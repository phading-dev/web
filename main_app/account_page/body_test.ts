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
  ACCOUNT_PAGE,
  AccountPage as AccountPageUrl,
} from "@phading/web_interface/main/account/page";
import { copyMessage } from "@selfage/message/copier";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

function createAccountPage() {
  let nowDate = new Date("2023-10-10T00:00:00Z");
  return new AccountPage(
    () => new PaymentPageMock(() => nowDate),
    () => new PayoutPageMock(() => nowDate),
    (appendBodies) => new ProfilePageMock(appendBodies),
    (canEarn) => new StatementsPageMock(() => nowDate, canEarn),
    (...bodies) => document.body.append(...bodies),
  );
}

TEST_RUNNER.run({
  name: "PublisherPageTest",
  cases: [
    new (class implements TestCase {
      public name = "NavigationCanNotEarn_SwitchAccount_SignOut";
      private cut: AccountPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createAccountPage();
        let newUrl: AccountPageUrl;
        this.cut.on("newUrl", (url) => {
          newUrl = url;
        });

        // Execute
        this.cut.applyUrl(false);

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
          newUrl,
          eqMessage(
            {
              payment: {},
            },
            ACCOUNT_PAGE,
          ),
          "payment",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_page_payment.png"),
          path.join(__dirname, "/golden/account_page_payment.png"),
          path.join(__dirname, "/account_page_payment_diff.png"),
        );

        // Execute
        this.cut.statementsButton.val.click();

        // Verify
        assertThat(
          newUrl,
          eqMessage(
            {
              statements: {},
            },
            ACCOUNT_PAGE,
          ),
          "statements",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_page_statements.png"),
          path.join(__dirname, "/golden/account_page_statements.png"),
          path.join(__dirname, "/account_page_statements_diff.png"),
        );

        // Execute
        this.cut.profileButton.val.click();

        // Verify
        assertThat(
          newUrl,
          eqMessage(
            {
              profile: {},
            },
            ACCOUNT_PAGE,
          ),
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
        let switchAccount = false;
        this.cut.on("switchAccount", () => {
          switchAccount = true;
        });

        // Execute
        this.cut.profilePage.emit("switchAccount");

        // Verify
        assertThat(switchAccount, eq(true), "switch account");

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
        this.cut = createAccountPage();
        let newUrl: AccountPageUrl;
        this.cut.on("newUrl", (url) => {
          newUrl = url;
        });

        // Execute
        this.cut.applyUrl(true);

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
          newUrl,
          eqMessage(
            {
              payout: {},
            },
            ACCOUNT_PAGE,
          ),
          "payout",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_page_payout_can_earn.png"),
          path.join(__dirname, "/golden/account_page_payout_can_earn.png"),
          path.join(__dirname, "/account_page_payout_can_earn_diff.png"),
        );

        // Execute
        this.cut.statementsButton.val.click();

        // Verify
        assertThat(
          newUrl,
          eqMessage(
            {
              statements: {},
            },
            ACCOUNT_PAGE,
          ),
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
      public name = "ApplyUrl_Empty";
      private cut: AccountPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createAccountPage();

        // Execute
        this.cut.applyUrl(false);

        // Verify
        assertThat(Boolean(this.cut.profilePage), eq(true), "profile");
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyUrl_InvalidPayoutUrl";
      private cut: AccountPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createAccountPage();
        let replaceUrl: AccountPageUrl;
        this.cut.on("replaceUrl", (url) => {
          replaceUrl = copyMessage(url, ACCOUNT_PAGE);
        });

        // Execute
        this.cut.applyUrl(false, {});

        // Verify
        assertThat(replaceUrl, eqMessage({}, ACCOUNT_PAGE), "replaceUrl");
        assertThat(Boolean(this.cut.profilePage), eq(true), "profile");
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyUrl_ProfilePage_SameUrlSamePage";
      private cut: AccountPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createAccountPage();

        // Execute
        this.cut.applyUrl(false, {
          profile: {},
        });

        // Verify
        assertThat(Boolean(this.cut.profilePage), eq(true), "profile");

        // Prepare
        let page = this.cut.profilePage;

        // Execute
        this.cut.applyUrl(false, {
          profile: {},
        });

        // Verify
        assertThat(this.cut.profilePage, eq(page), "profile page unchanged");
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyUrl_PaymentPage_SameUrlSamePage";
      private cut: AccountPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createAccountPage();

        // Execute
        this.cut.applyUrl(false, {
          payment: {},
        });

        // Verify
        assertThat(Boolean(this.cut.paymentPage), eq(true), "payment");

        // Prepare
        let page = this.cut.paymentPage;

        // Execute
        this.cut.applyUrl(false, {
          payment: {},
        });

        // Verify
        assertThat(this.cut.paymentPage, eq(page), "payment page unchanged");
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyUrl_PayoutPage_SameUrlSamePage";
      private cut: AccountPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createAccountPage();

        // Execute
        this.cut.applyUrl(true, {
          payout: {},
        });

        // Verify
        assertThat(Boolean(this.cut.payoutPage), eq(true), "payout");

        // Prepare
        let page = this.cut.payoutPage;

        // Execute
        this.cut.applyUrl(true, {
          payout: {},
        });

        // Verify
        assertThat(this.cut.payoutPage, eq(page), "payout page unchanged");
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyUrl_StatementsPage_SameUrlSamePage";
      private cut: AccountPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createAccountPage();

        // Execute
        this.cut.applyUrl(false, {
          statements: {},
        });

        // Verify
        assertThat(Boolean(this.cut.statementsPage), eq(true), "statements");

        // Prepare
        let page = this.cut.statementsPage;

        // Execute
        this.cut.applyUrl(false, {
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
