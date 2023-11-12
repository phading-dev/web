import path = require("path");
import { UpdatePasswordPage } from "./body";
import {
  UPDATE_PASSWORD,
  UPDATE_PASSWORD_REQUEST_BODY,
  UpdatePasswordResponse,
} from "@phading/user_service_interface/interface";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "../../../../../common/normalize_body";

function createLongString(length: number) {
  let stringArray = new Array<string>();
  for (let i = 0; i < length; i++) {
    stringArray.push("1");
  }
  return stringArray.join("");
}

let menuContainer: HTMLDivElement;

TEST_RUNNER.run({
  name: "UpdatePasswordPageTest",
  environment: {
    setUp: () => {
      menuContainer = E.div({
        style: `position: absolute; top: 0; left: 0`,
      });
      document.body.append(menuContainer);
    },
    tearDown: () => {
      menuContainer.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Default_UpdateFailed_UpdateSuccess";
      private cut: UpdatePasswordPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 600);
        let requestCaptured: any;
        let error: Error;
        let response: UpdatePasswordResponse;

        // Execute
        this.cut = new UpdatePasswordPage(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any): Promise<any> {
              requestCaptured = request;
              if (error) {
                throw error;
              } else {
                return response;
              }
            }
          })()
        );
        document.body.append(this.cut.body);
        menuContainer.append(this.cut.menuBody);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_password_page.png"),
          path.join(__dirname, "/golden/update_password_page.png"),
          path.join(__dirname, "/update_password_page_diff.png")
        );

        // Execute
        this.cut.newPasswordInput.value = createLongString(101);
        this.cut.newPasswordInput.dispatchInput();
        await new Promise<void>((resolve) =>
          this.cut.newPasswordInput.once("validated", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_password_page_too_long_error.png"),
          path.join(
            __dirname,
            "/golden/update_password_page_too_long_error.png"
          ),
          path.join(
            __dirname,
            "/update_password_page_too_long_error_diff.png"
          )
        );

        // Execute
        this.cut.newPasswordRepeatInput.value = "some password";
        this.cut.newPasswordRepeatInput.dispatchInput();
        await new Promise<void>((resolve) =>
          this.cut.newPasswordRepeatInput.once("validated", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_password_page_password_not_match.png"),
          path.join(
            __dirname,
            "/golden/update_password_page_password_not_match.png"
          ),
          path.join(
            __dirname,
            "/update_password_page_password_not_match_diff.png"
          )
        );

        // Prepare
        this.cut.currentPasswordInput.value = "current password";
        this.cut.currentPasswordInput.dispatchInput();
        await new Promise<void>((resolve) =>
          this.cut.currentPasswordInput.once("validated", resolve)
        );
        this.cut.newPasswordInput.value = "a new password";
        this.cut.newPasswordInput.dispatchInput();
        await new Promise<void>((resolve) =>
          this.cut.newPasswordInput.once("validated", resolve)
        );
        this.cut.newPasswordRepeatInput.value = "a new password";
        this.cut.newPasswordRepeatInput.dispatchInput();
        await new Promise<void>((resolve) =>
          this.cut.newPasswordRepeatInput.once("validated", resolve)
        );
        error = new Error("fake error");

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) =>
          this.cut.once("updateError", resolve)
        );

        // Verify
        assertThat(
          requestCaptured.descriptor,
          eq(UPDATE_PASSWORD),
          "service"
        );
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              currentPassword: "current password",
              newPassword: "a new password"
            },
            UPDATE_PASSWORD_REQUEST_BODY
          ),
          "request body"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_password_page_update_failed.png"),
          path.join(
            __dirname,
            "/golden/update_password_page_update_failed.png"
          ),
          path.join(
            __dirname,
            "/update_password_page_update_failed_diff.png"
          )
        );

        // Prepare
        error = undefined;
        response = {};

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_password_page_update_successs.png"),
          path.join(
            __dirname,
            "/golden/update_password_page_update_successs.png"
          ),
          path.join(
            __dirname,
            "/update_password_page_update_successs_diff.png"
          )
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    {
      name: "Back",
      execute: () => {
        // Prepare
        let cut = new UpdatePasswordPage(undefined);
        let isBack = false;
        cut.on("back", () => (isBack = true));

        // Execute
        cut.backMenuItem.click();

        // Verify
        assertThat(isBack, eq(true), "Back");
      },
    },
  ],
});
