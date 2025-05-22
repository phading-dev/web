import path = require("path");
import { LOCAL_SESSION_STORAGE } from "../../../common/local_session_storage";
import { normalizeBody } from "../../../common/normalize_body";
import { setDesktopView } from "../../../common/view_port";
import { CreateAccountPage } from "./body";
import { AccountType } from "@phading/user_service_interface/account_type";
import {
  CREATE_ACCOUNT,
  CREATE_ACCOUNT_REQUEST_BODY,
  CreateAccountResponse,
} from "@phading/user_service_interface/web/self/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

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
        await setDesktopView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new CreateAccountPage(
          LOCAL_SESSION_STORAGE,
          serviceClientMock,
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
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) =>
          this.cut.inputFormPage.once("primaryDone", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(CREATE_ACCOUNT),
          "service",
        );
        assertThat(
          serviceClientMock.request.body,
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
        serviceClientMock.error = undefined;
        serviceClientMock.response = {
          signedSession: "session 1",
        } as CreateAccountResponse;
        let chosen = false;
        this.cut.on("chosen", () => (chosen = true));

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) =>
          this.cut.inputFormPage.once("primaryDone", resolve),
        );

        // Verify
        assertThat(chosen, eq(true), "chosen");
        assertThat(
          LOCAL_SESSION_STORAGE.read(),
          eq("session 1"),
          "stored session",
        );

        // Prepare
        let back = false;
        this.cut.on("back", () => (back = true));

        // Execute
        this.cut.inputFormPage.backButton.val.click();

        // Verify
        assertThat(back, eq(true), "went back");
      }
      public tearDown() {
        this.cut.remove();
        LOCAL_SESSION_STORAGE.clear();
      }
    })(),
    new (class implements TestCase {
      public name = "Publisher_Created";
      private cut: CreateAccountPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
          signedSession: "session 1",
        } as CreateAccountResponse;
        this.cut = new CreateAccountPage(
          LOCAL_SESSION_STORAGE,
          serviceClientMock,
        );

        // Execute
        document.body.append(this.cut.body);
        this.cut.publisherOption.val.click();

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
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) =>
          this.cut.inputFormPage.once("primaryDone", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(CREATE_ACCOUNT),
          "service",
        );
        assertThat(
          serviceClientMock.request.body,
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
        LOCAL_SESSION_STORAGE.clear();
      }
    })(),
  ],
});
