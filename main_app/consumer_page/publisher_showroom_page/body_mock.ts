import coverImage = require("../common/test_data/cover_tall.jpg");
import userImage = require("../common/test_data/user_image.jpg");
import { PublisherShowroomPage } from "./body";
import {
  LIST_SEASONS_BY_RECENT_PREMIERE_TIME_AND_PUBLISHER,
  ListSeasonsByRecentPremiereTimeAndPublisherResponse,
} from "@phading/product_service_interface/show/web/public/interface";
import {
  GET_ACCOUNT_DETAILS,
  GetAccountDetailsResponse,
} from "@phading/user_service_interface/web/third_person/interface";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class PublisherShowroomPageMock extends PublisherShowroomPage {
  public constructor(getNowDate: () => Date, accountId: string) {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: ClientRequestInterface<any>): Promise<any> {
          if (request.descriptor === GET_ACCOUNT_DETAILS) {
            let response: GetAccountDetailsResponse = {
              account: {
                accountId: "account1",
                name: "Account 1",
                avatarLargeUrl: userImage,
              },
            };
            return response;
          } else if (
            request.descriptor ===
            LIST_SEASONS_BY_RECENT_PREMIERE_TIME_AND_PUBLISHER
          ) {
            let response: ListSeasonsByRecentPremiereTimeAndPublisherResponse =
              {
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
        }
      })(),
      getNowDate,
      accountId,
    );
  }
}
