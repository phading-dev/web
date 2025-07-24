import path = require("path");
import { normalizeBody } from "../../../common/normalize_body";
import { setDesktopView } from "../../../common/view_port";
import { SignInPage } from "./body";
import {
  SIGN_IN,
  SIGN_IN_REQUEST_BODY,
  SignInResponse,
} from "@phading/user_service_interface/web/self/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "SignInPageTest",
  cases: [
    new (class implements TestCase {
      public name = "SubmitFailure_SubmitSuccess";
      private cut: SignInPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let serviceClientMock = new WebServiceClientMock();

        // Execute
        this.cut = new SignInPage(serviceClientMock);
        document.body.appendChild(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_in_page_render.png"),
          path.join(__dirname, "/golden/sign_in_page_render.png"),
          path.join(__dirname, "/sign_in_page_render_diff.png"),
        );

        // Execute
        this.cut.userEmailInput.val.value = " me@gmail.com ";
        this.cut.userEmailInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_in_page_user_email_input.png"),
          path.join(__dirname, "/golden/sign_in_page_user_email_input.png"),
          path.join(__dirname, "/sign_in_page_user_email_input_diff.png"),
        );

        // Execute
        this.cut.passwordInput.val.value = "123";
        this.cut.passwordInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_in_page_password_input.png"),
          path.join(__dirname, "/golden/sign_in_page_password_input.png"),
          path.join(__dirname, "/sign_in_page_password_input_diff.png"),
        );

        // Prepare
        serviceClientMock.error = new Error("fake error");

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) =>
          this.cut.once("signInDone", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(SIGN_IN),
          "request service",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            { userEmail: "me@gmail.com", password: "123" },
            SIGN_IN_REQUEST_BODY,
          ),
          "request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_in_page_submit_failure.png"),
          path.join(__dirname, "/golden/sign_in_page_submit_failure.png"),
          path.join(__dirname, "/sign_in_page_submit_failure_diff.png"),
        );

        // Prepare
        serviceClientMock.error = undefined;
        serviceClientMock.response = {
          notAuthenticated: true,
        } as SignInResponse;

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) =>
          this.cut.once("signInDone", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_in_page_not_authenticated.png"),
          path.join(__dirname, "/golden/sign_in_page_not_authenticated.png"),
          path.join(__dirname, "/sign_in_page_not_authenticated_diff.png"),
        );

        // Prepare
        serviceClientMock.response = {
          needsEmailVerification: true,
        } as SignInResponse;
        let verifyEmail: string;
        this.cut.on("verifyEmail", (email) => (verifyEmail = email));

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) =>
          this.cut.once("signInDone", resolve),
        );

        // Verify
        assertThat(verifyEmail, eq("me@gmail.com"), "verify email");
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_in_page_success.png"),
          path.join(__dirname, "/golden/sign_in_page_success.png"),
          path.join(__dirname, "/sign_in_page_success_diff.png"),
        );

        // Prepare
        serviceClientMock.response = {
          signedSession: "signed_session",
        } as SignInResponse;
        let signedSession: string;
        this.cut.on("auth", (session) => (signedSession = session));

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.once("auth", resolve));

        // Verify
        assertThat(signedSession, eq("signed_session"), "session");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    {
      name: "GoToSignUp",
      execute: async () => {
        // Prepare
        let cut = new SignInPage(undefined);
        let goToSignUp = false;
        cut.on("signUp", () => (goToSignUp = true));

        // Execute
        cut.switchToSignUpButton.val.click();

        // Verify
        assertThat(goToSignUp, eq(true), "go to sign up");
      },
    },
  ],
});
