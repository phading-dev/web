import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { newWatchEpisodeRequest } from "@phading/play_activity_service_interface/show/web/client";
import { WebServiceClient } from "@selfage/web_service_client";

export class WatchSessionTracker {
  public static create(
    seasonId: string,
    episodeId: string,
  ): WatchSessionTracker {
    return new WatchSessionTracker(
      SERVICE_CLIENT,
      () => Date.now(),
      seasonId,
      episodeId,
    );
  }

  private static IDLE_THRESHOLD_MS = 60 * 60 * 1000;
  private static SYNC_THROTTLE_INTERVAL_MS = 10 * 1000;

  private watchSessionId: string;
  private lastSyncTimestampMs = 0;

  public constructor(
    protected serviceClient: WebServiceClient,
    private now: () => number,
    private seasonId: string,
    private episodeId: string,
  ) {}

  public async start(videoTimeMs: number): Promise<void> {
    let now = this.now();
    if (
      now - this.lastSyncTimestampMs >
      WatchSessionTracker.IDLE_THRESHOLD_MS
    ) {
      this.watchSessionId = undefined;
    }
    this.lastSyncTimestampMs = now;
    await this.sync(videoTimeMs);
  }

  public async update(videoTimeMs: number): Promise<void> {
    let now = this.now();
    if (
      now - this.lastSyncTimestampMs >
      WatchSessionTracker.SYNC_THROTTLE_INTERVAL_MS
    ) {
      this.lastSyncTimestampMs = now;
      await this.sync(videoTimeMs);
    }
  }

  public async stop(videoTimeMs: number): Promise<void> {
    this.lastSyncTimestampMs = this.now();
    await this.sync(videoTimeMs);
  }

  private async sync(videoTimeMs: number): Promise<void> {
    let response = await this.serviceClient.send(
      newWatchEpisodeRequest({
        watchSessionId: this.watchSessionId,
        seasonId: this.seasonId,
        episodeId: this.episodeId,
        watchedVideoTimeMs: videoTimeMs,
      }),
    );
    this.watchSessionId = response.watchSessionId;
  }
}
