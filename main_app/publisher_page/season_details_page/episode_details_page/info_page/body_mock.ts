import { InfoPage } from "./body";
import { EpisodeDetails } from "@phading/product_service_interface/show/web/publisher/details";
import { GetEpisodeResponse } from "@phading/product_service_interface/show/web/publisher/interface";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class InfoPageMock extends InfoPage {
  public constructor(
    episode: EpisodeDetails,
    getNowDate: () => Date,
    seasonId: string,
    episodeId: string,
  ) {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: ClientRequestInterface<any>): Promise<any> {
          this.request = request;
          let response: GetEpisodeResponse = {
            episode,
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
