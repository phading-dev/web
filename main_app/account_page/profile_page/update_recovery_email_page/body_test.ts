import "../../../../common/normalize_body";
import path = require("path");
import { setDesktopView } from "../../../../common/view_port";
import { UpdateRecoveryEmailPage } from "./body";
import {
  UPDATE_RECOVERY_EMAIL,
  UPDATE_RECOVERY_EMAIL_REQUEST_BODY,
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
  name: "UpdateRecoveryEmailPageTest",
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
      private cut: UpdateRecoveryEmailPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let clientMock = new WebServiceClientMock();

        // Execute
        this.cut = new UpdateRecoveryEmailPage(clientMock, "user1");
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_recovery_email_page.png"),
          path.join(__dirname, "/golden/update_recovery_email_page.png"),
          path.join(__dirname, "/update_recovery_email_page_diff.png"),
        );

        // Execute
        this.cut.newRecoveryEmailInput.val.value = createLongString(201);
        this.cut.newRecoveryEmailInput.val.dispatchInput();
        await new Promise<void>((resolve) =>
          this.cut.newRecoveryEmailInput.val.once("validated", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_recovery_email_page_too_long_error.png",
          ),
          path.join(
            __dirname,
            "/golden/update_recovery_email_page_too_long_error.png",
          ),
          path.join(
            __dirname,
            "/update_recovery_email_page_too_long_error_diff.png",
          ),
        );

        // Prepare
        this.cut.currentPasswordInput.val.value = "current password";
        this.cut.currentPasswordInput.val.dispatchInput();
        await new Promise<void>((resolve) =>
          this.cut.currentPasswordInput.val.once("validated", resolve),
        );
        this.cut.newRecoveryEmailInput.val.value = "new@gmail.com";
        this.cut.newRecoveryEmailInput.val.dispatchInput();
        await new Promise<void>((resolve) =>
          this.cut.newRecoveryEmailInput.val.once("validated", resolve),
        );
        clientMock.error = new Error("fake error");

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) =>
          this.cut.inputFormPage.once("primaryDone", resolve),
        );

        // Verify
        assertThat(
          clientMock.request.descriptor,
          eq(UPDATE_RECOVERY_EMAIL),
          "RC",
        );
        assertThat(
          clientMock.request.body,
          eqMessage(
            {
              newEmail: "new@gmail.com",
              currentPassword: "current password",
            },
            UPDATE_RECOVERY_EMAIL_REQUEST_BODY,
          ),
          "RC request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_recovery_email_page_update_failed.png"),
          path.join(
            __dirname,
            "/golden/update_recovery_email_page_update_failed.png",
          ),
          path.join(
            __dirname,
            "/update_recovery_email_page_update_failed_diff.png",
          ),
        );

        // Prepare
        clientMock.error = undefined;
        clientMock.response = {};

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_recovery_email_page_update_successs.png",
          ),
          path.join(
            __dirname,
            "/golden/update_recovery_email_page_update_successs.png",
          ),
          path.join(
            __dirname,
            "/update_recovery_email_page_update_successs_diff.png",
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
        let cut = new UpdateRecoveryEmailPage(undefined, "user1");
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
