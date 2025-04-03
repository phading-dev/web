import "../../common/normalize_body";
import path = require("path");
import { AuthPage } from "./body";
import { SignInPageMock } from "./sign_in_page_mock";
import { SignUpPageMock } from "./sign_up_page_mock";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { AccountType } from "@phading/user_service_interface/account_type";

TEST_RUNNER.run({
  name: "AuthPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Render";
      private cut: AuthPage;
      public async execute() {
        // Execute
        this.cut = new AuthPage(
          () => new SignInPageMock(),
          (initAccountType) => new SignUpPageMock(initAccountType),
          (...bodies) => document.body.append(...bodies),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/auth_page_navigator_render.png"),
          path.join(__dirname, "/golden/auth_page_navigator_render.png"),
          path.join(__dirname, "/auth_page_navigator_render_diff.png"),
        );

        // Execute
        this.cut.signInPage.emit("signUp");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/auth_page_navigator_switch_to_sign_up.png"),
          path.join(
            __dirname,
            "/golden/auth_page_navigator_switch_to_sign_up.png",
          ),
          path.join(
            __dirname,
            "/auth_page_navigator_switch_to_sign_up_diff.png",
          ),
        );

        // Execute
        this.cut.signUpPage.emit("signIn");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/auth_page_navigator_switch_to_sign_in.png"),
          path.join(__dirname, "/golden/auth_page_navigator_render.png"),
          path.join(
            __dirname,
            "/auth_page_navigator_switch_to_sign_in_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "SignUpInitConsumerType";
      private cut: AuthPage;
      public async execute() {
        // Execute
        this.cut = new AuthPage(
          () => new SignInPageMock(),
          (initAccountType) => new SignUpPageMock(initAccountType),
          (...bodies) => document.body.append(...bodies),
          AccountType.CONSUMER,
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/auth_page_navigator_consumer_sign_up.png"),
          path.join(__dirname, "/golden/auth_page_navigator_consumer_sign_up.png"),
          path.join(__dirname, "/auth_page_navigator_consumer_sign_up_diff.png"),
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
        // Execute
        this.cut = new AuthPage(
          () => new SignInPageMock(),
          (initAccountType) => new SignUpPageMock(initAccountType),
          (...bodies) => document.body.append(...bodies),
          AccountType.PUBLISHER,
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/auth_page_navigator_publisher_sign_up.png"),
          path.join(__dirname, "/golden/auth_page_navigator_publisher_sign_up.png"),
          path.join(__dirname, "/auth_page_navigator_publisher_sign_up_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
