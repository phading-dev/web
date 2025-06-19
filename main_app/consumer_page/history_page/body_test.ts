import "../../../dev/env";
import coverImage = require("../common/test_data/cover_tall.jpg");
import coverImage2 = require("../common/test_data/cover_tall2.jpg");
import path from "path";
import { normalizeBody } from "../../../common/normalize_body";
import {
  setDesktopView,
  setPhoneView,
  setTabletView,
} from "../../../common/view_port";
import { HistoryPage } from "./body";
import {
  LIST_METER_READINGS_PER_DAY,
  LIST_METER_READINGS_PER_DAY_REQUEST_BODY,
  ListMeterReadingsPerDayResponse,
} from "@phading/meter_service_interface/show/web/consumer/interface";
import {
  LIST_WATCH_SESSIONS,
  LIST_WATCH_SESSIONS_REQUEST_BODY,
  ListWatchSessionsResponse,
} from "@phading/play_activity_service_interface/show/web/interface";
import {
  GET_EPISODE_WITH_SEASON_SUMMARY,
  GetEpisodeWithSeasonSummaryResponse,
} from "@phading/product_service_interface/show/web/consumer/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { mouseClick, mouseMove } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

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
        let listMeterReadingsPerDayRequest: any;
        let serviceClientMock = new (class extends WebServiceClientMock {
          public async send(
            request: ClientRequestInterface<any>,
          ): Promise<any> {
            switch (request.descriptor) {
              case LIST_METER_READINGS_PER_DAY:
                listMeterReadingsPerDayRequest = request;
                let response: ListMeterReadingsPerDayResponse = {
                  readings: [
                    {
                      date: "2023-10-01",
                      watchTimeSecGraded: 12345678,
                    },
                    {
                      date: "2023-10-05",
                      watchTimeSecGraded: 22345678,
                    },
                    {
                      date: "2023-10-30",
                      watchTimeSecGraded: 32345678,
                    },
                  ],
                };
                return response;
              case LIST_WATCH_SESSIONS:
                this.request = request;
                return this.response;
              case GET_EPISODE_WITH_SEASON_SUMMARY:
                if (request.body.seasonId === "season1") {
                  if (request.body.episodeId === "episode1") {
                    return {
                      summary: {
                        season: {
                          seasonId: "season1",
                          name: "Re:Zero -Starting Life in Another World-",
                          coverImageUrl: coverImage,
                          grade: 180,
                          ratingsCount: 12345,
                          averageRating: 4,
                        },
                        episode: {
                          episodeId: "episode1",
                          name: "Episode 1",
                          videoDurationSec: 3700,
                          canPlay: true,
                        },
                      },
                    } as GetEpisodeWithSeasonSummaryResponse;
                  } else if (request.body.episodeId === "episode2") {
                    return {
                      summary: {
                        season: {
                          seasonId: "season1",
                          name: "Re:Zero -Starting Life in Another World-",
                          grade: 180,
                          ratingsCount: 12345,
                          averageRating: 4,
                        },
                        episode: {
                          episodeId: "episode2",
                          name: "Episode 2",
                          videoDurationSec: 3890,
                          canPlay: true,
                        },
                      },
                    } as GetEpisodeWithSeasonSummaryResponse;
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
                          grade: 209,
                          ratingsCount: 54321,
                          averageRating: 5,
                        },
                        episode: {
                          episodeId: "episode1",
                          name: "The Fall of Shiganshina",
                          videoDurationSec: 2700,
                          canPlay: true,
                        },
                      },
                    } as GetEpisodeWithSeasonSummaryResponse;
                  } else if (request.body.episodeId === "episode2") {
                    return {
                      summary: {
                        season: {
                          seasonId: "season2",
                          name: "Attack on Titan",
                          grade: 209,
                          ratingsCount: 54321,
                          averageRating: 5,
                        },
                        episode: {
                          episodeId: "episode2",
                          name: "The Beast Titan",
                          videoDurationSec: 2700,
                          canPlay: true,
                        },
                      },
                    } as GetEpisodeWithSeasonSummaryResponse;
                  } else if (request.body.episodeId === "episode3") {
                    return {
                      summary: {
                        season: {
                          seasonId: "season2",
                          name: "Attack on Titan",
                          grade: 209,
                          ratingsCount: 54321,
                          averageRating: 5,
                        },
                        episode: {
                          episodeId: "episode3",
                          name: "The War Hammer Titan",
                          videoDurationSec: 2700,
                          canPlay: false,
                        },
                      },
                    } as GetEpisodeWithSeasonSummaryResponse;
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
        let response: ListWatchSessionsResponse = {
          sessions: [
            {
              seasonId: "season1",
              episodeId: "episode1",
              date: "2023-10-11",
              latestWatchedVideoTimeMs: 1434000,
            },
            {
              seasonId: "season1",
              episodeId: "episode3", // Not found
              date: "2023-10-10",
              latestWatchedVideoTimeMs: 3434000,
            },
            {
              seasonId: "season1",
              episodeId: "episode2",
              date: "2023-10-10",
              latestWatchedVideoTimeMs: 3434000,
            },
          ],
          updatedTimeCursor: 1000,
        };
        serviceClientMock.response = response;
        this.cut = new HistoryPage(
          serviceClientMock,
          () => new Date("2023-10-11"),
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          listMeterReadingsPerDayRequest.body,
          eqMessage(
            {
              startDate: "2023-10-01",
              endDate: "2023-10-31",
            },
            LIST_METER_READINGS_PER_DAY_REQUEST_BODY,
          ),
          "ListMeterReadingsPerDayRequest",
        );
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
        response = {
          sessions: [
            {
              seasonId: "season2",
              episodeId: "episode3", // Cannot play
              date: "2023-10-09",
              latestWatchedVideoTimeMs: 1234000,
            },
            {
              seasonId: "season2",
              episodeId: "episode1",
              date: "2023-10-09",
              latestWatchedVideoTimeMs: 34000,
            },
            {
              seasonId: "season2",
              episodeId: "episode2",
              date: "2023-10-09",
              latestWatchedVideoTimeMs: 234000,
            },
          ],
        };
        serviceClientMock.response = response;

        // Execute
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              limit: 10,
              updatedTimeCursor: 1000,
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
      public async tearDown() {
        await mouseMove(-1, -1, 1);
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
              case LIST_METER_READINGS_PER_DAY:
                let response: ListMeterReadingsPerDayResponse = {
                  readings: [],
                };
                return response;
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
