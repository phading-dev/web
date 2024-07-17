import path = require("path");
import { SecurityInfoPage } from "./body";
import {
  GET_USER,
  GET_USER_REQUEST_BODY,
  GetUserResponse,
} from "@phading/user_service_interface/self/frontend/interface";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";
import {
  eqRequestMessageBody,
  eqService,
} from "@selfage/web_service_client/request_test_matcher";
import "../../../../../common/normalize_body";

TEST_RUNNER.run({
  name: "SecurityInfoPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Default";
      private cut: SecurityInfoPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 600);
        let clientMock = new WebServiceClientMock();
        clientMock.response = {
          user: {
            username: "user1",
            recoveryEmail: "some@gmail.com",
          },
        } as GetUserResponse;

        // Execute
        this.cut = new SecurityInfoPage(clientMock);
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(clientMock.request, eqService(GET_USER), "service");
        assertThat(
          clientMock.request,
          eqRequestMessageBody({}, GET_USER_REQUEST_BODY),
          "request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/security_info_page_default.png"),
          path.join(__dirname, "/golden/security_info_page_default.png"),
          path.join(__dirname, "/security_info_page_default_diff.png"),
        );
      }
      public tearnDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UpdateUsername";
      private cut: SecurityInfoPage;
      public async execute() {
        // Prepare
        let clientMock = new WebServiceClientMock();
        clientMock.response = {
          user: {
            username: "user1",
            recoveryEmail: "some@gmail.com",
          },
        } as GetUserResponse;
        this.cut = new SecurityInfoPage(clientMock);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        let updateUsername = false;
        this.cut.on("updateUsername", () => (updateUsername = true));

        // Execute
        this.cut.username.val.click();

        // Verify
        assertThat(updateUsername, eq(true), "update username");
      }
      public tearnDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UpdatePassword";
      private cut: SecurityInfoPage;
      public async execute() {
        // Prepare
        let clientMock = new WebServiceClientMock();
        clientMock.response = {
          user: {
            username: "user1",
            recoveryEmail: "some@gmail.com",
          },
        } as GetUserResponse;
        this.cut = new SecurityInfoPage(clientMock);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        let updatePassword = false;
        this.cut.on("updatePassword", () => (updatePassword = true));

        // Execute
        this.cut.password.val.click();

        // Verify
        assertThat(updatePassword, eq(true), "update password");
      }
      public tearnDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UpdateRecoveryEmail";
      private cut: SecurityInfoPage;
      public async execute() {
        // Prepare
        let clientMock = new WebServiceClientMock();
        clientMock.response = {
          user: {
            username: "user1",
            recoveryEmail: "some@gmail.com",
          },
        } as GetUserResponse;
        this.cut = new SecurityInfoPage(clientMock);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        let updateRecoveryEmail = false;
        this.cut.on("updateRecoveryEmail", () => (updateRecoveryEmail = true));

        // Execute
        this.cut.recoveryEmail.val.click();

        // Verify
        assertThat(updateRecoveryEmail, eq(true), "update recovery email");
      }
      public tearnDown() {
        this.cut.remove();
      }
    })(),
  ],
});
