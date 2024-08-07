import path = require("path");
import { LOCAL_SESSION_STORAGE } from "../common/local_session_storage";
import { SignUpPage } from "./sign_up_page";
import { AccountType } from "@phading/user_service_interface/account_type";
import {
  SIGN_UP,
  SIGN_UP_REQUEST_BODY,
  SignUpResponse,
} from "@phading/user_service_interface/self/frontend/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";
import "../common/normalize_body";

function createLongString(length: number): string {
  let characters = [];
  for (let i = 0; i < length; i++) {
    characters.push("a");
  }
  return characters.join("");
}

TEST_RUNNER.run({
  name: "SignUpPageTest",
  cases: [
    new (class implements TestCase {
      public name = "LargeScreen_EnterAllFields_SignUpFailed_SignUpSuccess";
      private cut: SignUpPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 1000);
        let webServiceClientMock =
          new (class extends WebServiceClientMock {})();

        // Execute
        this.cut = new SignUpPage(LOCAL_SESSION_STORAGE, webServiceClientMock);
        document.body.appendChild(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_tall.png"),
          path.join(__dirname, "/golden/sign_up_page_tall.png"),
          path.join(__dirname, "/sign_up_page_tall_diff.png"),
        );

        // Execute
        this.cut.naturalNameInput.value = "First Second name";
        this.cut.naturalNameInput.dispatchInput();
        this.cut.usernameInput.value = "my_username";
        this.cut.usernameInput.dispatchInput();
        this.cut.passwordInput.value = "123123";
        this.cut.passwordInput.dispatchInput();
        this.cut.repeatPasswordInput.value = "123123";
        this.cut.repeatPasswordInput.dispatchInput();
        this.cut.accountTypeInput.optionButtons[1].select();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_enter_all_valid_fields.png"),
          path.join(
            __dirname,
            "/golden/sign_up_page_enter_all_valid_fields.png",
          ),
          path.join(__dirname, "/sign_up_page_enter_all_valid_fields_diff.png"),
        );

        // Prepare
        webServiceClientMock.send = async (request) => {
          assertThat(request.descriptor, eq(SIGN_UP), "sign up service");
          assertThat(
            request.body,
            eqMessage(
              {
                naturalName: "First Second name",
                username: "my_username",
                password: "123123",
                accountType: AccountType.PUBLISHER,
              },
              SIGN_UP_REQUEST_BODY,
            ),
            "sign up request body",
          );
          throw new Error("Fake error");
        };

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) =>
          this.cut.once("signUpError", () => resolve()),
        );

        // Verify
        assertThat(LOCAL_SESSION_STORAGE.read(), eq(null), "no session");
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_username_submit_failed.png"),
          path.join(
            __dirname,
            "/golden/sign_up_page_username_submit_failed.png",
          ),
          path.join(__dirname, "/sign_up_page_username_submit_failed_diff.png"),
        );

        // Prepare
        webServiceClientMock.send = async (request) => {
          return { usernameIsNotAvailable: true } as SignUpResponse;
        };

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) =>
          this.cut.once("signUpError", () => resolve()),
        );

        // Verify
        assertThat(LOCAL_SESSION_STORAGE.read(), eq(null), "no session");
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_username_is_used.png"),
          path.join(__dirname, "/golden/sign_up_page_username_is_used.png"),
          path.join(__dirname, "/sign_up_page_username_is_used_diff.png"),
        );

        // Prepare
        webServiceClientMock.send = async (request) => {
          return {
            signedSession: "signed_session",
          } as SignUpResponse;
        };

        // Execute
        this.cut.usernameInput.value = "my_new_username";
        this.cut.usernameInput.dispatchInput();
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) =>
          this.cut.once("signedUp", resolve),
        );

        // Verify
        assertThat(
          LOCAL_SESSION_STORAGE.read(),
          eq("signed_session"),
          "stored session",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "SmallScreen";
      private cut: SignUpPage;
      public async execute() {
        // Prepare
        await setViewport(500, 400);

        // Execute
        this.cut = new SignUpPage(undefined, undefined);
        document.body.appendChild(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_short.png"),
          path.join(__dirname, "/golden/sign_up_page_short.png"),
          path.join(__dirname, "/sign_up_page_short_diff.png"),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_short_scroll_to_bottom.png"),
          path.join(
            __dirname,
            "/golden/sign_up_page_short_scroll_to_bottom.png",
          ),
          path.join(__dirname, "/sign_up_page_short_scroll_to_bottom_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "NaturalNameInputAndError";
      private cut: SignUpPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 1000);
        this.cut = new SignUpPage(undefined, undefined);
        document.body.appendChild(this.cut.body);

        // Execute
        this.cut.naturalNameInput.value = createLongString(120);
        this.cut.naturalNameInput.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_natural_name_too_long_error.png"),
          path.join(
            __dirname,
            "/golden/sign_up_page_natural_name_too_long_error.png",
          ),
          path.join(
            __dirname,
            "/sign_up_page_natural_name_too_long_error_diff.png",
          ),
        );

        // Execute
        this.cut.naturalNameInput.value = "";
        this.cut.naturalNameInput.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_natural_name_missing_error.png"),
          path.join(
            __dirname,
            "/golden/sign_up_page_natural_name_missing_error.png",
          ),
          path.join(
            __dirname,
            "/sign_up_page_natural_name_missing_error_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UsernameInputAndError";
      private cut: SignUpPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 1000);
        this.cut = new SignUpPage(undefined, undefined);
        document.body.appendChild(this.cut.body);

        // Execute
        this.cut.usernameInput.value = createLongString(120);
        this.cut.usernameInput.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_username_too_long_error.png"),
          path.join(
            __dirname,
            "/golden/sign_up_page_username_too_long_error.png",
          ),
          path.join(
            __dirname,
            "/sign_up_page_username_too_long_error_diff.png",
          ),
        );

        // Execute
        this.cut.usernameInput.value = "";
        this.cut.usernameInput.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_username_missing_error.png"),
          path.join(
            __dirname,
            "/golden/sign_up_page_username_missing_error.png",
          ),
          path.join(__dirname, "/sign_up_page_username_missing_error_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "PasswordInputAndError";
      private cut: SignUpPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 1000);
        this.cut = new SignUpPage(undefined, undefined);
        document.body.appendChild(this.cut.body);

        // Execute
        this.cut.passwordInput.value = createLongString(120);
        this.cut.passwordInput.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_password_too_long_error.png"),
          path.join(
            __dirname,
            "/golden/sign_up_page_password_too_long_error.png",
          ),
          path.join(
            __dirname,
            "/sign_up_page_password_too_long_error_diff.png",
          ),
        );

        // Execute
        this.cut.passwordInput.value = "";
        this.cut.passwordInput.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_password_missing_error.png"),
          path.join(
            __dirname,
            "/golden/sign_up_page_password_missing_error.png",
          ),
          path.join(__dirname, "/sign_up_page_password_missing_error_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "RepeatPasswordInputAndError";
      private cut: SignUpPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 1000);
        this.cut = new SignUpPage(undefined, undefined);
        document.body.appendChild(this.cut.body);
        this.cut.passwordInput.value = "123123";

        // Execute
        this.cut.repeatPasswordInput.value = "1111";
        this.cut.repeatPasswordInput.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/sign_up_page_repeat_password_not_match_error.png",
          ),
          path.join(
            __dirname,
            "/golden/sign_up_page_repeat_password_not_match_error.png",
          ),
          path.join(
            __dirname,
            "/sign_up_page_repeat_password_not_match_error_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    {
      name: "GoToSignUp",
      execute: async () => {
        // Prepare
        let cut = new SignUpPage(undefined, undefined);
        let goToSignIn = false;
        cut.on("signIn", () => (goToSignIn = true));

        // Execute
        cut.switchToSignInButton.click();

        // Verify
        assertThat(goToSignIn, eq(true), "go to sign in");
      },
    },
  ],
});
