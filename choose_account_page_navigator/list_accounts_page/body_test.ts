import userImage = require("./test_data/user_image.jpg");
import path = require("path");
import { LOCAL_SESSION_STORAGE } from "../../common/local_session_storage";
import { AccountItem, AddAccountItem } from "./account_item";
import { ListAccountsPage } from "./body";
import { AccountType } from "@phading/user_service_interface/account_type";
import {
  LIST_ACCOUNTS,
  ListAccountsResponse,
  SWITCH_ACCOUNT,
  SWITCH_ACCOUNT_REQUEST_BODY,
  SwitchAccountResponse,
} from "@phading/user_service_interface/self/frontend/interface";
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
import "../../common/normalize_body";

TEST_RUNNER.run({
  name: "ListAccountsPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_Scroll";
      private cut: ListAccountsPage;
      public async execute() {
        // Prepare
        await setViewport(600, 300);
        this.cut = new ListAccountsPage(
          LOCAL_SESSION_STORAGE,
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              return {
                accounts: [
                  {
                    accountId: "consumer 1",
                    accountType: AccountType.CONSUMER,
                    avatarSmallPath: userImage,
                    naturalName: "First Consumer",
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
        "MultipleAccounts_ChooseConsumer_AddConsumer_ChoosePublisher_AddPublisher";
      private cut: ListAccountsPage;
      public async execute() {
        // Prepare
        await setViewport(1200, 600);
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
                      avatarSmallPath: userImage,
                      naturalName: "First Consumer",
                    },
                    {
                      accountId: "consumer 2",
                      accountType: AccountType.CONSUMER,
                      avatarSmallPath: userImage,
                      naturalName:
                        "Second Consumer Second Consumer Second Consumer Second Consumer Second Consumer",
                    },
                    {
                      accountId: "consumer 3",
                      accountType: AccountType.CONSUMER,
                      avatarSmallPath: userImage,
                      naturalName: "Third Consumer",
                    },
                    {
                      accountId: "consumer 4",
                      accountType: AccountType.CONSUMER,
                      avatarSmallPath: userImage,
                      naturalName: "4th Consumer",
                    },
                    {
                      accountId: "consumer 5",
                      accountType: AccountType.CONSUMER,
                      avatarSmallPath: userImage,
                      naturalName: "5th Consumer",
                    },
                    {
                      accountId: "consumer 6",
                      accountType: AccountType.CONSUMER,
                      avatarSmallPath: userImage,
                      naturalName: "6th Consumer",
                    },
                    {
                      accountId: "publisher 1",
                      accountType: AccountType.PUBLISHER,
                      avatarSmallPath: userImage,
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
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_accounts_page_accounts.png"),
          path.join(__dirname, "/golden/list_accounts_page_accounts.png"),
          path.join(__dirname, "/list_accounts_page_accounts_diff.png"),
        );

        // Execute
        this.cut.consumerItems[1].click();
        await new Promise<void>((resolve) =>
          this.cut.once("switched", resolve),
        );

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
        let createConsumer = false;
        this.cut.on("createConsumer", () => (createConsumer = true));

        // Execute
        this.cut.addConsumerItem.val.click();

        // Verify
        assertThat(createConsumer, eq(true), "create consumer");

        // Prepare
        LOCAL_SESSION_STORAGE.clear();

        // Execute
        this.cut.publisherItems[0].click();
        await new Promise<void>((resolve) =>
          this.cut.once("switched", resolve),
        );

        // Verify
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              accountId: "publisher 1",
            },
            SWITCH_ACCOUNT_REQUEST_BODY,
          ),
          "switch to first publisher",
        );
        assertThat(
          LOCAL_SESSION_STORAGE.read(),
          eq("session 1"),
          "stored publisher session",
        );

        // Prepare
        let createPublisher = false;
        this.cut.on("createPublisher", () => (createPublisher = true));

        // Execute
        this.cut.addPublisherItem.val.click();

        // Verify
        assertThat(createPublisher, eq(true), "create publisher");
      }
      public tearDown() {
        this.cut.remove();
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

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_accounts_page_wide.png"),
          path.join(__dirname, "/golden/list_accounts_page_wide.png"),
          path.join(__dirname, "/list_accounts_page_wide_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
