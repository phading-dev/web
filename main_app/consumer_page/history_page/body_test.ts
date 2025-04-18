import "../../../dev/env";
import "../../../common/normalize_body";
import coverImage = require("../common/test_data/cover_tall.jpg");
import coverImage2 = require("../common/test_data/cover_tall2.jpg");
import path from "path";
import {
  setDesktopView,
  setPhoneView,
  setTabletView,
} from "../../../common/view_port";
import { HistoryPage } from "./body";
import {
  LIST_METER_READINGS_PER_MONTH,
  ListMeterReadingsPerMonthResponse,
} from "@phading/meter_service_interface/show/web/consumer/interface";
import {
  LIST_WATCH_SESSIONS,
  LIST_WATCH_SESSIONS_REQUEST_BODY,
  ListWatchSessionsResponse,
} from "@phading/play_activity_service_interface/show/web/interface";
import {
  GET_SEASON_AND_EPISODE_SUMMARY,
  GetSeasonAndEpisodeSummaryResponse,
} from "@phading/product_service_interface/show/web/consumer/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { mouseClick } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

TEST_RUNNER.run({
  name: "HistoryPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "TabletView_LoadMore_ScrolledToBottom_DeskTopView_PhoneView_ClickEstimatesCard_ClickEpisode";
      private cut: HistoryPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new (class extends WebServiceClientMock {
          public async send(
            request: ClientRequestInterface<any>,
          ): Promise<any> {
            switch (request.descriptor) {
              case LIST_METER_READINGS_PER_MONTH:
                return {
                  readings: [
                    {
                      month: "2023-10",
                      watchTimeSecGraded: 12345678,
                    },
                  ],
                } as ListMeterReadingsPerMonthResponse;
              case LIST_WATCH_SESSIONS:
                this.request = request;
                return this.response;
              case GET_SEASON_AND_EPISODE_SUMMARY:
                if (request.body.seasonId === "season1") {
                  if (request.body.episodeId === "episode1") {
                    return {
                      summary: {
                        season: {
                          seasonId: "season1",
                          name: "Re:Zero -Starting Life in Another World-",
                          coverImageUrl: coverImage,
                          grade: 18,
                          ratingsCount: 12345,
                          averageRating: 4,
                        },
                        episode: {
                          episodeId: "episode1",
                          name: "Episode 1",
                          videoDurationSec: 3700,
                        },
                      },
                    } as GetSeasonAndEpisodeSummaryResponse;
                  } else if (request.body.episodeId === "episode2") {
                    return {
                      summary: {
                        season: {
                          seasonId: "season1",
                          name: "Re:Zero -Starting Life in Another World-",
                          coverImageUrl: coverImage,
                          grade: 18,
                          ratingsCount: 12345,
                          averageRating: 4,
                        },
                        episode: {
                          episodeId: "episode2",
                          name: "Episode 2",
                          videoDurationSec: 3890,
                        },
                      },
                    } as GetSeasonAndEpisodeSummaryResponse;
                  } else {
                    throw new Error(
                      `${request.body.seasonId} ${request.body.episodeId} Not found`,
                    );
                  }
                } else if (request.body.seasonId === "season2") {
                  if (request.body.episodeId === "episode1") {
                    return {
                      summary: {
                        season: {
                          seasonId: "season2",
                          name: "Attack on Titan",
                          coverImageUrl: coverImage2,
                          grade: 20,
                          ratingsCount: 54321,
                          averageRating: 5,
                        },
                        episode: {
                          episodeId: "episode1",
                          name: "The Fall of Shiganshina",
                          videoDurationSec: 2700,
                        },
                      },
                    } as GetSeasonAndEpisodeSummaryResponse;
                  } else if (request.body.episodeId === "episode2") {
                    return {
                      summary: {
                        season: {
                          seasonId: "season2",
                          name: "Attack on Titan",
                          coverImageUrl: coverImage2,
                          grade: 20,
                          ratingsCount: 54321,
                          averageRating: 5,
                        },
                        episode: {
                          episodeId: "episode2",
                          name: "The Beast Titan",
                          videoDurationSec: 2700,
                        },
                      },
                    } as GetSeasonAndEpisodeSummaryResponse;
                  } else {
                    throw new Error(
                      `${request.body.seasonId} ${request.body.episodeId} Not found`,
                    );
                  }
                } else {
                  throw new Error(
                    `${request.body.seasonId} ${request.body.episodeId} Not found`,
                  );
                }
              default:
                throw new Error(`Unexpected`);
            }
          }
        })();
        serviceClientMock.response = {
          sessions: [
            {
              seasonId: "season1",
              episodeId: "episode1",
              latestWatchedTimeMs: 1434000,
              createdTimeMs: 1697018400000, // 2023-10-11T10:00:00Z
            },
            {
              seasonId: "season1",
              episodeId: "episode3", // Not found
              latestWatchedTimeMs: 3434000,
              createdTimeMs: 1697007600000, // 2023-10-11T07:00:00Z
            },
            {
              seasonId: "season1",
              episodeId: "episode2",
              latestWatchedTimeMs: 3434000,
              createdTimeMs: 1697007600000, // 2023-10-11T07:00:00Z
            },
          ],
          createdTimeCursor: 1000,
        } as ListWatchSessionsResponse;
        this.cut = new HistoryPage(
          serviceClientMock,
          () => new Date("2023-10-11"),
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
            LIST_WATCH_SESSIONS_REQUEST_BODY,
          ),
          "ListWatchSessionsRequest 1",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/history_page_tablet.png"),
          path.join(__dirname, "/golden/history_page_tablet.png"),
          path.join(__dirname, "/history_page_tablet_diff.png"),
        );

        // Prepare
        serviceClientMock.response = {
          sessions: [
            {
              seasonId: "season3", // Not found
              episodeId: "episode1",
              latestWatchedTimeMs: 1234000,
              createdTimeMs: 1696845600000, // 2023-10-09T10:00:00Z
            },
            {
              seasonId: "season2",
              episodeId: "episode1",
              latestWatchedTimeMs: 34000,
              createdTimeMs: 1696852800000, // 2023-10-09T12:00:00Z
            },
            {
              seasonId: "season2",
              episodeId: "episode2",
              latestWatchedTimeMs: 234000,
              createdTimeMs: 1696845600000, // 2023-10-09T10:00:00Z
            },
          ],
        } as ListWatchSessionsResponse;

        // Execute
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              limit: 10,
              createdTimeCursor: 1000,
            },
            LIST_WATCH_SESSIONS_REQUEST_BODY,
          ),
          "ListWatchSessionsRequest 2",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/history_page_tablet_scrolled.png"),
          path.join(__dirname, "/golden/history_page_tablet_scrolled.png"),
          path.join(__dirname, "/history_page_tablet_scrolled_diff.png"),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/history_page_tablet_scrolled_no_more.png"),
          path.join(
            __dirname,
            "/golden/history_page_tablet_scrolled_no_more.png",
          ),
          path.join(
            __dirname,
            "/history_page_tablet_scrolled_no_more_diff.png",
          ),
        );

        // Prepare
        window.scrollTo(0, 0);

        // Execute
        await setDesktopView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/history_page_desktop.png"),
          path.join(__dirname, "/golden/history_page_desktop.png"),
          path.join(__dirname, "/history_page_desktop_diff.png"),
        );

        // Execute
        await setPhoneView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/history_page_phone.png"),
          path.join(__dirname, "/golden/history_page_phone.png"),
          path.join(__dirname, "/history_page_phone_diff.png"),
        );

        // Prepare
        let viewUsageCalled = false;
        this.cut.on("viewUsage", () => {
          viewUsageCalled = true;
        });

        // Execute
        this.cut.estimatesCard.val.click();

        // Verify
        assertThat(viewUsageCalled, eq(true), "viewUsage called");

        // Prepare
        let playSeasonId: string;
        let playEpisodeId: string;
        this.cut.on("play", (seasonId, episodeId) => {
          playSeasonId = seasonId;
          playEpisodeId = episodeId;
        });

        // Execute
        await mouseClick(100, 300);

        // Verify
        assertThat(playSeasonId, eq("season1"), "play seasonId");
        assertThat(playEpisodeId, eq("episode1"), "play episodeId");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TabletView_NoEstimatedCharge_NoHistory";
      private cut: HistoryPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new (class extends WebServiceClientMock {
          public async send(
            request: ClientRequestInterface<any>,
          ): Promise<any> {
            switch (request.descriptor) {
              case LIST_METER_READINGS_PER_MONTH:
                return {
                  readings: [],
                } as ListMeterReadingsPerMonthResponse;
              case LIST_WATCH_SESSIONS:
                this.request = request;
                return this.response;
              default:
                throw new Error(`Unexpected`);
            }
          }
        })();
        serviceClientMock.response = {
          sessions: [],
        } as ListWatchSessionsResponse;
        this.cut = new HistoryPage(
          serviceClientMock,
          () => new Date("2023-10-11"),
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/history_page_tablet_nothing.png"),
          path.join(__dirname, "/golden/history_page_tablet_nothing.png"),
          path.join(__dirname, "/history_page_tablet_nothing_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
