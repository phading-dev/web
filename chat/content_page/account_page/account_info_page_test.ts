import userImage = require("./test_data/user_image.jpg");
import path = require("path");
import { AccountInfoPage } from "./account_info_page";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "../../common/normalize_body";

TEST_RUNNER.run({
  name: "AccountInfoPageTest",
  cases: [
    new (class implements TestCase {
      public name = "RenderAndHoverAndClick";
      private cut: AccountInfoPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);

        // Execute
        this.cut = new AccountInfoPage(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public send() {
              return {
                username: "some-name",
                naturalName: "Some Name",
                email: "somename@something.com",
                avatarLargePath: userImage,
              } as any;
            }
          })()
        );
        document.body.appendChild(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_info_page_render.png"),
          path.join(__dirname, "/golden/account_info_page_render.png"),
          path.join(__dirname, "/account_info_page_diff_render.png")
        );

        // Execute
        this.cut.avatarContainer.dispatchEvent(new MouseEvent("mouseenter"));
        await new Promise<void>((resolve) =>
          this.cut.once("avatarUpdateHintTransitionEnded", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_info_page_hover_avatar.png"),
          path.join(__dirname, "/golden/account_info_page_hover_avatar.png"),
          path.join(__dirname, "/account_info_page_hover_avatar_diff.png")
        );

        // Prepare
        let toUpdate = false;
        this.cut.on("updateAvatar", () => (toUpdate = true));

        // Execute
        this.cut.avatarContainer.dispatchEvent(new MouseEvent("click"));

        // Verify
        assertThat(toUpdate, eq(true), "to update avatar");

        // Execute
        this.cut.avatarContainer.dispatchEvent(new MouseEvent("mouseleave"));
        await new Promise<void>((resolve) =>
          this.cut.once("avatarUpdateHintTransitionEnded", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_info_page_leave_avatar.png"),
          path.join(__dirname, "/golden/account_info_page_render.png"),
          path.join(__dirname, "/account_info_page_leave_avatar_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
