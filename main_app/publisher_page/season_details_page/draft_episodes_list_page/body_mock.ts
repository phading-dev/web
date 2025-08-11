import { DraftEpisodesListPage } from "./body";
import { ListDraftEpisodesResponse } from "@phading/product_service_interface/show/web/publisher/interface";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class DraftEpisodesListPageMock extends DraftEpisodesListPage {
  public constructor(seasonId: string) {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: ClientRequestInterface<any>): Promise<any> {
          let response: ListDraftEpisodesResponse = {
            episodes: [],
          };
          return response;
        }
      })(),
      seasonId,
    );
  }
}
