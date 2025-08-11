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

TEST_RUNNER.run({
  name: "UpdateAccountInfoPageTest",
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
        this.cut.accountNameInput.val.value = " First second ";
        this.cut.accountNameInput.val.dispatchInput();
        this.cut.descriptionInput.val.value = " Some kind of description. ";
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
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

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
              name: "First second",
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
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

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
      public name = "NoDescription";
      private cut: UpdateAccountInfoPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let webServiceClientMock = new WebServiceClientMock();

        // Execute
        this.cut = new UpdateAccountInfoPage(webServiceClientMock, {
          name: "First second",
        });
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_account_info_page_with_no_description.png",
          ),
          path.join(
            __dirname,
            "/golden/update_account_info_page_with_no_description.png",
          ),
          path.join(
            __dirname,
            "/update_account_info_page_with_no_description_diff.png",
          ),
        );

        // Prepare
        let isBack = false;
        this.cut.on("back", () => (isBack = true));

        // Execute
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

        // Verify
        assertThat(isBack, eq(true), "Back");
        assertThat(
          webServiceClientMock.request.body,
          eqMessage(
            {
              name: "First second",
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
          name: "First second",
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
        this.cut.inputFormPage.clickPrimaryButton();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

        // Verify
        assertThat(isBack, eq(true), "Back");
        assertThat(
          webServiceClientMock.request.body,
          eqMessage(
            {
              name: "First second",
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
      public name = "AccountNameInputError";
      private cut: UpdateAccountInfoPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        this.cut = new UpdateAccountInfoPage(undefined, {
          name: "First last",
        });
        document.body.appendChild(this.cut.body);

        // Execute
        this.cut.accountNameInput.val.value = Array(101).fill("1").join("");
        this.cut.accountNameInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_account_info_page_account_name_too_long_error.png",
          ),
          path.join(
            __dirname,
            "/golden/update_account_info_page_account_name_too_long_error.png",
          ),
          path.join(
            __dirname,
            "/update_account_info_page_account_name_too_long_error_diff.png",
          ),
        );

        // Execute
        this.cut.accountNameInput.val.value = "";
        this.cut.accountNameInput.val.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_account_info_page_account_name_missing_error.png",
          ),
          path.join(
            __dirname,
            "/golden/update_account_info_page_account_name_missing_error.png",
          ),
          path.join(
            __dirname,
            "/update_account_info_page_account_name_missing_error_diff.png",
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
          name: "First last",
        });
        document.body.appendChild(this.cut.body);

        // Execute
        this.cut.descriptionInput.val.value = Array(2001).fill("1").join("");
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
