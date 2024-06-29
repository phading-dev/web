import { ViewSessionTracker } from "./view_session_tracker";

export class ViewSessionTrackerMock extends ViewSessionTracker {
  public currentTimestampMs: number;
  public currentEpisodeId: string;

  public constructor(episodeId: string) {
    super(undefined, undefined, episodeId);
    this.currentEpisodeId = episodeId;
  }

  public async watchStart(timestampMs: number): Promise<void> {
    this.currentTimestampMs = timestampMs;
  }
  public async watchStop(timestampMs: number): Promise<void> {
    this.currentTimestampMs = timestampMs;
  }
}
