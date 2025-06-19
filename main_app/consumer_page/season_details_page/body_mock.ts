import coverImage = require("../common/test_data/cover_tall2.jpg");
import userImage = require("../common/test_data/user_image.jpg");
import { SeasonDetailsPage } from "./body";
import {
  CHECK_IN_WATCH_LATER_LIST,
  CheckInWatchLaterListResponse,
  GET_LATEST_WATCHED_VIDEO_TIME_OF_EPISODE,
  GetLatestWatchedVideoTimeOfEpisodeResponse,
} from "@phading/play_activity_service_interface/show/web/interface";
import {
  GET_CONTINUE_EPISODE,
  GET_INDIVIDUAL_SEASON_RATING,
  GET_SEASON_DETAILS,
  GetContinueEpisodeResponse,
  GetIndividualSeasonRatingResponse,
  GetSeasonDetailsResponse,
  LIST_EPISODES,
  ListEpisodesResponse,
} from "@phading/product_service_interface/show/web/consumer/interface";
import {
  GET_ACCOUNT_SUMMARY,
  GetAccountSummaryResponse,
} from "@phading/user_service_interface/web/third_person/interface";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class SeasonDetailsPageMock extends SeasonDetailsPage {
  public constructor(getNowDate: () => Date, seasonId: string) {
    super(
      undefined,
      new (class extends WebServiceClientMock {
        public async send(request: ClientRequestInterface<any>): Promise<any> {
          switch (request.descriptor) {
            case GET_SEASON_DETAILS: {
              let response: GetSeasonDetailsResponse = {
                seasonDetails: {
                  seasonId: "season1",
                  publisherId: "publisher1",
                  name: "Re-Zero Starting Life in Another World",
                  description:
                    "Re-Zero Starting Life in Another World is a Japanese light novel series written by Tappei Nagatsuki and illustrated by Shinichirou Otsuka. The story centers around Subaru Natsuki, a young man who is suddenly transported to another world on his way home from the convenience store. Without any sign of the person who summoned him, he soon discovers he has gained the ability to return to a specific point in time upon his death, a power he dubs 'Return by Death.' Subaru uses this ability to protect his newfound friends and unravel the mysteries of this new world, all while facing the emotional and physical toll of repeatedly experiencing his own death. The series is known for its intricate plot, deep character development, and exploration of themes such as perseverance, sacrifice, and the consequences of one's actions.",
                  coverImageUrl: coverImage,
                  averageRating: 4.5,
                  ratingsCount: 1234,
                  grade: 900,
                  totalEpisodes: 2,
                },
              };
              return response;
            }
            case GET_ACCOUNT_SUMMARY: {
              let response: GetAccountSummaryResponse = {
                account: {
                  accountId: "550e8400-e29b-41d4-a716-446655440000",
                  naturalName: "Animplex",
                  avatarSmallUrl: userImage,
                },
              };
              return response;
            }
            case GET_CONTINUE_EPISODE: {
              let response: GetContinueEpisodeResponse = {
                episode: {
                  episodeId: "episode1",
                  name: "Episode 1: The End of the Beginning and the Beginning of the End",
                  index: 1,
                  resolution: "1920x1080",
                  videoDurationSec: 24 * 60,
                  premiereTimeMs: new Date("2024-01-01T00:00:00Z").getTime(),
                  canPlay: true,
                },
                rewatching: false,
              };
              return response;
            }
            case LIST_EPISODES: {
              let response: ListEpisodesResponse;
              if (request.body.next) {
                response = {
                  episodes: [
                    {
                      episodeId: "episode1",
                      name: "Episode 1: The End of the Beginning and the Beginning of the End",
                      index: 1,
                      resolution: "1920x1080",
                      videoDurationSec: 24 * 60,
                      premiereTimeMs: new Date(
                        "2024-01-01T00:00:00Z",
                      ).getTime(),
                      canPlay: true,
                    },
                    {
                      episodeId: "episode2",
                      name: "Episode 2: The Next Step",
                      index: 2,
                      resolution: "1920x1080",
                      videoDurationSec: 24 * 60,
                      premiereTimeMs: new Date(
                        "2024-01-08T08:00:00Z",
                      ).getTime(),
                      canPlay: true,
                    },
                  ],
                };
              } else {
                response = {
                  episodes: [],
                };
              }
              return response;
            }
            case GET_LATEST_WATCHED_VIDEO_TIME_OF_EPISODE: {
              let response: GetLatestWatchedVideoTimeOfEpisodeResponse = {};
              return response;
            }
            case CHECK_IN_WATCH_LATER_LIST: {
              let response: CheckInWatchLaterListResponse = {
                isIn: false,
              };
              return response;
            }
            case GET_INDIVIDUAL_SEASON_RATING: {
              let response: GetIndividualSeasonRatingResponse = {};
              return response;
            }
            default:
              throw new Error(`Unexpected request.`);
          }
        }
      })(),
      getNowDate,
      seasonId,
    );
  }
}
