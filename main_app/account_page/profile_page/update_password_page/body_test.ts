import "../../../../common/normalize_body";
import path = require("path");
import { setDesktopView } from "../../../../common/view_port";
import { UpdatePasswordPage } from "./body";
import {
  UPDATE_PASSWORD,
  UPDATE_PASSWORD_REQUEST_BODY,
} from "@phading/user_service_interface/web/self/interface";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

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
        await setDesktopView();
        let clientMock = new WebServiceClientMock();

        // Execute
        this.cut = new UpdatePasswordPage(clientMock, "user1");
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_password_page.png"),
          path.join(__dirname, "/golden/update_password_page.png"),
          path.join(__dirname, "/update_password_page_diff.png"),
        );

        // Execute
        this.cut.newPasswordInput.val.value = createLongString(101);
        this.cut.newPasswordInput.val.dispatchInput();
        await new Promise<void>((resolve) =>
          this.cut.newPasswordInput.val.once("validated", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_password_page_too_long_error.png"),
          path.join(
            __dirname,
            "/golden/update_password_page_too_long_error.png",
          ),
          path.join(__dirname, "/update_password_page_too_long_error_diff.png"),
        );

        // Execute
        this.cut.newPasswordInput.val.value = "a new password";
        this.cut.newPasswordInput.val.dispatchInput();
        await new Promise<void>((resolve) =>
          this.cut.newPasswordInput.val.once("validated", resolve),
        );
        this.cut.newPasswordRepeatInput.val.value = "some password";
        this.cut.newPasswordRepeatInput.val.dispatchInput();
        await new Promise<void>((resolve) =>
          this.cut.newPasswordRepeatInput.val.once("validated", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_password_page_password_not_match.png"),
          path.join(
            __dirname,
            "/golden/update_password_page_password_not_match.png",
          ),
          path.join(
            __dirname,
            "/update_password_page_password_not_match_diff.png",
          ),
        );

        // Prepare
        this.cut.currentPasswordInput.val.value = "current password";
        this.cut.currentPasswordInput.val.dispatchInput();
        await new Promise<void>((resolve) =>
          this.cut.currentPasswordInput.val.once("validated", resolve),
        );
        this.cut.newPasswordRepeatInput.val.value = "a new password";
        this.cut.newPasswordRepeatInput.val.dispatchInput();
        await new Promise<void>((resolve) =>
          this.cut.newPasswordRepeatInput.val.once("validated", resolve),
        );
        clientMock.error = new Error("fake error");

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) =>
          this.cut.inputFormPage.once("primaryDone", resolve),
        );

        // Verify
        assertThat(clientMock.request.descriptor, eq(UPDATE_PASSWORD), "RC");
        assertThat(
          clientMock.request.body,
          eqMessage(
            {
              currentPassword: "current password",
              newPassword: "a new password",
            },
            UPDATE_PASSWORD_REQUEST_BODY,
          ),
          "RC request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_password_page_update_failed.png"),
          path.join(
            __dirname,
            "/golden/update_password_page_update_failed.png",
          ),
          path.join(__dirname, "/update_password_page_update_failed_diff.png"),
        );

        // Prepare
        clientMock.error = undefined;
        clientMock.response = {};

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_password_page_update_successs.png"),
          path.join(
            __dirname,
            "/golden/update_password_page_update_successs.png",
          ),
          path.join(
            __dirname,
            "/update_password_page_update_successs_diff.png",
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
        let cut = new UpdatePasswordPage(undefined, "user1");
        let isBack = false;
        cut.on("back", () => (isBack = true));

        // Execute
        cut.inputFormPage.backButton.val.click();

        // Verify
        assertThat(isBack, eq(true), "Back");
      },
    },
  ],
});
