import EventEmitter = require("events");
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { newRecordWatchTimeRequest } from "@phading/meter_service_interface/show/web/consumer/client";
import { WebServiceClient } from "@selfage/web_service_client";

export interface WatchTimeMeter {
  on(event: "newReading", listener: (watchTimeMs: number) => void): this;
  on(event: "stopPlaying", listener: () => void): this;
}

export class WatchTimeMeter extends EventEmitter {
  public static create(seasonId: string, episodeId: string): WatchTimeMeter {
    return new WatchTimeMeter(
      window,
      SERVICE_CLIENT,
      () => Date.now(),
      seasonId,
      episodeId,
    );
  }

  private static SYNC_THROTTLE_INTERVAL_MS = 10 * 1000;
  private static WATCH_TIME_ACCUMULATE_INTERVAL_MS = 100;

  private lastSyncTimestampMs: number;
  private meterStartMs: number;
  private timeoutId: number;
  private watchTimeMsStaging = 0;
  private watchTimeMsCommitted = 0;
  private playbackSpeed: number;

  public constructor(
    private window: Window,
    protected serviceClient: WebServiceClient,
    private now: () => number,
    private seasonId: string,
    private episodeId: string,
  ) {
    super();
    this.window.addEventListener("beforeunload", this.syncReading);
  }

  public setPlaybackSpeed(playbackSpeed: number): this {
    if (this.meterStartMs == null) {
      this.playbackSpeed = playbackSpeed;
    } else {
      this.accumulateWatchTimeMs();
      this.playbackSpeed = playbackSpeed;
    }
    return this;
  }

  public start(): void {
    let now = this.now();
    this.meterStartMs = now;
    this.lastSyncTimestampMs = now;
    this.timeoutId = this.window.setTimeout(
      () => this.update(),
      WatchTimeMeter.WATCH_TIME_ACCUMULATE_INTERVAL_MS,
    );
  }

  private update(): void {
    this.accumulateWatchTimeMs();
    let now = this.now();
    if (
      now - this.lastSyncTimestampMs >
      WatchTimeMeter.SYNC_THROTTLE_INTERVAL_MS
    ) {
      this.lastSyncTimestampMs = now;
      this.syncReading();
    }
    this.timeoutId = this.window.setTimeout(
      () => this.update(),
      WatchTimeMeter.WATCH_TIME_ACCUMULATE_INTERVAL_MS,
    );
  }

  public stop(): void {
    this.window.clearTimeout(this.timeoutId);
    if (this.meterStartMs == null) {
      // Not started properly.
      return;
    }
    this.accumulateWatchTimeMs();
    this.meterStartMs = undefined;
    this.syncReading();
  }

  private accumulateWatchTimeMs(): void {
    let now = this.now();
    let elapsedMs = now - this.meterStartMs;
    this.watchTimeMsStaging += elapsedMs * this.playbackSpeed;
    this.meterStartMs = now;
  }

  private syncReading = async (): Promise<void> => {
    if (!this.watchTimeMsStaging) {
      return;
    }

    let watchTimeMsStaging = this.watchTimeMsStaging;
    // Clears it so that we won't double count if there is another call in parallel.
    this.watchTimeMsStaging = 0;
    let success = false;
    for (let i = 0; i < 3 && !success; i++) {
      try {
        await this.serviceClient.send(
          newRecordWatchTimeRequest({
            seasonId: this.seasonId,
            episodeId: this.episodeId,
            watchTimeMs: watchTimeMsStaging,
          }),
          {
            keepAlive: true,
            timeout: 3000,
          },
        );
        success = true;
      } catch (e) {
        console.error(
          `Failed to sync watch time after ${i + 1} attempts: ${e.stack ?? e.message ?? e}`,
        );
      }
    }
    if (!success) {
      // Add back to the staging counter so that it can be accumulated again.
      this.watchTimeMsStaging += watchTimeMsStaging;
      this.emit("stopPlaying");
    } else {
      this.watchTimeMsCommitted += watchTimeMsStaging;
      this.emit("newReading", this.watchTimeMsCommitted);
    }
  };

  public destroy(): void {
    this.window.removeEventListener("beforeunload", this.syncReading);
    this.window.clearTimeout(this.timeoutId);
  }
}
