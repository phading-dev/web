import path = require("path");
import { UpdateAccountInfoPage } from "./body";
import {
  UPDATE_ACCOUNT,
  UPDATE_ACCOUNT_REQUEST_BODY,
  UpdateAccountResponse,
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
import "../../../../common/normalize_body";

function createLongString(length: number) {
  let stringArray = new Array<string>();
  for (let i = 0; i < length; i++) {
    stringArray.push("1");
  }
  return stringArray.join("");
}

let menuContainer: HTMLDivElement;

TEST_RUNNER.run({
  name: "UpateContactEmailPageTest",
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
      private cut: UpdateAccountInfoPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 600);
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
          this.cut.once("updateError", resolve),
        );

        // Verify
        assertThat(
          webServiceClientMock.request,
          eqService(UPDATE_ACCOUNT),
          "service",
        );
        assertThat(
          webServiceClientMock.request,
          eqRequestMessageBody(
            {
              naturalName: "First second",
              contactEmail: "me@gmail.com",
              description: "Some kind of description.",
            },
            UPDATE_ACCOUNT_REQUEST_BODY,
          ),
          "request body",
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

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

        // Verify
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
        await setViewport(1000, 600);
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

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

        // Verify
        assertThat(
          webServiceClientMock.request,
          eqRequestMessageBody(
            {
              naturalName: "First second",
              contactEmail: "",
              description: "",
            },
            UPDATE_ACCOUNT_REQUEST_BODY,
          ),
          "request body",
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
        await setViewport(1000, 600);
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

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

        // Verify
        assertThat(
          webServiceClientMock.request,
          eqRequestMessageBody(
            {
              naturalName: "First second",
              contactEmail: "me@gmail.com",
              description: "Some kind of description.",
            },
            UPDATE_ACCOUNT_REQUEST_BODY,
          ),
          "request body",
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
        await setViewport(1000, 600);
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
        await setViewport(1000, 600);
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
        await setViewport(1000, 600);
        this.cut = new UpdateAccountInfoPage(undefined, {
          naturalName: "First last",
        });
        document.body.appendChild(this.cut.body);

        // Execute
        this.cut.descriptionInput.val.value = createLongString(1001);
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
        cut.inputFormPage.clickBackButton();

        // Verify
        assertThat(isBack, eq(true), "Back");
      },
    },
  ],
});
