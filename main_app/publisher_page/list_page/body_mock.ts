import { ListPage } from "./body";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import { ListSeasonsResponse } from "@phading/product_service_interface/show/web/publisher/interface";
import { SeasonSummary } from "@phading/product_service_interface/show/web/publisher/summary";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class ListPageMock extends ListPage {
  public constructor(
    seasons: Array<SeasonSummary>,
    getNowDate: () => Date,
    seasonState: SeasonState,
  ) {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: any): Promise<any> {
          let response: ListSeasonsResponse = {
            seasons,
          };
          return response;
        }
      })(),
      getNowDate,
      seasonState,
    );
  }
}
