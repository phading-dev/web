import coverImage = require("./test_data/cover.jpg");
import userImage = require("./test_data/user_image.jpg");
import path = require("path");
import { ListPage } from "./body";
import { ShowItem } from "./show_item";
import {
  RECOMMEND_SHOWS,
  RecommendShowsResponse,
} from "@phading/product_recommendation_service_interface/consumer/show_app/web/interface";
import { ShowSnapshot } from "@phading/product_service_interface/consumer/show_app/show";
import { Counter } from "@selfage/counter";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "../../../../common/normalize_body";

function createShowSnapshot(showId: string): ShowSnapshot {
  return {
    showId,
    name: "11 22 33 44 55 66",
    coverImagePath: coverImage,
    length: 3789,
    publishedTime: 1234567890,
    publisher: {
      accountId: `account ${showId}`,
      avatarSmallPath: userImage,
      naturalName: `account ${showId}`,
    },
  };
}

class LayoutTestCase implements TestCase {
  private cut: ListPage;
  public constructor(
    public name: string,
    private width: number,
    private numOfItems: number,
    private actualFile: string,
    private expectedFile: string,
    private diffFile: string
  ) {}
  public async execute() {
    // Prepare
    await setViewport(this.width, 800);
    let numOfItems = this.numOfItems;
    let requestCaptured: any;

    // Execute
    this.cut = new ListPage(
      ShowItem.create,
      new (class extends WebServiceClient {
        private counter = new Counter<string>();
        public constructor() {
          super(undefined, undefined);
        }
        public async send(request: any): Promise<RecommendShowsResponse> {
          switch (this.counter.increment("send")) {
            case 1:
              requestCaptured = request;
              let shows = new Array<ShowSnapshot>();
              for (let i = 0; i < numOfItems; i++) {
                shows.push(createShowSnapshot(`id${i}`));
              }
              return {
                shows,
              };
            case 2:
              return {
                shows: [],
              };
            default:
              throw new Error("Not expected");
          }
        }
      })()
    );
    document.body.append(this.cut.body);
    await new Promise<void>((resolve) => this.cut.on("loadedAll", resolve));

    // Verify
    await asyncAssertScreenshot(
      this.actualFile,
      this.expectedFile,
      this.diffFile
    );
    assertThat(requestCaptured.descriptor, eq(RECOMMEND_SHOWS), "load request");
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
      600,
      2,
      path.join(__dirname, "/list_page_smallest.png"),
      path.join(__dirname, "/golden/list_page_smallest.png"),
      path.join(__dirname, "/list_page_smallest_diff.png")
    ),
    new LayoutTestCase(
      "Small",
      900,
      3,
      path.join(__dirname, "/list_page_small.png"),
      path.join(__dirname, "/golden/list_page_small.png"),
      path.join(__dirname, "/list_page_small_diff.png")
    ),
    new LayoutTestCase(
      "Medium",
      1300,
      5,
      path.join(__dirname, "/list_page_medium.png"),
      path.join(__dirname, "/golden/list_page_medium.png"),
      path.join(__dirname, "/list_page_medium_diff.png")
    ),
    new LayoutTestCase(
      "Large",
      1600,
      6,
      path.join(__dirname, "/list_page_large.png"),
      path.join(__dirname, "/golden/list_page_large.png"),
      path.join(__dirname, "/list_page_large_diff.png")
    ),
    new LayoutTestCase(
      "Largest",
      1800,
      7,
      path.join(__dirname, "/list_page_largest.png"),
      path.join(__dirname, "/golden/list_page_largest.png"),
      path.join(__dirname, "/list_page_largest_diff.png")
    ),
    new (class implements TestCase {
      public name = "PlayShow_FocusUser";
      private cut: ListPage;
      public async execute() {
        // Prepare
        await setViewport(900, 800);
        this.cut = new ListPage(
          ShowItem.create,
          new (class extends WebServiceClient {
            private counter = new Counter<string>();
            public constructor() {
              super(undefined, undefined);
            }
            public async send(): Promise<RecommendShowsResponse> {
              switch (this.counter.increment("send")) {
                case 1:
                  let shows = new Array<ShowSnapshot>();
                  for (let i = 0; i < 3; i++) {
                    shows.push(createShowSnapshot(`id${i}`));
                  }
                  return {
                    shows,
                  };
                case 2:
                  return {
                    shows: [],
                  };
                default:
                  throw new Error("Not expected");
              }
            }
          })()
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.on("loadedAll", resolve));
        let playingShowId: string;
        this.cut.on("play", (showId) => (playingShowId = showId));
        let focusUserId: string;
        this.cut.on("focusUser", (accountId) => (focusUserId = accountId));

        // Execute
        for (let item of this.cut.showItems) {
          item.click();
          item.clickUser();
          break;
        }

        // Verify
        assertThat(playingShowId, eq(`id0`), "playing show id");
        assertThat(focusUserId, eq(`account id0`), "focus user id");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Long_ScrollToLoadMore";
      private cut: ListPage;
      public async execute() {
        // Prepare
        await setViewport(800, 800);
        let webServiceClientMock = new (class extends WebServiceClient {
          public constructor() {
            super(undefined, undefined);
          }
        })();
        webServiceClientMock.send =
          async (): Promise<RecommendShowsResponse> => {
            let shows = new Array<ShowSnapshot>();
            for (let i = 0; i < 7; i++) {
              shows.push(createShowSnapshot(`id${i}`));
            }
            return {
              shows,
            };
          };

        // Execute
        this.cut = new ListPage(ShowItem.create, webServiceClientMock);
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.on("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_page_long.png"),
          path.join(__dirname, "/golden/list_page_long.png"),
          path.join(__dirname, "/list_page_long_diff.png")
        );

        // Prepare
        webServiceClientMock.send =
          async (): Promise<RecommendShowsResponse> => {
            let shows = new Array<ShowSnapshot>();
            for (let i = 7; i < 14; i++) {
              shows.push(createShowSnapshot(`id${i}`));
            }
            return {
              shows,
            };
          };

        // Execute
        window.scrollBy(0, 150);
        await new Promise<void>((resolve) => this.cut.on("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_page_loaded_1st.png"),
          path.join(__dirname, "/golden/list_page_loaded_1st.png"),
          path.join(__dirname, "/list_page_loaded_1st_diff.png")
        );

        // Prepare
        webServiceClientMock.send =
          async (): Promise<RecommendShowsResponse> => {
            let shows = new Array<ShowSnapshot>();
            for (let i = 14; i < 21; i++) {
              shows.push(createShowSnapshot(`id${i}`));
            }
            return {
              shows,
            };
          };

        // Execute
        window.scrollBy(0, 650);
        await new Promise<void>((resolve) => this.cut.on("loaded", resolve));

        // Verify
        for (let item of this.cut.showItems) {
          item.mouseenter();
          break;
        }
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_page_loaded_2nd.png"),
          path.join(__dirname, "/golden/list_page_loaded_2nd.png"),
          path.join(__dirname, "/list_page_loaded_2nd_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
