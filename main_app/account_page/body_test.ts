import "../../dev/env";
import path = require("path");
import { normalizeBody } from "../../common/normalize_body";
import { setTabletView } from "../../common/view_port";
import { AccountPage } from "./body";
import { PaymentPageMock } from "./payment_page/body_mock";
import { PayoutPageMock } from "./payout_page/body_mock";
import { ProfilePageMock } from "./profile_page/body_mock";
import { StatementsPageMock } from "./statements_page/body_mock";
import {
  ACCOUNT_PAGE_RL,
  AccountPageRl,
} from "@phading/web_interface/main/account/page";
import { copyMessage } from "@selfage/message/copier";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq, isArray } from "@selfage/test_matcher";

normalizeBody();

function createAccountPage(canEarn: boolean) {
  let nowDate = new Date("2023-10-10T00:00:00Z");
  return new AccountPage(
    () => new PaymentPageMock(() => nowDate),
    () => new PayoutPageMock(() => nowDate),
    (appendBodies) => new ProfilePageMock(appendBodies),
    (canEarn) => new StatementsPageMock(() => nowDate, canEarn),
    (...bodies) => document.body.append(...bodies),
    canEarn,
  );
}

TEST_RUNNER.run({
  name: "PublisherPageTest",
  cases: [
    new (class implements TestCase {
      public name = "NavigationCanNotEarn_Home_ChooseAccount_SignOut";
      private cut: AccountPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createAccountPage(false);
        let rls = new Array<AccountPageRl>();
        this.cut.on("pushRl", (rl) => {
          rls.push(copyMessage(rl, ACCOUNT_PAGE_RL));
        });
        this.cut.on("replaceRl", (rl) => {
          rls[rls.length - 1] = copyMessage(rl, ACCOUNT_PAGE_RL);
        });

        // Execute
        this.cut.applyRl();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_page_profile.png"),
          path.join(__dirname, "/golden/account_page_profile.png"),
          path.join(__dirname, "/account_page_profile_diff.png"),
        );

        // Execute
        this.cut.paymentButton.val.click();

        // Verify
        assertThat(
          rls,
          isArray([
            eqMessage(
              {
                payment: {},
              },
              ACCOUNT_PAGE_RL,
            ),
          ]),
          "payment",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_page_payment.png"),
          path.join(__dirname, "/golden/account_page_payment.png"),
          path.join(__dirname, "/account_page_payment_diff.png"),
        );

        // Prepare
        rls.length = 0;

        // Execute
        this.cut.statementsButton.val.click();

        // Verify
        assertThat(
          rls,
          isArray([
            eqMessage(
              {
                statements: {},
              },
              ACCOUNT_PAGE_RL,
            ),
          ]),
          "statements",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_page_statements.png"),
          path.join(__dirname, "/golden/account_page_statements.png"),
          path.join(__dirname, "/account_page_statements_diff.png"),
        );

        // Prepare
        rls.length = 0;

        // Execute
        this.cut.profileButton.val.click();

        // Verify
        assertThat(
          rls,
          isArray([
            eqMessage(
              {
                profile: {},
              },
              ACCOUNT_PAGE_RL,
            ),
          ]),
          "profile",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_page_profile.png"),
          path.join(__dirname, "/golden/account_page_profile.png"),
          path.join(__dirname, "/account_page_profile_diff.png"),
        );

        // Prepare
        let home = false;
        this.cut.on("goToHome", () => {
          home = true;
        });

        // Execute
        this.cut.homeButton.val.click();

        // Verify
        assertThat(home, eq(true), "go to home");

        // Prepare
        let chooseAccount = false;
        this.cut.on("chooseAccount", () => {
          chooseAccount = true;
        });

        // Execute
        this.cut.profilePage.emit("chooseAccount");

        // Verify
        assertThat(chooseAccount, eq(true), "choose account");

        // Prepare
        let signOut = false;

        this.cut.on("signOut", () => {
          signOut = true;
        });

        // Execute
        this.cut.profilePage.emit("signOut");

        // Verify
        assertThat(signOut, eq(true), "sign out");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "NavigationCanEarn";
      private cut: AccountPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createAccountPage(true);
        let rls = new Array<AccountPageRl>();
        this.cut.on("pushRl", (rl) => {
          rls.push(copyMessage(rl, ACCOUNT_PAGE_RL));
        });
        this.cut.on("replaceRl", (rl) => {
          rls[rls.length - 1] = copyMessage(rl, ACCOUNT_PAGE_RL);
        });

        // Execute
        this.cut.applyRl();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_page_profile_can_earn.png"),
          path.join(__dirname, "/golden/account_page_profile_can_earn.png"),
          path.join(__dirname, "/account_page_profile_can_earn_diff.png"),
        );

        // Execute
        this.cut.payoutButton.val.click();

        // Verify
        assertThat(
          rls,
          isArray([
            eqMessage(
              {
                payout: {},
              },
              ACCOUNT_PAGE_RL,
            ),
          ]),
          "payout",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_page_payout_can_earn.png"),
          path.join(__dirname, "/golden/account_page_payout_can_earn.png"),
          path.join(__dirname, "/account_page_payout_can_earn_diff.png"),
        );

        // Prepare
        rls.length = 0;

        // Execute
        this.cut.statementsButton.val.click();

        // Verify
        assertThat(
          rls,
          isArray([
            eqMessage(
              {
                statements: {},
              },
              ACCOUNT_PAGE_RL,
            ),
          ]),
          "statements",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_page_statements_can_earn.png"),
          path.join(__dirname, "/golden/account_page_statements_can_earn.png"),
          path.join(__dirname, "/account_page_statements_can_earn_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyRl_Empty";
      private cut: AccountPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createAccountPage(false);

        // Execute
        this.cut.applyRl();

        // Verify
        assertThat(Boolean(this.cut.profilePage), eq(true), "profile");
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyRl_InvalidPayoutRl";
      private cut: AccountPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createAccountPage(false);
        let replaceRl: AccountPageRl;
        this.cut.on("replaceRl", (rl) => {
          replaceRl = copyMessage(rl, ACCOUNT_PAGE_RL);
        });

        // Execute
        this.cut.applyRl({
          payout: {},
        });

        // Verify
        assertThat(replaceRl, eqMessage({}, ACCOUNT_PAGE_RL), "replaceRl");
        assertThat(Boolean(this.cut.profilePage), eq(true), "profile");
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyRl_ProfilePage_SameRlSamePage";
      private cut: AccountPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createAccountPage(false);

        // Execute
        this.cut.applyRl({
          profile: {},
        });

        // Verify
        assertThat(Boolean(this.cut.profilePage), eq(true), "profile");

        // Prepare
        let page = this.cut.profilePage;

        // Execute
        this.cut.applyRl({
          profile: {},
        });

        // Verify
        assertThat(this.cut.profilePage, eq(page), "profile page unchanged");
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyRl_PaymentPage_SameRlSamePage";
      private cut: AccountPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createAccountPage(false);

        // Execute
        this.cut.applyRl({
          payment: {},
        });

        // Verify
        assertThat(Boolean(this.cut.paymentPage), eq(true), "payment");

        // Prepare
        let page = this.cut.paymentPage;

        // Execute
        this.cut.applyRl({
          payment: {},
        });

        // Verify
        assertThat(this.cut.paymentPage, eq(page), "payment page unchanged");
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyRl_PayoutPage_SameRlSamePage";
      private cut: AccountPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createAccountPage(true);

        // Execute
        this.cut.applyRl({
          payout: {},
        });

        // Verify
        assertThat(Boolean(this.cut.payoutPage), eq(true), "payout");

        // Prepare
        let page = this.cut.payoutPage;

        // Execute
        this.cut.applyRl({
          payout: {},
        });

        // Verify
        assertThat(this.cut.payoutPage, eq(page), "payout page unchanged");
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyRl_StatementsPage_SameRlSamePage";
      private cut: AccountPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createAccountPage(false);

        // Execute
        this.cut.applyRl({
          statements: {},
        });

        // Verify
        assertThat(Boolean(this.cut.statementsPage), eq(true), "statements");

        // Prepare
        let page = this.cut.statementsPage;

        // Execute
        this.cut.applyRl({
          statements: {},
        });

        // Verify
        assertThat(
          this.cut.statementsPage,
          eq(page),
          "statements page unchanged",
        );
      }
    })(),
  ],
});
