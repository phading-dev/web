import LRU = require("lru-cache");
import path = require("path");
import { AccountPageMock } from "./account_page/container_mock";
import { Page as AccountPage } from "./account_page/state";
import { ContentPage } from "./container";
import { HomePageMock } from "./home_page/container_mock";
import { QuickTalesListPage } from "./home_page/quick_tales_page/quick_tales_list_page/container";
import { Page as HomePage } from "./home_page/state";
import { WriteTalePage } from "./home_page/write_tale_page/container";
import { CONTENT_PAGE_STATE, ContentPageState, Page } from "./state";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat } from "@selfage/test_matcher";
import "../common/normalize_body";

let menuContainer: HTMLDivElement;
let controllerContainer: HTMLDivElement;

TEST_RUNNER.run({
  name: "ContentPageTest",
  environment: {
    setUp: () => {
      menuContainer = E.div({
        style: `position: fixed; left: 0; top: 0; display: flex; flex-flow: column nowrap;`,
      });
      controllerContainer = E.div({
        style: `position: fixed; right: 0; top: 0; display: flex; flex-flow: column nowrap;`,
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
      public name = "Render_WriteTale_Account_UpdatePassword";
      private cut: ContentPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let quickTalesListPageCache = new LRU<string, QuickTalesListPage>({
          max: 10,
        });
        let writeTalePageCache = new LRU<string, WriteTalePage>({
          max: 10,
        });

        // Execute
        this.cut = new ContentPage(
          (
            appendBodies,
            prependMenuBodies,
            appendMenuBodies,
            appendControllerBodies
          ) =>
            new HomePageMock(
              quickTalesListPageCache,
              writeTalePageCache,
              appendBodies,
              prependMenuBodies,
              appendMenuBodies,
              appendControllerBodies
            ),
          (appendBodies, prependMenuBodies, appendMenuBodies) =>
            new AccountPageMock(
              appendBodies,
              prependMenuBodies,
              appendMenuBodies
            ),
          (...bodies) => {
            document.body.append(...bodies);
          },
          (...bodies) => {
            menuContainer.prepend(...bodies);
          },
          (...bodies) => {
            menuContainer.append(...bodies);
          },
          (...bodies) => {
            controllerContainer.append(...bodies);
          }
        );
        this.cut.updateState();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/content_page_render.png"),
          path.join(__dirname, "/golden/content_page_render.png"),
          path.join(__dirname, "/content_page_render_diff.png")
        );

        // Prepare
        let state: ContentPageState;
        this.cut.on("newState", (newState) => (state = newState));

        // Execute
        this.cut.homePage.writeTaleMenuItem.click();

        // Verify
        assertThat(
          state,
          eqMessage(
            {
              page: Page.Home,
              home: {
                page: HomePage.Write,
                list: [{}],
                reply: "",
              },
            },
            CONTENT_PAGE_STATE
          ),
          "go to write tale"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/content_page_go_to_write_tale.png"),
          path.join(__dirname, "/golden/content_page_go_to_write_tale.png"),
          path.join(__dirname, "/content_page_go_to_write_tale_diff.png")
        );

        // Execute
        this.cut.accountMenuItem.click();

        // Verify
        assertThat(
          state,
          eqMessage({ page: Page.Account }, CONTENT_PAGE_STATE),
          "go to account"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/content_page_go_to_account.png"),
          path.join(__dirname, "/golden/content_page_go_to_account.png"),
          path.join(__dirname, "/content_page_go_to_account_diff.png")
        );

        // Execute
        this.cut.accountPage.accountInfoPage.passwordEditable.click();

        // Verify
        assertThat(
          state,
          eqMessage(
            {
              page: Page.Account,
              account: {
                page: AccountPage.UpdatePassword,
              },
            },
            CONTENT_PAGE_STATE
          ),
          "go to update password"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/content_page_go_to_update_password.png"),
          path.join(
            __dirname,
            "/golden/content_page_go_to_update_password.png"
          ),
          path.join(__dirname, "/content_page_go_to_update_password_diff.png")
        );

        // Execute
        this.cut.homeMenuItem.click();

        // Verify
        assertThat(
          state,
          eqMessage({ page: Page.Home }, CONTENT_PAGE_STATE),
          "go to home"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/content_page_go_to_home.png"),
          path.join(__dirname, "/golden/content_page_render.png"),
          path.join(__dirname, "/content_page_go_to_home_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "RenderFromStateAndUpdate";
      private cut: ContentPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let quickTalesListPageCache = new LRU<string, QuickTalesListPage>({
          max: 10,
        });
        let writeTalePageCache = new LRU<string, WriteTalePage>({
          max: 10,
        });

        // Execute
        this.cut = new ContentPage(
          (
            appendBodies,
            prependMenuBodies,
            appendMenuBodies,
            appendControllerBodies
          ) =>
            new HomePageMock(
              quickTalesListPageCache,
              writeTalePageCache,
              appendBodies,
              prependMenuBodies,
              appendMenuBodies,
              appendControllerBodies
            ),
          (appendBodies, prependMenuBodies, appendMenuBodies) =>
            new AccountPageMock(
              appendBodies,
              prependMenuBodies,
              appendMenuBodies
            ),
          (...bodies) => {
            document.body.append(...bodies);
          },
          (...bodies) => {
            menuContainer.prepend(...bodies);
          },
          (...bodies) => {
            menuContainer.append(...bodies);
          },
          (...bodies) => {
            controllerContainer.append(...bodies);
          }
        );
        this.cut.updateState({
          page: Page.Home,
          home: { page: HomePage.Write, reply: "" },
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/content_page_render_write_tale_from_state.png"
          ),
          path.join(
            __dirname,
            "/golden/content_page_render_write_tale_from_state.png"
          ),
          path.join(
            __dirname,
            "/content_page_render_write_tale_from_state_diff.png"
          )
        );

        // Execute
        this.cut.updateState();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/content_page_render_tales_list_from_state.png"
          ),
          path.join(
            __dirname,
            "/golden/content_page_render_tales_list_from_state.png"
          ),
          path.join(
            __dirname,
            "/content_page_render_tales_list_from_state_diff.png"
          )
        );

        // Execute
        this.cut.updateState({
          page: Page.Account,
          account: {
            page: AccountPage.UpdatePassword,
          },
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/content_page_render_update_password_from_state.png"
          ),
          path.join(
            __dirname,
            "/golden/content_page_render_update_password_from_state.png"
          ),
          path.join(
            __dirname,
            "/content_page_render_update_password_from_state_diff.png"
          )
        );

        // Execute
        this.cut.updateState({
          page: Page.Account,
          account: {
            page: AccountPage.AccountInfo,
          },
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/content_page_render_account_info_from_state.png"
          ),
          path.join(
            __dirname,
            "/golden/content_page_render_account_info_from_state.png"
          ),
          path.join(
            __dirname,
            "/content_page_render_account_info_from_state_diff.png"
          )
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
