import "../../../dev/env";
import "../../../common/normalize_body";
import coverImage = require("./test_data/cover_tall.jpg");
import coverImage2 = require("./test_data/cover_tall2.jpg");
import path = require("path");
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
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebClientOptions } from "@selfage/web_service_client";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

TEST_RUNNER.run({
  name: "MultiSectionPageTest",
  cases: [
    new (class implements TestCase {
      public name = "OneForEachSection";
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
                        grade: 18,
                        ratingsCount: 12345,
                        averageRating: 4,
                      },
                      episode: {
                        episodeId: "episode1",
                        name: "Episode 1",
                        continueTimeMs: 134000,
                        videoDurationSec: 3600,
                      },
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
                      grade: 16,
                      ratingsCount: 6789,
                      averageRating: 4.5,
                    },
                  ],
                } as ListSeasonsByRecentPremiereTimeResponse;
            }
          }
        })();
        this.cut = new MultiSectionPage(serviceClientMock);

        // Execute
        document.body.appendChild(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loaded", () => resolve()),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/multi_section_page_one_item.png"),
          path.join(__dirname, "/golden/multi_section_page_one_item.png"),
          path.join(__dirname, "/multi_section_page_one_item_diff.png"),
        );

        // Execute
        await setTabletView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/multi_section_page_one_item_tablet.png"),
          path.join(
            __dirname,
            "/golden/multi_section_page_one_item_tablet.png",
          ),
          path.join(__dirname, "/multi_section_page_one_item_tablet_diff.png"),
        );

        // Execute
        await setPhoneView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/multi_section_page_one_item_phone.png"),
          path.join(__dirname, "/golden/multi_section_page_one_item_phone.png"),
          path.join(__dirname, "/multi_section_page_one_item_phone_diff.png"),
        );
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
                        grade: 18,
                        ratingsCount: 12345,
                        averageRating: 4,
                      },
                      episode: {
                        episodeId: "episode1",
                        name: "Episode 1",
                        continueTimeMs: 134000,
                        videoDurationSec: 3600,
                      },
                    },
                    {
                      season: {
                        seasonId: "season2",
                        name: "Attack on Titan",
                        coverImageUrl: coverImage2,
                        grade: 16,
                        ratingsCount: 6789,
                        averageRating: 4.5,
                      },
                      episode: {
                        episodeId: "episode2",
                        name: "Episode 2",
                        continueTimeMs: 120000,
                        videoDurationSec: 3600,
                      },
                    },
                    {
                      season: {
                        seasonId: "season3",
                        name: "My Hero Academia",
                        coverImageUrl: coverImage,
                        grade: 12,
                        ratingsCount: 4567,
                        averageRating: 4.8,
                      },
                      episode: {
                        episodeId: "episode3",
                        name: "Episode 3",
                        continueTimeMs: 60000,
                        videoDurationSec: 3600,
                      },
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
                      grade: 16,
                      ratingsCount: 6789,
                      averageRating: 4.5,
                    },
                    {
                      seasonId: "season3",
                      name: "My Hero Academia",
                      coverImageUrl: coverImage,
                      grade: 12,
                      ratingsCount: 4567,
                      averageRating: 4.8,
                    },
                    {
                      seasonId: "season4",
                      name: "Demon Slayer",
                      coverImageUrl: coverImage2,
                      grade: 10,
                      ratingsCount: 2345,
                      averageRating: 4.9,
                    },
                  ],
                } as ListSeasonsByRecentPremiereTimeResponse;
            }
          }
        })();
        this.cut = new MultiSectionPage(serviceClientMock);

        // Execute
        document.body.appendChild(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loaded", () => resolve()),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/multi_section_page_three_items.png"),
          path.join(__dirname, "/golden/multi_section_page_three_items.png"),
          path.join(__dirname, "/multi_section_page_three_items_diff.png"),
        );

        // Execute
        await setTabletView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/multi_section_page_three_items_tablet.png"),
          path.join(
            __dirname,
            "/golden/multi_section_page_three_items_tablet.png",
          ),
          path.join(
            __dirname,
            "/multi_section_page_three_items_tablet_diff.png",
          ),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/multi_section_page_three_items_tablet_scroll_to_bottom.png",
          ),
          path.join(
            __dirname,
            "/golden/multi_section_page_three_items_tablet_scroll_to_bottom.png",
          ),
          path.join(
            __dirname,
            "/multi_section_page_three_items_tablet_scroll_to_bottom_diff.png",
          ),
        );

        // Execute
        await setPhoneView();
        window.scrollTo(0, 0);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/multi_section_page_three_items_phone.png"),
          path.join(
            __dirname,
            "/golden/multi_section_page_three_items_phone.png",
          ),
          path.join(
            __dirname,
            "/multi_section_page_three_items_phone_diff.png",
          ),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/multi_section_page_three_items_phone_scroll_to_bottom.png",
          ),
          path.join(
            __dirname,
            "/golden/multi_section_page_three_items_phone_scroll_to_bottom.png",
          ),
          path.join(
            __dirname,
            "/multi_section_page_three_items_phone_scroll_to_bottom_diff.png",
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
                  continues: [
                  ],
                } as ListContinueWatchingSeasonsResponse;
              case LIST_SEASONS_BY_RECENT_PREMIERE_TIME:
                return {
                  seasons: [
                    {
                      seasonId: "season2",
                      name: "Attack on Titan",
                      coverImageUrl: coverImage2,
                      grade: 16,
                      ratingsCount: 6789,
                      averageRating: 4.5,
                    },
                  ],
                } as ListSeasonsByRecentPremiereTimeResponse;
            }
          }
        })();
        this.cut = new MultiSectionPage(serviceClientMock);

        // Execute
        document.body.appendChild(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loaded", () => resolve()),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/multi_section_page_no_continue_watching.png"),
          path.join(__dirname, "/golden/multi_section_page_no_continue_watching.png"),
          path.join(__dirname, "/multi_section_page_no_continue_watching_diff.png"),
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
                        grade: 18,
                        ratingsCount: 12345,
                        averageRating: 4,
                      },
                      episode: {
                        episodeId: "episode1",
                        name: "Episode 1",
                        continueTimeMs: 134000,
                        videoDurationSec: 3600,
                      },
                    }
                  ],
                } as ListContinueWatchingSeasonsResponse;
              case LIST_SEASONS_BY_RECENT_PREMIERE_TIME:
                return {
                  seasons: [],
                } as ListSeasonsByRecentPremiereTimeResponse;
            }
          }
        })();
        this.cut = new MultiSectionPage(serviceClientMock);
        document.body.appendChild(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loaded", () => resolve()),
        );

        let listContinueWatching = false;
        this.cut.on("listContinueWatching", () => {
          listContinueWatching = true;
        });
        let listRecentPremieres = false;
        this.cut.on("listRecentPremieres", () => {
          listRecentPremieres = true;
        });

        // Execute
        this.cut.continueWatchingViewMore.val.click();

        // Verify
        assertThat(
          listContinueWatching,
          eq(true),
          "listContinueWatching should be emitted",
        );

        // Execute
        this.cut.recentPremiereViewMore.val.click();

        // Verify
        assertThat(
          listRecentPremieres,
          eq(true),
          "listRecentPremieres should be emitted",
        );
      }
      public tearDown() {
        this.cut.body.remove();
      }
    })(),
  ],
});
