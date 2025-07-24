import path = require("path");
import { normalizeBody } from "../../../common/normalize_body";
import { setPhoneView, setTabletView } from "../../../common/view_port";
import { PasswordResetSentPage } from "./body";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "PasswordResetSentPageTest",
  cases: [
    new (class implements TestCase {
      public name = "PhoneView_TabletView_BackButton";
      private cut: PasswordResetSentPage;
      public async execute() {
        // Prepare
        await setPhoneView();
        this.cut = new PasswordResetSentPage("me@gmail.com");

        // Execute
        document.body.appendChild(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/password_reset_sent_page_phone.png"),
          path.join(__dirname, "/golden/password_reset_sent_page_phone.png"),
          path.join(__dirname, "/password_reset_sent_page_phone_diff.png"),
        );

        // Execute
        await setTabletView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/password_reset_sent_page_tablet.png"),
          path.join(__dirname, "/golden/password_reset_sent_page_tablet.png"),
          path.join(__dirname, "/password_reset_sent_page_tablet_diff.png"),
        );

        // Prepare
        let back = false;
        this.cut.on("back", () => {
          back = true;
        });

        // Execute
        this.cut.backButton.val.click();

        // Verify
        assertThat(back, eq(true), "back");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
