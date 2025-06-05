import coverImage = require("../common/test_data/cover_tall2.jpg");
import { SearchSeasonsPage } from "./body";
import { SearchSeasonsResponse } from "@phading/product_service_interface/show/web/consumer/interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class SearchSeasonsPageMock extends SearchSeasonsPage {
  public constructor(getNowDate: () => Date, query: string) {
    super(
      new (class extends WebServiceClientMock {
        public async send(): Promise<any> {
          let response: SearchSeasonsResponse = {
            seasons: [
              {
                seasonId: "season1",
                name: "Re-Zero - Starting Life in Another World",
                coverImageUrl: coverImage,
                grade: 89,
                totalEpisodes: 34,
                averageRating: 4.1,
                ratingsCount: 1200,
                publisherId: "publisher1",
              },
            ],
          };
          return response;
        }
      })(),
      getNowDate,
      query,
    );
  }
}
