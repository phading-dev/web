import path = require("path");
import { LOCAL_SESSION_STORAGE } from "../common/local_session_storage";
import { SignUpPage } from "./sign_up_page";
import {
  SIGN_UP,
  SIGN_UP_REQUEST_BODY,
  SignUpResponse,
} from "@phading/user_service_interface/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
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
      public name = "RenderLargeScreen_EnterAllFields_Submit";
      private cut: SignUpPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 1000);
        let webServiceClientMock = new (class extends WebServiceClient {
          public constructor() {
            super(undefined, undefined);
          }
        })();

        // Execute
        this.cut = new SignUpPage(LOCAL_SESSION_STORAGE, webServiceClientMock);
        document.body.appendChild(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_tall_render.png"),
          path.join(__dirname, "/golden/sign_up_page_tall_render.png"),
          path.join(__dirname, "/sign_up_page_tall_render_diff.png")
        );

        // Execute
        this.cut.naturalNameInputWithError.input.value = "First Second name";
        this.cut.naturalNameInputWithError.input.dispatchEvent(
          new KeyboardEvent("input")
        );
        this.cut.usernameInputWithError.input.value = "my_username";
        this.cut.usernameInputWithError.input.dispatchEvent(
          new KeyboardEvent("input")
        );
        this.cut.passwordInputWithError.input.value = "123123";
        this.cut.passwordInputWithError.input.dispatchEvent(
          new KeyboardEvent("input")
        );
        this.cut.repeatPasswordInputWithError.input.value = "123123";
        this.cut.repeatPasswordInputWithError.input.dispatchEvent(
          new KeyboardEvent("input")
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_enter_all_valid_fields.png"),
          path.join(
            __dirname,
            "/golden/sign_up_page_enter_all_valid_fields.png"
          ),
          path.join(__dirname, "/sign_up_page_enter_all_valid_fields_diff.png")
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
              },
              SIGN_UP_REQUEST_BODY
            ),
            "sign up request body"
          );
          return { signedSession: "signed_session" } as SignUpResponse;
        };

        // Execute
        this.cut.submitButton.click();
        await new Promise<void>((resolve) =>
          this.cut.once("signedUp", resolve)
        );

        // Verify
        assertThat(
          LOCAL_SESSION_STORAGE.read(),
          eq("signed_session"),
          "stored session"
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "RenderSmallScreen";
      private cut: SignUpPage;
      public async execute() {
        // Prepare
        await setViewport(500, 400);

        // Execute
        this.cut = new SignUpPage(undefined, undefined);
        document.body.appendChild(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_short_render.png"),
          path.join(__dirname, "/golden/sign_up_page_short_render.png"),
          path.join(__dirname, "/sign_up_page_short_render_diff.png")
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_short_scroll_to_bottom.png"),
          path.join(
            __dirname,
            "/golden/sign_up_page_short_scroll_to_bottom.png"
          ),
          path.join(__dirname, "/sign_up_page_short_scroll_to_bottom_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "RenderNaturalNameInputAndError";
      private cut: SignUpPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 1000);
        this.cut = new SignUpPage(undefined, undefined);
        document.body.appendChild(this.cut.body);

        // Execute
        this.cut.naturalNameInputWithError.input.value = createLongString(120);
        this.cut.naturalNameInputWithError.input.dispatchEvent(
          new KeyboardEvent("input")
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_natural_name_too_long_error.png"),
          path.join(
            __dirname,
            "/golden/sign_up_page_natural_name_too_long_error.png"
          ),
          path.join(
            __dirname,
            "/sign_up_page_natural_name_too_long_error_diff.png"
          )
        );

        // Execute
        this.cut.naturalNameInputWithError.input.value = "";
        this.cut.naturalNameInputWithError.input.dispatchEvent(
          new KeyboardEvent("input")
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_natural_name_missing_error.png"),
          path.join(
            __dirname,
            "/golden/sign_up_page_natural_name_missing_error.png"
          ),
          path.join(
            __dirname,
            "/sign_up_page_natural_name_missing_error_diff.png"
          )
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "RenderUsernameInputAndError";
      private cut: SignUpPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 1000);
        this.cut = new SignUpPage(undefined, undefined);
        document.body.appendChild(this.cut.body);

        // Execute
        this.cut.usernameInputWithError.input.value = createLongString(120);
        this.cut.usernameInputWithError.input.dispatchEvent(
          new KeyboardEvent("input")
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_username_too_long_error.png"),
          path.join(
            __dirname,
            "/golden/sign_up_page_username_too_long_error.png"
          ),
          path.join(__dirname, "/sign_up_page_username_too_long_error_diff.png")
        );

        // Execute
        this.cut.usernameInputWithError.input.value = "";
        this.cut.usernameInputWithError.input.dispatchEvent(
          new KeyboardEvent("input")
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_username_missing_error.png"),
          path.join(
            __dirname,
            "/golden/sign_up_page_username_missing_error.png"
          ),
          path.join(__dirname, "/sign_up_page_username_missing_error_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "RenderPasswordInputAndError";
      private cut: SignUpPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 1000);
        this.cut = new SignUpPage(undefined, undefined);
        document.body.appendChild(this.cut.body);

        // Execute
        this.cut.passwordInputWithError.input.value = createLongString(120);
        this.cut.passwordInputWithError.input.dispatchEvent(
          new KeyboardEvent("input")
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_password_too_long_error.png"),
          path.join(
            __dirname,
            "/golden/sign_up_page_password_too_long_error.png"
          ),
          path.join(__dirname, "/sign_up_page_password_too_long_error_diff.png")
        );

        // Execute
        this.cut.passwordInputWithError.input.value = "";
        this.cut.passwordInputWithError.input.dispatchEvent(
          new KeyboardEvent("input")
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/sign_up_page_password_missing_error.png"),
          path.join(
            __dirname,
            "/golden/sign_up_page_password_missing_error.png"
          ),
          path.join(__dirname, "/sign_up_page_password_missing_error_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "RenderRepeatPasswordInputAndError";
      private cut: SignUpPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 1000);
        this.cut = new SignUpPage(undefined, undefined);
        document.body.appendChild(this.cut.body);
        this.cut.passwordInputWithError.input.value = "123123";

        // Execute
        this.cut.repeatPasswordInputWithError.input.value = "1111";
        this.cut.repeatPasswordInputWithError.input.dispatchEvent(
          new KeyboardEvent("input")
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/sign_up_page_repeat_password_not_match_error.png"
          ),
          path.join(
            __dirname,
            "/golden/sign_up_page_repeat_password_not_match_error.png"
          ),
          path.join(
            __dirname,
            "/sign_up_page_repeat_password_not_match_error_diff.png"
          )
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
