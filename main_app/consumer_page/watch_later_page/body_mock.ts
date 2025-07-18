import coverImage = require("../common/test_data/cover_tall2.jpg");
import { WatchLaterPage } from "./body";
import {
  LIST_FROM_WATCH_LATER_LIST,
  ListFromWatchLaterListResponse,
} from "@phading/play_activity_service_interface/show/web/interface";
import {
  GET_SEASON_SUMMARY,
  GetSeasonSummaryResponse,
} from "@phading/product_service_interface/show/web/public/interface";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class WatchLaterPageMock extends WatchLaterPage {
  public constructor(getNowDate: () => Date) {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: ClientRequestInterface<any>): Promise<any> {
          if (request.descriptor === LIST_FROM_WATCH_LATER_LIST) {
            let response: ListFromWatchLaterListResponse = {
              seasonIds: ["season1"],
            };
            return response;
          } else if (request.descriptor === GET_SEASON_SUMMARY) {
            let response: GetSeasonSummaryResponse = {
              seasonSummary: {
                seasonId: "season1",
                publisherId: "publisherId1",
                name: "Re-Zero Starting Life in Another World",
                grade: 289,
                averageRating: 4.5,
                ratingsCount: 99,
                coverImageUrl: coverImage,
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
