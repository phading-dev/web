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

  private lastSyncTimestampMs: number;
  private videoTimeStartMs: number;
  private watchTimeMsStaging = 0;
  private watchTimeMsCommitted = 0;

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

  public start(videoTimeMs: number): void {
    this.videoTimeStartMs = videoTimeMs;
    this.lastSyncTimestampMs = this.now();
  }

  public async update(videoTimeMs: number): Promise<void> {
    this.watchTimeMsStaging += videoTimeMs - this.videoTimeStartMs;
    this.videoTimeStartMs = videoTimeMs;
    let now = this.now();
    if (
      now - this.lastSyncTimestampMs >
      WatchTimeMeter.SYNC_THROTTLE_INTERVAL_MS
    ) {
      this.lastSyncTimestampMs = now;
      await this.syncReading();
    }
  }

  public async stop(videoTimeMs: number): Promise<void> {
    if (this.videoTimeStartMs == null) {
      // Not started properly.
      return;
    }

    this.watchTimeMsStaging += videoTimeMs - this.videoTimeStartMs;
    this.videoTimeStartMs = undefined;
    await this.syncReading();
  }

  private syncReading = async (): Promise<void> => {
    if (!this.watchTimeMsStaging) {
      return;
    }

    let watchTimeMsStaging = this.watchTimeMsStaging;
    // Clears it so that we won't double count if there is another call in parallel.
    this.watchTimeMsStaging = 0;
    try {
      await this.serviceClient.send(
        newRecordWatchTimeRequest({
          seasonId: this.seasonId,
          episodeId: this.episodeId,
          watchTimeMs: watchTimeMsStaging,
        }),
        {
          retries: 5,
          keepAlive: true,
          timeout: 5000,
        },
      );
    } catch (e) {
      // When failed, add back to the staging counter.
      this.watchTimeMsStaging += watchTimeMsStaging;
      this.emit("stopPlaying");
      return;
    }
    this.watchTimeMsCommitted += watchTimeMsStaging;
    this.emit("newReading", this.watchTimeMsCommitted);
  };

  public destroy(): void {
    this.window.removeEventListener("beforeunload", this.syncReading);
  }
}
