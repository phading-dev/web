import path = require("path");
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

TEST_RUNNER.run({
  name: "CreateAccountPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "Consumer_NameTooLong_NameValid_EmailTooLong_EmailValid_CreateError_Created";
      private cut: CreateAccountPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new CreateAccountPage(serviceClientMock);

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/create_account_page_consumer.png"),
          path.join(__dirname, "/golden/create_account_page_consumer.png"),
          path.join(__dirname, "/create_account_page_consumer_diff.png"),
        );

        // Execute
        this.cut.naturalNameInput.val.value = Array(120).fill("a").join("");
        this.cut.naturalNameInput.val.dispatchChange();

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
        this.cut.naturalNameInput.val.value = " First Second ";
        this.cut.naturalNameInput.val.dispatchChange();
        this.cut.emailInput.val.value = Array(201).fill("1").join("");
        this.cut.emailInput.val.dispatchChange();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/create_account_page_consumer_email_too_long.png",
          ),
          path.join(
            __dirname,
            "/golden/create_account_page_consumer_email_too_long.png",
          ),
          path.join(
            __dirname,
            "/create_account_page_consumer_email_too_long_diff.png",
          ),
        );

        // Execute
        this.cut.emailInput.val.value = " me@gmail.com ";
        this.cut.emailInput.val.dispatchChange();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/create_account_page_consumer_valid.png"),
          path.join(
            __dirname,
            "/golden/create_account_page_consumer_valid.png",
          ),
          path.join(__dirname, "/create_account_page_consumer_valid_diff.png"),
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.once("chosen", resolve));

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
              contactEmail: "me@gmail.com",
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
        let signedSession: string;
        this.cut.on("choose", (session) => (signedSession = session));

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.once("chosen", resolve));

        // Verify
        assertThat(signedSession, eq("session 1"), "signed session");

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
        this.cut = new CreateAccountPage(serviceClientMock);

        // Execute
        document.body.append(this.cut.body);
        this.cut.publisherOption.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/create_account_page_publisher.png"),
          path.join(__dirname, "/golden/create_account_page_publisher.png"),
          path.join(__dirname, "/create_account_page_publisher_diff.png"),
        );

        // Prepare
        let signedSession: string;
        this.cut.on("choose", (session) => (signedSession = session));

        // Execute
        this.cut.naturalNameInput.val.value = "First Second";
        this.cut.naturalNameInput.val.dispatchChange();
        this.cut.emailInput.val.value = "me@gmail.com";
        this.cut.emailInput.val.dispatchChange();
        await new Promise<void>((resolve) =>
          this.cut.emailInput.val.once("validate", resolve),
        );
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.once("chosen", resolve));

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
              contactEmail: "me@gmail.com",
            },
            CREATE_ACCOUNT_REQUEST_BODY,
          ),
          "request body",
        );
        assertThat(signedSession, eq("session 1"), "signed session");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
