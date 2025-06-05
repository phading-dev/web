import coverImage = require("../common/test_data/cover_tall.jpg");
import { MultiSectionPage } from "./body";
import {
  LIST_CONTINUE_WATCHING_SEASONS,
  LIST_SEASONS_BY_RATING,
  LIST_SEASONS_BY_RECENT_PREMIERE_TIME,
  ListContinueWatchingSeasonsResponse,
  ListSeasonsByRatingResponse,
} from "@phading/product_service_interface/show/web/consumer/interface";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class MultiSectionPageMock extends MultiSectionPage {
  public constructor(getNowDate: () => Date) {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: ClientRequestInterface<any>): Promise<any> {
          if (request.descriptor === LIST_CONTINUE_WATCHING_SEASONS) {
            let response: ListContinueWatchingSeasonsResponse = {
              continues: [
                {
                  season: {
                    seasonId: "season1",
                    name: "Re-Zero",
                    coverImageUrl: coverImage,
                    totalEpisodes: 12,
                    grade: 99,
                    ratingsCount: 12345,
                    averageRating: 4.8,
                    publisherId: "publisher1",
                  },
                  episode: {
                    episodeId: "episode1",
                    name: "Episode 1",
                    index: 1,
                    premiereTimeMs: new Date("2023-10-10T00:00:00Z").getTime(),
                    videoDurationSec: 1500,
                  },
                  continueTimeMs: 20000,
                },
              ],
            };
            return response;
          } else if (
            request.descriptor === LIST_SEASONS_BY_RECENT_PREMIERE_TIME
          ) {
            let response: ListSeasonsByRatingResponse = {
              seasons: [
                {
                  seasonId: "season2",
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
           } else if (request.descriptor === LIST_SEASONS_BY_RATING) {
            let response: ListSeasonsByRatingResponse = {
              seasons: [
                {
                  seasonId: "season3",
                  name: "Attack on Titan",
                  coverImageUrl: coverImage,
                  grade: 20,
                  ratingsCount: 6789,
                  averageRating: 4.5,
                  totalEpisodes: 24,
                  publisherId: "publisher2",
                },
              ],
            };
            return response;
           }
        }
      })(),
      getNowDate,
    );
  }
}
