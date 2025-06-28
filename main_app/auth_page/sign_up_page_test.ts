import path = require("path");
import { normalizeBody } from "../../common/normalize_body";
import { setDesktopView, setPhoneView } from "../../common/view_port";
import { SignUpPage } from "./sign_up_page";
import { AccountType } from "@phading/user_service_interface/account_type";
import {
  SIGN_UP,
  SIGN_UP_REQUEST_BODY,
  SignUpResponse,
} from "@phading/user_service_interface/web/self/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "SignUpPageTest",
  cases: [
    new (class implements TestCase {
      public name = "EnterAllFields_SignUpFailed_SignUpSuccess";
      private cut: SignUpPage;
      public async execute() {
        // Prepare
        await setPhoneView();
        let webServiceClientMock = new WebServiceClientMock();

        // Execute
        this.cut = new SignUpPage(webServiceClientMock);
        document.body.appendChild(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_phone_render.png"),
          path.join(__dirname, "/golden/sign_up_page_phone_render.png"),
          path.join(__dirname, "/sign_up_page_phone_render_diff.png"),
        );

        // Execute
        await setDesktopView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_desktop_render.png"),
          path.join(__dirname, "/golden/sign_up_page_desktop_render.png"),
          path.join(__dirname, "/sign_up_page_desktop_render_diff.png"),
        );

        // Execute
        this.cut.naturalNameInput.val.value = " First Second name ";
        this.cut.naturalNameInput.val.dispatchInput();
        this.cut.usernameInput.val.value = " my_username ";
        this.cut.usernameInput.val.dispatchInput();
        this.cut.passwordInput.val.value = "123123";
        this.cut.passwordInput.val.dispatchInput();
        this.cut.repeatPasswordInput.val.value = "123123";
        this.cut.repeatPasswordInput.val.dispatchInput();
        this.cut.emailInput.val.value = " me@gmail.com ";
        this.cut.emailInput.val.dispatchInput();
        this.cut.publisherOption.val.click();

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
        webServiceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) =>
          this.cut.once("signUpDone", () => resolve()),
        );

        // Verify
        assertThat(
          webServiceClientMock.request.descriptor,
          eq(SIGN_UP),
          "request service",
        );
        assertThat(
          webServiceClientMock.request.body,
          eqMessage(
            {
              naturalName: "First Second name",
              username: "my_username",
              password: "123123",
              contactEmail: "me@gmail.com",
              recoveryEmail: "me@gmail.com",
              accountType: AccountType.PUBLISHER,
            },
            SIGN_UP_REQUEST_BODY,
          ),
          "request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_username_submit_failed.png"),
          path.join(
            __dirname,
            "/golden/sign_up_page_username_submit_failed.png",
          ),
          path.join(__dirname, "/sign_up_page_username_submit_failed_diff.png"),
        );

        // Prepare
        webServiceClientMock.error = undefined;
        webServiceClientMock.response = {
          usernameIsAvailable: false,
        } as SignUpResponse;

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) =>
          this.cut.once("signUpDone", () => resolve()),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_username_is_used.png"),
          path.join(__dirname, "/golden/sign_up_page_username_is_used.png"),
          path.join(__dirname, "/sign_up_page_username_is_used_diff.png"),
        );

        // Prepare
        webServiceClientMock.response = {
          usernameIsAvailable: true,
          signedSession: "signed_session",
        } as SignUpResponse;
        let signedSession: string;
        this.cut.on("auth", (session) => {
          signedSession = session;
        });

        // Execute
        this.cut.usernameInput.val.value = "my_new_username";
        this.cut.usernameInput.val.dispatchInput();
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.once("auth", resolve));

        // Verify
        assertThat(
          signedSession,
          eq("signed_session"),
          "auth signed session",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "InitPubliserType";
      private cut: SignUpPage;
      public async execute() {
        // Prepare
        await setPhoneView();

        // Execute
        this.cut = new SignUpPage(undefined, AccountType.PUBLISHER);
        document.body.appendChild(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_phone_publisher.png"),
          path.join(__dirname, "/golden/sign_up_page_phone_publisher.png"),
          path.join(__dirname, "/sign_up_page_phone_publisher_diff.png"),
        );

        // Execute
        await setDesktopView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_desktop_publisher.png"),
          path.join(__dirname, "/golden/sign_up_page_desktop_publisher.png"),
          path.join(__dirname, "/sign_up_page_desktop_publisher_diff.png"),
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
        await setDesktopView();
        this.cut = new SignUpPage(undefined);
        document.body.appendChild(this.cut.body);

        // Execute
        this.cut.naturalNameInput.val.value = Array(120).fill("a").join("");
        this.cut.naturalNameInput.val.dispatchInput();

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
        this.cut.naturalNameInput.val.value = "";
        this.cut.naturalNameInput.val.dispatchInput();

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
        await setDesktopView();
        this.cut = new SignUpPage(undefined, undefined);
        document.body.appendChild(this.cut.body);

        // Execute
        this.cut.usernameInput.val.value = Array(120).fill("a").join("");
        this.cut.usernameInput.val.dispatchInput();

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
        this.cut.usernameInput.val.value = "";
        this.cut.usernameInput.val.dispatchInput();

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
      public name = "EmailInputAndError";
      private cut: SignUpPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        this.cut = new SignUpPage(undefined, undefined);
        document.body.appendChild(this.cut.body);

        // Execute
        this.cut.emailInput.val.value = Array(201).fill("a").join("");
        this.cut.emailInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_email_too_long_error.png"),
          path.join(__dirname, "/golden/sign_up_page_email_too_long_error.png"),
          path.join(__dirname, "/sign_up_page_email_too_long_error_diff.png"),
        );

        // Execute
        this.cut.emailInput.val.value = "";
        this.cut.emailInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_email_missing_error.png"),
          path.join(__dirname, "/golden/sign_up_page_email_missing_error.png"),
          path.join(__dirname, "/sign_up_page_email_missing_error_diff.png"),
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
        await setDesktopView();
        this.cut = new SignUpPage(undefined, undefined);
        document.body.appendChild(this.cut.body);

        // Execute
        this.cut.passwordInput.val.value = Array(120).fill("a").join("");
        this.cut.passwordInput.val.dispatchInput();

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
        this.cut.passwordInput.val.value = "";
        this.cut.passwordInput.val.dispatchInput();

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
        await setDesktopView();
        this.cut = new SignUpPage(undefined, undefined);
        document.body.appendChild(this.cut.body);
        this.cut.passwordInput.val.value = "123123";
        this.cut.passwordInput.val.dispatchInput();

        // Execute
        this.cut.repeatPasswordInput.val.value = "1111";
        this.cut.repeatPasswordInput.val.dispatchInput();

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
        cut.switchToSignInButton.val.click();

        // Verify
        assertThat(goToSignIn, eq(true), "go to sign in");
      },
    },
  ],
});
