import path = require("path");
import { normalizeBody } from "../../../common/normalize_body";
import { setPhoneView, setTabletView } from "../../../common/view_port";
import { SendEmailVerificationPage } from "./body";
import { SendEmailVerificationEmailResponse } from "@phading/user_service_interface/web/self/interface";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "SendEmailVerificationPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "PhoneView_InitSendSuccess_TabletView_CountDown_ResendError_ResendRateLimited_ResendSuccessClearingError";
      private cut: SendEmailVerificationPage;
      public async execute() {
        // Prepare
        await setPhoneView();
        let serviceClientMock = new WebServiceClientMock();
        let response: SendEmailVerificationEmailResponse = {
          rateLimited: false,
        };
        serviceClientMock.response = response;
        let scheduledFn: () => void;
        this.cut = new SendEmailVerificationPage(
          serviceClientMock,
          {
            setTimeout: (callbackFn: any) => {
              scheduledFn = callbackFn;
            },
          } as any,
          "me@gmail.com",
        );

        // Execute
        document.body.appendChild(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/send_email_verification_page_phone.png"),
          path.join(
            __dirname,
            "/golden/send_email_verification_page_phone.png",
          ),
          path.join(__dirname, "/send_email_verification_page_phone_diff.png"),
        );

        // Execute
        await setTabletView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/send_email_verification_page_tablet.png"),
          path.join(
            __dirname,
            "/golden/send_email_verification_page_tablet.png",
          ),
          path.join(__dirname, "/send_email_verification_page_tablet_diff.png"),
        );

        // Execute
        scheduledFn();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/send_email_verification_page_tablet_countdown_once.png",
          ),
          path.join(
            __dirname,
            "/golden/send_email_verification_page_tablet_countdown_once.png",
          ),
          path.join(
            __dirname,
            "/send_email_verification_page_tablet_countdown_once_diff.png",
          ),
        );

        // Execute
        for (let i = 0; i < 59; i++) {
          scheduledFn();
        }

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/send_email_verification_page_tablet_countdown_completed.png",
          ),
          path.join(
            __dirname,
            "/golden/send_email_verification_page_tablet_countdown_completed.png",
          ),
          path.join(
            __dirname,
            "/send_email_verification_page_tablet_countdown_completed_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.resendButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/send_email_verification_page_tablet_error.png",
          ),
          path.join(
            __dirname,
            "/golden/send_email_verification_page_tablet_error.png",
          ),
          path.join(
            __dirname,
            "/send_email_verification_page_tablet_error_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.error = undefined;
        response = {
          rateLimited: true,
        };
        serviceClientMock.response = response;

        // Execute
        this.cut.resendButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/send_email_verification_page_tablet_rate_limit.png",
          ),
          path.join(
            __dirname,
            "/golden/send_email_verification_page_tablet_rate_limit.png",
          ),
          path.join(
            __dirname,
            "/send_email_verification_page_tablet_rate_limit_diff.png",
          ),
        );

        // Prepare
        response = {
          rateLimited: false,
        };
        serviceClientMock.response = response;

        // Execute
        this.cut.resendButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/send_email_verification_page_tablet_resend.png",
          ),
          path.join(
            __dirname,
            "/golden/send_email_verification_page_tablet.png",
          ),
          path.join(
            __dirname,
            "/send_email_verification_page_tablet_resend_diff.png",
          ),
        );

        // Prepare
        let changeEmail: string;
        this.cut.on("changeEmail", (email) => {
          changeEmail = email;
        });

        // Execute
        this.cut.changeEmailButton.val.click();

        // Verify
        assertThat(changeEmail, eq("me@gmail.com"), "change email");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
