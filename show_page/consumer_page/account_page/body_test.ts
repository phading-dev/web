import path = require("path");
import { AccountPage } from "./body";
import { PaymentMethodsPageMock } from "./payment_methods_page/body_mock";
import { ProfilePageMock } from "./profile_page/body_mock";
import { ACCOUNT_PAGE_STATE, AccountPageState, Page } from "./state";
import { UsageReportPageMock } from "./usage_report_page/body_mock";
import { Granularity, UsageReportPageState } from "./usage_report_page/state";
import { eqMessage } from "@selfage/message/test_matcher";
import {
  mouseMove,
  mouseWheel,
  setViewport,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat } from "@selfage/test_matcher";
import "../../../common/normalize_body";

TEST_RUNNER.run({
  name: "AccountPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Default";
      private cut: AccountPage;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        this.cut = new AccountPage(
          (appendBodies) => new PaymentMethodsPageMock(appendBodies),
          (appendBodies) => new ProfilePageMock(appendBodies),
          () => new UsageReportPageMock(),
        );
        this.cut.updateState();
        let newStateCaptured: AccountPageState;
        this.cut.on("newState", (newState) => (newStateCaptured = newState));

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_page_default.png"),
          path.join(__dirname, "/golden/account_page_default.png"),
          path.join(__dirname, "/account_page_default_diff.png"),
        );

        // Execute
        this.cut.paymentMethodsPageButton.val.click();

        // Verify
        assertThat(
          newStateCaptured,
          eqMessage(
            {
              page: Page.PAYMENT_METHODS,
            },
            ACCOUNT_PAGE_STATE,
          ),
          "go to payment methods page",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_page_payment_methods_page.png"),
          path.join(__dirname, "/golden/account_page_payment_methods_page.png"),
          path.join(__dirname, "/account_page_payment_methods_page_diff.png"),
        );

        // Execute
        this.cut.usageReportPageButton.val.click();

        // Verify
        assertThat(
          newStateCaptured,
          eqMessage(
            {
              page: Page.USAGE_REPORT,
            },
            ACCOUNT_PAGE_STATE,
          ),
          "go to usage report page",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_page_usage_report_page.png"),
          path.join(__dirname, "/golden/account_page_usage_report_page.png"),
          path.join(__dirname, "/account_page_usage_report_page_diff.png"),
        );

        // Execute
        this.cut.usageReportPage.emit("newState", {
          granularity: Granularity.MONTH,
        } as UsageReportPageState);

        // Verify
        assertThat(
          newStateCaptured,
          eqMessage(
            {
              page: Page.USAGE_REPORT,
              usageReport: {
                granularity: Granularity.MONTH,
              },
            },
            ACCOUNT_PAGE_STATE,
          ),
          "usage report update",
        );

        // Execute
        this.cut.profilePageButton.val.click();

        // Verify
        assertThat(
          newStateCaptured,
          eqMessage(
            {
              page: Page.PROFILE,
            },
            ACCOUNT_PAGE_STATE,
          ),
          "go to profile page",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_page_profile_page.png"),
          path.join(__dirname, "/golden/account_page_default.png"),
          path.join(__dirname, "/account_page_profile_page_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UpdateStateToPaymentMethods";
      private cut: AccountPage;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        this.cut = new AccountPage(
          (appendBodies) => new PaymentMethodsPageMock(appendBodies),
          (appendBodies) => new ProfilePageMock(appendBodies),
          () => new UsageReportPageMock(),
        );
        this.cut.updateState({
          page: Page.PAYMENT_METHODS,
        });

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/account_page_update_state_payment_methods_Page.png",
          ),
          path.join(
            __dirname,
            "/golden/account_page_update_state_payment_methods_Page.png",
          ),
          path.join(
            __dirname,
            "/account_page_update_state_payment_methods_Page_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Short_ScrollToBottom";
      private cut: AccountPage;
      public async execute() {
        // Prepare
        await setViewport(350, 500);
        this.cut = new AccountPage(
          (appendBodies) => new PaymentMethodsPageMock(appendBodies),
          (appendBodies) => new ProfilePageMock(appendBodies),
          () => new UsageReportPageMock(),
        );
        this.cut.updateState();

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_page_short.png"),
          path.join(__dirname, "/golden/account_page_short.png"),
          path.join(__dirname, "/account_page_short_diff.png"),
        );

        // Execute
        await mouseMove(1, 1, 1);
        await mouseWheel(100, 300);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_page_scroll_to_bottom.png"),
          path.join(__dirname, "/golden/account_page_scroll_to_bottom.png"),
          path.join(__dirname, "/account_page_scroll_to_bottom_diff.png"),
        );
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        this.cut.remove();
      }
    })(),
  ],
});
