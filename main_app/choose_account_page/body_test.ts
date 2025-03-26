import "../../common/normalize_body";
import path = require("path");
import { ChooseAccountPage } from "./body";
import { CreateAccountPageMock } from "./create_account_page/body_mock";
import { ListAccountsPageMock } from "./list_accounts_page/body_mock";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

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
          () => new CreateAccountPageMock(),
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
        this.cut.listAccountsPage.emit("createAccount");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/choose_account_page_create_account.png"),
          path.join(
            __dirname,
            "/golden/choose_account_page_create_account.png",
          ),
          path.join(__dirname, "/choose_account_page_create_account_diff.png"),
        );

        // Prepare
        chosen = false;

        // Execute
        this.cut.createAccountPage.emit("created");

        // Verify
        assertThat(chosen, eq(true), "switched");

        // Execute
        this.cut.createAccountPage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/choose_account_page_back_from_create_account.png",
          ),
          path.join(__dirname, "/golden/choose_account_page_default.png"),
          path.join(
            __dirname,
            "/choose_account_page_back_from_create_account_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
