import path = require("path");
import { LOCAL_SESSION_STORAGE } from "../common/local_session_storage";
import { normalizeBody } from "../common/normalize_body";
import { setTabletView } from "../common/view_port";
import { ResetPasswordPage } from "./body";
import { ResetPage } from "./reset_page/body";
import { ResetSuccessPage } from "./reset_success_page/body";
import { ResetTokenExpiredPage } from "./reset_token_expired_page/body";
import {
  RESET_PASSWORD_AND_SIGN_IN,
  RESET_PASSWORD_AND_SIGN_IN_REQUEST_BODY,
  ResetPasswordAndSignInResponse,
} from "@phading/user_service_interface/web/self/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "ResetPasswordPageTest",
  cases: [
    new (class implements TestCase {
      public name = "TokenExpired";
      private cut: ResetPasswordPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();

        // Execute
        this.cut = new ResetPasswordPage(
          (tokenId) =>
            new ResetPage(LOCAL_SESSION_STORAGE, serviceClientMock, tokenId),
          () =>
            new ResetSuccessPage(),
          () => new ResetTokenExpiredPage(),
          (...bodies) => document.body.append(...bodies),
          "token123",
        );

        // Verify
        assertThat(
          this.cut.resetPage.tokenId,
          eq("token123"),
          "resetPage.tokenId",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/reset_password_page_tablet.png"),
          path.join(__dirname, "/golden/reset_password_page_tablet.png"),
          path.join(__dirname, "/reset_password_page_tablet_diff.png"),
        );

        // Execute
        this.cut.resetPage.newPasswordInput.val.value = "a".repeat(101);
        this.cut.resetPage.newPasswordInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/reset_password_page_tablet_too_long_error.png",
          ),
          path.join(
            __dirname,
            "/golden/reset_password_page_tablet_too_long_error.png",
          ),
          path.join(
            __dirname,
            "/reset_password_page_tablet_too_long_error_diff.png",
          ),
        );

        // Execute
        this.cut.resetPage.newPasswordInput.val.value = "a new password";
        this.cut.resetPage.newPasswordInput.val.dispatchInput();
        this.cut.resetPage.repeatPasswordInput.val.value = "some password";
        this.cut.resetPage.repeatPasswordInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/reset_password_page_tablet_password_not_match.png",
          ),
          path.join(
            __dirname,
            "/golden/reset_password_page_tablet_password_not_match.png",
          ),
          path.join(
            __dirname,
            "/reset_password_page_tablet_password_not_match_diff.png",
          ),
        );

        // Execute
        this.cut.resetPage.repeatPasswordInput.val.value = "a new password";
        this.cut.resetPage.repeatPasswordInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/reset_password_page_tablet_valid.png"),
          path.join(__dirname, "/golden/reset_password_page_tablet_valid.png"),
          path.join(__dirname, "/reset_password_page_tablet_valid_diff.png"),
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.resetPage.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) =>
          this.cut.resetPage.once("resetDone", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(RESET_PASSWORD_AND_SIGN_IN),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              resetToken: "token123",
              newPassword: "a new password",
            },
            RESET_PASSWORD_AND_SIGN_IN_REQUEST_BODY,
          ),
          "RC request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/reset_password_page_tablet_error.png"),
          path.join(__dirname, "/golden/reset_password_page_tablet_error.png"),
          path.join(__dirname, "/reset_password_page_tablet_error_diff.png"),
        );

        // Prepare
        serviceClientMock.error = undefined;
        let response: ResetPasswordAndSignInResponse = {
          tokenExpired: true,
        };
        serviceClientMock.response = response;

        // Execute
        this.cut.resetPage.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) =>
          this.cut.resetPage.once("tokenExpired", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/reset_password_page_tablet_token_expired.png"),
          path.join(
            __dirname,
            "/golden/reset_password_page_tablet_token_expired.png",
          ),
          path.join(
            __dirname,
            "/reset_password_page_tablet_token_expired_diff.png",
          ),
        );

        // Prepare
        let home = false;
        this.cut.resetTokenExpiredPage.on("home", () => (home = true));

        // Execute
        this.cut.resetTokenExpiredPage.homeButton.val.click();

        // Verify
        assertThat(home, eq(true), "home button clicked");
      }
      public tearDown() {
        this.cut.remove();
        LOCAL_SESSION_STORAGE.clear();
      }
    })(),
    new (class implements TestCase {
      public name = "Success";
      private cut: ResetPasswordPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        let response: ResetPasswordAndSignInResponse = {
          signedSession: "session123",
        };
        serviceClientMock.response = response;
        this.cut = new ResetPasswordPage(
          (tokenId) =>
            new ResetPage(LOCAL_SESSION_STORAGE, serviceClientMock, tokenId),
          () =>
            new ResetSuccessPage(),
          () => new ResetTokenExpiredPage(),
          (...bodies) => document.body.append(...bodies),
          "token123",
        );
        this.cut.resetPage.newPasswordInput.val.value = "a new password";
        this.cut.resetPage.newPasswordInput.val.dispatchInput();
        this.cut.resetPage.repeatPasswordInput.val.value = "a new password";
        this.cut.resetPage.repeatPasswordInput.val.dispatchInput();

        // Execute
        this.cut.resetPage.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) =>
          this.cut.resetPage.once("success", resolve),
        );

        // Verify
        assertThat(
          LOCAL_SESSION_STORAGE.read(),
          eq("session123"),
          "session stored",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/reset_password_page_tablet_success.png"),
          path.join(
            __dirname,
            "/golden/reset_password_page_tablet_success.png",
          ),
          path.join(__dirname, "/reset_password_page_tablet_success_diff.png"),
        );

        // Prepare
        let home = false;
        this.cut.on("home", () => {
          home = true;
        });

        // Execute
        this.cut.resetSuccessPage.homeButton.val.click();

        // Verify
        assertThat(home, eq(true), "home button clicked");
      }
      public tearDown() {
        this.cut.remove();
        LOCAL_SESSION_STORAGE.clear();
      }
    })(),
  ],
});
