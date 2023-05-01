import userImage = require("./test_data/user_image.jpg");
import path = require("path");
import { normalizeBody } from "../../common/normalize_body";
import { HomePage } from "./container";
import {
  QuickTalesPageMock,
  QuickTalesPageMockData,
} from "./quick_tales_page/container_mock";
import { HOME_PAGE_STATE, HomePageState, Page } from "./state";
import { WriteTalePageMock } from "./write_tale_page/container_mock";
import { QuickTaleCard as QuickTaleCardData } from "@phading/tale_service_interface/tale_card";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { Ref } from "@selfage/ref";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat } from "@selfage/test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "HomePageTest",
  cases: [
    new (class implements TestCase {
      public name = "RenderAndNavigate";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setViewport(800, 800);
        let menuContainerRef = new Ref<HTMLDivElement>();
        let controllerContainerRef = new Ref<HTMLDivElement>();
        this.container = E.div(
          {},
          E.divRef(menuContainerRef, { style: `position: fixed;` }),
          E.divRef(controllerContainerRef, {
            style: `position: fixed; right: 0;`,
          })
        );
        document.body.append(this.container);
        let quickTalesPageMockData: QuickTalesPageMockData = {
          startingTaleId: 0,
        };
        let writeTalePageCardMockData: QuickTaleCardData;

        // Execute
        let cut = new HomePage(
          (bodies) => this.container.append(...bodies),
          (menuBodies) => menuContainerRef.val.prepend(...menuBodies),
          (menuBodies) => menuContainerRef.val.append(...menuBodies),
          (controllerBodies) =>
            controllerContainerRef.val.append(...controllerBodies),
          (taleId) => new WriteTalePageMock(taleId, writeTalePageCardMockData),
          (
            context,
            appendBodiesFn,
            prependMenuBodiesFn,
            appendMenuBodiesFn,
            appendControllerBodiesFn
          ) => {
            return new QuickTalesPageMock(
              context,
              appendBodiesFn,
              prependMenuBodiesFn,
              appendMenuBodiesFn,
              appendControllerBodiesFn,
              quickTalesPageMockData
            );
          }
        ).show();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_render.png"),
          path.join(__dirname, "/golden/home_page_render.png"),
          path.join(__dirname, "/home_page_render_diff.png")
        );

        // Prepare
        let state: HomePageState;
        cut.on("newState", (newState) => (state = newState));
        quickTalesPageMockData = { startingTaleId: 100, pinnedTaleId: 0 };

        // Execute
        for (let card of cut.talesListPages.get("").quickTaleCards) {
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
        quickTalesPageMockData = { startingTaleId: 200, pinnedTaleId: 100 };

        // Execute
        for (let card of cut.talesListPages.get("t:tale0").quickTaleCards) {
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
        quickTalesPageMockData = {
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
        for (let card of cut.talesListPages.get("t:tale100").quickTaleCards) {
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
        cut.writeTaleMenuItem.click();

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
        cut.writeTalePages.get("").backMenuItem.click();

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
        cut.talesListPages.get("u:user1").backMenuItem.click();

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
        cut.talesListPages.get("t:tale100").replyMenuItem.click();

        // Verify
        assertThat(
          state,
          eqMessage(
            {
              page: Page.Reply,
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
        cut.writeTalePages.get("tale100").backMenuItem.click();

        // Verify
        assertThat(
          state,
          eqMessage(
            {
              page: Page.List,
              list: [{}, { taleId: "tale0" }, { taleId: "tale100" }],
              reply: "tale100",
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
        cut.talesListPages.get("t:tale100").backMenuItem.click();

        // Verify

        assertThat(
          state,
          eqMessage(
            {
              page: Page.List,
              list: [{}, { taleId: "tale0" }],
              reply: "tale100",
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
        cut.talesListPages.get("t:tale0").backMenuItem.click();

        // Verify
        assertThat(
          state,
          eqMessage(
            { page: Page.List, list: [{}], reply: "tale100" },
            HOME_PAGE_STATE
          ),
          "new state home back from tale0"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_back_to_home.png"),
          path.join(__dirname, "/golden/home_page_render.png"),
          path.join(__dirname, "/home_page_back_to_home_diff.png")
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "NavigateFromState";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setViewport(800, 800);
        let menuContainerRef = new Ref<HTMLDivElement>();
        let controllerContainerRef = new Ref<HTMLDivElement>();
        this.container = E.div(
          {},
          E.divRef(menuContainerRef, { style: `position: fixed;` }),
          E.divRef(controllerContainerRef, {
            style: `position: fixed; right: 0;`,
          })
        );
        document.body.append(this.container);
        let quickTalesPageMockData: QuickTalesPageMockData = {
          startingTaleId: 100,
          pinnedTaleId: 0,
        };
        let writeTalePageCardMockData: QuickTaleCardData;

        // Execute
        let cut = new HomePage(
          (bodies) => this.container.append(...bodies),
          (menuBodies) => menuContainerRef.val.prepend(...menuBodies),
          (menuBodies) => menuContainerRef.val.append(...menuBodies),
          (controllerBodies) =>
            controllerContainerRef.val.append(...controllerBodies),
          (taleId) => new WriteTalePageMock(taleId, writeTalePageCardMockData),
          (
            context,
            appendBodiesFn,
            prependMenuBodiesFn,
            appendMenuBodiesFn,
            appendControllerBodiesFn
          ) => {
            return new QuickTalesPageMock(
              context,
              appendBodiesFn,
              prependMenuBodiesFn,
              appendMenuBodiesFn,
              appendControllerBodiesFn,
              quickTalesPageMockData
            );
          }
        ).show({ page: Page.List, list: [{}, { taleId: "tale0" }] });

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
        cut.on("newState", (newState) => (state = newState));
        quickTalesPageMockData = { startingTaleId: 0 };

        // Execute
        cut.talesListPages.get("t:tale0").backMenuItem.click();

        // Verify
        assertThat(
          state,
          eqMessage({ page: Page.List, list: [{}] }, HOME_PAGE_STATE),
          "new state home back from tale0"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_back_from_pinned_tale.png"),
          path.join(__dirname, "/golden/home_page_render_home_state.png"),
          path.join(__dirname, "/home_page_back_from_pinned_tale_diff.png")
        );

        // Execute
        cut.show({
          list: [{ taleId: "tale0" }],
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_invalid_pinned_tale.png"),
          path.join(__dirname, "/golden/home_page_render_home_state.png"),
          path.join(__dirname, "/home_page_invalid_pinned_tale_diff.png")
        );

        // Execute
        cut.show({
          page: Page.Reply,
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_write_from_state.png"),
          path.join(__dirname, "/golden/home_page_write_from_state.png"),
          path.join(__dirname, "/home_page_write_from_state_diff.png")
        );

        // Execute
        cut.writeTalePages.get("").backMenuItem.click();

        // Verify
        assertThat(
          state,
          eqMessage({ page: Page.List, list: [{}] }, HOME_PAGE_STATE),
          "new state home back from write"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/home_page_back_from_write_state.png"),
          path.join(__dirname, "/golden/home_page_render_home_state.png"),
          path.join(__dirname, "/home_page_back_from_write_state_diff.png")
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
