import path = require("path");
import { normalizeBody } from "../../../common/normalize_body";
import { setTabletView } from "../../../common/view_port";
import { ChangeEmailPage } from "./body";
import {
  UPDATE_USER_EMAIL_WITH_PASSWORD,
  UPDATE_USER_EMAIL_WITH_PASSWORD_REQUEST_BODY,
  UpdateUserEmailWithPasswordResponse,
} from "@phading/user_service_interface/web/self/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "ChangeEmailPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "TabletView_Default_InvalidEmail_ValidEmail_Error_IncorrectCredential_EmailUnavailable_Success_Back";
      private cut: ChangeEmailPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new ChangeEmailPage(
          serviceClientMock,
          "current@example.com",
        );

        // Execute
        document.body.appendChild(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/change_email_page_tablet.png"),
          path.join(__dirname, "/golden/change_email_page_tablet.png"),
          path.join(__dirname, "/change_email_page_tablet_diff.png"),
        );

        // Execute
        this.cut.passwordInput.val.value = "password123";
        this.cut.passwordInput.val.dispatchInput();
        this.cut.emailInput.val.value = Array(201).fill("a").join("");
        this.cut.emailInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/change_email_page_tablet_invalid_email.png"),
          path.join(
            __dirname,
            "/golden/change_email_page_tablet_invalid_email.png",
          ),
          path.join(
            __dirname,
            "/change_email_page_tablet_invalid_email_diff.png",
          ),
        );

        // Execute
        this.cut.emailInput.val.value = " test@example.com ";
        this.cut.emailInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/change_email_page_tablet_valid.png"),
          path.join(__dirname, "/golden/change_email_page_tablet_valid.png"),
          path.join(__dirname, "/change_email_page_tablet_valid_diff.png"),
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.on("updated", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(UPDATE_USER_EMAIL_WITH_PASSWORD),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              currentEmail: "current@example.com",
              newEmail: "test@example.com",
              password: "password123",
            },
            UPDATE_USER_EMAIL_WITH_PASSWORD_REQUEST_BODY,
          ),
          "RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/change_email_page_tablet_error.png"),
          path.join(__dirname, "/golden/change_email_page_tablet_error.png"),
          path.join(__dirname, "/change_email_page_tablet_error_diff.png"),
        );

        // Prepare
        serviceClientMock.error = undefined;
        serviceClientMock.response = {
          notAuthenticated: true,
        } as UpdateUserEmailWithPasswordResponse;

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.on("updated", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/change_email_page_tablet_incorrect_credential.png",
          ),
          path.join(
            __dirname,
            "/golden/change_email_page_tablet_incorrect_credential.png",
          ),
          path.join(
            __dirname,
            "/change_email_page_tablet_incorrect_credential_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.response = {
          userEmailUnavailable: true,
        } as UpdateUserEmailWithPasswordResponse;

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.on("updated", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/change_email_page_tablet_email_unavailable.png",
          ),
          path.join(
            __dirname,
            "/golden/change_email_page_tablet_email_unavailable.png",
          ),
          path.join(
            __dirname,
            "/change_email_page_tablet_email_unavailable_diff.png",
          ),
        );

        // Prepare
        serviceClientMock.response = {} as UpdateUserEmailWithPasswordResponse;
        let verifyEmail: string;
        this.cut.on("verifyEmail", (email) => {
          verifyEmail = email;
        });

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.on("updated", resolve));

        // Verify
        assertThat(verifyEmail, eq("test@example.com"), "verifyEmail");
        await asyncAssertScreenshot(
          path.join(__dirname, "/change_email_page_tablet_success.png"),
          path.join(__dirname, "/golden/change_email_page_tablet_valid.png"),
          path.join(__dirname, "/change_email_page_tablet_success_diff.png"),
        );

        // Prepare
        let back = false;
        this.cut.on("back", () => {
          back = true;
        });

        // Execute
        this.cut.inputFormPage.clickBackButton();

        // Verify
        assertThat(back, eq(true), "back");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
