import path = require("path");
import { SecurityInfoPage } from "./body";
import {
  GET_ACCOUNT_TYPE_REQUEST_BODY,
  GET_AUTH_SETTINGS,
  GetAuthSettingsResponse,
} from "@phading/user_service_interface/self/web/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "../../../../../common/normalize_body";

TEST_RUNNER.run({
  name: "SecurityInfoPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Default";
      private cut: SecurityInfoPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);

        // Execute
        this.cut = new SecurityInfoPage(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any): Promise<any> {
              assertThat(request.descriptor, eq(GET_AUTH_SETTINGS), "service");
              assertThat(
                request.body,
                eqMessage({}, GET_ACCOUNT_TYPE_REQUEST_BODY),
                "request body"
              );
              return {
                authSettings: {
                  username: "user1",
                  recoveryEmail: "some@gmail.com",
                },
              } as GetAuthSettingsResponse;
            }
          })()
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/security_info_page_default.png"),
          path.join(__dirname, "/golden/security_info_page_default.png"),
          path.join(__dirname, "/security_info_page_default_diff.png")
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
        this.cut = new SecurityInfoPage(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any): Promise<any> {
              return {
                authSettings: {
                  username: "user1",
                  recoveryEmail: "some@gmail.com",
                },
              } as GetAuthSettingsResponse;
            }
          })()
        );
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        let updateUsername = false;
        this.cut.on("updateUsername", () => (updateUsername = true));

        // Execute
        this.cut.username.click();

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
        this.cut = new SecurityInfoPage(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any): Promise<any> {
              return {
                authSettings: {
                  username: "user1",
                  recoveryEmail: "some@gmail.com",
                },
              } as GetAuthSettingsResponse;
            }
          })()
        );
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        let updatePassword = false;
        this.cut.on("updatePassword", () => (updatePassword = true));

        // Execute
        this.cut.password.click();

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
        this.cut = new SecurityInfoPage(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any): Promise<any> {
              return {
                authSettings: {
                  username: "user1",
                  recoveryEmail: "some@gmail.com",
                },
              } as GetAuthSettingsResponse;
            }
          })()
        );
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        let updateRecoveryEmail = false;
        this.cut.on("updateRecoveryEmail", () => (updateRecoveryEmail = true));

        // Execute
        this.cut.recoveryEmail.click();

        // Verify
        assertThat(updateRecoveryEmail, eq(true), "update recovery email");
      }
      public tearnDown() {
        this.cut.remove();
      }
    })(),
  ],
});
