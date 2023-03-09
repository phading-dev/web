import smallImage = require("./test_data/small.jpg");
import userImage = require("./test_data/user_image.jpg");
import wideImage = require("./test_data/wide.png");
import { normalizeBody } from "../../../common/normalize_body";
import { QuickTalesPage } from "./container";
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
import { Ref } from "@selfage/ref";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import {
  assertThat,
  containUnorderedElements,
  eq,
} from "@selfage/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/test_runner";
import { WebServiceClient } from "@selfage/web_service_client";

normalizeBody();

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

TEST_RUNNER.run({
  name: "QuickTalesPageTest",
  cases: [
    new (class implements TestCase {
      public name = "RenderAndScrollAndLoad";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await puppeteerSetViewport(800, 800);
        this.container = E.div({});
        document.body.append(this.container);
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
        let cut = new QuickTalesPage(
          {},
          (bodies) => this.container.append(...bodies),
          () => {},
          () => {},
          () => {},
          (cardData, pinned) => new QuickTaleCardMock(cardData, pinned),
          undefined,
          webServiceClientMock
        ).show();
        await new Promise<void>((resolve) => cut.once("talesLoaded", resolve));

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
          __dirname + "/quick_tales_page_render.png",
          __dirname + "/golden/quick_tales_page_render.png",
          __dirname + "/quick_tales_page_render_diff.png"
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
        await new Promise<void>((resolve) => cut.once("talesLoaded", resolve));

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
          __dirname + "/quick_tales_page_load_more.png",
          __dirname + "/golden/quick_tales_page_load_more.png",
          __dirname + "/quick_tales_page_load_more_diff.png"
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
        await new Promise<void>((resolve) => cut.once("talesLoaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/quick_tales_page_loaded_again.png",
          __dirname + "/golden/quick_tales_page_loaded_again.png",
          __dirname + "/quick_tales_page_loaded_again_diff.png"
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
          __dirname + "/quick_tales_page_scroll_top.png",
          __dirname + "/golden/quick_tales_page_scroll_top.png",
          __dirname + "/quick_tales_page_scroll_top_diff.png"
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TryLoadTales";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await puppeteerSetViewport(800, 800);
        this.container = E.div({});
        document.body.append(this.container);
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
        let cut = new QuickTalesPage(
          {},
          (bodies) => this.container.append(...bodies),
          () => {},
          () => {},
          () => {},
          (cardData, pinned) => new QuickTaleCardMock(cardData, pinned),
          undefined,
          webServiceClientMock
        ).show();
        await new Promise<void>((resolve) => cut.once("talesLoaded", resolve));

        // Verify
        assertThat(
          webServiceClientMock.counter.get("get_recommended"),
          eq(1),
          "1st call"
        );
        await asyncAssertScreenshot(
          __dirname + "/quick_tales_page_no_more_tales.png",
          __dirname + "/golden/quick_tales_page_no_more_tales.png",
          __dirname + "/quick_tales_page_no_more_tales_diff.png"
        );

        // Execute
        cut.tryLoadingButton.click();
        await new Promise<void>((resolve) => cut.once("talesLoaded", resolve));

        // Verify
        assertThat(
          webServiceClientMock.counter.get("get_recommended"),
          eq(2),
          "2nd call"
        );
        await asyncAssertScreenshot(
          __dirname + "/quick_tales_page_no_more_tales_after_retried.png",
          __dirname + "/golden/quick_tales_page_no_more_tales.png",
          __dirname + "/quick_tales_page_no_more_tales_after_retried_diff.png"
        );

        // Prepare
        let cards = new Array<QuickTaleCardData>();
        for (let i = 0; i < 20; i++) {
          cards.push(createCardData(1, i));
        }
        webServiceClientMock.getRecommendedTalesResponse = { cards };

        // Execute
        cut.tryLoadingButton.click();
        await new Promise<void>((resolve) => cut.once("talesLoaded", resolve));

        // Verify
        assertThat(
          webServiceClientMock.counter.get("get_recommended"),
          eq(3),
          "3rd call"
        );
        await asyncAssertScreenshot(
          __dirname + "/quick_tales_page_reloaded.png",
          __dirname + "/golden/quick_tales_page_reloaded.png",
          __dirname + "/quick_tales_page_reloaded_diff.png"
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise<void>((resolve) => cut.once("talesLoaded", resolve));

        // Verify
        assertThat(
          webServiceClientMock.counter.get("get_recommended"),
          eq(4),
          "4th call"
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "LoadTaleContext";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await puppeteerSetViewport(800, 800);
        let menuBodyContainerRef = new Ref<HTMLDivElement>();
        let controllerBodyContainerRef = new Ref<HTMLDivElement>();
        this.container = E.div(
          {},
          E.divRef(menuBodyContainerRef, { style: `position: fixed;` }),
          E.divRef(controllerBodyContainerRef, {
            style: `position: fixed; right: 0;`,
          })
        );
        document.body.append(this.container);
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
        let cut = new QuickTalesPage(
          { taleId: "tale1" },
          (bodies) => this.container.append(...bodies),
          (menuBodies) => menuBodyContainerRef.val.prepend(...menuBodies),
          (menuBodies) => menuBodyContainerRef.val.append(...menuBodies),
          (controllerBodies) =>
            controllerBodyContainerRef.val.append(...controllerBodies),
          (cardData, pinned) => new QuickTaleCardMock(cardData, pinned),
          undefined,
          webServiceClientMock
        ).show();
        await new Promise<void>((resolve) =>
          cut.once("contextLoaded", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/quick_tales_page_tale_context.png",
          __dirname + "/golden/quick_tales_page_tale_context.png",
          __dirname + "/quick_tales_page_tale_context_diff.png"
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "LoadUserContext";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await puppeteerSetViewport(800, 800);
        let menuBodyContainerRef = new Ref<HTMLDivElement>();
        let controllerBodyContainerRef = new Ref<HTMLDivElement>();
        this.container = E.div(
          {},
          E.divRef(menuBodyContainerRef, { style: `position: fixed;` }),
          E.divRef(controllerBodyContainerRef, {
            style: `position: fixed; right: 0;`,
          })
        );
        document.body.append(this.container);
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
        let cut = new QuickTalesPage(
          { userId: "user1" },
          (bodies) => this.container.append(...bodies),
          (menuBodies) => menuBodyContainerRef.val.prepend(...menuBodies),
          (menuBodies) => menuBodyContainerRef.val.append(...menuBodies),
          (controllerBodies) =>
            controllerBodyContainerRef.val.append(...controllerBodies),
          undefined,
          (cardData) => new UserInfoCardMock(cardData),
          webServiceClientMock
        ).show();
        await new Promise<void>((resolve) =>
          cut.once("contextLoaded", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/quick_tales_page_user_context.png",
          __dirname + "/golden/quick_tales_page_user_context.png",
          __dirname + "/quick_tales_page_user_context_diff.png"
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ViewOneImage";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await puppeteerSetViewport(800, 800);
        let menuBodyContainerRef = new Ref<HTMLDivElement>();
        let controllerBodyContainerRef = new Ref<HTMLDivElement>();
        this.container = E.div(
          {},
          E.divRef(menuBodyContainerRef, { style: `position: fixed;` }),
          E.divRef(controllerBodyContainerRef, {
            style: `position: fixed; right: 0;`,
          })
        );
        document.body.append(this.container);
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
                      images: [wideImage],
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
        let cut = new QuickTalesPage(
          {},
          (bodies) => this.container.append(...bodies),
          (menuBodies) => menuBodyContainerRef.val.prepend(...menuBodies),
          (menuBodies) => menuBodyContainerRef.val.append(...menuBodies),
          (controllerBodies) =>
            controllerBodyContainerRef.val.append(...controllerBodies),
          (cardData, pinned) => new QuickTaleCardMock(cardData, pinned),
          undefined,
          webServiceClientMock
        ).show();
        await new Promise<void>((resolve) => cut.once("talesLoaded", resolve));
        await puppeteerScreenshot(
          __dirname + "/quick_tales_page_view_one_image_baseline.png"
        );

        // Execute
        for (let card of cut.quickTaleCards) {
          card.previewImages[0].click();
          break;
        }

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/quick_tales_page_view_one_image.png",
          __dirname + "/golden/quick_tales_page_view_one_image.png",
          __dirname + "/quick_tales_page_view_one_image_diff.png"
        );

        // Execute
        cut.imagesViewerPage.backMenuItem.click();

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/quick_tales_page_back_from_viewing_one_image.png",
          __dirname + "/quick_tales_page_view_one_image_baseline.png",
          __dirname + "/quick_tales_page_back_from_viewing_one_image_diff.png"
        );

        // Cleanup
        await puppeteerDeleteFile(
          __dirname + "/quick_tales_page_view_one_image_baseline.png"
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ViewImagesWithContext";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await puppeteerSetViewport(800, 800);
        let menuBodyContainerRef = new Ref<HTMLDivElement>();
        let controllerBodyContainerRef = new Ref<HTMLDivElement>();
        this.container = E.div(
          {},
          E.divRef(menuBodyContainerRef, { style: `position: fixed;` }),
          E.divRef(controllerBodyContainerRef, {
            style: `position: fixed; right: 0;`,
          })
        );
        document.body.append(this.container);
        let webServiceClientMock = new (class extends WebServiceClient {
          public getQuickTaleRequest: GetQuickTaleRequestBody;
          public counter = new Counter<string>();
          public constructor() {
            super(undefined, undefined);
          }
          public async send(request: any): Promise<any> {
            if (request.descriptor === GET_QUICK_TALE) {
              return { card: createCardData(1, 10) } as GetQuickTaleResponse;
            } else if (request.descriptor === GET_RECOMMENDED_QUICK_TALES) {
              if (this.counter.increment("get_recommended") === 1) {
                return {
                  cards: [
                    {
                      metadata: {
                        taleId: `tale2`,
                        userId: `user2`,
                        username: "some-username",
                        userNatureName: "First Second",
                        createdTimestamp: Date.parse("2022-10-11"),
                        avatarSmallPath: userImage,
                      },
                      text: `some text 22`,
                      images: [wideImage, smallImage],
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
        let cut = new QuickTalesPage(
          { taleId: "tale2" },
          (bodies) => this.container.append(...bodies),
          (menuBodies) => menuBodyContainerRef.val.prepend(...menuBodies),
          (menuBodies) => menuBodyContainerRef.val.append(...menuBodies),
          (controllerBodies) =>
            controllerBodyContainerRef.val.append(...controllerBodies),
          (cardData, pinned) => new QuickTaleCardMock(cardData, pinned),
          undefined,
          webServiceClientMock
        ).show();
        await new Promise<void>((resolve) => cut.once("talesLoaded", resolve));
        await puppeteerScreenshot(
          __dirname + "/quick_tales_page_view_images_baseline.png"
        );

        // Execute
        for (let card of cut.quickTaleCards) {
          card.previewImages[1].click();
          break;
        }

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/quick_tales_page_view_images.png",
          __dirname + "/golden/quick_tales_page_view_images.png",
          __dirname + "/quick_tales_page_view_images_diff.png"
        );

        // Execute
        cut.show();

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/quick_tales_page_back_from_viewing_images.png",
          __dirname + "/quick_tales_page_view_images_baseline.png",
          __dirname + "/quick_tales_page_back_from_viewing_images_diff.png"
        );

        // Cleanup
        await puppeteerDeleteFile(
          __dirname + "/quick_tales_page_view_images_baseline.png"
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "PinTale";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await puppeteerSetViewport(800, 800);
        this.container = E.div({});
        document.body.append(this.container);
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
        let cut = new QuickTalesPage(
          {},
          (bodies) => this.container.append(...bodies),
          () => {},
          () => {},
          () => {},
          (cardData, pinned) => new QuickTaleCardMock(cardData, pinned),
          undefined,
          webServiceClientMock
        ).show();
        await new Promise<void>((resolve) => cut.once("talesLoaded", resolve));
        let pinedContext: TaleContext;
        cut.on("pin", (context) => (pinedContext = context));

        // Execute
        for (let card of cut.quickTaleCards) {
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
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "PinUser";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await puppeteerSetViewport(800, 800);
        this.container = E.div({});
        document.body.append(this.container);
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
        let cut = new QuickTalesPage(
          {},
          (bodies) => this.container.append(...bodies),
          () => {},
          () => {},
          () => {},
          (cardData, pinned) => new QuickTaleCardMock(cardData, pinned),
          undefined,
          webServiceClientMock
        ).show();
        await new Promise<void>((resolve) => cut.once("talesLoaded", resolve));
        let pinedContext: TaleContext;
        cut.on("pin", (context) => (pinedContext = context));

        // Execute
        for (let card of cut.quickTaleCards) {
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
        this.container.remove();
      }
    })(),
  ],
});
