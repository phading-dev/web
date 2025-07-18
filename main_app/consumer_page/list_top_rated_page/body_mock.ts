import coverImage = require("../common/test_data/cover_tall.jpg");
import { ListTopRatedPage } from "./body";
import { ListSeasonsByRatingResponse } from "@phading/product_service_interface/show/web/public/interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class ListTopRatedPageMock extends ListTopRatedPage {
  public constructor(getNowDate: () => Date) {
    super(
      new (class extends WebServiceClientMock {
        public async send(): Promise<any> {
          let response: ListSeasonsByRatingResponse = {
            seasons: [
              {
                seasonId: "season1",
                name: "My Hero Academia",
                coverImageUrl: coverImage,
                grade: 19,
                ratingsCount: 5432,
                averageRating: 3.8,
                totalEpisodes: 13,
                publisherId: "publisher1",
              },
            ],
          };
          return response;
        }
      })(),
      getNowDate,
    );
  }
}
