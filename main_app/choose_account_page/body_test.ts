import path = require("path");
import { normalizeBody } from "../../common/normalize_body";
import { setTabletView } from "../../common/view_port";
import { ChooseAccountPage } from "./body";
import { CreateAccountPage } from "./create_account_page/body";
import { ListAccountsPageMock } from "./list_accounts_page/body_mock";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "ChooseAccountPage",
  cases: [
    new (class implements TestCase {
      public name = "Navigation";
      private cut: ChooseAccountPage;
      public async execute() {
        // Prepare
        await setTabletView();

        // Execute
        this.cut = new ChooseAccountPage(
          () => new CreateAccountPage(undefined, undefined),
          (preSelectedAccountId) =>
            new ListAccountsPageMock(preSelectedAccountId),
          (...bodies) => document.body.append(...bodies),
          "consumer 1",
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/choose_account_page_list_preselected.png"),
          path.join(
            __dirname,
            "/golden/choose_account_page_list_preselected.png",
          ),
          path.join(
            __dirname,
            "/choose_account_page_list_preselected_diff.png",
          ),
        );

        // Prepare
        let choose = false;
        this.cut.on("choose", () => (choose = true));

        // Execute
        this.cut.listAccountsPage.emit("choose");

        // Verify
        assertThat(choose, eq(true), "choose");

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
        choose = false;

        // Execute
        this.cut.createAccountPage.emit("choose");

        // Verify
        assertThat(choose, eq(true), "choose");

        // Execute
        this.cut.createAccountPage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/choose_account_page_list.png"),
          path.join(__dirname, "/golden/choose_account_page_list.png"),
          path.join(__dirname, "/choose_account_page_list_diff.png"),
        );

        // Prepare
        let signOut = false;
        this.cut.on("signOut", () => (signOut = true));

        // Execute
        this.cut.listAccountsPage.emit("signOut");

        // Verify
        assertThat(signOut, eq(true), "signOut");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
