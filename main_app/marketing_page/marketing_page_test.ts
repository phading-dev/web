import "../../dev/env";
import "../../common/normalize_body";
import path = require("path");
import { MarketingPage } from "./marketing_page";
import { AccountType } from "@phading/user_service_interface/account_type";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

TEST_RUNNER.run({
  name: "MarketingPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Render";
      private cut: MarketingPage;
      public async execute() {
        // Prepare
        await setViewport(600, 800);

        // Execute
        this.cut = new MarketingPage(() => new Date(100000000));
        this.cut.updateState({});
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/marketing_page_render.png"),
          path.join(__dirname, "/golden/marketing_page_render.png"),
          path.join(__dirname, "/marketing_page_render_diff.png"),
        );

        // Execute
        this.cut.publisherTabButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/marketing_page_publisher.png"),
          path.join(__dirname, "/golden/marketing_page_publisher.png"),
          path.join(__dirname, "/marketing_page_publisher_diff.png"),
        );

        // Execute
        this.cut.consumerTabButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/marketing_page_consumer.png"),
          path.join(__dirname, "/golden/marketing_page_render.png"),
          path.join(__dirname, "/marketing_page_consumer_diff.png"),
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
        this.cut.updateState({});
        let accountTypeCaptured: AccountType;
        this.cut.on("signIn", (accountType) => {
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
        this.cut.updateState({});
        let accountTypeCaptured: AccountType;
        this.cut.on("signIn", (accountType) => {
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
        this.cut.updateState({});
        let goToPricing = false;
        this.cut.on("pricing", () => {
          goToPricing = true;
        });

        // Execute
        this.cut.serviceFeesLink.val.click();

        // Verify
        assertThat(goToPricing, eq(true), "go to pricing");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
