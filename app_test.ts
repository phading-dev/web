import "./dev/env";
import path = require("path");
import { App } from "./app";
import { LOCAL_SESSION_STORAGE } from "./common/local_session_storage";
import { normalizeBody } from "./common/normalize_body";
import { setTabletView } from "./common/view_port";
import { MainAppMock } from "./main_app/body_mock";
import { ReplacePrimaryPaymentMethodActionMock } from "./replace_primary_payment_method_action/action_mock";
import { ResetPasswordPageMock } from "./reset_password_page/body_mock";
import { VerifyEmailPageMock } from "./verify_email_page/body_mock";
import { APP_RL, AppRl } from "@phading/web_interface/app";
import { MainAppRl } from "@phading/web_interface/main/app";
import { copyMessage } from "@selfage/message/copier";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq, isArray } from "@selfage/test_matcher";

normalizeBody();

function createApp(): [App, Array<AppRl>] {
  let nowDate = new Date("2023-10-10T00:00:00Z");
  let rls = new Array<AppRl>();
  let app = new App(
    (appendBodies) => new MainAppMock(() => nowDate, appendBodies),
    (accountId) => new ReplacePrimaryPaymentMethodActionMock(accountId),
    (appendBodies, tokenId) => new ResetPasswordPageMock(appendBodies, tokenId),
    (tokenId) => new VerifyEmailPageMock(tokenId),
    document.body,
  )
    .on("pushRl", (rl) => rls.push(copyMessage(rl, APP_RL)))
    .on("replaceRl", (rl) => (rls[rls.length - 1] = copyMessage(rl, APP_RL)));
  return [app, rls];
}

TEST_RUNNER.run({
  name: "AppTest",
  cases: [
    new (class implements TestCase {
      public name = "MainApp_PushRl_ReplaceRl";
      private cut: App;
      public async execute() {
        // Prepare
        await setTabletView();
        LOCAL_SESSION_STORAGE.save("session1");
        let [cut, rls] = createApp();
        this.cut = cut;

        // Execute
        await this.cut.applyRl();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/app_home.png"),
          path.join(__dirname, "/golden/app_home.png"),
          path.join(__dirname, "/app_home_diff.png"),
        );

        // Execute
        this.cut.mainApp.emit("pushRl", {
          account: {},
        } as MainAppRl);

        // Verify
        assertThat(
          rls,
          isArray([
            eqMessage(
              {
                main: {
                  account: {},
                },
              },
              APP_RL,
            ),
          ]),
          "push rls",
        );

        // Execute
        this.cut.mainApp.emit("replaceRl", {
          chooseAccount: {},
        } as MainAppRl);

        // Verify
        assertThat(
          rls,
          isArray([
            eqMessage(
              {
                main: {
                  chooseAccount: {},
                },
              },
              APP_RL,
            ),
          ]),
          "replace rls",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ReplacePrimaryPaymentMethodAction_Payment";
      private cut: App;
      public async execute() {
        // Prepare
        await setTabletView();
        LOCAL_SESSION_STORAGE.save("session1");
        let [cut, rls] = createApp();
        this.cut = cut;
        let chosenAccountId: string;
        this.cut.on("chosen", (accountId) => {
          chosenAccountId = accountId;
        });
        rls.push({
          replacePrimaryPaymentMethod: {
            accountId: "account1",
          },
        });

        // Execute
        this.cut.applyRl(rls[0]);
        // ReplacePrimaryPaymentMethodAction will re-apply RL.
        await new Promise((resolve) => this.cut.once("rlApplied", resolve));

        // Verify
        assertThat(
          rls,
          isArray([
            eqMessage(
              {
                main: {
                  account: {
                    payment: {},
                  },
                },
              },
              APP_RL,
            ),
          ]),
          "rls after applyRl",
        );
        assertThat(
          chosenAccountId,
          eq("account1"),
          "chosen accountId after applyRl",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/app_replace_primary_payment_method.png"),
          path.join(
            __dirname,
            "/golden/app_replace_primary_payment_method.png",
          ),
          path.join(__dirname, "/app_replace_primary_payment_method_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "VerifyEmailPage_Home";
      private cut: App;
      public async execute() {
        // Prepare
        await setTabletView();
        LOCAL_SESSION_STORAGE.save("session1");
        let [cut, rls] = createApp();
        this.cut = cut;
        rls.push({
          verifyEmail: {
            tokenId: "token1",
          },
        });

        // Execute
        this.cut.applyRl(rls[0]);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/app_verify_email.png"),
          path.join(__dirname, "/golden/app_verify_email.png"),
          path.join(__dirname, "/app_verify_email_diff.png"),
        );

        // Execute
        rls[0].verifyEmail.tokenId = "token2";
        this.cut.applyRl(rls[0]);

        // Verify
        assertThat(
          this.cut.verifyEmailPage.tokenId,
          eq("token2"),
          "verifyEmailPage.tokenId after applyRl",
        );

        // Execute
        this.cut.verifyEmailPage.emit("home");

        // Verify
        assertThat(
          rls,
          isArray([
            eqMessage(
              {
                main: {},
              },
              APP_RL,
            ),
          ]),
          "rls after home",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/app_home_after_verify.png"),
          path.join(__dirname, "/golden/app_home.png"),
          path.join(__dirname, "/app_home_after_verify_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ResetPasswordPage_Home";
      private cut: App;
      public async execute() {
        // Prepare
        await setTabletView();
        LOCAL_SESSION_STORAGE.save("session1");
        let [cut, rls] = createApp();
        this.cut = cut;
        rls.push({
          resetPassword: {
            tokenId: "token1",
          },
        });

        // Execute
        this.cut.applyRl(rls[0]);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/app_reset_password.png"),
          path.join(__dirname, "/golden/app_reset_password.png"),
          path.join(__dirname, "/app_reset_password_diff.png"),
        );

        // Execute
        rls[0].resetPassword.tokenId = "token2";
        this.cut.applyRl(rls[0]);

        // Verify
        assertThat(
          this.cut.resetPasswordPage.tokenId,
          eq("token2"),
          "resetPasswordPage.tokenId after applyRl",
        );

        // Execute
        this.cut.resetPasswordPage.emit("home");

        // Verify
        assertThat(
          rls,
          isArray([
            eqMessage(
              {
                main: {},
              },
              APP_RL,
            ),
          ]),
          "rls after home",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/app_home_after_reset.png"),
          path.join(__dirname, "/golden/app_home.png"),
          path.join(__dirname, "/app_home_after_reset_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
