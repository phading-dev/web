import path = require("path");
import { LOCAL_SESSION_STORAGE } from "../../common/local_session_storage";
import { ConsumerSelectionPage } from "./body";
import { ConsumerCreationPageMock } from "./consumer_creation_page/body_mock";
import { AccountType } from "@phading/user_service_interface/account_type";
import {
  LIST_OWNED_ACCOUNTS,
  LIST_OWNED_ACCOUNTS_REQUEST_BODY,
  ListOwnedAccountsResponse,
  SWITCH_ACCOUNT,
  SWITCH_ACCOUNT_REQUEST_BODY,
  SwitchAccountResponse,
} from "@phading/user_service_interface/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "../../common/normalize_body";

TEST_RUNNER.run({
  name: "ConsumerSelectionPageTest",
  cases: [
    new (class implements TestCase {
      public name = "SelectTheOnlyConsumer";
      private cut: ConsumerSelectionPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let listOwnedAccountsRequestCaptured: any;
        let switchAccountRequestCaptured: any;
        let userServiceClientMock = new (class extends WebServiceClient {
          public constructor() {
            super(undefined, undefined);
          }
          public async send(request: any): Promise<any> {
            if (request.descriptor === LIST_OWNED_ACCOUNTS) {
              listOwnedAccountsRequestCaptured = request;
              return {
                accounts: [
                  {
                    accountId: "user id",
                  },
                ],
              } as ListOwnedAccountsResponse;
            } else if (request.descriptor === SWITCH_ACCOUNT) {
              switchAccountRequestCaptured = request;
              return {
                signedSession: "new session",
              } as SwitchAccountResponse;
            } else {
              throw new Error("Unexpected.");
            }
          }
        })();

        // Execute
        this.cut = new ConsumerSelectionPage(
          () => new ConsumerCreationPageMock(),
          LOCAL_SESSION_STORAGE,
          userServiceClientMock,
          (...bodies) => document.body.append(...bodies)
        );
        await new Promise<void>((resolve) =>
          this.cut.once("selected", resolve)
        );

        // Verify
        assertThat(
          listOwnedAccountsRequestCaptured.body,
          eqMessage(
            {
              accountType: AccountType.CONSUMER,
            },
            LIST_OWNED_ACCOUNTS_REQUEST_BODY
          ),
          "ListOwnedAccounts request body"
        );
        assertThat(
          switchAccountRequestCaptured.body,
          eqMessage(
            {
              accountId: "user id",
            },
            SWITCH_ACCOUNT_REQUEST_BODY
          ),
          "SwitchAccounts request body"
        );
        assertThat(
          LOCAL_SESSION_STORAGE.read(),
          eq("new session"),
          "new session"
        );
      }
      public tearDown() {
        this.cut.remove();
        LOCAL_SESSION_STORAGE.clear();
      }
    })(),
    new (class implements TestCase {
      public name = "CreateConsumer";
      private cut: ConsumerSelectionPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let requestCaptured: any;
        let userServiceClientMock = new (class extends WebServiceClient {
          public constructor() {
            super(undefined, undefined);
          }
          public async send(request: any): Promise<any> {
            requestCaptured = request;
            return {
              accounts: [],
            } as ListOwnedAccountsResponse;
          }
        })();

        // Execute
        this.cut = new ConsumerSelectionPage(
          () => new ConsumerCreationPageMock(),
          LOCAL_SESSION_STORAGE,
          userServiceClientMock,
          (...bodies) => document.body.append(...bodies)
        );
        await new Promise<void>((resolve) =>
          this.cut.once("navigated", resolve)
        );

        // Verify
        assertThat(
          requestCaptured.descriptor,
          eq(LIST_OWNED_ACCOUNTS),
          "init request"
        );
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              accountType: AccountType.CONSUMER,
            },
            LIST_OWNED_ACCOUNTS_REQUEST_BODY
          ),
          "ListOwnedAccounts requesty body"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_selection_page_create.png"),
          path.join(__dirname, "/golden/consumer_selection_page_create.png"),
          path.join(__dirname, "/consumer_selection_page_create_diff.png")
        );

        // Prepare
        let selectedCaptured = false;
        this.cut.on("selected", () => (selectedCaptured = true));

        // Execute
        this.cut.consumerCreationPage.emit("created", "new session 2");

        // Verify
        assertThat(selectedCaptured, eq(true), "selected emitted");
        assertThat(
          LOCAL_SESSION_STORAGE.read(),
          eq("new session 2"),
          "new session"
        );
      }
      public tearDown() {
        this.cut.remove();
        LOCAL_SESSION_STORAGE.clear();
      }
    })(),
  ],
});
