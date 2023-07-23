import LRU = require("lru-cache");
import path = require("path");
import { AuthPageMock } from "./auth_page/container_mock";
import { BodyContainer } from "./body_container";
import { LOCAL_SESSION_STORAGE } from "./common/local_session_storage";
import { Page as AccountPage } from "./content_page/account_page/state";
import { ContentPageMock } from "./content_page/container_mock";
import { QuickTalesListPage } from "./content_page/home_page/quick_tales_page/quick_tales_list_page/container";
import { WriteTalePage } from "./content_page/home_page/write_tale_page/container";
import { Page as ContentPage } from "./content_page/state";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "./common/normalize_body";

TEST_RUNNER.run({
  name: "BodyContainerTest",
  cases: [
    new (class implements TestCase {
      public name = "Render_SignIn";
      private cut: BodyContainer;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let quickTalesListPageCache = new LRU<string, QuickTalesListPage>({
          max: 10,
        });
        let writeTalePageCache = new LRU<string, WriteTalePage>({
          max: 10,
        });
        let webServiceClient = new WebServiceClient(undefined, undefined);

        // Execute
        this.cut = new BodyContainer(
          (appendBodies) => new AuthPageMock(appendBodies),
          (
            appendBodies,
            prependMenuBodies,
            appendMenuBodies,
            appendControllerBodies
          ) =>
            new ContentPageMock(
              quickTalesListPageCache,
              writeTalePageCache,
              appendBodies,
              prependMenuBodies,
              appendMenuBodies,
              appendControllerBodies
            ),
          quickTalesListPageCache,
          writeTalePageCache,
          LOCAL_SESSION_STORAGE,
          webServiceClient,
          document.body
        );
        this.cut.updateState();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/body_render.png"),
          path.join(__dirname, "/golden/body_render.png"),
          path.join(__dirname, "/body_render_diff.png")
        );

        // Prepare
        LOCAL_SESSION_STORAGE.save("111");

        // Execute
        this.cut.authPage.emit("signedIn");

        // Verify
        assertThat(quickTalesListPageCache.size, eq(1), "list cache size");
        await asyncAssertScreenshot(
          path.join(__dirname, "/body_signed_in.png"),
          path.join(__dirname, "/golden/body_signed_in.png"),
          path.join(__dirname, "/body_signed_in_diff.png")
        );

        // Execute
        this.cut.contentPage.emit("signOut");

        // Verify
        assertThat(LOCAL_SESSION_STORAGE.read(), eq(null), "cleared session");
        assertThat(
          quickTalesListPageCache.size,
          eq(0),
          "cleared list cache size"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/body_signed_out.png"),
          path.join(__dirname, "/golden/body_render.png"),
          path.join(__dirname, "/body_signed_out_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "SignedOutWithState_SignIn_UpdateState";
      private cut: BodyContainer;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let quickTalesListPageCache = new LRU<string, QuickTalesListPage>({
          max: 10,
        });
        let writeTalePageCache = new LRU<string, WriteTalePage>({
          max: 10,
        });
        let webServiceClient = new WebServiceClient(undefined, undefined);

        // Execute
        this.cut = new BodyContainer(
          (appendBodies) => new AuthPageMock(appendBodies),
          (
            appendBodies,
            prependMenuBodies,
            appendMenuBodies,
            appendControllerBodies
          ) =>
            new ContentPageMock(
              quickTalesListPageCache,
              writeTalePageCache,
              appendBodies,
              prependMenuBodies,
              appendMenuBodies,
              appendControllerBodies
            ),
          quickTalesListPageCache,
          writeTalePageCache,
          LOCAL_SESSION_STORAGE,
          webServiceClient,
          document.body
        );
        this.cut.updateState({
          page: ContentPage.Account,
          account: {
            page: AccountPage.AccountInfo,
          },
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/body_render_with_state.png"),
          path.join(__dirname, "/golden/body_render_with_state.png"),
          path.join(__dirname, "/body_render_with_state_diff.png")
        );

        // Prepare
        LOCAL_SESSION_STORAGE.save("111");

        // Execute
        this.cut.authPage.emit("signedIn");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/body_signed_in_with_state.png"),
          path.join(__dirname, "/golden/body_signed_in_with_state.png"),
          path.join(__dirname, "/body_signed_in_with_state_diff.png")
        );

        // Execute
        this.cut.updateState({
          page: ContentPage.Account,
          account: {
            page: AccountPage.UpdatePassword,
          },
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/body_update_state_to_update_password.png"),
          path.join(
            __dirname,
            "/golden/body_update_state_to_update_password.png"
          ),
          path.join(__dirname, "/body_update_state_to_update_password_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
