import userImage = require("./test_data/user_image.jpg");
import { normalizeBody } from "../../common/normalize_body";
import { AccountBasicTab } from "./account_basic_tab";
import { E } from "@selfage/element/factory";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/test_runner";
import { WebServiceClient } from "@selfage/web_service_client";
import "@selfage/puppeteer_test_executor_api";

normalizeBody();

TEST_RUNNER.run({
  name: "AccountBasicTabTest",
  cases: [
    new (class implements TestCase {
      public name = "RenderAndHoverAndClick";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut = new AccountBasicTab(
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
        this.container = E.div({}, cut.body);
        document.body.style.width = "1000px";
        document.body.appendChild(this.container);

        // Execute
        await cut.show();

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/account_basic_tab_render.png",
          __dirname + "/golden/account_basic_tab_render.png",
          __dirname + "/account_basic_tab_diff_render.png",
          { fullPage: true }
        );

        // Execute
        cut.avatarContainer.dispatchEvent(new MouseEvent("mouseenter"));
        await new Promise<void>((resolve) =>
          cut.once("avatarChangeHintTransitionEnded", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/account_basic_tab_hover_avatar.png",
          __dirname + "/golden/account_basic_tab_hover_avatar.png",
          __dirname + "/account_basic_tab_hover_avatar_diff.png",
          { fullPage: true }
        );

        // Prepare
        let changed = false;
        cut.on("changeAvatar", () => (changed = true));

        // Execute
        cut.avatarContainer.dispatchEvent(new MouseEvent("click"));

        // Verify
        assertThat(changed, eq(true), "changed avatar");

        // Execute
        cut.avatarContainer.dispatchEvent(new MouseEvent("mouseleave"));
        await new Promise<void>((resolve) =>
          cut.once("avatarChangeHintTransitionEnded", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/account_basic_tab_leave_avatar.png",
          __dirname + "/golden/account_basic_tab_render.png",
          __dirname + "/account_basic_tab_leave_avatar_diff.png",
          { fullPage: true }
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
