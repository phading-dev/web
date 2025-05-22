import path = require("path");
import { LOCAL_SESSION_STORAGE } from "../../common/local_session_storage";
import { normalizeBody } from "../../common/normalize_body";
import { setDesktopView } from "../../common/view_port";
import { SignInPage } from "./sign_in_page";
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
        this.cut = new SignInPage(LOCAL_SESSION_STORAGE, serviceClientMock);
        document.body.appendChild(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_in_page_render.png"),
          path.join(__dirname, "/golden/sign_in_page_render.png"),
          path.join(__dirname, "/sign_in_page_render_diff.png"),
        );

        // Execute
        this.cut.usernameInput.val.value = "my_username";
        this.cut.usernameInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_in_page_username_input.png"),
          path.join(__dirname, "/golden/sign_in_page_username_input.png"),
          path.join(__dirname, "/sign_in_page_username_input_diff.png"),
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
          this.cut.inputFormPage.once("primaryDone", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_in_page_submit_failure.png"),
          path.join(__dirname, "/golden/sign_in_page_submit_failure.png"),
          path.join(__dirname, "/sign_in_page_submit_failure_diff.png"),
        );

        // Prepare
        serviceClientMock.error = undefined;
        serviceClientMock.response = {
          signedSession: "signed_session",
        } as SignInResponse;

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) =>
          this.cut.once("signedIn", resolve),
        );

        // Verify
        assertThat(
          LOCAL_SESSION_STORAGE.read(),
          eq("signed_session"),
          "stored session",
        );
        assertThat(
          serviceClientMock.request.descriptor,
          eq(SIGN_IN),
          "request service",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            { username: "my_username", password: "123" },
            SIGN_IN_REQUEST_BODY,
          ),
          "request body",
        );
      }
      public tearDown() {
        this.cut.remove();
        LOCAL_SESSION_STORAGE.clear();
      }
    })(),
    {
      name: "GoToSignUp",
      execute: async () => {
        // Prepare
        let cut = new SignInPage(undefined, undefined);
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
