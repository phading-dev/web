import { SearchPage } from "./body";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import { SearchSeasonsResponse } from "@phading/product_service_interface/show/web/publisher/interface";
import { SeasonSummary } from "@phading/product_service_interface/show/web/publisher/summary";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class SearchPageMock extends SearchPage {
  public constructor(
    seasons: Array<SeasonSummary>,
    getNowDate: () => Date,
    seasonState: SeasonState,
    query?: string,
  ) {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: any): Promise<any> {
          let response: SearchSeasonsResponse = {
            seasons,
          };
          return response;
        }
      })(),
      getNowDate,
      seasonState,
      query,
    );
  }
}
