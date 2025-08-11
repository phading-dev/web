import { PublishedEpisodesListPage } from "./body";
import { SeasonDetails } from "@phading/product_service_interface/show/web/publisher/details";
import { ListPublishedEpisodesResponse } from "@phading/product_service_interface/show/web/publisher/interface";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class PublishedEpisodesListPageMock extends PublishedEpisodesListPage {
  public constructor(
    getNowDate: () => Date,
    seasonId: string,
    seasonDetails: SeasonDetails,
  ) {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: ClientRequestInterface<any>): Promise<any> {
          let response: ListPublishedEpisodesResponse = {
            episodes: [],
          };
          return response;
        }
      })(),
      getNowDate,
      seasonId,
      seasonDetails,
    );
  }
}
