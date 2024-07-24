import path = require("path");
import { ChooseAccountPage } from "./body";
import { CreateAccountPageMock } from "./create_account_page/body_mock";
import { ListAccountsPageMock } from "./list_accounts_page/body_mock";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import "../common/normalize_body";

TEST_RUNNER.run({
  name: "ChooseAccountPage",
  cases: [
    new (class implements TestCase {
      public name = "Default";
      private cut: ChooseAccountPage;
      public async execute() {
        // Prepare
        await setViewport(800, 600);

        // Execute
        this.cut = new ChooseAccountPage(
          (accountType) => new CreateAccountPageMock(accountType),
          () => new ListAccountsPageMock(),
          (...bodies) => document.body.append(...bodies),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/choose_account_page_default.png"),
          path.join(__dirname, "/golden/choose_account_page_default.png"),
          path.join(__dirname, "/choose_account_page_default_diff.png"),
        );

        // Prepare
        let chosen = false;
        this.cut.on("chosen", () => (chosen = true));

        // Execute
        this.cut.listAccountsPage.emit("switched");

        // Verify
        assertThat(chosen, eq(true), "switched");

        // Execute
        this.cut.listAccountsPage.emit("createConsumer");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/choose_account_page_create_consumer.png"),
          path.join(
            __dirname,
            "/golden/choose_account_page_create_consumer.png",
          ),
          path.join(__dirname, "/choose_account_page_create_consumer_diff.png"),
        );

        // Prepare
        chosen = false;

        // Execute
        this.cut.createConsumerPage.emit("created");

        // Verify
        assertThat(chosen, eq(true), "switched");

        // Execute
        this.cut.createConsumerPage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/choose_account_page_back_from_create_consumer.png",
          ),
          path.join(__dirname, "/golden/choose_account_page_default.png"),
          path.join(
            __dirname,
            "/choose_account_page_back_from_create_consumer_diff.png",
          ),
        );

        // Execute
        this.cut.listAccountsPage.emit("createPublisher");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/choose_account_page_create_publisher.png"),
          path.join(
            __dirname,
            "/golden/choose_account_page_create_publisher.png",
          ),
          path.join(
            __dirname,
            "/choose_account_page_create_publisher_diff.png",
          ),
        );

        // Prepare
        chosen = false;

        // Execute
        this.cut.createPublisherPage.emit("created");

        // Verify
        assertThat(chosen, eq(true), "switched");

        // Execute
        this.cut.createPublisherPage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/choose_account_page_back_from_create_publisher.png",
          ),
          path.join(__dirname, "/golden/choose_account_page_default.png"),
          path.join(
            __dirname,
            "/choose_account_page_back_from_create_publisher_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
