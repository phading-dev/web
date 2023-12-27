import path = require("path");
import { UpdateUsernamePage } from "./body";
import {
  UPDATE_USERNAME,
  UPDATE_USERNAME_REQUEST_BODY,
  UpdateUsernameResponse,
} from "@phading/user_service_interface/self/web/interface";
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
  name: "UpdateUsernamePageTest",
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
      private cut: UpdateUsernamePage;
      public async execute() {
        // Prepare
        await setViewport(1000, 600);
        let requestCaptured: any;
        let error: Error;
        let response: UpdateUsernameResponse;

        // Execute
        this.cut = new UpdateUsernamePage(
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
          path.join(__dirname, "/update_username_page.png"),
          path.join(__dirname, "/golden/update_username_page.png"),
          path.join(__dirname, "/update_username_page_diff.png")
        );

        // Execute
        this.cut.newUsernameInput.value = createLongString(101);
        this.cut.newUsernameInput.dispatchInput();
        await new Promise<void>((resolve) =>
          this.cut.newUsernameInput.once("validated", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_username_page_too_long_error.png"),
          path.join(
            __dirname,
            "/golden/update_username_page_too_long_error.png"
          ),
          path.join(__dirname, "/update_username_page_too_long_error_diff.png")
        );

        // Prepare
        this.cut.currentPasswordInput.value = "current password";
        this.cut.currentPasswordInput.dispatchInput();
        await new Promise<void>((resolve) =>
          this.cut.currentPasswordInput.once("validated", resolve)
        );
        this.cut.newUsernameInput.value = "new username";
        this.cut.newUsernameInput.dispatchInput();
        await new Promise<void>((resolve) =>
          this.cut.newUsernameInput.once("validated", resolve)
        );
        error = new Error("fake error");

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) =>
          this.cut.once("updateError", resolve)
        );

        // Verify
        assertThat(requestCaptured.descriptor, eq(UPDATE_USERNAME), "service");
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              newUsername: "new username",
              currentPassword: "current password",
            },
            UPDATE_USERNAME_REQUEST_BODY
          ),
          "request body"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_username_page_update_failed.png"),
          path.join(
            __dirname,
            "/golden/update_username_page_update_failed.png"
          ),
          path.join(__dirname, "/update_username_page_update_failed_diff.png")
        );

        // Cleanup
        error = undefined;

        // Prepare
        response = {
          usernameIsNotAvailable: true,
        };

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) =>
          this.cut.once("updateError", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_username_page_username_not_available.png"
          ),
          path.join(
            __dirname,
            "/golden/update_username_page_username_not_available.png"
          ),
          path.join(
            __dirname,
            "/update_username_page_username_not_available_diff.png"
          )
        );

        // Prepare
        response = {};

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_username_page_update_successs.png"),
          path.join(
            __dirname,
            "/golden/update_username_page_update_successs.png"
          ),
          path.join(__dirname, "/update_username_page_update_successs_diff.png")
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
        let cut = new UpdateUsernamePage(undefined);
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
