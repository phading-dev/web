import coverImage = require("./test_data/cover.jpg");
import userImage = require("./test_data/user_image.jpg");
import { RecommendationPage } from "./body";
import { PublisherContextItem } from "./publisher_context_item";
import { SeasonItem } from "./season_item";
import { RecommendationPageState } from "./state";
import { RecommendSeasonsResponse } from "@phading/product_recommendation_service_interface/consumer/frontend/show/interface";
import { SeasonOverview } from "@phading/product_recommendation_service_interface/consumer/frontend/show/season_overview";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class RecommendationPageMock extends RecommendationPage {
  public constructor(state: RecommendationPageState, numOfSeasons: number) {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: any): Promise<RecommendSeasonsResponse> {
          let seasons = new Array<SeasonOverview>();
          for (let i = 0; i < numOfSeasons; i++) {
            seasons.push({
              seasonId: `season${i}`,
              name: `season ${i}`,
              coverImagePath: coverImage,
              grade: 1,
              continueEpisode: {
                episodeId: `episode ${i}`,
                name: `episode ${i}`,
                length: 123,
                publishedTime: 1234567,
              },
              publisher: {
                accountId: `account id ${i}`,
                avatarSmallPath: userImage,
                naturalName: `account id ${i}`,
              },
            });
          }
          return {
            seasons,
          };
        }
      })(),
      (season) => new SeasonItem(season),
      (publisher) => new PublisherContextItem(publisher),
      state,
    );
  }
}
