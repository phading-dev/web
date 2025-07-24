import path = require("path");
import { normalizeBody } from "../../../../common/normalize_body";
import { setDesktopView } from "../../../../common/view_port";
import { UpdateUserEmailPage } from "./body";
import {
  UPDATE_USER_EMAIL,
  UPDATE_USER_EMAIL_REQUEST_BODY,
  UpdateUserEmailResponse,
} from "@phading/user_service_interface/web/self/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

function createLongString(length: number) {
  let stringArray = new Array<string>();
  for (let i = 0; i < length; i++) {
    stringArray.push("1");
  }
  return stringArray.join("");
}

TEST_RUNNER.run({
  name: "UpdateUserEmailPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_UpdateFailed_UpdateSuccess";
      private cut: UpdateUserEmailPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let clientMock = new WebServiceClientMock();

        // Execute
        this.cut = new UpdateUserEmailPage(clientMock, {
          userEmail: "me@gmail.com",
        });
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_user_email_page.png"),
          path.join(__dirname, "/golden/update_user_email_page.png"),
          path.join(__dirname, "/update_user_email_page_diff.png"),
        );

        // Execute
        this.cut.newUserEmailInput.val.value = createLongString(201);
        this.cut.newUserEmailInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_user_email_page_too_long_error.png"),
          path.join(
            __dirname,
            "/golden/update_user_email_page_too_long_error.png",
          ),
          path.join(
            __dirname,
            "/update_user_email_page_too_long_error_diff.png",
          ),
        );

        // Execute
        this.cut.currentPasswordInput.val.value = "current password";
        this.cut.currentPasswordInput.val.dispatchInput();
        this.cut.newUserEmailInput.val.value = " new@gmail.com ";
        this.cut.newUserEmailInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_user_email_page_valid.png"),
          path.join(__dirname, "/golden/update_user_email_page_valid.png"),
          path.join(__dirname, "/update_user_email_page_valid_diff.png"),
        );

        // Prepare
        clientMock.error = new Error("fake error");

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

        // Verify
        assertThat(clientMock.request.descriptor, eq(UPDATE_USER_EMAIL), "RC");
        assertThat(
          clientMock.request.body,
          eqMessage(
            {
              newEmail: "new@gmail.com",
              password: "current password",
            },
            UPDATE_USER_EMAIL_REQUEST_BODY,
          ),
          "RC request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_user_email_page_update_failed.png"),
          path.join(
            __dirname,
            "/golden/update_user_email_page_update_failed.png",
          ),
          path.join(
            __dirname,
            "/update_user_email_page_update_failed_diff.png",
          ),
        );

        // Prepare
        clientMock.error = undefined;
        clientMock.response = {
          notAuthenticated: true,
        } as UpdateUserEmailResponse;

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_user_email_page_incorrect_password.png",
          ),
          path.join(
            __dirname,
            "/golden/update_user_email_page_incorrect_password.png",
          ),
          path.join(
            __dirname,
            "/update_user_email_page_incorrect_password_diff.png",
          ),
        );

        // Prepare
        clientMock.response = {
          userEmailUnavailable: true,
        } as UpdateUserEmailResponse;

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_user_email_page_user_email_not_available.png",
          ),
          path.join(
            __dirname,
            "/golden/update_user_email_page_user_email_not_available.png",
          ),
          path.join(
            __dirname,
            "/update_user_email_page_user_email_not_available_diff.png",
          ),
        );

        // Prepare
        clientMock.response = {};
        let signOut = false;
        this.cut.on("signOut", () => (signOut = true));

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

        // Verify
        assertThat(signOut, eq(true), "Sign Out");
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_user_email_page_update_successs.png"),
          path.join(
            __dirname,
            "/golden/update_user_email_page_update_successs.png",
          ),
          path.join(
            __dirname,
            "/update_user_email_page_update_successs_diff.png",
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
        let cut = new UpdateUserEmailPage(undefined, {
          userEmail: "me@gmail.com",
        });
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
