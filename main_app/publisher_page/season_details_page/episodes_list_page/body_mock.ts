import { EpisodesListPage } from "./body";
import { SeasonDetails } from "@phading/product_service_interface/show/web/publisher/details";
import {
  LIST_DRAFT_EPISODES,
  LIST_PUBLISHED_EPISODES,
  ListDraftEpisodesResponse,
  ListPublishedEpisodesResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class EpisodesListPageMock extends EpisodesListPage {
  public constructor(
    getNowDate: () => Date,
    seasonId: string,
    seasonDetails: SeasonDetails,
  ) {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: ClientRequestInterface<any>): Promise<any> {
          switch (request.descriptor) {
            case LIST_DRAFT_EPISODES: {
              let response: ListDraftEpisodesResponse = {
                episodes: [],
              };
              return response;
            }
            case LIST_PUBLISHED_EPISODES: {
              let response: ListPublishedEpisodesResponse = {
                episodes: [],
              };
              return response;
            }
          }
        }
      })(),
      getNowDate,
      seasonId,
      seasonDetails,
    );
  }
}
