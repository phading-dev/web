import path = require("path");
import { normalizeBody } from "../../common/normalize_body";
import { setTabletView } from "../../common/view_port";
import { AuthPage } from "./body";
import { ChangeEmailPage } from "./change_email_page/body";
import { PasswordResetSentPage } from "./password_reset_sent_page/body";
import { SendEmailVerificationPage } from "./send_email_verification_page/body";
import { SendPasswordResetPage } from "./send_password_reset_page/body";
import { SignInPage } from "./sign_in_page/body";
import { SignUpPage } from "./sign_up_page/body";
import { AccountType } from "@phading/user_service_interface/account_type";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebClientOptions } from "@selfage/web_service_client";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

function createAuthPage(initAccountType?: AccountType): AuthPage {
  return new AuthPage(
    (email) => new ChangeEmailPage(undefined, email),
    (email) => new PasswordResetSentPage(email),
    (email) =>
      new SendEmailVerificationPage(
        new (class extends WebServiceClientMock {
          public async send(
            request: ClientRequestInterface<any>,
            options?: WebClientOptions,
          ): Promise<any> {
            return {};
          }
        })(),
        {
          setTimeout: () => {},
        } as any,
        email,
      ),
    () => new SendPasswordResetPage(undefined),
    () => new SignInPage(undefined),
    (initAccountType) => new SignUpPage(undefined, initAccountType),
    (...bodies) => document.body.append(...bodies),
    initAccountType,
  );
}

TEST_RUNNER.run({
  name: "AuthPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "SignIn_Auth_SignUp_SignIn_ResetPassword_PasswordResetSent_BackToSignIn_ResetPasswordAndBackToSignIn";
      private cut: AuthPage;
      public async execute() {
        // Prepare
        await setTabletView();

        // Execute
        this.cut = createAuthPage();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/auth_page_sign_in.png"),
          path.join(__dirname, "/golden/auth_page_sign_in.png"),
          path.join(__dirname, "/auth_page_sign_in_diff.png"),
        );

        // Prepare
        let signedSession: string;
        this.cut.on("auth", (session) => {
          signedSession = session;
        });

        // Execute
        this.cut.signInPage.emit("auth", "session1");

        // Verify
        assertThat(signedSession, eq("session1"), "auth session from sign in");

        // Execute
        this.cut.signInPage.emit("signUp");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/auth_page_sign_up.png"),
          path.join(__dirname, "/golden/auth_page_sign_up.png"),
          path.join(__dirname, "/auth_page_sign_up_diff.png"),
        );

        // Execute
        this.cut.signUpPage.emit("signIn");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/auth_page_sign_up_to_sign_in.png"),
          path.join(__dirname, "/golden/auth_page_sign_in.png"),
          path.join(__dirname, "/auth_page_sign_up_to_sign_in_diff.png"),
        );

        // Execute
        this.cut.signInPage.emit("resetPassword");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/auth_page_send_password_reset.png"),
          path.join(__dirname, "/golden/auth_page_send_password_reset.png"),
          path.join(__dirname, "/auth_page_send_password_reset_diff.png"),
        );

        // Execute
        this.cut.sendPasswordResetPage.emit(
          "showSuccess",
          "test_another@example.com",
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/auth_page_send_password_reset_sent.png"),
          path.join(
            __dirname,
            "/golden/auth_page_send_password_reset_sent.png",
          ),
          path.join(__dirname, "/auth_page_send_password_reset_sent_diff.png"),
        );

        // Execute
        this.cut.passwordResetSentPage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/auth_page_password_reset_success_to_sign_in.png",
          ),
          path.join(__dirname, "/golden/auth_page_sign_in.png"),
          path.join(
            __dirname,
            "/auth_page_password_reset_success_to_sign_in_diff.png",
          ),
        );

        // Execute
        this.cut.signInPage.emit("resetPassword");
        this.cut.sendPasswordResetPage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/auth_page_password_reset_to_sign_in.png"),
          path.join(__dirname, "/golden/auth_page_sign_in.png"),
          path.join(__dirname, "/auth_page_password_reset_to_sign_in_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "SignUpInitConsumerType_VerifyEmail_ChangeEmail_BackToSignIn_VerifyEmail";
      private cut: AuthPage;
      public async execute() {
        // Prepare
        await setTabletView();

        // Execute
        this.cut = createAuthPage(AccountType.CONSUMER);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/auth_page_sign_up.png"),
          path.join(__dirname, "/golden/auth_page_sign_up.png"),
          path.join(__dirname, "/auth_page_sign_up_diff.png"),
        );

        // Execute
        this.cut.signUpPage.emit("verifyEmail", "test@example.com");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/auth_page_send_email_verification.png"),
          path.join(__dirname, "/golden/auth_page_send_email_verification.png"),
          path.join(__dirname, "/auth_page_send_email_verification_diff.png"),
        );

        // Execute
        this.cut.sendEmailVerificationPage.emit(
          "changeEmail",
          "test@example.com",
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/auth_page_change_email.png"),
          path.join(__dirname, "/golden/auth_page_change_email.png"),
          path.join(__dirname, "/auth_page_change_email_diff.png"),
        );

        // Execute
        this.cut.changeEmailPage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/auth_page_sign_in.png"),
          path.join(__dirname, "/golden/auth_page_sign_in.png"),
          path.join(__dirname, "/auth_page_sign_in_diff.png"),
        );

        // Execute
        this.cut.signInPage.emit("verifyEmail", "test@example.com");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/auth_page_send_email_verification.png"),
          path.join(__dirname, "/golden/auth_page_send_email_verification.png"),
          path.join(__dirname, "/auth_page_send_email_verification_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "SignUpInitPublisherType";
      private cut: AuthPage;
      public async execute() {
        // Prepare
        await setTabletView();

        // Execute
        this.cut = createAuthPage(AccountType.PUBLISHER);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/auth_page_sign_up_publisher.png"),
          path.join(__dirname, "/golden/auth_page_sign_up_publisher.png"),
          path.join(__dirname, "/auth_page_sign_up_publisher_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
