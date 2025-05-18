import "../../../dev/env";
import coverImage = require("../common/test_data/cover_tall.jpg");
import coverImage2 = require("../common/test_data/cover_tall2.jpg");
import path from "path";
import { normalizeBody } from "../../../common/normalize_body";
import { setTabletView } from "../../../common/view_port";
import { WatchLaterPage } from "./body";
import {
  LIST_FROM_WATCH_LATER_LIST,
  LIST_FROM_WATCH_LATER_LIST_REQUEST_BODY,
  ListFromWatchLaterListResponse,
} from "@phading/play_activity_service_interface/show/web/interface";
import {
  GET_SEASON_SUMMARY,
  GetSeasonSummaryResponse,
} from "@phading/product_service_interface/show/web/consumer/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { mouseClick } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "WatchLaterPageTest",
  cases: [
    new (class implements TestCase {
      public name = "TabletView_Default_Scroll_Click";
      private cut: WatchLaterPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new (class extends WebServiceClientMock {
          public async send(
            request: ClientRequestInterface<any>,
          ): Promise<any> {
            switch (request.descriptor) {
              case LIST_FROM_WATCH_LATER_LIST:
                this.request = request;
                return this.response;
              case GET_SEASON_SUMMARY:
                if (request.body.seasonId === "season1") {
                  return {
                    seasonSummary: {
                      seasonId: "season1",
                      publisherId: "publisherId1",
                      name: "Re-Zero Starting Life in Another World",
                      grade: 289,
                      averageRating: 4.5,
                      ratingsCount: 99,
                      coverImageUrl: coverImage,
                    },
                  } as GetSeasonSummaryResponse;
                } else if (request.body.seasonId === "season2") {
                  return {
                    seasonSummary: {
                      seasonId: "season2",
                      publisherId: "publisherId2",
                      name: "Attack on Titan",
                      grade: 359,
                      averageRating: 4.8,
                      ratingsCount: 120,
                      coverImageUrl: coverImage2,
                    },
                  } as GetSeasonSummaryResponse;
                } else if (request.body.seasonId === "season3") {
                  return {
                    seasonSummary: {
                      seasonId: "season3",
                      publisherId: "publisherId3",
                      name: "My Hero Academia",
                      grade: 309,
                      averageRating: 4.6,
                      ratingsCount: 85,
                      coverImageUrl: coverImage,
                    },
                  } as GetSeasonSummaryResponse;
                } else if (request.body.seasonId === "season4") {
                  return {
                    seasonSummary: {
                      seasonId: "season4",
                      publisherId: "publisherId4",
                      name: "Demon Slayer",
                      grade: 409,
                      averageRating: 4.9,
                      ratingsCount: 150,
                      coverImageUrl: coverImage2,
                    },
                  } as GetSeasonSummaryResponse;
                } else if (request.body.seasonId === "season6") {
                  return {
                    seasonSummary: {
                      seasonId: "season6",
                      publisherId: "publisherId6",
                      name: "One Punch Man",
                      grade: 259,
                      averageRating: 4.4,
                      ratingsCount: 70,
                      coverImageUrl: coverImage,
                    },
                  } as GetSeasonSummaryResponse;
                } else if (request.body.seasonId === "season7") {
                  return {
                    seasonSummary: {
                      seasonId: "season7",
                      publisherId: "publisherId7",
                      name: "Naruto",
                      grade: 329,
                      averageRating: 4.7,
                      ratingsCount: 110,
                      coverImageUrl: coverImage2,
                    },
                  } as GetSeasonSummaryResponse;
                } else if (request.body.seasonId === "season8") {
                  return {
                    seasonSummary: {
                      seasonId: "season8",
                      publisherId: "publisherId8",
                      name: "Bleach",
                      grade: 299,
                      averageRating: 4.5,
                      ratingsCount: 95,
                      coverImageUrl: coverImage,
                    },
                  } as GetSeasonSummaryResponse;
                } else {
                  throw new Error(`Season ${request.body.seasonId} not found.`);
                }
            }
          }
        })();
        serviceClientMock.response = {
          seasonIds: [
            "season1",
            "season2",
            "season3",
            "season4",
            "season5",
            "season6",
            "season7",
            "season8",
          ],
          addedTimeCursor: 1000,
        } as ListFromWatchLaterListResponse;
        this.cut = new WatchLaterPage(
          serviceClientMock,
          () => new Date("2023-12-10T08:00:00Z"),
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              limit: 10,
            },
            LIST_FROM_WATCH_LATER_LIST_REQUEST_BODY,
          ),
          "Init request",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "./watch_later_page_tablet_default.png"),
          path.join(__dirname, "./golden/watch_later_page_tablet_default.png"),
          path.join(__dirname, "./watch_later_page_tablet_default_diff.png"),
        );

        // Prepare
        serviceClientMock.response = {
          seasonIds: ["season1", "season2"],
        } as ListFromWatchLaterListResponse;

        // Execute
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              limit: 10,
              addedTimeCursor: 1000,
            },
            LIST_FROM_WATCH_LATER_LIST_REQUEST_BODY,
          ),
          "Request 2",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "./watch_later_page_tablet_scrolled.png"),
          path.join(__dirname, "./golden/watch_later_page_tablet_scrolled.png"),
          path.join(__dirname, "./watch_later_page_tablet_scrolled_diff.png"),
        );

        // Prepare
        let detailsId: string;
        this.cut.on("showDetails", (seasonId) => {
          detailsId = seasonId;
        });

        // Execute
        await mouseClick(300, 50);

        // Verify
        assertThat(detailsId, eq("season6"), "Show details");
      }
      public tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
  ],
});
