import { InfoPage } from "./body";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import {
  GET_SEASON,
  GetSeasonResponse,
  LIST_DRAFT_EPISODES,
  ListDraftEpisodesResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class InfoPageMock extends InfoPage {
  public constructor(getNowDate: () => Date, seasonId: string) {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: ClientRequestInterface<any>): Promise<any> {
          switch (request.descriptor) {
            case GET_SEASON: {
              let resposne: GetSeasonResponse = {
                seasonDetails: {
                  name: "Re-Zero: Starting Life in Another World Season 1",
                  description: "",
                  state: SeasonState.DRAFT,
                  grade: 1,
                  nextGrade: {
                    grade: 2,
                  },
                  totalPublishedEpisodes: 0,
                  lastChangeTimeMs: new Date("2024-12-01T18:00:00Z").getTime(),
                  createdTimeMs: new Date("2024-01-01T12:00:00Z").getTime(),
                },
              };
              return resposne;
            }
            case LIST_DRAFT_EPISODES: {
              let response: ListDraftEpisodesResponse = {
                episodes: [],
              };
              return response;
            }
          }
        }
      })(),
      getNowDate,
      seasonId,
    );
  }
}
