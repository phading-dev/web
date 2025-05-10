import { WatchTimeMeter } from "./watch_time_meter";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class WatchTimeMeterMock extends WatchTimeMeter {
  public constructor(now: () => number, seasonId: string, episodeId: string) {
    super(
      {
        addEventListener: () => {},
        removeEventListener: () => {},
      } as any,
      new WebServiceClientMock(),
      () => now(),
      seasonId,
      episodeId,
    );
  }

  public get request() {
    return (this.serviceClient as WebServiceClientMock).request;
  }
  public set error(value: Error) {
    (this.serviceClient as WebServiceClientMock).error = value;
  }
}
