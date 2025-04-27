import userImage = require("./test_data/user_image.jpg");
import path = require("path");
import { LOCAL_SESSION_STORAGE } from "../../../common/local_session_storage";
import { normalizeBody } from "../../../common/normalize_body";
import {
  setDesktopView,
  setPhoneView,
  setTabletView,
} from "../../../common/view_port";
import { AccountItem, AddAccountItem } from "./account_item";
import { ListAccountsPage } from "./body";
import { AccountType } from "@phading/user_service_interface/account_type";
import {
  LIST_ACCOUNTS,
  ListAccountsResponse,
  SWITCH_ACCOUNT,
  SWITCH_ACCOUNT_REQUEST_BODY,
  SwitchAccountResponse,
} from "@phading/user_service_interface/web/self/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import {
  mouseMove,
  mouseWheel,
  setViewport,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "ListAccountsPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_Scroll";
      private cut: ListAccountsPage;
      public async execute() {
        // Prepare
        await setPhoneView();
        this.cut = new ListAccountsPage(
          LOCAL_SESSION_STORAGE,
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              return {
                accounts: [
                  {
                    accountId: "consumer 1",
                    accountType: AccountType.CONSUMER,
                    avatarSmallUrl: userImage,
                    naturalName: "First Consumer",
                  },
                  {
                    accountId: "publisher 1",
                    accountType: AccountType.PUBLISHER,
                    avatarSmallUrl: userImage,
                    naturalName: "First Publisher",
                  },
                ],
              } as ListAccountsResponse;
            }
          })(),
          AccountItem.create,
          AddAccountItem.create,
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
        await mouseMove(100, 100, 1);
        await mouseWheel(0, 600);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_accounts_page_scrolled.png"),
          path.join(__dirname, "/golden/list_accounts_page_scrolled.png"),
          path.join(__dirname, "/list_accounts_page_scrolled_diff.png"),
        );
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        this.cut.remove();
        // Force reflow to reset scrolling.
        document.body.clientHeight;
      }
    })(),
    new (class implements TestCase {
      public name =
        "MultipleAccountsWithPreSelectedAccount_ChooseConsumer_AddConsumer_ChoosePublisher_AddPublisher";
      private cut: ListAccountsPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let requestCaptured: any;
        this.cut = new ListAccountsPage(
          LOCAL_SESSION_STORAGE,
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              requestCaptured = request;
              if (request.descriptor === LIST_ACCOUNTS) {
                return {
                  accounts: [
                    {
                      accountId: "consumer 1",
                      accountType: AccountType.CONSUMER,
                      avatarSmallUrl: userImage,
                      naturalName: "First Consumer",
                    },
                    {
                      accountId: "consumer 2",
                      accountType: AccountType.CONSUMER,
                      avatarSmallUrl: userImage,
                      naturalName:
                        "Second Consumer Second Consumer Second Consumer Second Consumer Second Consumer",
                    },
                    {
                      accountId: "consumer 3",
                      accountType: AccountType.CONSUMER,
                      avatarSmallUrl: userImage,
                      naturalName: "Third Consumer",
                    },
                    {
                      accountId: "consumer 4",
                      accountType: AccountType.CONSUMER,
                      avatarSmallUrl: userImage,
                      naturalName: "4th Consumer",
                    },
                    {
                      accountId: "consumer 5",
                      accountType: AccountType.CONSUMER,
                      avatarSmallUrl: userImage,
                      naturalName: "5th Consumer",
                    },
                    {
                      accountId: "consumer 6",
                      accountType: AccountType.CONSUMER,
                      avatarSmallUrl: userImage,
                      naturalName: "6th Consumer",
                    },
                    {
                      accountId: "publisher 1",
                      accountType: AccountType.PUBLISHER,
                      avatarSmallUrl: userImage,
                      naturalName: "First Publisher",
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
          AccountItem.create,
          AddAccountItem.create,
          "consumer 2",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_accounts_page_accounts.png"),
          path.join(__dirname, "/golden/list_accounts_page_accounts.png"),
          path.join(__dirname, "/list_accounts_page_accounts_diff.png"),
        );

        // Execute
        this.cut.accountItems[1].click();
        await new Promise<void>((resolve) => this.cut.once("chosen", resolve));

        // Verify
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              accountId: "consumer 2",
            },
            SWITCH_ACCOUNT_REQUEST_BODY,
          ),
          "switch to second consumer",
        );
        assertThat(
          LOCAL_SESSION_STORAGE.read(),
          eq("session 1"),
          "stored consumer session",
        );

        // Prepare
        let createAccount = false;
        this.cut.on("createAccount", () => (createAccount = true));

        // Execute
        this.cut.addAccountItem.val.click();

        // Verify
        assertThat(createAccount, eq(true), "create account");
      }
      public tearDown() {
        this.cut.remove();
        LOCAL_SESSION_STORAGE.clear();
      }
    })(),
    new (class implements TestCase {
      public name = "PreSelectedAccountNotFound";
      private cut: ListAccountsPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = new ListAccountsPage(
          LOCAL_SESSION_STORAGE,
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              if (request.descriptor === LIST_ACCOUNTS) {
                return {
                  accounts: [
                    {
                      accountId: "consumer 1",
                      accountType: AccountType.CONSUMER,
                      avatarSmallUrl: userImage,
                      naturalName: "First Consumer",
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
          AccountItem.create,
          AddAccountItem.create,
          "consumer 2",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_accounts_account_not_found.png"),
          path.join(__dirname, "/golden/list_accounts_account_not_found.png"),
          path.join(__dirname, "/list_accounts_account_not_found_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
        LOCAL_SESSION_STORAGE.clear();
      }
    })(),
    new (class implements TestCase {
      public name = "SuperWide";
      private cut: ListAccountsPage;
      public async execute() {
        // Prepare
        await setViewport(2200, 600);
        this.cut = new ListAccountsPage(
          LOCAL_SESSION_STORAGE,
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              return {
                accounts: [],
              } as ListAccountsResponse;
            }
          })(),
          AccountItem.create,
          AddAccountItem.create,
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_accounts_page_wide.png"),
          path.join(__dirname, "/golden/list_accounts_page_wide.png"),
          path.join(__dirname, "/list_accounts_page_wide_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
        LOCAL_SESSION_STORAGE.clear();
      }
    })(),
    new (class implements TestCase {
      public name = "SignOut";
      private cut: ListAccountsPage;
      public async execute() {
        // Prepare
        this.cut = new ListAccountsPage(
          LOCAL_SESSION_STORAGE,
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              return {
                accounts: [],
              } as ListAccountsResponse;
            }
          })(),
          AccountItem.create,
          AddAccountItem.create,
        );
        let signedOut = false;
        this.cut.once("signOut", () => (signedOut = true));

        // Execute
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        this.cut.signOutButton.val.click();

        // Verify
        assertThat(signedOut, eq(true), "sign out button clicked");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
