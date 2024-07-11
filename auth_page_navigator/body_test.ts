import path = require("path");
import { AuthPageNavigator } from "./body";
import { SignInPageMock } from "./sign_in_page_mock";
import { SignUpPageMock } from "./sign_up_page_mock";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import "../common/normalize_body";

TEST_RUNNER.run({
  name: "AuthPageNavigatorTest",
  cases: [
    new (class implements TestCase {
      public name = "Render";
      private cut: AuthPageNavigator;
      public async execute() {
        // Execute
        this.cut = new AuthPageNavigator(
          () => new SignInPageMock(),
          () => new SignUpPageMock(),
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
  ],
});
