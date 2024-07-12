import path = require("path");
import { LOCAL_SESSION_STORAGE } from "../../common/local_session_storage";
import { CreateAccountPage } from "./body";
import { AccountType } from "@phading/user_service_interface/account_type";
import {
  CREATE_ACCOUNT,
  CREATE_ACCOUNT_REQUEST_BODY,
  CreateAccountResponse,
} from "@phading/user_service_interface/self/frontend/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";
import "../../common/normalize_body";

function createLongString(length: number): string {
  let characters = [];
  for (let i = 0; i < length; i++) {
    characters.push("a");
  }
  return characters.join("");
}

TEST_RUNNER.run({
  name: "CreateAccountPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Consumer_NameTooLong_NameValid_CreateError_Created";
      private cut: CreateAccountPage;
      public async execute() {
        // Prepare
        await setViewport(800, 600);
        let requestCaptured: any;
        let error: Error;
        let response: CreateAccountResponse;
        this.cut = new CreateAccountPage(
          LOCAL_SESSION_STORAGE,
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              requestCaptured = request;
              if (error) {
                throw error;
              } else {
                return response;
              }
            }
          })(),
          AccountType.CONSUMER,
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/create_account_page_consumer.png"),
          path.join(__dirname, "/golden/create_account_page_consumer.png"),
          path.join(__dirname, "/create_account_page_consumer_diff.png"),
        );

        // Execute
        this.cut.naturalNameInput.val.value = createLongString(120);
        this.cut.naturalNameInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/create_account_page_consumer_name_too_long.png",
          ),
          path.join(
            __dirname,
            "/golden/create_account_page_consumer_name_too_long.png",
          ),
          path.join(
            __dirname,
            "/create_account_page_consumer_name_too_long_diff.png",
          ),
        );

        // Execute
        this.cut.naturalNameInput.val.value = "First Second";
        this.cut.naturalNameInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/create_account_page_consumer_valid_name.png"),
          path.join(
            __dirname,
            "/golden/create_account_page_consumer_valid_name.png",
          ),
          path.join(
            __dirname,
            "/create_account_page_consumer_valid_name_diff.png",
          ),
        );

        // Prepare
        error = new Error("Fake error");

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) =>
          this.cut.once("createError", resolve),
        );

        // Verify
        assertThat(requestCaptured.descriptor, eq(CREATE_ACCOUNT), "service");
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              accountType: AccountType.CONSUMER,
              naturalName: "First Second",
            },
            CREATE_ACCOUNT_REQUEST_BODY,
          ),
          "request body",
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/create_account_page_consumer_create_failed.png",
          ),
          path.join(
            __dirname,
            "/golden/create_account_page_consumer_create_failed.png",
          ),
          path.join(
            __dirname,
            "/create_account_page_consumer_create_failed_diff.png",
          ),
        );

        // Prepare
        error = undefined;
        response = {
          signedSession: "session 1",
        };

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) => this.cut.once("created", resolve));

        // Verify
        assertThat(
          LOCAL_SESSION_STORAGE.read(),
          eq("session 1"),
          "stored session",
        );

        // Prepare
        let back = false;
        this.cut.on("back", () => (back = true));

        // Execute
        this.cut.inputFormPage.clickBackButton();

        // Verify
        assertThat(back, eq(true), "went back");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Publisher_Created";
      private cut: CreateAccountPage;
      public async execute() {
        // Prepare
        await setViewport(800, 600);
        let requestCaptured: any;
        this.cut = new CreateAccountPage(
          LOCAL_SESSION_STORAGE,
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              requestCaptured = request;
              return {
                signedSession: "session 1",
              } as CreateAccountResponse;
            }
          })(),
          AccountType.PUBLISHER,
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/create_account_page_publisher.png"),
          path.join(__dirname, "/golden/create_account_page_publisher.png"),
          path.join(__dirname, "/create_account_page_publisher_diff.png"),
        );

        // Execute
        this.cut.naturalNameInput.val.value = "First Second";
        this.cut.naturalNameInput.val.dispatchInput();
        // Wait for validation.
        await new Promise<void>((resolve) => setTimeout(resolve));
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) => this.cut.once("created", resolve));

        // Verify
        assertThat(requestCaptured.descriptor, eq(CREATE_ACCOUNT), "service");
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              accountType: AccountType.PUBLISHER,
              naturalName: "First Second",
            },
            CREATE_ACCOUNT_REQUEST_BODY,
          ),
          "request body",
        );
        assertThat(
          LOCAL_SESSION_STORAGE.read(),
          eq("session 1"),
          "stored session",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
