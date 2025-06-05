import path = require("path");
import { normalizeBody } from "../../common/normalize_body";
import { setTabletView } from "../../common/view_port";
import { AuthPage } from "./body";
import { SignInPage } from "./sign_in_page";
import { SignUpPage } from "./sign_up_page";
import { AccountType } from "@phading/user_service_interface/account_type";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";

normalizeBody();

function createAuthPage(initAccountType?: AccountType): AuthPage {
  return new AuthPage(
    () => new SignInPage(undefined, undefined),
    (initAccountType) => new SignUpPage(undefined, undefined, initAccountType),
    (...bodies) => document.body.append(...bodies),
    initAccountType,
  );
}

TEST_RUNNER.run({
  name: "AuthPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Navigation";
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
          path.join(__dirname, "/auth_page_sign_in.png"),
          path.join(__dirname, "/golden/auth_page_sign_in.png"),
          path.join(__dirname, "/auth_page_sign_in_diff.png"),
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
        // Prepare
        await setTabletView();

        // Execute
        this.cut = createAuthPage();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/auth_page_sign_up.png"),
          path.join(__dirname, "/golden/auth_page_sign_up.png"),
          path.join(__dirname, "/auth_page_sign_up_diff.png"),
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
