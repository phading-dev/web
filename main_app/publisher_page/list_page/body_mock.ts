import coverImage2 = require("../common/test_data/cover_tall2.jpg");
import { ListPage } from "./body";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import { ListSeasonsResponse } from "@phading/product_service_interface/show/web/publisher/interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class ListPageMock extends ListPage {
  public constructor(getNowDate: () => Date, seasonState?: SeasonState) {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: any): Promise<any> {
          let response: ListSeasonsResponse = {
            seasons: [
              {
                seasonId: "season1",
                name: "My Hero Academia Season 1",
                coverImageUrl: coverImage2,
                totalPublishedEpisodes: 13,
                averageRating: 4.75,
                ratingsCount: 67890,
                state: SeasonState.PUBLISHED,
                lastChangeTimeMs: new Date("2024-12-23T12:00:00Z").getTime(),
                grade: 390,
              },
            ],
          };
          return response;
        }
      })(),
      getNowDate,
      seasonState,
    );
  }
}
