import { normalizeBody } from "../common/normalize_body";
import { AccountPageMock } from "./account_page/container_mock";
import { ContentPage } from "./container";
import { HomePageMock } from "./home_page/container_mock";
import { Page as HomePage } from "./home_page/state";
import { CONTENT_PAGE_STATE, ContentPageState, Page } from "./state";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat } from "@selfage/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/test_runner";
import "@selfage/puppeteer_test_executor_api";

normalizeBody();

TEST_RUNNER.run({
  name: "ContentPageTest",
  cases: [
    new (class implements TestCase {
      public name = "RenderAndNavigate";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await puppeteerSetViewport(1000, 800);
        this.container = E.div({});
        document.body.append(this.container);
        let cut = new ContentPage(
          (
            appendBodiesFn,
            prependMenuBodiesFn,
            appendMenuBodiesFn,
            appendControllerBodiesFn
          ) =>
            new HomePageMock(
              appendBodiesFn,
              prependMenuBodiesFn,
              appendMenuBodiesFn,
              appendControllerBodiesFn,
              {
                startingTaleId: 0,
              }
            ),
          (prependMenuBodiesFn) => new AccountPageMock(prependMenuBodiesFn),
          (bodies) => this.container.append(...bodies)
        );
        this.container.append(cut.menuItemsBody, cut.controllerItemsBody);
        let state: ContentPageState;
        cut.on("newState", (newState) => (state = newState));

        // Execute
        cut.show();

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/content_page_render.png",
          __dirname + "/golden/content_page_render.png",
          __dirname + "/content_page_render_diff.png"
        );

        // Execute
        cut.accountMenuItem.click();

        // Verify
        assertThat(
          state,
          eqMessage({ page: Page.Account }, CONTENT_PAGE_STATE),
          "go to account"
        );
        await asyncAssertScreenshot(
          __dirname + "/content_page_go_to_account.png",
          __dirname + "/golden/content_page_go_to_account.png",
          __dirname + "/content_page_go_to_account_diff.png"
        );

        // Execute
        cut.homeMenuItem.click();

        // Verify
        assertThat(
          state,
          eqMessage({ page: Page.Home }, CONTENT_PAGE_STATE),
          "go to home"
        );
        await asyncAssertScreenshot(
          __dirname + "/content_page_go_to_home.png",
          __dirname + "/golden/content_page_render.png",
          __dirname + "/content_page_go_to_home_diff.png"
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "RenderFromStateAndUpdate";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await puppeteerSetViewport(1000, 800);
        this.container = E.div({});
        document.body.append(this.container);
        let cut = new ContentPage(
          (
            appendBodiesFn,
            prependMenuBodiesFn,
            appendMenuBodiesFn,
            appendControllerBodiesFn
          ) =>
            new HomePageMock(
              appendBodiesFn,
              prependMenuBodiesFn,
              appendMenuBodiesFn,
              appendControllerBodiesFn,
              {
                startingTaleId: 0,
              }
            ),
          (prependMenuBodiesFn) => new AccountPageMock(prependMenuBodiesFn),
          (bodies) => this.container.append(...bodies)
        );
        this.container.append(cut.menuItemsBody, cut.controllerItemsBody);

        // Execute
        cut.show({ page: Page.Home, home: { page: HomePage.Write } });

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/content_page_render_from_state.png",
          __dirname + "/golden/content_page_render_from_state.png",
          __dirname + "/content_page_render_from_state_diff.png"
        );

        // Execute
        cut.show({ page: Page.Account });

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/content_page_render_account_from_state.png",
          __dirname + "/golden/content_page_render_account_from_state.png",
          __dirname + "/content_page_render_account_from_state_diff.png"
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
