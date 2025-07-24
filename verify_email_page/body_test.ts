import path = require("path");
import { normalizeBody } from "../common/normalize_body";
import { setTabletView } from "../common/view_port";
import { VerifyEmailPage } from "./body";
import {
  VERIFY_EMAIL_AND_SIGN_IN,
  VERIFY_EMAIL_AND_SIGN_IN_REQUEST_BODY,
  VerifyEmailAndSignInResponse,
} from "@phading/user_service_interface/web/self/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";
import { LOCAL_SESSION_STORAGE } from "../common/local_session_storage";

normalizeBody();

TEST_RUNNER.run({
  name: "VerifyEmailPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Success";
      private cut: VerifyEmailPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        let response: VerifyEmailAndSignInResponse = {
          signedSession: "session123",
        };
        serviceClientMock.response = response;
        this.cut = new VerifyEmailPage(LOCAL_SESSION_STORAGE, serviceClientMock, "token123");

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("verified", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(VERIFY_EMAIL_AND_SIGN_IN),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              verificationToken: "token123",
            },
            VERIFY_EMAIL_AND_SIGN_IN_REQUEST_BODY,
          ),
          "RC body",
        );
        assertThat(
          LOCAL_SESSION_STORAGE.read(),
          eq("session123"),
          "session",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/verify_email_page_tablet_success.png"),
          path.join(__dirname, "/golden/verify_email_page_tablet_success.png"),
          path.join(__dirname, "/verify_email_page_tablet_success_diff.png"),
        );

        // Prepare
        let home = false;
        this.cut.on("home", () => {
          home = true;
        });

        // Execute
        this.cut.homeButton.val.click();

        // Verify
        assertThat(home, eq(true), "home");
      }
      public async tearDown() {
        this.cut.remove();
        LOCAL_SESSION_STORAGE.clear();
      }
    })(),
    new (class implements TestCase {
      public name = "TokenExpired";
      private cut: VerifyEmailPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        let response: VerifyEmailAndSignInResponse = {
          tokenExpired: true,
        };
        serviceClientMock.response = response;
        this.cut = new VerifyEmailPage(LOCAL_SESSION_STORAGE, serviceClientMock, "token123");

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("verified", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/verify_email_page_tablet_token_expired.png"),
          path.join(
            __dirname,
            "/golden/verify_email_page_tablet_token_expired.png",
          ),
          path.join(
            __dirname,
            "/verify_email_page_tablet_token_expired_diff.png",
          ),
        );

        // Prepare
        let home = false;
        this.cut.on("home", () => {
          home = true;
        });

        // Execute
        this.cut.homeButton.val.click();

        // Verify
        assertThat(home, eq(true), "home");
      }
      public async tearDown() {
        this.cut.remove();
        LOCAL_SESSION_STORAGE.clear();
      }
    })(),
  ],
});
