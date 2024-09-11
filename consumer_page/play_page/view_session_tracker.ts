import { USER_ACTIVITY_SERVICE_CLIENT } from "../../common/web_service_client";
import { viewEpisode } from "@phading/user_activity_service_interface/consumer/frontend/show/client";
import { WebServiceClient } from "@selfage/web_service_client";

export class ViewSessionTracker {
  public static create(episodeId: string): ViewSessionTracker {
    return new ViewSessionTracker(
      () => Date.now(),
      USER_ACTIVITY_SERVICE_CLIENT,
      episodeId,
    );
  }

  private static IDLE_THRESHOLD_MS = 60 * 60 * 1000;

  private viewSessionId: string;
  private lastLogTimestampMs = 0;

  public constructor(
    private now: () => number,
    private webServiceClient: WebServiceClient,
    private episodeId: string,
  ) {}

  public async watchStart(timestampMs: number): Promise<void> {
    let now = this.now();
    if (now - this.lastLogTimestampMs > ViewSessionTracker.IDLE_THRESHOLD_MS) {
      this.viewSessionId = undefined;
    }
    this.lastLogTimestampMs = now;
    await this.log(timestampMs);
  }

  public async watchStop(timestampMs: number): Promise<void> {
    this.lastLogTimestampMs = this.now();
    await this.log(timestampMs);
  }

  private async log(timestampMs: number): Promise<void> {
    let response = await viewEpisode(this.webServiceClient, {
      viewSessionId: this.viewSessionId,
      episodeId: this.episodeId,
      episodeTimestamp: Math.floor(timestampMs / 1000),
    });
    this.viewSessionId = response.viewSessionId;
  }
}
