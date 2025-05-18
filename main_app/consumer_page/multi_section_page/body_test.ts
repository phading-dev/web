import "../../../dev/env";
import coverImage = require("../common/test_data/cover_tall.jpg");
import coverImage2 = require("../common/test_data/cover_tall2.jpg");
import path = require("path");
import { normalizeBody } from "../../../common/normalize_body";
import {
  setDesktopView,
  setPhoneView,
  setTabletView,
} from "../../../common/view_port";
import { MultiSectionPage } from "./body";
import {
  LIST_CONTINUE_WATCHING_SEASONS,
  LIST_SEASONS_BY_RECENT_PREMIERE_TIME,
  ListContinueWatchingSeasonsResponse,
  ListSeasonsByRecentPremiereTimeResponse,
} from "@phading/product_service_interface/show/web/consumer/interface";
import { mouseClick } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebClientOptions } from "@selfage/web_service_client";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "MultiSectionPageTest",
  cases: [
    new (class implements TestCase {
      public name = "OneForEachSection_ClickToPlay_ClickToShowDetails";
      private cut: MultiSectionPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let serviceClientMock = new (class extends WebServiceClientMock {
          public async send(
            request: ClientRequestInterface<any>,
            options?: WebClientOptions,
          ): Promise<any> {
            switch (request.descriptor) {
              case LIST_CONTINUE_WATCHING_SEASONS:
                return {
                  continues: [
                    {
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
                        videoDurationSec: 3600,
                      },
                      continueTimeMs: 134000,
                    },
                  ],
                } as ListContinueWatchingSeasonsResponse;
              case LIST_SEASONS_BY_RECENT_PREMIERE_TIME:
                return {
                  seasons: [
                    {
                      seasonId: "season2",
                      name: "Attack on Titan",
                      coverImageUrl: coverImage2,
                      grade: 160,
                      ratingsCount: 6789,
                      averageRating: 4.5,
                    },
                  ],
                } as ListSeasonsByRecentPremiereTimeResponse;
            }
          }
        })();
        this.cut = new MultiSectionPage(
          serviceClientMock,
          () => new Date("2024-01-01"),
        );

        // Execute
        document.body.appendChild(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loaded", () => resolve()),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_one_item.png"),
          path.join(__dirname, "/golden/home_page_one_item.png"),
          path.join(__dirname, "/home_page_one_item_diff.png"),
        );

        // Execute
        await setTabletView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_one_item_tablet.png"),
          path.join(__dirname, "/golden/home_page_one_item_tablet.png"),
          path.join(__dirname, "/home_page_one_item_tablet_diff.png"),
        );

        // Execute
        await setPhoneView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_one_item_phone.png"),
          path.join(__dirname, "/golden/home_page_one_item_phone.png"),
          path.join(__dirname, "/home_page_one_item_phone_diff.png"),
        );

        // Prepare
        let playSeasonId: string;
        let playEpisodeId: string;
        this.cut.on("play", (seasonId, episodeId) => {
          playSeasonId = seasonId;
          playEpisodeId = episodeId;
        });

        // Execute
        await mouseClick(100, 50);

        // Verify
        assertThat(playSeasonId, eq("season1"), "playSeasonId");
        assertThat(playEpisodeId, eq("episode1"), "playEpisodeId");

        // Prepare
        let showDetailsId: string;
        this.cut.on("showDetails", (id) => {
          showDetailsId = id;
        });

        // Execute
        await mouseClick(100, 450);

        // Verify
        assertThat(showDetailsId, eq("season2"), "showDetailsId");
      }
      public tearDown() {
        this.cut.body.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ThreeForEachSection";
      private cut: MultiSectionPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let serviceClientMock = new (class extends WebServiceClientMock {
          public async send(
            request: ClientRequestInterface<any>,
            options?: WebClientOptions,
          ): Promise<any> {
            switch (request.descriptor) {
              case LIST_CONTINUE_WATCHING_SEASONS:
                return {
                  continues: [
                    {
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
                        videoDurationSec: 3600,
                      },
                      continueTimeMs: 134000,
                    },
                    {
                      season: {
                        seasonId: "season2",
                        name: "Attack on Titan",
                        coverImageUrl: coverImage2,
                        grade: 162,
                        ratingsCount: 6789,
                        averageRating: 4.5,
                      },
                      episode: {
                        episodeId: "episode2",
                        name: "Episode 2",
                        videoDurationSec: 3600,
                      },
                      continueTimeMs: 120000,
                    },
                    {
                      season: {
                        seasonId: "season3",
                        name: "My Hero Academia",
                        coverImageUrl: coverImage,
                        grade: 125,
                        ratingsCount: 4567,
                        averageRating: 4.8,
                      },
                      episode: {
                        episodeId: "episode3",
                        name: "Episode 3",
                        videoDurationSec: 3600,
                      },
                      continueTimeMs: 60000,
                    },
                    {
                      // This item will be ignored
                      season: {
                        seasonId: "season4",
                        name: "Demon Slayer",
                        coverImageUrl: coverImage2,
                        grade: 100,
                        ratingsCount: 2345,
                        averageRating: 4.9,
                      },
                      episode: {
                        episodeId: "episode4",
                        name: "Episode 4",
                        videoDurationSec: 3600,
                      },
                      continueTimeMs: 30000,
                    },
                  ],
                } as ListContinueWatchingSeasonsResponse;
              case LIST_SEASONS_BY_RECENT_PREMIERE_TIME:
                return {
                  seasons: [
                    {
                      seasonId: "season2",
                      name: "Attack on Titan",
                      coverImageUrl: coverImage2,
                      grade: 160,
                      ratingsCount: 6789,
                      averageRating: 4.5,
                    },
                    {
                      seasonId: "season3",
                      name: "My Hero Academia",
                      coverImageUrl: coverImage,
                      grade: 120,
                      ratingsCount: 4567,
                      averageRating: 4.8,
                    },
                    {
                      seasonId: "season4",
                      name: "Demon Slayer",
                      coverImageUrl: coverImage2,
                      grade: 100,
                      ratingsCount: 2345,
                      averageRating: 4.9,
                    },
                  ],
                } as ListSeasonsByRecentPremiereTimeResponse;
            }
          }
        })();
        this.cut = new MultiSectionPage(
          serviceClientMock,
          () => new Date("2024-01-01"),
        );

        // Execute
        document.body.appendChild(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loaded", () => resolve()),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_three_items.png"),
          path.join(__dirname, "/golden/home_page_three_items.png"),
          path.join(__dirname, "/home_page_three_items_diff.png"),
        );

        // Execute
        await setTabletView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_three_items_tablet.png"),
          path.join(__dirname, "/golden/home_page_three_items_tablet.png"),
          path.join(__dirname, "/home_page_three_items_tablet_diff.png"),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/home_page_three_items_tablet_scroll_to_bottom.png",
          ),
          path.join(
            __dirname,
            "/golden/home_page_three_items_tablet_scroll_to_bottom.png",
          ),
          path.join(
            __dirname,
            "/home_page_three_items_tablet_scroll_to_bottom_diff.png",
          ),
        );

        // Execute
        await setPhoneView();
        window.scrollTo(0, 0);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_three_items_phone.png"),
          path.join(__dirname, "/golden/home_page_three_items_phone.png"),
          path.join(__dirname, "/home_page_three_items_phone_diff.png"),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/home_page_three_items_phone_scroll_to_bottom.png",
          ),
          path.join(
            __dirname,
            "/golden/home_page_three_items_phone_scroll_to_bottom.png",
          ),
          path.join(
            __dirname,
            "/home_page_three_items_phone_scroll_to_bottom_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.body.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "NoContinueWatchingItems";
      private cut: MultiSectionPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let serviceClientMock = new (class extends WebServiceClientMock {
          public async send(
            request: ClientRequestInterface<any>,
            options?: WebClientOptions,
          ): Promise<any> {
            switch (request.descriptor) {
              case LIST_CONTINUE_WATCHING_SEASONS:
                return {
                  continues: [],
                } as ListContinueWatchingSeasonsResponse;
              case LIST_SEASONS_BY_RECENT_PREMIERE_TIME:
                return {
                  seasons: [
                    {
                      seasonId: "season2",
                      name: "Attack on Titan",
                      coverImageUrl: coverImage2,
                      grade: 160,
                      ratingsCount: 6789,
                      averageRating: 4.5,
                    },
                  ],
                } as ListSeasonsByRecentPremiereTimeResponse;
            }
          }
        })();
        this.cut = new MultiSectionPage(
          serviceClientMock,
          () => new Date("2024-01-01"),
        );

        // Execute
        document.body.appendChild(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loaded", () => resolve()),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_no_continue_watching.png"),
          path.join(__dirname, "/golden/home_page_no_continue_watching.png"),
          path.join(__dirname, "/home_page_no_continue_watching_diff.png"),
        );
      }
      public tearDown() {
        this.cut.body.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ClickViewMore";
      private cut: MultiSectionPage;
      public async execute() {
        // Prepare
        let serviceClientMock = new (class extends WebServiceClientMock {
          public async send(
            request: ClientRequestInterface<any>,
            options?: WebClientOptions,
          ): Promise<any> {
            switch (request.descriptor) {
              case LIST_CONTINUE_WATCHING_SEASONS:
                return {
                  continues: [
                    {
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
                        videoDurationSec: 3600,
                      },
                      continueTimeMs: 134000,
                    },
                  ],
                } as ListContinueWatchingSeasonsResponse;
              case LIST_SEASONS_BY_RECENT_PREMIERE_TIME:
                return {
                  seasons: [],
                } as ListSeasonsByRecentPremiereTimeResponse;
            }
          }
        })();
        this.cut = new MultiSectionPage(
          serviceClientMock,
          () => new Date("2024-01-01"),
        );
        document.body.appendChild(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loaded", () => resolve()),
        );

        let listWatchHistory = false;
        this.cut.on("listWatchHistory", () => {
          listWatchHistory = true;
        });
        let listRecentPremieres = false;
        this.cut.on("listRecentPremieres", () => {
          listRecentPremieres = true;
        });

        // Execute
        this.cut.continueWatchingViewMore.val.click();

        // Verify
        assertThat(
          listWatchHistory,
          eq(true),
          "listWatchHistory should be emitted",
        );

        // Execute
        this.cut.recentPremieresViewMore.val.click();

        // Verify
        assertThat(
          listRecentPremieres,
          eq(true),
          "listRecentPremieres should be emitted",
        );
      }
      public tearDown() {
        window.scrollTo(0, 0);
        this.cut.body.remove();
      }
    })(),
  ],
});
