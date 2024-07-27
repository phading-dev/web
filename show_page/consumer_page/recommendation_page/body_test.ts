import coverImage = require("./test_data/cover.jpg");
import userImage = require("./test_data/user_image.jpg");
import path = require("path");
import { RecommendationPage } from "./body";
import { PublisherContextItem } from "./publisher_context_item";
import { SeasonItem } from "./season_item";
import {
  RECOMMEND_SEASONS,
  RECOMMEND_SEASONS_REQUEST_BODY,
  RecommendSeasonsResponse,
} from "@phading/product_recommendation_service_interface/consumer/frontend/show/interface";
import { SeasonOverview } from "@phading/product_recommendation_service_interface/consumer/frontend/show/season_overview";
import { eqMessage } from "@selfage/message/test_matcher";
import {
  deleteFile,
  keyboardDown,
  keyboardUp,
  mouseMove,
  mouseWheel,
  screenshot,
  setViewport,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";
import "../../../common/normalize_body";

function createSeasonOverview(seasonId: string): SeasonOverview {
  return {
    seasonId: seasonId,
    name: `This is a title ${seasonId}`,
    coverImagePath: coverImage,
    grade: 1,
    continueEpisode: {
      episodeId: `ep ${seasonId}`,
      name: `Episode ${seasonId}`,
      length: 12,
      publishedTime: 123456,
    },
    publisher: {
      accountId: `account ${seasonId}`,
      avatarSmallPath: userImage,
      naturalName: `Name ${seasonId}`,
    },
  };
}

function createMultipleSeasons(
  startIndex: number,
  times: number,
): Array<SeasonOverview> {
  let seasons = new Array<SeasonOverview>();
  for (let i = 0; i < times; i++) {
    seasons.push(createSeasonOverview(`id${i + startIndex}`));
  }
  return seasons;
}

class LayoutTestCase implements TestCase {
  private cut: RecommendationPage;
  public constructor(
    public name: string,
    private width: number,
    private numOfItems: number,
    private actualFile: string,
    private expectedFile: string,
    private diffFile: string,
  ) {}
  public async execute() {
    // Prepare
    await setViewport(this.width, 1200);
    let numOfItems = this.numOfItems;

    // Execute
    this.cut = new RecommendationPage(
      new (class extends WebServiceClientMock {
        private counter = 0;
        public async send(request: any): Promise<RecommendSeasonsResponse> {
          switch (this.counter++) {
            case 0:
              let seasons = new Array<SeasonOverview>();
              for (let i = 0; i < numOfItems; i++) {
                seasons.push(createSeasonOverview(`id${i}`));
              }
              return {
                seasons,
              };
            case 1:
              return {
                seasons: [],
              };
            default:
              throw new Error("Not expected");
          }
        }
      })(),
      SeasonItem.create,
      PublisherContextItem.create,
    );
    document.body.append(this.cut.body);
    await new Promise<void>((resolve) => this.cut.on("loadedAll", resolve));

    // Verify
    await asyncAssertScreenshot(
      this.actualFile,
      this.expectedFile,
      this.diffFile,
    );
  }

  public tearDown() {
    this.cut.remove();
  }
}

TEST_RUNNER.run({
  name: "ListPageTest",
  cases: [
    new LayoutTestCase(
      "Smallest",
      400,
      1,
      path.join(__dirname, "/recommendation_page_smallest.png"),
      path.join(__dirname, "/golden/recommendation_page_smallest.png"),
      path.join(__dirname, "/recommendation_page_smallest_diff.png"),
    ),
    new LayoutTestCase(
      "Small",
      900,
      5,
      path.join(__dirname, "/recommendation_page_small.png"),
      path.join(__dirname, "/golden/recommendation_page_small.png"),
      path.join(__dirname, "/recommendation_page_small_diff.png"),
    ),
    new LayoutTestCase(
      "Medium",
      1300,
      6,
      path.join(__dirname, "/recommendation_page_medium.png"),
      path.join(__dirname, "/golden/recommendation_page_medium.png"),
      path.join(__dirname, "/recommendation_page_medium_diff.png"),
    ),
    new LayoutTestCase(
      "Large",
      1600,
      7,
      path.join(__dirname, "/recommendation_page_large.png"),
      path.join(__dirname, "/golden/recommendation_page_large.png"),
      path.join(__dirname, "/recommendation_page_large_diff.png"),
    ),
    new LayoutTestCase(
      "Largest",
      1800,
      8,
      path.join(__dirname, "/recommendation_page_largest.png"),
      path.join(__dirname, "/golden/recommendation_page_largest.png"),
      path.join(__dirname, "/recommendation_page_largest_diff.png"),
    ),
    new (class implements TestCase {
      public name = "LoadManyWithCursor_ScrollToLoadMore";
      private cut: RecommendationPage;
      public async execute() {
        // Prepare
        await setViewport(800, 800);
        let requestCaptured = new Array<any>();
        let response: RecommendSeasonsResponse;
        response = {
          seasons: createMultipleSeasons(0, 7),
          cursor: "2nd",
        };

        // Execute
        this.cut = new RecommendationPage(
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              requestCaptured.push(request);
              return response;
            }
          })(),
          SeasonItem.create,
          PublisherContextItem.create,
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.on("loaded", resolve));
        await mouseMove(600, 600, 1);

        // Verify
        assertThat(requestCaptured.length, eq(1), "1st request");
        assertThat(
          requestCaptured[0].descriptor,
          eq(RECOMMEND_SEASONS),
          "service",
        );
        assertThat(
          requestCaptured[0].body,
          eqMessage(
            {
              query: "",
            },
            RECOMMEND_SEASONS_REQUEST_BODY,
          ),
          "1st request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/recommendation_page_long.png"),
          path.join(__dirname, "/golden/recommendation_page_long.png"),
          path.join(__dirname, "/recommendation_page_long_diff.png"),
        );

        // Prepare
        requestCaptured.length = 0;
        response = {
          seasons: createMultipleSeasons(7, 7),
          cursor: "3rd",
        };

        // Execute
        await mouseWheel(0, 600);
        await new Promise<void>((resolve) => this.cut.on("loaded", resolve));

        // Verify
        assertThat(requestCaptured.length, eq(1), "2nd request");
        assertThat(
          requestCaptured[0].body,
          eqMessage(
            {
              query: "",
              cursor: "2nd",
            },
            RECOMMEND_SEASONS_REQUEST_BODY,
          ),
          "2nd request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/recommendation_page_loaded_1st.png"),
          path.join(__dirname, "/golden/recommendation_page_loaded_1st.png"),
          path.join(__dirname, "/recommendation_page_loaded_1st_diff.png"),
        );

        // Prepare
        requestCaptured.length = 0;
        response = {
          seasons: createMultipleSeasons(14, 7),
          cursor: "4th",
        };

        // Execute
        await mouseWheel(0, 800);
        await new Promise<void>((resolve) => this.cut.on("loaded", resolve));

        // Verify
        assertThat(requestCaptured.length, eq(1), "3rd request");
        assertThat(
          requestCaptured[0].body,
          eqMessage(
            {
              query: "",
              cursor: "3rd",
            },
            RECOMMEND_SEASONS_REQUEST_BODY,
          ),
          "3rd request body",
        );
        for (let item of this.cut.seasonItems) {
          item.hover();
          break;
        }
        await asyncAssertScreenshot(
          path.join(__dirname, "/recommendation_page_loaded_2nd.png"),
          path.join(__dirname, "/golden/recommendation_page_loaded_2nd.png"),
          path.join(__dirname, "/recommendation_page_loaded_2nd_diff.png"),
        );
      }
      public async tearDown() {
        this.cut.remove();
        await mouseMove(-1, -1, 1);
      }
    })(),
    new (class implements TestCase {
      public name = "PlayShow_FocusAccount";
      private cut: RecommendationPage;
      public async execute() {
        // Prepare
        await setViewport(900, 800);
        this.cut = new RecommendationPage(
          new (class extends WebServiceClientMock {
            private counter = 0;
            public async send(): Promise<RecommendSeasonsResponse> {
              switch (this.counter++) {
                case 0:
                  return {
                    seasons: createMultipleSeasons(0, 3),
                  };
                case 1:
                  return {
                    seasons: [],
                  };
                default:
                  throw new Error("Not expected");
              }
            }
          })(),
          SeasonItem.create,
          PublisherContextItem.create,
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.on("loadedAll", resolve));
        let playingEpisodeId: string;
        this.cut.on("play", (episodeId) => (playingEpisodeId = episodeId));
        let focusAccountId: string;
        this.cut.on(
          "focusAccount",
          (accountId) => (focusAccountId = accountId),
        );

        // Execute
        for (let item of this.cut.seasonItems) {
          item.click();
          item.clickAccount();
          break;
        }

        // Verify
        assertThat(playingEpisodeId, eq(`ep id0`), "playing episode id");
        assertThat(focusAccountId, eq(`account id0`), "focus account id");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Loading";
      private cut: RecommendationPage;
      public async execute() {
        // Prepare
        await setViewport(900, 800);
        let counter = 0;
        let response = new Array<Promise<RecommendSeasonsResponse>>();
        response.push(
          Promise.resolve({
            seasons: createMultipleSeasons(0, 3),
          }),
          Promise.resolve({
            seasons: [],
          }),
        );
        this.cut = new RecommendationPage(
          new (class extends WebServiceClientMock {
            public async send(): Promise<any> {
              return response[counter++];
            }
          })(),
          SeasonItem.create,
          PublisherContextItem.create,
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.on("loadedAll", resolve));
        await screenshot(
          path.join(__dirname, "/recommendation_page_loaded_baseline.png"),
        );

        let resolverFn: (response: RecommendSeasonsResponse) => void;
        response.push(
          new Promise<RecommendSeasonsResponse>(
            (resolve) => (resolverFn = resolve),
          ),
        );

        // Execute
        this.cut.tryReloadButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/recommendation_page_loading.png"),
          path.join(__dirname, "/golden/recommendation_page_loading.png"),
          path.join(__dirname, "/recommendation_page_loading_diff.png"),
          {
            excludedAreas: [
              {
                x: 0,
                width: 900,
                y: 495,
                height: 50,
              },
            ],
          },
        );

        // Execute
        resolverFn({
          seasons: [],
        });
        await new Promise<void>((resolve) => this.cut.on("loadedAll", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/recommendation_page_loaded.png"),
          path.join(__dirname, "/recommendation_page_loaded_baseline.png"),
          path.join(__dirname, "/recommendation_page_loaded_diff.png"),
        );

        // Cleanup
        await deleteFile(
          path.join(__dirname, "/recommendation_page_loaded_baseline.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "SearchByAccountId_ScrolledDown";
      private cut: RecommendationPage;
      public async execute() {
        // Prepare
        await setViewport(600, 800);
        let requestCaptured = new Array<any>();
        let counter = 0;
        let response = new Array<RecommendSeasonsResponse>();
        response.push(
          {
            context: {
              publisher: {
                accountId: "account id1",
                avatarLargePath: userImage,
                description: "This is a publisher",
                naturalName: "First Second",
              },
            },
            cursor: "2nd",
            seasons: [
              createSeasonOverview(`season1`),
              createSeasonOverview(`season2`),
              createSeasonOverview(`season3`),
              createSeasonOverview(`season4`),
            ],
          },
          {
            seasons: [],
            cursor: "3rd",
          },
        );

        // Execute
        this.cut = new RecommendationPage(
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<RecommendSeasonsResponse> {
              requestCaptured.push(request);
              return response[counter++];
            }
          })(),
          SeasonItem.create,
          PublisherContextItem.create,
          {
            accountId: "id1",
          },
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.on("loaded", resolve));

        // Verify
        assertThat(requestCaptured.length, eq(1), "1st request");
        assertThat(
          requestCaptured[0].body,
          eqMessage(
            {
              query: "accountId=id1",
            },
            RECOMMEND_SEASONS_REQUEST_BODY,
          ),
          "1st request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/recommendation_page_publisher_context.png"),
          path.join(
            __dirname,
            "/golden/recommendation_page_publisher_context.png",
          ),
          path.join(
            __dirname,
            "/recommendation_page_publisher_context_diff.png",
          ),
        );

        // Prepare
        requestCaptured.length = 0;

        // Execute
        await mouseMove(100, 400, 1);
        await mouseWheel(0, 600);
        await new Promise<void>((resolve) => this.cut.on("loadedAll", resolve));

        // Verify
        assertThat(requestCaptured.length, eq(1), "2nd request");
        assertThat(
          requestCaptured[0].body,
          eqMessage(
            {
              query: "accountId=id1",
              cursor: "2nd",
            },
            RECOMMEND_SEASONS_REQUEST_BODY,
          ),
          "2nd request body",
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/recommendation_page_publisher_context_scrolled.png",
          ),
          path.join(
            __dirname,
            "/golden/recommendation_page_publisher_context_scrolled.png",
          ),
          path.join(
            __dirname,
            "/recommendation_page_publisher_context_scrolled_diff.png",
          ),
        );
      }
      public async tearDown() {
        this.cut.remove();
        await mouseMove(-1, -1, 1);
      }
    })(),
    new (class implements TestCase {
      public name =
        "SearchByQuery_NoResults_NoSearchForTheSameQuery_EmptyQuery";
      private cut: RecommendationPage;
      public async execute() {
        // Prepare
        await setViewport(600, 800);
        let requestCaptured = new Array<any>();

        // Execute
        this.cut = new RecommendationPage(
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<RecommendSeasonsResponse> {
              requestCaptured.push(request);
              return {
                seasons: [],
              };
            }
          })(),
          SeasonItem.create,
          PublisherContextItem.create,
          {
            query: "some some query",
          },
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.on("loadedAll", resolve));

        // Verify
        assertThat(requestCaptured.length, eq(1), "1 request");
        assertThat(
          requestCaptured[0].body,
          eqMessage(
            {
              query: "some some query",
            },
            RECOMMEND_SEASONS_REQUEST_BODY,
          ),
          "request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/recommendation_page_query.png"),
          path.join(__dirname, "/golden/recommendation_page_query.png"),
          path.join(__dirname, "/recommendation_page_query_diff.png"),
        );

        // Prepare
        let toQuery: string;
        this.cut.on("search", (query) => (toQuery = query));

        // Execute
        this.cut.searchButton.val.click();

        // Verify
        assertThat(toQuery, eq(undefined), "no query yet");

        // Execute
        this.cut.searchInput.val.value = "";
        this.cut.searchInput.val.focus();
        await keyboardDown("Enter");

        // Verify
        assertThat(toQuery, eq(""), "empty query");
      }
      public async tearDown() {
        this.cut.remove();
        await keyboardUp("Enter");
      }
    })(),
    new (class implements TestCase {
      public name = "ShowMenu_GoToAccount_GoToHistory_HideMenu";
      private cut: RecommendationPage;
      public async execute() {
        // Prepare
        await setViewport(600, 800);
        this.cut = new RecommendationPage(
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<RecommendSeasonsResponse> {
              return {
                seasons: createMultipleSeasons(0, 4),
              };
            }
          })(),
          SeasonItem.create,
          PublisherContextItem.create,
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.on("loaded", resolve));

        // Prepare
        let goToAccount = false;
        this.cut.on("goToAccount", () => (goToAccount = true));

        // Execute
        this.cut.accountButton.val.click();

        // Verify
        assertThat(goToAccount, eq(true), "go to account");

        // Prepare
        let goToHistory = false;
        this.cut.on("goToHistory", () => (goToHistory = true));

        // Execute
        this.cut.historyButton.val.click();

        // Verify
        assertThat(goToHistory, eq(true), "go to history");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
