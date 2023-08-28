import userImage = require("./test_data/user_image.jpg");
import LRU = require("lru-cache");
import path = require("path");
import { HomePage } from "./container";
import { QuickTalesPageMock } from "./quick_tales_page/container_mock";
import { QuickTalesListPage } from "./quick_tales_page/quick_tales_list_page/container";
import { QuickTalesListPageMockData } from "./quick_tales_page/quick_tales_list_page/container_mock";
import { HOME_PAGE_STATE, HomePageState, Page } from "./state";
import { WriteTalePage } from "./write_tale_page/container";
import { WriteTalePageMock } from "./write_tale_page/container_mock";
import { QuickTaleCard as QuickTaleCardData } from "@phading/tale_service_interface/tale_card";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat } from "@selfage/test_matcher";
import "../../common/normalize_body";

let menuContainer: HTMLDivElement;
let controllerContainer: HTMLDivElement;

TEST_RUNNER.run({
  name: "HomePageTest",
  environment: {
    setUp: () => {
      menuContainer = E.div({
        style: `position: fixed; left: 0; top: 0;`,
      });
      controllerContainer = E.div({
        style: `position: fixed; right: 0; top: 0;`,
      });
      document.body.append(menuContainer, controllerContainer);
    },
    tearDown: () => {
      menuContainer.remove();
      controllerContainer.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Render_Navigate";
      private cut: HomePage;
      public async execute() {
        // Prepare
        await setViewport(800, 800);
        let quickTalesListPageCache = new LRU<string, QuickTalesListPage>({
          max: 10,
        });
        let writeTalePageCache = new LRU<string, WriteTalePage>({
          max: 10,
        });
        let quickTalesListPageMockData: QuickTalesListPageMockData = {
          startingTaleId: 0,
        };
        let writeTalePageCardMockData: QuickTaleCardData;

        // Execute
        this.cut = new HomePage(
          writeTalePageCache,
          (
            context,
            appendBodiesFn,
            prependMenuBodiesFn,
            appendMenuBodiesFn,
            appendControllerBodiesFn
          ) => {
            return new QuickTalesPageMock(
              quickTalesListPageCache,
              context,
              appendBodiesFn,
              prependMenuBodiesFn,
              appendMenuBodiesFn,
              appendControllerBodiesFn,
              quickTalesListPageMockData
            );
          },
          (taleId) => new WriteTalePageMock(taleId, writeTalePageCardMockData),
          (...bodies) => document.body.append(...bodies),
          (...bodies) => menuContainer.prepend(...bodies),
          (...bodies) => menuContainer.append(...bodies),
          (...bodies) => controllerContainer.append(...bodies)
        );
        this.cut.updateState();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_render.png"),
          path.join(__dirname, "/golden/home_page_render.png"),
          path.join(__dirname, "/home_page_render_diff.png")
        );

        // Prepare
        let state: HomePageState;
        this.cut.on("newState", (newState) => (state = newState));
        quickTalesListPageMockData = { startingTaleId: 100, pinnedTaleId: 0 };

        // Execute
        for (let card of this.cut.talesListPage.listPage.quickTaleCards) {
          card.showCommentsButton.click();
          break;
        }

        // Verify
        assertThat(
          state,
          eqMessage(
            { page: Page.List, list: [{}, { taleId: "tale0" }] },
            HOME_PAGE_STATE
          ),
          "new state tale0"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_pinned_tale.png"),
          path.join(__dirname, "/golden/home_page_pinned_tale.png"),
          path.join(__dirname, "/home_page_pinned_tale_diff.png")
        );

        // Prepare
        quickTalesListPageMockData = { startingTaleId: 200, pinnedTaleId: 100 };

        // Execute
        for (let card of this.cut.talesListPage.listPage.quickTaleCards) {
          card.showCommentsButton.click();
          break;
        }

        // Verify
        assertThat(
          state,
          eqMessage(
            {
              page: Page.List,
              list: [{}, { taleId: "tale0" }, { taleId: "tale100" }],
            },
            HOME_PAGE_STATE
          ),
          "new state tale100"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_pinned_tale_2.png"),
          path.join(__dirname, "/golden/home_page_pinned_tale_2.png"),
          path.join(__dirname, "/home_page_pinned_tale_2_diff.png")
        );

        // Prepare
        quickTalesListPageMockData = {
          startingTaleId: 300,
          userInfoCardData: {
            userId: "user1",
            naturalName: "Some Name",
            username: "somename",
            description: "some user description",
            avatarLargePath: userImage,
          },
        };

        // Execute
        for (let card of this.cut.talesListPage.listPage.quickTaleCards) {
          card.userInfoChip.click();
          break;
        }

        // Verify
        assertThat(
          state,
          eqMessage(
            {
              page: Page.List,
              list: [
                {},
                { taleId: "tale0" },
                { taleId: "tale100" },
                { userId: "user1" },
              ],
            },
            HOME_PAGE_STATE
          ),
          "new state user1"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_pinned_user.png"),
          path.join(__dirname, "/golden/home_page_pinned_user.png"),
          path.join(__dirname, "/home_page_pinned_user_diff.png")
        );

        // Execute
        this.cut.writeTaleMenuItem.click();

        // Verify
        assertThat(
          state,
          eqMessage(
            {
              page: Page.Write,
              list: [
                {},
                { taleId: "tale0" },
                { taleId: "tale100" },
                { userId: "user1" },
              ],
              reply: "",
            },
            HOME_PAGE_STATE
          ),
          "new state write"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_write.png"),
          path.join(__dirname, "/golden/home_page_write.png"),
          path.join(__dirname, "/home_page_write_diff.png")
        );

        // Execute
        this.cut.writeTalePage.backMenuItem.click();

        // Verify
        assertThat(
          state,
          eqMessage(
            {
              page: Page.List,
              list: [
                {},
                { taleId: "tale0" },
                { taleId: "tale100" },
                { userId: "user1" },
              ],
            },
            HOME_PAGE_STATE
          ),
          "new state user1 back from write"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_pinned_user_back_from_write.png"),
          path.join(__dirname, "/golden/home_page_pinned_user.png"),
          path.join(
            __dirname,
            "/home_page_pinned_user_back_from_write_diff.png"
          )
        );

        // Execute
        this.cut.talesListPage.listPage.backMenuItem.click();

        // Verify
        assertThat(
          state,
          eqMessage(
            {
              page: Page.List,
              list: [{}, { taleId: "tale0" }, { taleId: "tale100" }],
            },
            HOME_PAGE_STATE
          ),
          "new state tale100 back from user1"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_pinned_tale_2_back.png"),
          path.join(__dirname, "/golden/home_page_pinned_tale_2.png"),
          path.join(__dirname, "/home_page_pinned_tale_2_back_diff.png")
        );

        // Prepare
        writeTalePageCardMockData = {
          metadata: {
            taleId: `tale100`,
            userId: `user1`,
            username: "some-username",
            userNatureName: "First Second",
            createdTimestamp: Date.parse("2022-10-11"),
            avatarSmallPath: userImage,
          },
          text: `some text tale100`,
        };

        // Execute
        this.cut.talesListPage.listPage.replyMenuItem.click();

        // Verify
        assertThat(
          state,
          eqMessage(
            {
              page: Page.Write,
              list: [{}, { taleId: "tale0" }, { taleId: "tale100" }],
              reply: "tale100",
            },
            HOME_PAGE_STATE
          ),
          "new state reply to tale100"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_reply.png"),
          path.join(__dirname, "/golden/home_page_reply.png"),
          path.join(__dirname, "/home_page_reply_diff.png")
        );

        // Execute
        this.cut.writeTalePage.backMenuItem.click();

        // Verify
        assertThat(
          state,
          eqMessage(
            {
              page: Page.List,
              list: [{}, { taleId: "tale0" }, { taleId: "tale100" }],
            },
            HOME_PAGE_STATE
          ),
          "new state tale100 back from reply"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_pinned_tale_back_from_reply.png"),
          path.join(__dirname, "/golden/home_page_pinned_tale_2.png"),
          path.join(
            __dirname,
            "/home_page_pinned_tale_back_from_reply_diff.png"
          )
        );

        // Execute
        this.cut.talesListPage.listPage.backMenuItem.click();

        // Verify
        assertThat(
          state,
          eqMessage(
            {
              page: Page.List,
              list: [{}, { taleId: "tale0" }],
            },
            HOME_PAGE_STATE
          ),
          "new state tale0 back from tale100"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_pinned_tale_back.png"),
          path.join(__dirname, "/golden/home_page_pinned_tale.png"),
          path.join(__dirname, "/home_page_pinned_tale_back_diff.png")
        );

        // Execute
        this.cut.talesListPage.listPage.backMenuItem.click();

        // Verify
        assertThat(
          state,
          eqMessage({ page: Page.List, list: [{}] }, HOME_PAGE_STATE),
          "new state home back from tale0"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_back_to_home.png"),
          path.join(__dirname, "/golden/home_page_render.png"),
          path.join(__dirname, "/home_page_back_to_home_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "NavigateFromState";
      private cut: HomePage;
      public async execute() {
        // Prepare
        await setViewport(800, 800);
        let quickTalesListPageCache = new LRU<string, QuickTalesListPage>({
          max: 10,
        });
        let writeTalePageCache = new LRU<string, WriteTalePage>({
          max: 10,
        });
        let quickTalesListPageMockData: QuickTalesListPageMockData = {
          startingTaleId: 100,
          pinnedTaleId: 0,
        };
        let writeTalePageCardMockData: QuickTaleCardData;

        // Execute
        this.cut = new HomePage(
          writeTalePageCache,
          (
            context,
            appendBodiesFn,
            prependMenuBodiesFn,
            appendMenuBodiesFn,
            appendControllerBodiesFn
          ) => {
            return new QuickTalesPageMock(
              quickTalesListPageCache,
              context,
              appendBodiesFn,
              prependMenuBodiesFn,
              appendMenuBodiesFn,
              appendControllerBodiesFn,
              quickTalesListPageMockData
            );
          },
          (taleId) => new WriteTalePageMock(taleId, writeTalePageCardMockData),
          (...bodies) => document.body.append(...bodies),
          (...bodies) => menuContainer.prepend(...bodies),
          (...bodies) => menuContainer.append(...bodies),
          (...bodies) => controllerContainer.append(...bodies)
        );
        this.cut.updateState({
          page: Page.List,
          list: [{}, { taleId: "tale0" }],
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_render_state_pinned_tale.png"),
          path.join(
            __dirname,
            "/golden/home_page_render_state_pinned_tale.png"
          ),
          path.join(__dirname, "/home_page_render_state_pinned_tale_diff.png")
        );

        // Prepare
        let state: HomePageState;
        this.cut.on("newState", (newState) => (state = newState));
        quickTalesListPageMockData = { startingTaleId: 0 };

        // Execute
        this.cut.talesListPage.listPage.backMenuItem.click();

        // Verify
        assertThat(
          state,
          eqMessage({ page: Page.List, list: [{}] }, HOME_PAGE_STATE),
          "new state home back from tale0"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_back_to_home.png"),
          path.join(__dirname, "/golden/home_page_back_to_home.png"),
          path.join(__dirname, "/home_page_back_to_home_diff.png")
        );

        // Execute
        this.cut.updateState({
          list: [{ taleId: "tale0" }],
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_invalid_pinned_tale.png"),
          path.join(__dirname, "/golden/home_page_back_to_home.png"),
          path.join(__dirname, "/home_page_invalid_pinned_tale_diff.png")
        );

        // Execute
        this.cut.updateState({
          page: Page.Write,
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_write_from_state.png"),
          path.join(__dirname, "/golden/home_page_write_from_state.png"),
          path.join(__dirname, "/home_page_write_from_state_diff.png")
        );

        // Execute
        this.cut.writeTalePage.backMenuItem.click();

        // Verify
        assertThat(
          state,
          eqMessage({ page: Page.List, list: [{}] }, HOME_PAGE_STATE),
          "new state home back from write"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_back_from_write_state.png"),
          path.join(__dirname, "/golden/home_page_back_to_home.png"),
          path.join(__dirname, "/home_page_back_from_write_state_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
