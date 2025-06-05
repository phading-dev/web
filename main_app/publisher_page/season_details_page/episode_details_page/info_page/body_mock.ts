import { InfoPage } from "./body";
import { EpisodeState } from "@phading/product_service_interface/show/episode_state";
import { GetEpisodeResponse } from "@phading/product_service_interface/show/web/publisher/interface";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class InfoPageMock extends InfoPage {
  public constructor(
    getNowDate: () => Date,
    seasonId: string,
    episodeId: string,
  ) {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: ClientRequestInterface<any>): Promise<any> {
          this.request = request;
          let response: GetEpisodeResponse = {
            episode: {
              seasonName: "Re-Zero: Starting Life in Another World",
              episodeName:
                "The End of the Beginning and the Beginning of the End",
              state: EpisodeState.DRAFT,
              videoContainer: {
                masterPlaylist: {
                  synced: {
                    version: 1,
                  },
                },
                videos: [],
                audios: [],
                subtitles: [],
              },
            },
          };
          return response;
        }
      })(),
      getNowDate,
      seasonId,
      episodeId,
    );
  }
}
