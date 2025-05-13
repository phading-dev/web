import path = require("path");
import { normalizeBody } from "../../../../common/normalize_body";
import { setDesktopView } from "../../../../common/view_port";
import { UpdateAccountInfoPage } from "./body";
import {
  UPDATE_ACCOUNT,
  UPDATE_ACCOUNT_REQUEST_BODY,
  UpdateAccountResponse,
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
  name: "UpateContactEmailPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_UpdateFailed_UpdateSuccess";
      private cut: UpdateAccountInfoPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let webServiceClientMock = new WebServiceClientMock();

        // Execute
        this.cut = new UpdateAccountInfoPage(webServiceClientMock, {});
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_account_info_page_default.png"),
          path.join(__dirname, "/golden/update_account_info_page_default.png"),
          path.join(__dirname, "/update_account_info_page_default_diff.png"),
        );

        // Execute
        this.cut.naturalNameInput.val.value = "First second";
        this.cut.naturalNameInput.val.dispatchInput();
        this.cut.emailInput.val.value = "me@gmail.com";
        this.cut.emailInput.val.dispatchInput();
        this.cut.descriptionInput.val.value = "Some kind of description.";
        this.cut.descriptionInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_account_info_page_all_valid_input.png"),
          path.join(
            __dirname,
            "/golden/update_account_info_page_all_valid_input.png",
          ),
          path.join(
            __dirname,
            "/update_account_info_page_all_valid_input_diff.png",
          ),
        );

        // Prepare
        webServiceClientMock.error = new Error("fake error");

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) =>
          this.cut.inputFormPage.once("primaryDone", resolve),
        );

        // Verify
        assertThat(
          webServiceClientMock.request.descriptor,
          eq(UPDATE_ACCOUNT),
          "RC",
        );
        assertThat(
          webServiceClientMock.request.body,
          eqMessage(
            {
              naturalName: "First second",
              contactEmail: "me@gmail.com",
              description: "Some kind of description.",
            },
            UPDATE_ACCOUNT_REQUEST_BODY,
          ),
          "RC request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_account_info_page_updated_failed.png"),
          path.join(
            __dirname,
            "/golden/update_account_info_page_updated_failed.png",
          ),
          path.join(
            __dirname,
            "/update_account_info_page_updated_failed_diff.png",
          ),
        );

        // Prepare
        webServiceClientMock.error = undefined;
        webServiceClientMock.response = {} as UpdateAccountResponse;
        let isBack = false;
        this.cut.on("back", () => (isBack = true));

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) =>
          this.cut.inputFormPage.once("primaryDone", resolve),
        );

        // Verify
        assertThat(isBack, eq(true), "Back");
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_account_info_page_updated_success.png"),
          path.join(
            __dirname,
            "/golden/update_account_info_page_updated_success.png",
          ),
          path.join(
            __dirname,
            "/update_account_info_page_updated_success_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "WithNaturalName";
      private cut: UpdateAccountInfoPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let webServiceClientMock = new WebServiceClientMock();

        // Execute
        this.cut = new UpdateAccountInfoPage(webServiceClientMock, {
          naturalName: "First second",
        });
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_account_info_page_with_natural_name.png",
          ),
          path.join(
            __dirname,
            "/golden/update_account_info_page_with_natural_name.png",
          ),
          path.join(
            __dirname,
            "/update_account_info_page_with_natural_name_diff.png",
          ),
        );

        // Prepare
        let isBack = false;
        this.cut.on("back", () => (isBack = true));

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) =>
          this.cut.inputFormPage.once("primaryDone", resolve),
        );

        // Verify
        assertThat(isBack, eq(true), "Back");
        assertThat(
          webServiceClientMock.request.body,
          eqMessage(
            {
              naturalName: "First second",
              contactEmail: "",
              description: "",
            },
            UPDATE_ACCOUNT_REQUEST_BODY,
          ),
          "RC request body",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "WithAllInfo";
      private cut: UpdateAccountInfoPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let webServiceClientMock = new WebServiceClientMock();

        // Execute
        this.cut = new UpdateAccountInfoPage(webServiceClientMock, {
          naturalName: "First second",
          contactEmail: "me@gmail.com",
          description: "Some kind of description.",
        });
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_account_info_page_with_all_info.png"),
          path.join(
            __dirname,
            "/golden/update_account_info_page_with_all_info.png",
          ),
          path.join(
            __dirname,
            "/update_account_info_page_with_all_info_diff.png",
          ),
        );

        // Prepare
        let isBack = false;
        this.cut.on("back", () => (isBack = true));

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) =>
          this.cut.inputFormPage.once("primaryDone", resolve),
        );

        // Verify
        assertThat(isBack, eq(true), "Back");
        assertThat(
          webServiceClientMock.request.body,
          eqMessage(
            {
              naturalName: "First second",
              contactEmail: "me@gmail.com",
              description: "Some kind of description.",
            },
            UPDATE_ACCOUNT_REQUEST_BODY,
          ),
          "RC request body",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "NaturalNameInputError";
      private cut: UpdateAccountInfoPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        this.cut = new UpdateAccountInfoPage(undefined, {
          naturalName: "First last",
        });
        document.body.appendChild(this.cut.body);

        // Execute
        this.cut.naturalNameInput.val.value = createLongString(101);
        this.cut.naturalNameInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_account_info_page_natural_name_too_long_error.png",
          ),
          path.join(
            __dirname,
            "/golden/update_account_info_page_natural_name_too_long_error.png",
          ),
          path.join(
            __dirname,
            "/update_account_info_page_natural_name_too_long_error_diff.png",
          ),
        );

        // Execute
        this.cut.naturalNameInput.val.value = "";
        this.cut.naturalNameInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_account_info_page_natural_name_missing_error.png",
          ),
          path.join(
            __dirname,
            "/golden/update_account_info_page_natural_name_missing_error.png",
          ),
          path.join(
            __dirname,
            "/update_account_info_page_natural_name_missing_error_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ContactEmailInputError";
      private cut: UpdateAccountInfoPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        this.cut = new UpdateAccountInfoPage(undefined, {
          naturalName: "First last",
        });
        document.body.appendChild(this.cut.body);

        // Execute
        this.cut.emailInput.val.value = createLongString(101);
        this.cut.emailInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_account_info_page_contact_email_too_long_error.png",
          ),
          path.join(
            __dirname,
            "/golden/update_account_info_page_contact_email_too_long_error.png",
          ),
          path.join(
            __dirname,
            "/update_account_info_page_contact_email_too_long_error_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "DescriptionInputError";
      private cut: UpdateAccountInfoPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        this.cut = new UpdateAccountInfoPage(undefined, {
          naturalName: "First last",
        });
        document.body.appendChild(this.cut.body);

        // Execute
        this.cut.descriptionInput.val.value = createLongString(2001);
        this.cut.descriptionInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_account_info_page_description_too_long_error.png",
          ),
          path.join(
            __dirname,
            "/golden/update_account_info_page_description_too_long_error.png",
          ),
          path.join(
            __dirname,
            "/update_account_info_page_description_too_long_error_diff.png",
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
        let cut = new UpdateAccountInfoPage(undefined, {});
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
