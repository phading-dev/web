import { InfoPage } from "./body";
import { SeasonDetails } from "@phading/product_service_interface/show/web/publisher/details";
import {
  GET_SEASON,
  GetSeasonResponse,
  LIST_DRAFT_EPISODES,
  ListDraftEpisodesResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class InfoPageMock extends InfoPage {
  public constructor(
    seasonDetails: SeasonDetails,
    getNowDate: () => Date,
    seasonId: string,
  ) {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: ClientRequestInterface<any>): Promise<any> {
          switch (request.descriptor) {
            case GET_SEASON: {
              let resposne: GetSeasonResponse = {
                seasonDetails,
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
