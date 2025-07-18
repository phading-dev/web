import coverImage = require("../common/test_data/cover_tall.jpg");
import { SearchPage } from "./body";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import { SearchSeasonsResponse } from "@phading/product_service_interface/show/web/publisher/interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class SearchPageMock extends SearchPage {
  public constructor(
    getNowDate: () => Date,
    query: string,
    seasonState?: SeasonState,
  ) {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: any): Promise<any> {
          let response: SearchSeasonsResponse = {
            seasons: [
              {
                seasonId: "season1",
                name: "Re-Zero: Starting Life in Another World Season 1",
                coverImageUrl: coverImage,
                totalPublishedEpisodes: 25,
                averageRating: 4.52,
                ratingsCount: 12345,
                state: SeasonState.PUBLISHED,
                lastChangeTimeMs: new Date("2024-12-23T12:00:00Z").getTime(),
                grade: 1800,
              },
            ],
          };
          return response;
        }
      })(),
      getNowDate,
      query,
      seasonState,
    );
  }
}
