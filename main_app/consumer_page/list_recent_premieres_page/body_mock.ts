import coverImage = require("../common/test_data/cover_tall.jpg");
import { ListRecentPremieresPage } from "./body";
import { ListSeasonsByRecentPremiereTimeResponse } from "@phading/product_service_interface/show/web/consumer/interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class ListRecentPremieresPageMock extends ListRecentPremieresPage {
  public constructor(getNowDate: () => Date) {
    super(
      new (class extends WebServiceClientMock {
        public async send(): Promise<any> {
          let response: ListSeasonsByRecentPremiereTimeResponse = {
            seasons: [
              {
                seasonId: "season1",
                name: "Attack on Titan",
                coverImageUrl: coverImage,
                grade: 9,
                ratingsCount: 6789,
                averageRating: 4.5,
                totalEpisodes: 25,
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
