import smallImage = require("./test_data/small.jpg");
import userImage = require("./test_data/user_image.jpg");
import wideImage = require("./test_data/wide.png");
import path = require("path");
import { QuickTalesListPage } from "./container";
import { QuickTaleCardMock } from "./quick_tale_card_mock";
import { UserInfoCardMock } from "./user_info_card_mock";
import {
  GET_QUICK_TALE,
  GET_RECOMMENDED_QUICK_TALES,
  GET_RECOMMENDED_QUICK_TALES_REQUEST_BODY,
  GetQuickTaleRequestBody,
  GetQuickTaleResponse,
  GetRecommendedQuickTalesRequestBody,
  GetRecommendedQuickTalesResponse,
  VIEW_TALE,
  VIEW_TALE_REQUEST_BODY,
  ViewTaleRequestBody,
  ViewTaleResponse,
} from "@phading/tale_service_interface/interface";
import { QuickTaleCard as QuickTaleCardData } from "@phading/tale_service_interface/tale_card";
import {
  TALE_CONTEXT,
  TaleContext,
} from "@phading/tale_service_interface/tale_context";
import {
  GET_USER_INFO_CARD,
  GetUserInfoCardResponse,
} from "@phading/user_service_interface/interface";
import { Counter } from "@selfage/counter";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import {
  assertThat,
  containUnorderedElements,
  eq,
  eqArray,
} from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "../../../../common/normalize_body";

function createCardData(userId: number, taleId: number): QuickTaleCardData {
  return {
    metadata: {
      taleId: `tale${taleId}`,
      userId: `user${userId}`,
      username: "some-username",
      userNatureName: "First Second",
      createdTimestamp: Date.parse("2022-10-11"),
      avatarSmallPath: userImage,
    },
    text: `some text ${taleId}`,
  };
}

let menuContainer: HTMLDivElement;

