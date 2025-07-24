import userImage = require("../common/test_data/user_image.jpg");
import path = require("path");
import { LOCAL_SESSION_STORAGE } from "../../../common/local_session_storage";
import { normalizeBody } from "../../../common/normalize_body";
import { setDesktopView, setPhoneView } from "../../../common/view_port";
import { ListAccountsPage } from "./body";
import { AccountType } from "@phading/user_service_interface/account_type";
import {
  LIST_ACCOUNTS,
  ListAccountsResponse,
  SWITCH_ACCOUNT,
  SwitchAccountResponse,
} from "@phading/user_service_interface/web/self/interface";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "ListAccountsPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_Scroll_SwitchAccount_CreateAccount_SignOut";
      private cut: ListAccountsPage;
      public async execute() {
        // Prepare
        await setPhoneView();
        this.cut = new ListAccountsPage(
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              return {
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
                  {
                    accountId: "consumer 2",
                    accountType: AccountType.CONSUMER,
                    avatarLargeUrl: userImage,
                    name: "Second Consumer",
                  },
                  {
                    accountId: "publisher 2",
                    accountType: AccountType.PUBLISHER,
                    avatarLargeUrl: userImage,
                    name: "Second Publisher",
                  },
                ],
              } as ListAccountsResponse;
            }
          })(),
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_accounts_page_default.png"),
          path.join(__dirname, "/golden/list_accounts_page_default.png"),
          path.join(__dirname, "/list_accounts_page_default_diff.png"),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_accounts_page_scrolled.png"),
          path.join(__dirname, "/golden/list_accounts_page_scrolled.png"),
          path.join(__dirname, "/list_accounts_page_scrolled_diff.png"),
        );

        // Prepare
        let switchAccountId: string;
        this.cut.on("switch", (accountId: string) => {
          switchAccountId = accountId;
        });

        // Execute
        this.cut.accountItems[0].click();

        // Verify
        assertThat(
          switchAccountId,
          eq("consumer 1"),
          "switch to first consumer",
        );

        // Prepare
        switchAccountId = undefined;

        // Execute
        this.cut.accountItems[1].click();

        // Verify
        assertThat(
          switchAccountId,
          eq("publisher 1"),
          "switch to first publisher",
        );

        // Prepare
        let createAccount = false;
        this.cut.on("create", () => (createAccount = true));

        // Execute
        this.cut.createAccountButton.val.click();

        // Verify
        assertThat(createAccount, eq(true), "create account");

        // Prepare
        let signedOut = false;
        this.cut.once("signOut", () => (signedOut = true));

        // Execute
        this.cut.signOutButton.val.click();

        // Verify
        assertThat(signedOut, eq(true), "sign out");
      }
      public async tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "MultipleAccountsWithError";
      private cut: ListAccountsPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        this.cut = new ListAccountsPage(
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              if (request.descriptor === LIST_ACCOUNTS) {
                return {
                  accounts: [
                    {
                      accountId: "consumer 1",
                      accountType: AccountType.CONSUMER,
                      avatarLargeUrl: userImage,
                      name: "First Consumer",
                    },
                    {
                      accountId: "consumer 2",
                      accountType: AccountType.CONSUMER,
                      avatarLargeUrl: userImage,
                      name:
                        "Second Consumer Second Consumer Second Consumer Second Consumer Second Consumer",
                    },
                    {
                      accountId: "consumer 3",
                      accountType: AccountType.CONSUMER,
                      avatarLargeUrl: userImage,
                      name: "Third Consumer",
                    },
                    {
                      accountId: "consumer 4",
                      accountType: AccountType.CONSUMER,
                      avatarLargeUrl: userImage,
                      name: "4th Consumer",
                    },
                    {
                      accountId: "consumer 5",
                      accountType: AccountType.CONSUMER,
                      avatarLargeUrl: userImage,
                      name: "5th Consumer",
                    },
                    {
                      accountId: "consumer 6",
                      accountType: AccountType.CONSUMER,
                      avatarLargeUrl: userImage,
                      name: "6th Consumer",
                    },
                    {
                      accountId: "publisher 1",
                      accountType: AccountType.PUBLISHER,
                      avatarLargeUrl: userImage,
                      name: "First Publisher",
                    },
                    {
                      accountId: "publisher 2",
                      accountType: AccountType.PUBLISHER,
                      avatarLargeUrl: userImage,
                      name: "Second Publisher",
                    },
                    {
                      accountId: "publisher 3",
                      accountType: AccountType.PUBLISHER,
                      avatarLargeUrl: userImage,
                      name: "Third Publisher",
                    },
                    {
                      accountId: "publisher 4",
                      accountType: AccountType.PUBLISHER,
                      avatarLargeUrl: userImage,
                      name: "4th Publisher",
                    },
                  ],
                } as ListAccountsResponse;
              } else if (request.descriptor === SWITCH_ACCOUNT) {
                return {
                  signedSession: "session 1",
                } as SwitchAccountResponse;
              }
            }
          })(),
          "Failed to do something",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_accounts_page_accounts_and_error.png"),
          path.join(
            __dirname,
            "/golden/list_accounts_page_accounts_and_error.png",
          ),
          path.join(
            __dirname,
            "/list_accounts_page_accounts_and_error_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
        LOCAL_SESSION_STORAGE.clear();
      }
    })(),
  ],
});
