import path = require("path");
import { UpdateContactEmailPage } from "./body";
import {
  UPDATE_CONTACT_EMAIL,
  UPDATE_CONTACT_EMAIL_REQUEST_BODY,
  UpdateContactEmailResponse,
} from "@phading/user_service_interface/interface";
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
      private cut: UpdateContactEmailPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 600);
        let requestCaptured: any;
        let error: Error;
        let response: UpdateContactEmailResponse;

        // Execute
        this.cut = new UpdateContactEmailPage(
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
          path.join(__dirname, "/update_contact_email_page.png"),
          path.join(__dirname, "/golden/update_contact_email_page.png"),
          path.join(__dirname, "/update_contact_email_page_diff.png")
        );

        // Execute
        this.cut.emailInput.value = createLongString(101);
        this.cut.emailInput.dispatchInput();
        await new Promise<void>((resolve) =>
          this.cut.emailInput.once("validated", resolve)
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
        this.cut.emailInput.value = "new@gmail.com";
        this.cut.emailInput.dispatchInput();
        await new Promise<void>((resolve) =>
          this.cut.emailInput.once("validated", resolve)
        );
        error = new Error("fake error");

        // Execute
        this.cut.inputFormPage.submit();
        await new Promise<void>((resolve) =>
          this.cut.once("updateError", resolve)
        );

        // Verify
        assertThat(
          requestCaptured.descriptor,
          eq(UPDATE_CONTACT_EMAIL),
          "service"
        );
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              contactEmail: "new@gmail.com",
            },
            UPDATE_CONTACT_EMAIL_REQUEST_BODY
          ),
          "request body"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_contact_email_page_update_failed.png"),
          path.join(
            __dirname,
            "/golden/update_contact_email_page_update_failed.png"
          ),
          path.join(
            __dirname,
            "/update_contact_email_page_update_failed_diff.png"
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
          path.join(__dirname, "/update_contact_email_page_update_success.png"),
          path.join(
            __dirname,
            "/golden/update_contact_email_page_update_success.png"
          ),
          path.join(
            __dirname,
            "/update_contact_email_page_update_success_diff.png"
          )
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
