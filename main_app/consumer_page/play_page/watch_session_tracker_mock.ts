import { WatchSessionTracker } from "./watch_session_tracker";
import { WatchEpisodeResponse } from "@phading/play_activity_service_interface/show/web/interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class WatchSessionTrackerMock extends WatchSessionTracker {
  public constructor(now: () => number, seasonId: string, episodeId: string) {
    super(new WebServiceClientMock(), () => now(), seasonId, episodeId);
    (this.serviceClient as WebServiceClientMock).response = {
      watchSessionId: "watchSession1",
    } as WatchEpisodeResponse;
  }

  public get request() {
    return (this.serviceClient as WebServiceClientMock).request;
  }
}
