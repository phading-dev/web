import path = require("path");
import { ConsumerCreationPage } from "./body";
import {
  CREATE_ACCOUNT,
  CREATE_ACCOUNT_REQUEST_BODY,
  CreateAccountResponse,
} from "@phading/user_service_interface/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "../../../common/normalize_body";
import { AccountType } from "@phading/user_service_interface/account_type";

TEST_RUNNER.run({
  name: "ConsumerCreationPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_CreateFailed_CreateSucceeded";
      private cut: ConsumerCreationPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let userServiceClientMock = new (class extends WebServiceClient {
          public constructor() {
            super(undefined, undefined);
          }
        })();

        // Execute
        this.cut = new ConsumerCreationPage(userServiceClientMock);
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_creation_page_default.png"),
          path.join(__dirname, "/golden/consumer_creation_page_default.png"),
          path.join(__dirname, "/consumer_creation_page_default_diff.png")
        );

        // Execute
        this.cut.nameInput.value = "new name";
        this.cut.nameInput.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_creation_page_valid_name.png"),
          path.join(__dirname, "/golden/consumer_creation_page_valid_name.png"),
          path.join(__dirname, "/consumer_creation_page_valid_name_diff.png")
        );

        // Prepare
        userServiceClientMock.send = async (request): Promise<any> => {
          throw new Error("fake error");
        };

        // Execute
        this.cut.nameInput.dispatchEnter();
        await new Promise<void>((resolve) => this.cut.once("createError", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_creation_page_create_failed.png"),
          path.join(
            __dirname,
            "/golden/consumer_creation_page_create_failed.png"
          ),
          path.join(__dirname, "/consumer_creation_page_create_failed_diff.png")
        );

        // Prepare
        let requestCaptured: any;
        userServiceClientMock.send = async (request): Promise<any> => {
          requestCaptured = request;
          return { signedSession: "new session" } as CreateAccountResponse;
        };

        // Execute
        this.cut.inputFormPage.submit();
        let newSession = await new Promise<string>((resolve) =>
          this.cut.once("created", (newSession) => resolve(newSession))
        );

        // Verify
        assertThat(requestCaptured.descriptor, eq(CREATE_ACCOUNT), "service")
        assertThat(
          requestCaptured.body,
          eqMessage(
            { naturalName: "new name", accountType: AccountType.CONSUMER },
            CREATE_ACCOUNT_REQUEST_BODY
          ),
          "request body"
        );
        assertThat(newSession, eq("new session"), "new session");
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_creation_page_create_succeeded.png"),
          path.join(
            __dirname,
            "/golden/consumer_creation_page_create_succeeded.png"
          ),
          path.join(
            __dirname,
            "/consumer_creation_page_create_succeeded_diff.png"
          )
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "NameTooLong_NameEmpty";
      private cut: ConsumerCreationPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        this.cut = new ConsumerCreationPage(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
          })()
        );
        document.body.append(this.cut.body);

        // Execute
        let characters = new Array<string>();
        for (let i = 0; i < 101; i++) {
          characters.push("a");
        }
        this.cut.nameInput.value = characters.join("");
        this.cut.nameInput.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_creation_page_name_too_long.png"),
          path.join(
            __dirname,
            "/golden/consumer_creation_page_name_too_long.png"
          ),
          path.join(__dirname, "/consumer_creation_page_name_too_long_diff.png")
        );

        // Execute
        this.cut.nameInput.value = "";
        this.cut.nameInput.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_creation_page_name_empty.png"),
          path.join(__dirname, "/golden/consumer_creation_page_name_empty.png"),
          path.join(__dirname, "/consumer_creation_page_name_empty_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