TEST_RUNNER.run({
  name: "QuickTalesListPageTest",
  environment: {
    setUp: () => {
      menuContainer = E.div({
        style: `position: fixed; left: 0; top: 0;`,
      });
      document.body.append(menuContainer);
    },
    tearDown: () => {
      menuContainer.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "RenderAndScrollAndLoad";
      private cut: QuickTalesListPage;
      public async execute() {
        // Prepare
        await setViewport(800, 800);
        let webServiceClientMock = new (class extends WebServiceClient {
          public getRecommendedTalesRequest: GetRecommendedQuickTalesRequestBody;
          public viewTalesRequests = new Array<ViewTaleRequestBody>();
          public id = 0;
          public constructor() {
            super(undefined, undefined);
          }
          public async send(request: any): Promise<any> {
            if (request.descriptor === GET_RECOMMENDED_QUICK_TALES) {
              this.getRecommendedTalesRequest = request.body;
              let cards = new Array<QuickTaleCardData>();
              for (let i = 0; i < 20; i++, this.id++) {
                cards.push(createCardData(1, this.id));
              }
              return {
                cards,
              } as GetRecommendedQuickTalesResponse;
            } else if (request.descriptor === VIEW_TALE) {
              this.viewTalesRequests.push(request.body);
              return {} as ViewTaleResponse;
            }
          }
        })();

        // Execute
        this.cut = new QuickTalesListPage(
          (cardData, pinned) => new QuickTaleCardMock(cardData, pinned),
          undefined,
          webServiceClientMock,
          {}
        );
        document.body.append(this.cut.body);
        menuContainer.append(this.cut.backMenuBody, this.cut.menuBody);
        await new Promise<void>((resolve) =>
          this.cut.once("talesLoaded", resolve)
        );

        // Verify
        assertThat(
          webServiceClientMock.getRecommendedTalesRequest,
          eqMessage(
            {
              context: {},
            },
            GET_RECOMMENDED_QUICK_TALES_REQUEST_BODY
          ),
          "get recommended tales"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_tales_list_page_render.png"),
          path.join(__dirname, "/golden/quick_tales_list_page_render.png"),
          path.join(__dirname, "/quick_tales_list_page_render_diff.png")
        );
        // Needs to wait for a while before checking views.
        assertThat(
          webServiceClientMock.viewTalesRequests,
          containUnorderedElements([
            eqMessage({ taleId: `tale0` }, VIEW_TALE_REQUEST_BODY),
            eqMessage({ taleId: `tale2` }, VIEW_TALE_REQUEST_BODY),
            eqMessage({ taleId: `tale8` }, VIEW_TALE_REQUEST_BODY),
          ]),
          "viewed tales"
        );

        // Prepare
        webServiceClientMock.getRecommendedTalesRequest = undefined;
        webServiceClientMock.viewTalesRequests = [];

        // Execute
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise<void>((resolve) =>
          this.cut.once("talesLoaded", resolve)
        );

        // Verify
        assertThat(
          webServiceClientMock.getRecommendedTalesRequest,
          eqMessage(
            {
              context: {},
            },
            GET_RECOMMENDED_QUICK_TALES_REQUEST_BODY
          ),
          "get more recommended tales"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_tales_list_page_load_more.png"),
          path.join(__dirname, "/golden/quick_tales_list_page_load_more.png"),
          path.join(__dirname, "/quick_tales_list_page_load_more_diff.png")
        );
        assertThat(
          webServiceClientMock.viewTalesRequests,
          containUnorderedElements([
            eqMessage({ taleId: `tale18` }, VIEW_TALE_REQUEST_BODY),
            eqMessage({ taleId: `tale19` }, VIEW_TALE_REQUEST_BODY),
            eqMessage({ taleId: `tale20` }, VIEW_TALE_REQUEST_BODY),
          ]),
          "viewed tales"
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise<void>((resolve) =>
          this.cut.once("talesLoaded", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_tales_list_page_loaded_again.png"),
          path.join(
            __dirname,
            "/golden/quick_tales_list_page_loaded_again.png"
          ),
          path.join(__dirname, "/quick_tales_list_page_loaded_again_diff.png")
        );

        // Prepare
        webServiceClientMock.getRecommendedTalesRequest = undefined;
        webServiceClientMock.viewTalesRequests = [];

        // Execute
        window.scrollTo(0, 0);

        // Verify
        assertThat(
          webServiceClientMock.getRecommendedTalesRequest,
          eq(undefined),
          "no tales loaded"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_tales_list_page_scroll_top.png"),
          path.join(__dirname, "/golden/quick_tales_list_page_scroll_top.png"),
          path.join(__dirname, "/quick_tales_list_page_scroll_top_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TryLoadTales";
      private cut: QuickTalesListPage;
      public async execute() {
        // Prepare
        await setViewport(800, 800);
        let webServiceClientMock = new (class extends WebServiceClient {
          public counter = new Counter<string>();
          public getRecommendedTalesRequest: GetRecommendedQuickTalesRequestBody;
          public getRecommendedTalesResponse: GetRecommendedQuickTalesResponse;
          public constructor() {
            super(undefined, undefined);
          }
          public async send(request: any): Promise<any> {
            if (request.descriptor === GET_RECOMMENDED_QUICK_TALES) {
              this.counter.increment("get_recommended");
              return this.getRecommendedTalesResponse;
            } else if (request.descriptor === VIEW_TALE) {
              return {} as ViewTaleResponse;
            }
          }
        })();
        webServiceClientMock.getRecommendedTalesResponse = { cards: [] };

        // Execute
        this.cut = new QuickTalesListPage(
          (cardData, pinned) => new QuickTaleCardMock(cardData, pinned),
          undefined,
          webServiceClientMock,
          {}
        );
        document.body.append(this.cut.body);
        menuContainer.append(this.cut.backMenuBody, this.cut.menuBody);
        await new Promise<void>((resolve) =>
          this.cut.once("talesLoaded", resolve)
        );

        // Verify
        assertThat(
          webServiceClientMock.counter.get("get_recommended"),
          eq(1),
          "1st call"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_tales_list_page_no_more_tales.png"),
          path.join(
            __dirname,
            "/golden/quick_tales_list_page_no_more_tales.png"
          ),
          path.join(__dirname, "/quick_tales_list_page_no_more_tales_diff.png")
        );

        // Execute
        this.cut.tryLoadingButton.click();
        await new Promise<void>((resolve) =>
          this.cut.once("talesLoaded", resolve)
        );

        // Verify
        assertThat(
          webServiceClientMock.counter.get("get_recommended"),
          eq(2),
          "2nd call"
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/quick_tales_list_page_no_more_tales_after_retried.png"
          ),
          path.join(
            __dirname,
            "/golden/quick_tales_list_page_no_more_tales.png"
          ),
          path.join(
            __dirname,
            "/quick_tales_list_page_no_more_tales_after_retried_diff.png"
          )
        );

        // Prepare
        let cards = new Array<QuickTaleCardData>();
        for (let i = 0; i < 20; i++) {
          cards.push(createCardData(1, i));
        }
        webServiceClientMock.getRecommendedTalesResponse = { cards };

        // Execute
        this.cut.tryLoadingButton.click();
        await new Promise<void>((resolve) =>
          this.cut.once("talesLoaded", resolve)
        );

        // Verify
        assertThat(
          webServiceClientMock.counter.get("get_recommended"),
          eq(3),
          "3rd call"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_tales_list_page_reloaded.png"),
          path.join(__dirname, "/golden/quick_tales_list_page_reloaded.png"),
          path.join(__dirname, "/quick_tales_list_page_reloaded_diff.png")
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise<void>((resolve) =>
          this.cut.once("talesLoaded", resolve)
        );

        // Verify
        assertThat(
          webServiceClientMock.counter.get("get_recommended"),
          eq(4),
          "4th call"
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "LoadTaleContext";
      private cut: QuickTalesListPage;
      public async execute() {
        // Prepare
        await setViewport(800, 800);
        let webServiceClientMock = new (class extends WebServiceClient {
          public getQuickTaleRequest: GetQuickTaleRequestBody;
          public constructor() {
            super(undefined, undefined);
          }
          public async send(request: any): Promise<any> {
            if (request.descriptor === GET_QUICK_TALE) {
              this.getQuickTaleRequest = request.body;
              return { card: createCardData(1, 10) } as GetQuickTaleResponse;
            } else if (request.descriptor === GET_RECOMMENDED_QUICK_TALES) {
              return { cards: [] } as GetRecommendedQuickTalesResponse;
            } else if (request.descriptor === VIEW_TALE) {
              return {} as ViewTaleResponse;
            }
          }
        })();

        // Execute
        this.cut = new QuickTalesListPage(
          (cardData, pinned) => new QuickTaleCardMock(cardData, pinned),
          undefined,
          webServiceClientMock,
          { taleId: "tale1" }
        );
        document.body.append(this.cut.body);
        menuContainer.append(this.cut.backMenuBody, this.cut.menuBody);
        await new Promise<void>((resolve) =>
          this.cut.once("contextLoaded", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_tales_list_page_tale_context.png"),
          path.join(
            __dirname,
            "/golden/quick_tales_list_page_tale_context.png"
          ),
          path.join(__dirname, "/quick_tales_list_page_tale_context_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "LoadUserContext";
      private cut: QuickTalesListPage;
      public async execute() {
        // Prepare
        await setViewport(800, 800);
        let webServiceClientMock = new (class extends WebServiceClient {
          public getQuickTaleRequest: GetQuickTaleRequestBody;
          public constructor() {
            super(undefined, undefined);
          }
          public async send(request: any): Promise<any> {
            if (request.descriptor === GET_USER_INFO_CARD) {
              this.getQuickTaleRequest = request.body;
              return {
                card: {
                  userId: "user1",
                  username: "some-username",
                  naturalName: "First Second",
                  avatarLargePath: userImage,
                  description: "Some some long description",
                },
              } as GetUserInfoCardResponse;
            } else if (request.descriptor === GET_RECOMMENDED_QUICK_TALES) {
              return { cards: [] } as GetRecommendedQuickTalesResponse;
            } else if (request.descriptor === VIEW_TALE) {
              return {} as ViewTaleResponse;
            }
          }
        })();

        // Execute
        this.cut = new QuickTalesListPage(
          undefined,
          (cardData) => new UserInfoCardMock(cardData),
          webServiceClientMock,
          { userId: "user1" }
        );
        document.body.append(this.cut.body);
        menuContainer.append(this.cut.backMenuBody, this.cut.menuBody);
        await new Promise<void>((resolve) =>
          this.cut.once("contextLoaded", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_tales_list_page_user_context.png"),
          path.join(
            __dirname,
            "/golden/quick_tales_list_page_user_context.png"
          ),
          path.join(__dirname, "/quick_tales_list_page_user_context_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ViewOneImage";
      private cut: QuickTalesListPage;
      public async execute() {
        // Prepare
        await setViewport(800, 800);
        let webServiceClientMock = new (class extends WebServiceClient {
          public getQuickTaleRequest: GetQuickTaleRequestBody;
          public counter = new Counter<string>();
          public constructor() {
            super(undefined, undefined);
          }
          public async send(request: any): Promise<any> {
            if (request.descriptor === GET_RECOMMENDED_QUICK_TALES) {
              if (this.counter.increment("get_recommended") === 1) {
                return {
                  cards: [
                    {
                      metadata: {
                        taleId: `tale1`,
                        userId: `user1`,
                        username: "some-username",
                        userNatureName: "First Second",
                        createdTimestamp: Date.parse("2022-10-11"),
                        avatarSmallPath: userImage,
                      },
                      text: `some text 20`,
                      imagePaths: [wideImage, smallImage],
                    },
                  ],
                } as GetRecommendedQuickTalesResponse;
              } else {
                return { cards: [] } as GetRecommendedQuickTalesResponse;
              }
            } else if (request.descriptor === VIEW_TALE) {
              return {} as ViewTaleResponse;
            }
          }
        })();
        this.cut = new QuickTalesListPage(
          (cardData, pinned) => new QuickTaleCardMock(cardData, pinned),
          undefined,
          webServiceClientMock,
          {}
        );
        document.body.append(this.cut.body);
        menuContainer.append(this.cut.backMenuBody, this.cut.menuBody);
        await new Promise<void>((resolve) =>
          this.cut.once("talesLoaded", resolve)
        );

        let capturedImagePaths: Array<string>;
        let capturedInitialIndex: number;
        this.cut.on("viewImages", (imagePaths, initialIndex) => {
          capturedImagePaths = imagePaths;
          capturedInitialIndex = initialIndex;
        });

        // Execute
        for (let card of this.cut.quickTaleCards) {
          card.previewImages[1].click();
          break;
        }

        // Verify
        assertThat(
          capturedImagePaths,
          eqArray([eq(wideImage), eq(smallImage)]),
          "image paths"
        );
        assertThat(capturedInitialIndex, eq(1), "image index");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "PinTale";
      private cut: QuickTalesListPage;
      public async execute() {
        // Prepare
        await setViewport(800, 800);
        let webServiceClientMock = new (class extends WebServiceClient {
          public getQuickTaleRequest: GetQuickTaleRequestBody;
          public counter = new Counter<string>();
          public constructor() {
            super(undefined, undefined);
          }
          public async send(request: any): Promise<any> {
            if (request.descriptor === GET_RECOMMENDED_QUICK_TALES) {
              if (this.counter.increment("get_recommended") === 1) {
                return {
                  cards: [createCardData(1, 1)],
                } as GetRecommendedQuickTalesResponse;
              } else {
                return { cards: [] } as GetRecommendedQuickTalesResponse;
              }
            } else if (request.descriptor === VIEW_TALE) {
              return {} as ViewTaleResponse;
            }
          }
        })();
        this.cut = new QuickTalesListPage(
          (cardData, pinned) => new QuickTaleCardMock(cardData, pinned),
          undefined,
          webServiceClientMock,
          {}
        );
        document.body.append(this.cut.body);
        menuContainer.append(this.cut.backMenuBody, this.cut.menuBody);
        await new Promise<void>((resolve) =>
          this.cut.once("talesLoaded", resolve)
        );

        let pinedContext: TaleContext;
        this.cut.on("pin", (context) => (pinedContext = context));

        // Execute
        for (let card of this.cut.quickTaleCards) {
          card.showCommentsButton.click();
          break;
        }

        // Verify
        assertThat(
          pinedContext,
          eqMessage({ taleId: "tale1" }, TALE_CONTEXT),
          "pin"
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "PinUser";
      private cut: QuickTalesListPage;
      public async execute() {
        // Prepare
        await setViewport(800, 800);
        let webServiceClientMock = new (class extends WebServiceClient {
          public getQuickTaleRequest: GetQuickTaleRequestBody;
          public counter = new Counter<string>();
          public constructor() {
            super(undefined, undefined);
          }
          public async send(request: any): Promise<any> {
            if (request.descriptor === GET_RECOMMENDED_QUICK_TALES) {
              if (this.counter.increment("get_recommended") === 1) {
                return {
                  cards: [createCardData(1, 1)],
                } as GetRecommendedQuickTalesResponse;
              } else {
                return { cards: [] } as GetRecommendedQuickTalesResponse;
              }
            } else if (request.descriptor === VIEW_TALE) {
              return {} as ViewTaleResponse;
            }
          }
        })();
        this.cut = new QuickTalesListPage(
          (cardData, pinned) => new QuickTaleCardMock(cardData, pinned),
          undefined,
          webServiceClientMock,
          {}
        );
        document.body.append(this.cut.body);
        menuContainer.append(this.cut.backMenuBody, this.cut.menuBody);
        await new Promise<void>((resolve) =>
          this.cut.once("talesLoaded", resolve)
        );
        let pinedContext: TaleContext;
        this.cut.on("pin", (context) => (pinedContext = context));

        // Execute
        for (let card of this.cut.quickTaleCards) {
          card.userInfoChip.click();
          break;
        }

        // Verify
        assertThat(
          pinedContext,
          eqMessage({ userId: "user1" }, TALE_CONTEXT),
          "pin"
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
