import path = require("path");
import { UpdateNaturalNamePage } from "./body";
import {
  UPDATE_ACCOUNT,
  UPDATE_ACCOUNT_REQUEST_BODY,
  UpdateAccountResponse,
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
      private cut: UpdateNaturalNamePage;
      public async execute() {
        // Prepare
        await setViewport(1000, 600);
        let requestCaptured: any;
        let error: Error;
        let response: UpdateAccountResponse;

        // Execute
        this.cut = new UpdateNaturalNamePage(
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
          path.join(__dirname, "/update_natural_name_page.png"),
          path.join(__dirname, "/golden/update_natural_name_page.png"),
          path.join(__dirname, "/update_natural_name_page_diff.png")
        );

        // Execute
        this.cut.naturalNameInput.value = createLongString(101);
        this.cut.naturalNameInput.dispatchInput();
        await new Promise<void>((resolve) =>
          this.cut.naturalNameInput.once("validated", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_contact_email_too_long_error.png"),
          path.join(
            __dirname,
            "/golden/update_contact_email_too_long_error.png"
          ),
          path.join(__dirname, "/update_contact_email_too_long_error_diff.png")
        );

        // Prepare
        this.cut.naturalNameInput.value = "First second";
        this.cut.naturalNameInput.dispatchInput();
        await new Promise<void>((resolve) =>
          this.cut.naturalNameInput.once("validated", resolve)
        );
        error = new Error("fake error");

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) =>
          this.cut.once("updateError", resolve)
        );

        // Verify
        assertThat(requestCaptured.descriptor, eq(UPDATE_ACCOUNT), "service");
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              naturalName: "First second",
            },
            UPDATE_ACCOUNT_REQUEST_BODY
          ),
          "request body"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_natural_name_page_update_failed.png"),
          path.join(
            __dirname,
            "/golden/update_natural_name_page_update_failed.png"
          ),
          path.join(
            __dirname,
            "/update_natural_name_page_update_failed_diff.png"
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
          path.join(__dirname, "/update_natural_name_page_update_success.png"),
          path.join(
            __dirname,
            "/golden/update_natural_name_page_update_success.png"
          ),
          path.join(
            __dirname,
            "/update_natural_name_page_update_success_diff.png"
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
        let cut = new UpdateNaturalNamePage(undefined);
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
