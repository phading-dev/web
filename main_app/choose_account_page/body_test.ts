import userImage = require("./common/test_data/user_image.jpg");
import path = require("path");
import { normalizeBody } from "../../common/normalize_body";
import { setTabletView } from "../../common/view_port";
import { ChooseAccountPage } from "./body";
import { CreateAccountPage } from "./create_account_page/body";
import { ListAccountsPage } from "./list_accounts_page/body";
import { SwitchAccountPage } from "./switch_account_page/body";
import { AccountType } from "@phading/user_service_interface/account_type";
import {
  CREATE_ACCOUNT,
  CreateAccountResponse,
  LIST_ACCOUNTS,
  ListAccountsResponse,
  SWITCH_ACCOUNT,
  SwitchAccountResponse,
} from "@phading/user_service_interface/web/self/interface";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

class ChooseAccountServiceClientMock extends WebServiceClientMock {
  public createResponse: CreateAccountResponse;
  public listResponse: ListAccountsResponse;
  public switchResolveFn: (response: SwitchAccountResponse) => void;
  public switchRejectFn: (error: Error) => void;

  public async send(request: ClientRequestInterface<any>): Promise<any> {
    if (request.descriptor === LIST_ACCOUNTS) {
      return this.listResponse;
    } else if (request.descriptor === SWITCH_ACCOUNT) {
      let response = await new Promise<SwitchAccountResponse>(
        (resolve, rejectFn) => {
          this.switchResolveFn = resolve;
          this.switchRejectFn = rejectFn;
        },
      );
      return response;
    } else if (request.descriptor === CREATE_ACCOUNT) {
      return this.createResponse;
    }
  }
}

function createSwitchAccountPage(
  serviceClientMock: WebServiceClientMock,
  accountId?: string,
): ChooseAccountPage {
  return new ChooseAccountPage(
    () => new CreateAccountPage(serviceClientMock),
    (error) => new ListAccountsPage(serviceClientMock, error),
    (accountId) => new SwitchAccountPage(serviceClientMock, accountId, false),
    (...bodies) => document.body.append(...bodies),
    accountId,
  );
}

TEST_RUNNER.run({
  name: "ChooseAccountPage",
  cases: [
    new (class implements TestCase {
      public name = "NavigationBetweenCreateAndList";
      private cut: ChooseAccountPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new ChooseAccountServiceClientMock();
        serviceClientMock.listResponse = {
          accounts: [
            {
              accountId: "consumer 1",
              accountType: AccountType.CONSUMER,
              avatarLargeUrl: userImage,
              name: "First Consumer",
            },
            {
              accountId: "publisher 1",
              accountType: AccountType.PUBLISHER,
              avatarLargeUrl: userImage,
              name: "First Publisher",
            },
          ],
        };

        // Execute
        this.cut = createSwitchAccountPage(serviceClientMock);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/choose_account_page_list.png"),
          path.join(__dirname, "/golden/choose_account_page_list.png"),
          path.join(__dirname, "/choose_account_page_list_diff.png"),
        );

        // Execute
        this.cut.listAccountsPage.createAccountButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/choose_account_page_create.png"),
          path.join(__dirname, "/golden/choose_account_page_create.png"),
          path.join(__dirname, "/choose_account_page_create_diff.png"),
        );

        // Prepare
        serviceClientMock.createResponse = {
          signedSession: "new session 1",
        };
        let signedSession: string;
        this.cut.on("choose", (session) => {
          signedSession = session;
        });

        // Execute
        this.cut.createAccountPage.accountNameInput.val.value = "New Consumer";
        this.cut.createAccountPage.accountNameInput.val.dispatchInput();
        this.cut.createAccountPage.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) =>
          this.cut.createAccountPage.once("chosen", resolve),
        );

        // Verify
        assertThat(signedSession, eq("new session 1"), "signedSession");

        // Execute
        this.cut.createAccountPage.inputFormPage.clickBackButton();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/choose_account_page_list_after_create.png"),
          path.join(__dirname, "/golden/choose_account_page_list.png"),
          path.join(
            __dirname,
            "/choose_account_page_list_after_create_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "NavigationBetweenSwitchAndList";
      private cut: ChooseAccountPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new ChooseAccountServiceClientMock();
        serviceClientMock.listResponse = {
          accounts: [
            {
              accountId: "consumer 1",
              accountType: AccountType.CONSUMER,
              avatarLargeUrl: userImage,
              name: "First Consumer",
            },
            {
              accountId: "publisher 1",
              accountType: AccountType.PUBLISHER,
              avatarLargeUrl: userImage,
              name: "First Publisher",
            },
          ],
        };

        // Execute
        this.cut = createSwitchAccountPage(serviceClientMock, "consumer 2");

        // Verify
        assertThat(
          this.cut.switchAccountPage.accountId,
          eq("consumer 2"),
          "switchAccountPage.accountId",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/choose_account_page_switching.png"),
          path.join(__dirname, "/golden/choose_account_page_switching.png"),
          path.join(__dirname, "/choose_account_page_switching_diff.png"),
        );

        // Execute
        serviceClientMock.switchResolveFn({
          notFound: true,
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/choose_account_page_list_not_found.png"),
          path.join(
            __dirname,
            "/golden/choose_account_page_list_not_found.png",
          ),
          path.join(__dirname, "/choose_account_page_list_not_found_diff.png"),
        );

        // Execute
        this.cut.listAccountsPage.accountItems[0].click();

        // Verify
        assertThat(
          this.cut.switchAccountPage.accountId,
          eq("consumer 1"),
          "switchAccountPage.accountId 2",
        );

        // Execute
        serviceClientMock.switchRejectFn(new Error("Fake error"));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/choose_account_page_list_error.png"),
          path.join(__dirname, "/golden/choose_account_page_list_error.png"),
          path.join(__dirname, "/choose_account_page_list_error_diff.png"),
        );

        // Execute
        this.cut.listAccountsPage.accountItems[1].click();

        // Verify
        assertThat(
          this.cut.switchAccountPage.accountId,
          eq("publisher 1"),
          "switchAccountPage.accountId 3",
        );

        // Execute
        serviceClientMock.switchResolveFn({
          signedSession: "new session 1",
        });

        // Verify
        let signedSession = await new Promise<string>((resolve) =>
          this.cut.once("choose", (session) => resolve(session)),
        );
        assertThat(
          signedSession,
          eq("new session 1"),
          "signedSession after switching",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
