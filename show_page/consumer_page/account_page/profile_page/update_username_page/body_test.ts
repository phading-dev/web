import path = require("path");
import { UpdateUsernamePage } from "./body";
import {
  UPDATE_USERNAME,
  UPDATE_USERNAME_REQUEST_BODY,
  UpdateUsernameResponse,
} from "@phading/user_service_interface/self/frontend/interface";
import { E } from "@selfage/element/factory";
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
        let clientMock = new WebServiceClientMock();

        // Execute
        this.cut = new UpdateUsernamePage(clientMock);
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_username_page.png"),
          path.join(__dirname, "/golden/update_username_page.png"),
          path.join(__dirname, "/update_username_page_diff.png"),
        );

        // Execute
        this.cut.newUsernameInput.val.value = createLongString(101);
        this.cut.newUsernameInput.val.dispatchInput();
        await new Promise<void>((resolve) =>
          this.cut.newUsernameInput.val.once("validated", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_username_page_too_long_error.png"),
          path.join(
            __dirname,
            "/golden/update_username_page_too_long_error.png",
          ),
          path.join(__dirname, "/update_username_page_too_long_error_diff.png"),
        );

        // Prepare
        this.cut.currentPasswordInput.val.value = "current password";
        this.cut.currentPasswordInput.val.dispatchInput();
        await new Promise<void>((resolve) =>
          this.cut.currentPasswordInput.val.once("validated", resolve),
        );
        this.cut.newUsernameInput.val.value = "new username";
        this.cut.newUsernameInput.val.dispatchInput();
        await new Promise<void>((resolve) =>
          this.cut.newUsernameInput.val.once("validated", resolve),
        );
        clientMock.error = new Error("fake error");

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) =>
          this.cut.once("updateError", resolve),
        );

        // Verify
        assertThat(clientMock.request, eqService(UPDATE_USERNAME), "service");
        assertThat(
          clientMock.request,
          eqRequestMessageBody(
            {
              newUsername: "new username",
              currentPassword: "current password",
            },
            UPDATE_USERNAME_REQUEST_BODY,
          ),
          "request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_username_page_update_failed.png"),
          path.join(
            __dirname,
            "/golden/update_username_page_update_failed.png",
          ),
          path.join(__dirname, "/update_username_page_update_failed_diff.png"),
        );

        // Cleanup
        clientMock.error = undefined;

        // Prepare
        clientMock.response = {
          usernameIsNotAvailable: true,
        } as UpdateUsernameResponse;

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) =>
          this.cut.once("updateError", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_username_page_username_not_available.png",
          ),
          path.join(
            __dirname,
            "/golden/update_username_page_username_not_available.png",
          ),
          path.join(
            __dirname,
            "/update_username_page_username_not_available_diff.png",
          ),
        );

        // Prepare
        clientMock.response = {};

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_username_page_update_successs.png"),
          path.join(
            __dirname,
            "/golden/update_username_page_update_successs.png",
          ),
          path.join(
            __dirname,
            "/update_username_page_update_successs_diff.png",
          ),
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
        cut.inputFormPage.clickBackButton();

        // Verify
        assertThat(isBack, eq(true), "Back");
      },
    },
  ],
});
