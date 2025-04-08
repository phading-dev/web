import "../dev/env";
import "../common/normalize_body";
import path = require("path");
import {
  setDesktopView,
  setPhoneView,
  setTabletView,
} from "../common/view_port";
import { MarketingPage } from "./body";
import { AccountType } from "@phading/user_service_interface/account_type";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

TEST_RUNNER.run({
  name: "MarketingPageTest",
  cases: [
    new (class implements TestCase {
      public name = "PhoneView";
      private cut: MarketingPage;
      public async execute() {
        // Prepare
        await setPhoneView();

        // Execute
        this.cut = new MarketingPage(() => new Date(100000000));
        this.cut.applyUrl({});
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/marketing_page_phone.png"),
          path.join(__dirname, "/golden/marketing_page_phone.png"),
          path.join(__dirname, "/marketing_page_phone_diff.png"),
        );

        // Execute
        this.cut.publisherTabButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/marketing_page_phone_publisher.png"),
          path.join(__dirname, "/golden/marketing_page_phone_publisher.png"),
          path.join(__dirname, "/marketing_page_phone_publisher_diff.png"),
        );

        // Execute
        this.cut.consumerTabButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/marketing_page_consumer.png"),
          path.join(__dirname, "/golden/marketing_page_phone.png"),
          path.join(__dirname, "/marketing_page_consumer_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TabletView";
      private cut: MarketingPage;
      public async execute() {
        // Prepare
        await setTabletView();

        // Execute
        this.cut = new MarketingPage(() => new Date(100000000));
        this.cut.applyUrl({});
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/marketing_page_tablet.png"),
          path.join(__dirname, "/golden/marketing_page_tablet.png"),
          path.join(__dirname, "/marketing_page_tablet_diff.png"),
        );

        // Execute
        this.cut.publisherTabButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/marketing_page_tablet_publisher.png"),
          path.join(__dirname, "/golden/marketing_page_tablet_publisher.png"),
          path.join(__dirname, "/marketing_page_tablet_publisher_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "DesktopView";
      private cut: MarketingPage;
      public async execute() {
        // Prepare
        await setDesktopView();

        // Execute
        this.cut = new MarketingPage(() => new Date(100000000));
        this.cut.applyUrl({});
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/marketing_page_desktop.png"),
          path.join(__dirname, "/golden/marketing_page_desktop.png"),
          path.join(__dirname, "/marketing_page_desktop_diff.png"),
        );

        // Execute
        this.cut.publisherTabButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/marketing_page_desktop_publisher.png"),
          path.join(__dirname, "/golden/marketing_page_desktop_publisher.png"),
          path.join(__dirname, "/marketing_page_desktop_publisher_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ConsumerCta";
      private cut: MarketingPage;
      public async execute() {
        // Prepare
        this.cut = new MarketingPage(() => new Date(100000000));
        this.cut.applyUrl({});
        let accountTypeCaptured: AccountType;
        this.cut.on("signUp", (accountType) => {
          accountTypeCaptured = accountType;
        });

        // Execute
        this.cut.consumerSignInButton.val.click();

        // Verify
        assertThat(
          accountTypeCaptured,
          eq(AccountType.CONSUMER),
          "account type",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "PublisherCta";
      private cut: MarketingPage;
      public async execute() {
        // Prepare
        this.cut = new MarketingPage(() => new Date(100000000));
        this.cut.applyUrl({});
        let accountTypeCaptured: AccountType;
        this.cut.on("signUp", (accountType) => {
          accountTypeCaptured = accountType;
        });

        // Execute
        this.cut.publisherSignInButton.val.click();

        // Verify
        assertThat(
          accountTypeCaptured,
          eq(AccountType.PUBLISHER),
          "account type",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ServiceFeeLink";
      private cut: MarketingPage;
      public async execute() {
        // Prepare
        this.cut = new MarketingPage(() => new Date(100000000));
        this.cut.applyUrl({});
        let goToServiceFee = false;
        this.cut.on("goToServiceFee", () => {
          goToServiceFee = true;
        });

        // Execute
        this.cut.serviceFeesLink.val.click();

        // Verify
        assertThat(goToServiceFee, eq(true), "go to service fee");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
