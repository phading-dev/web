import path = require("path");
import { MenuItem } from "../../../common/menu_item/body";
import { AccountPage } from "./body";
import { PaymentMethodsPageMock } from "./payment_methods_page/body_mock";
import { ProfilePageMock } from "./profile_page/body_mock";
import { Page as ProfilePage } from "./profile_page/state";
import { SecurityPageMock } from "./security_page/body_mock";
import { Page as SecurityPage } from "./security_page/state";
import { AccountPageState, Page } from "./state";
import { UsageReportsPageMock } from "./usage_reports_page/body_mock";
import { Page as UsageReportsPage } from "./usage_reports_page/state";
import { E } from "@selfage/element/factory";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import "../../../common/normalize_body";

let menuBodyContainer: HTMLDivElement;

class NavigationTestCase implements TestCase {
  private cut: AccountPage;
  public constructor(
    public name: string,
    private initPage: Page,
    private getMenuItem: (accountPage: AccountPage) => MenuItem,
    private initPageActualFile: string,
    private initPageExpectedFile: string,
    private initPageDiffFile: string,
    private newStateToUpdate: AccountPageState,
    private updatedPageActualFile: string,
    private updatedPageExpectedFile: string,
    private updatedPageDiffFile: string
  ) {}
  public async execute() {
    // Prepare
    await setViewport(800, 600);
    this.cut = new AccountPage(
      (appendBodies, prependMenuBodies) =>
        new ProfilePageMock(appendBodies, prependMenuBodies),
      (appendBodies, prependMenuBodies) =>
        new SecurityPageMock(appendBodies, prependMenuBodies),
      (appendBodies, prependMenuBodies) =>
        new PaymentMethodsPageMock(appendBodies, prependMenuBodies),
      (appendBodies, prependMenuBodies) =>
        new UsageReportsPageMock(appendBodies, prependMenuBodies),
      (...bodies) => document.body.append(...bodies),
      (...bodies) => menuBodyContainer.prepend(...bodies),
      (...bodies) => menuBodyContainer.append(...bodies)
    );
    this.cut.updateState({
      page: this.initPage,
    });

    // Execute
    this.getMenuItem(this.cut).click();

    // Verify
    await asyncAssertScreenshot(
      this.initPageActualFile,
      this.initPageExpectedFile,
      this.initPageDiffFile
    );

    // Execute
    this.cut.updateState(this.newStateToUpdate);

    // Verify
    await asyncAssertScreenshot(
      this.updatedPageActualFile,
      this.updatedPageExpectedFile,
      this.updatedPageDiffFile
    );
  }
  public tearDown() {
    this.cut.remove();
  }
}

TEST_RUNNER.run({
  name: "AccountPageTest",
  environment: {
    setUp() {
      menuBodyContainer = E.div({
        style: `position: fixed; left: 0; top: 0`,
      });
      document.body.append(menuBodyContainer);
    },
    tearDown() {
      menuBodyContainer.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Default";
      private cut: AccountPage;
      public async execute() {
        // Prepare
        await setViewport(800, 600);
        this.cut = new AccountPage(
          (appendBodies, prependMenuBodies) =>
            new ProfilePageMock(appendBodies, prependMenuBodies),
          (appendBodies, prependMenuBodies) =>
            new SecurityPageMock(appendBodies, prependMenuBodies),
          (appendBodies, prependMenuBodies) =>
            new PaymentMethodsPageMock(appendBodies, prependMenuBodies),
          (appendBodies, prependMenuBodies) =>
            new UsageReportsPageMock(appendBodies, prependMenuBodies),
          (...bodies) => document.body.append(...bodies),
          (...bodies) => menuBodyContainer.prepend(...bodies),
          (...bodies) => menuBodyContainer.append(...bodies)
        );

        // Execute
        this.cut.updateState();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/account_page_default.png"),
          path.join(__dirname, "/golden/account_page_default.png"),
          path.join(__dirname, "/account_page_default_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new NavigationTestCase(
      "GoToAccount",
      Page.SECURITY,
      (accountPage) => accountPage.accountMenuItem,
      path.join(__dirname, "/account_page_go_to_account.png"),
      path.join(__dirname, "/golden/account_page_go_to_account.png"),
      path.join(__dirname, "/account_page_go_to_account_diff.png"),
      {
        page: Page.PROFILE,
        profilePageState: {
          page: ProfilePage.UpdateAvatar,
        },
      },
      path.join(__dirname, "/account_page_update_account.png"),
      path.join(__dirname, "/golden/account_page_update_account.png"),
      path.join(__dirname, "/account_page_update_account_diff.png")
    ),
    new NavigationTestCase(
      "GoToSecurtySettings",
      Page.PROFILE,
      (accountPage) => accountPage.securitySettingsMenuItem,
      path.join(__dirname, "/account_page_go_to_security_settings.png"),
      path.join(__dirname, "/golden/account_page_go_to_security_settings.png"),
      path.join(__dirname, "/account_page_go_to_security_settings_diff.png"),
      {
        page: Page.SECURITY,
        securityPageState: {
          page: SecurityPage.UpdatePassword,
        },
      },
      path.join(__dirname, "/account_page_update_security_settings.png"),
      path.join(__dirname, "/golden/account_page_update_security_settings.png"),
      path.join(__dirname, "/account_page_update_security_settings_diff.png")
    ),
    new NavigationTestCase(
      "GoToPaymentMethods",
      Page.PROFILE,
      (accountPage) => accountPage.paymentMethodsMenuItem,
      path.join(__dirname, "/account_page_go_to_payment_methods.png"),
      path.join(__dirname, "/golden/account_page_go_to_payment_methods.png"),
      path.join(__dirname, "/account_page_go_to_payment_methods_diff.png"),
      {
        page: Page.PAYMENT_METHODS,
        securityPageState: {
          page: SecurityPage.UpdatePassword,
        },
      },
      path.join(__dirname, "/account_page_update_payment_methods.png"),
      path.join(__dirname, "/golden/account_page_go_to_payment_methods.png"),
      path.join(__dirname, "/account_page_update_payment_methods_diff.png")
    ),
    new NavigationTestCase(
      "GoToUsageReports",
      Page.PROFILE,
      (accountPage) => accountPage.usageReportsMenuItem,
      path.join(__dirname, "/account_page_go_to_usage_reports.png"),
      path.join(__dirname, "/golden/account_page_go_to_usage_reports.png"),
      path.join(__dirname, "/account_page_go_to_usage_reports_diff.png"),
      {
        page: Page.USAGE_REPORTS,
        usageReportsPageState: {
          page: UsageReportsPage.CHOOSE,
        },
      },
      path.join(__dirname, "/account_page_update_usage_reports.png"),
      path.join(__dirname, "/golden/account_page_update_usage_reports.png"),
      path.join(__dirname, "/account_page_update_usage_reports_diff.png")
    ),
  ],
});
