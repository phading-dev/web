import path = require("path");
import { normalizeBody } from "../../../common/normalize_body";
import { setTabletView } from "../../../common/view_port";
import { SendPasswordResetPage } from "./body";
import { SendPasswordResetEmailResponse } from "@phading/user_service_interface/web/self/interface";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "SendPasswordResetPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "TabletView_Default_ValidEmail_Error_RateLimited_Success_Back";
      private cut: SendPasswordResetPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new SendPasswordResetPage(serviceClientMock);

        // Execute
        document.body.appendChild(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/send_password_reset_page_tablet.png"),
          path.join(__dirname, "/golden/send_password_reset_page_tablet.png"),
          path.join(__dirname, "/send_password_reset_page_tablet_diff.png"),
        );

        // Execute
        this.cut.emailInput.val.value = " test@example.com ";
        this.cut.emailInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/send_password_reset_page_tablet_valid.png"),
          path.join(
            __dirname,
            "/golden/send_password_reset_page_tablet_valid.png",
          ),
          path.join(
            __dirname,
            "/send_password_reset_page_tablet_valid_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.on("sent", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/send_password_reset_page_tablet_error.png"),
          path.join(
            __dirname,
            "/golden/send_password_reset_page_tablet_error.png",
          ),
          path.join(
            __dirname,
            "/send_password_reset_page_tablet_error_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.error = undefined;
        let response: SendPasswordResetEmailResponse = {
          rateLimited: true,
        };
        serviceClientMock.response = response;

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.on("sent", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/send_password_reset_page_tablet_rate_limited.png",
          ),
          path.join(
            __dirname,
            "/golden/send_password_reset_page_tablet_rate_limited.png",
          ),
          path.join(
            __dirname,
            "/send_password_reset_page_tablet_rate_limited_diff.png",
          ),
        );

        // Prepare
        response = {
          rateLimited: false,
        };
        serviceClientMock.response = response;
        let successEmail: string;
        this.cut.on("showSuccess", (email) => {
          successEmail = email;
        });

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.on("sent", resolve));

        // Verify
        assertThat(successEmail, eq("test@example.com"), "success email");
        await asyncAssertScreenshot(
          path.join(__dirname, "/send_password_reset_page_tablet_success.png"),
          path.join(
            __dirname,
            "/golden/send_password_reset_page_tablet_success.png",
          ),
          path.join(
            __dirname,
            "/send_password_reset_page_tablet_success_diff.png",
          ),
        );

        // Prepare
        let back = false;
        this.cut.on("back", () => {
          back = true;
        });

        // Execute
        this.cut.inputFormPage.clickBackButton();

        // Verify
        assertThat(back, eq(true), "back");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
