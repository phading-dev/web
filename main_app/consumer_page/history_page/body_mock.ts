import coverImage = require("../common/test_data/cover_tall.jpg");
import { HistoryPage } from "./body";
import {
  LIST_METER_READINGS_PER_DAY,
  ListMeterReadingsPerDayResponse,
} from "@phading/meter_service_interface/show/web/consumer/interface";
import {
  LIST_WATCH_SESSIONS,
  ListWatchSessionsResponse,
} from "@phading/play_activity_service_interface/show/web/interface";
import {
  GET_EPISODE_WITH_SEASON_SUMMARY,
  GetEpisodeWithSeasonSummaryResponse,
} from "@phading/product_service_interface/show/web/consumer/interface";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class HistoryPageMock extends HistoryPage {
  public constructor(getNowDate: () => Date) {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: ClientRequestInterface<any>): Promise<any> {
          if (request.descriptor === LIST_METER_READINGS_PER_DAY) {
            let response: ListMeterReadingsPerDayResponse = {
              readings: [
                {
                  date: "2023-10-01",
                  watchTimeSecGraded: 123456789,
                },
              ],
            };
            return response;
          } else if (request.descriptor === LIST_WATCH_SESSIONS) {
            let response: ListWatchSessionsResponse = {
              sessions: [
                {
                  seasonId: "season1",
                  episodeId: "episode1",
                  latestWatchedVideoTimeMs: 0,
                  createdTimeMs: new Date("2023-10-11T10:00:00Z").getTime(),
                },
              ],
            };
            return response;
          } else if (request.descriptor === GET_EPISODE_WITH_SEASON_SUMMARY) {
            let response: GetEpisodeWithSeasonSummaryResponse = {
              summary: {
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
                  name: "Starting Life in Another World",
                  index: 1,
                  premiereTimeMs: new Date("2023-10-10T00:00:00Z").getTime(),
                  videoDurationSec: 1500,
                },
              },
            };
            return response;
          }
        }
      })(),
      getNowDate,
    );
  }
}
