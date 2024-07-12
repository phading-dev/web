import path = require("path");
import { InputFormPage } from "./body";
import { TextInputWithErrorMsg } from "./text_input";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import "../normalize_body";

interface Request {
  username?: string;
}

interface Response {
  used?: boolean;
}

TEST_RUNNER.run({
  name: "InputFormPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "Default_ValidInput_SubmitError_ErrorInResponse_SubmitSuccess";
      private cut: InputFormPage<Request, Response>;
      public async execute() {
        // Prepare
        await setViewport(1000, 600);
        let input = TextInputWithErrorMsg.create<Request>(
          "Input",
          "",
          { type: "text" },
          (request, value) => {
            request.username = value;
          },
          (value) => {
            if (value.length === 0) {
              return { valid: false };
            } else {
              return { valid: true };
            }
          },
        );
        let callError: Error;
        let requestSubmitted: Request;
        let response: Response;

        // Execute
        this.cut = new InputFormPage<Request, Response>(
          "A title",
          [input.body],
          [input],
          "Update",
          async (request) => {
            requestSubmitted = request;
            if (callError) {
              throw callError;
            } else {
              return response;
            }
          },
          (response, error) => {
            if (error) {
              return "Failed to submit";
            } else if (response.used) {
              return "Username is used";
            } else {
              return "";
            }
          },
          {},
        );
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/input_form_page_default.png"),
          path.join(__dirname, "/golden/input_form_page_default.png"),
          path.join(__dirname, "/input_form_page_default_diff.png"),
        );

        // Execute
        input.value = "Joe";
        input.dispatchInput();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/input_form_page_valid.png"),
          path.join(__dirname, "/golden/input_form_page_valid.png"),
          path.join(__dirname, "/input_form_page_valid_diff.png"),
        );

        // Prepare
        callError = new Error("Fake error");

        // Execute
        this.cut.submit();
        await new Promise<void>((resolve) =>
          this.cut.once("submitError", resolve),
        );

        // Verify
        assertThat(requestSubmitted.username, eq("Joe"), "request");
        await asyncAssertScreenshot(
          path.join(__dirname, "/input_form_page_submit_error.png"),
          path.join(__dirname, "/golden/input_form_page_submit_error.png"),
          path.join(__dirname, "/input_form_page_submit_error_diff.png"),
        );

        // Cleanup
        callError = undefined;

        // Prepare
        response = { used: true };

        // Execute
        input.dispatchEnter();
        await new Promise<void>((resolve) =>
          this.cut.once("submitError", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/input_form_page_error_in_response.png"),
          path.join(__dirname, "/golden/input_form_page_error_in_response.png"),
          path.join(__dirname, "/input_form_page_error_in_response_diff.png"),
        );

        // Prepare
        response = {};

        // Execute
        this.cut.submit();
        await new Promise<void>((resolve) =>
          this.cut.once("submitted", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/input_form_page_submitted.png"),
          path.join(__dirname, "/golden/input_form_page_valid.png"),
          path.join(__dirname, "/input_form_page_submitted_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "SecondaryDeleteButton_DeleteFailed_DeleteSucceeded";
      private cut: InputFormPage<Request, Response>;
      public async execute() {
        // Prepare
        await setViewport(1000, 600);
        let input = TextInputWithErrorMsg.create<Request>(
          "Input",
          "",
          { type: "text" },
          (request, value) => {},
          (value) => {
            return { valid: false };
          },
        );
        let deleteError: Error;

        // Execute
        this.cut = new InputFormPage<Request, Response>(
          "A title",
          [input.body],
          [input],
          "Update",
          async (request) => {
            return {};
          },
          (response, error) => {
            return "";
          },
          {},
        ).addSecondaryBlockingButton(
          "Delete",
          async () => {
            if (deleteError) {
              throw deleteError;
            }
          },
          (error) => {
            if (error) {
              return "Failed to delete";
            } else {
              return "";
            }
          },
        );
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/input_form_page_delete_button.png"),
          path.join(__dirname, "/golden/input_form_page_delete_button.png"),
          path.join(__dirname, "/input_form_page_delete_button_diff.png"),
        );

        // Prepare
        deleteError = new Error("Fake error");

        // Execute
        this.cut.clickSecondaryBlockingButton();
        await new Promise<void>((resolve) =>
          this.cut.once("secondaryActionError", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/input_form_page_delete_error.png"),
          path.join(__dirname, "/golden/input_form_page_delete_error.png"),
          path.join(__dirname, "/input_form_page_delete_error_diff.png"),
        );

        // Cleanup
        deleteError = undefined;

        // Execute
        this.cut.clickSecondaryBlockingButton();
        await new Promise<void>((resolve) =>
          this.cut.once("secondaryActionSuccess", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/input_form_page_delete_success.png"),
          path.join(__dirname, "/golden/input_form_page_delete_success.png"),
          path.join(__dirname, "/input_form_page_delete_success_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "BackButton";
      private cut: InputFormPage<Request, Response>;
      public async execute() {
        // Prepare
        await setViewport(1000, 600);
        let input = TextInputWithErrorMsg.create<Request>(
          "Input",
          "",
          { type: "text" },
          (request, value) => {},
          (value) => {
            return { valid: false };
          },
        );

        // Execute
        this.cut = new InputFormPage<Request, Response>(
          "A title",
          [input.body],
          [input],
          "Update",
          async (request) => {
            return {};
          },
          (response, error) => {
            return "";
          },
          {},
        ).addBackButton();
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/input_form_page_back_button.png"),
          path.join(__dirname, "/golden/input_form_page_back_button.png"),
          path.join(__dirname, "/input_form_page_back_button_diff.png"),
        );

        // Prepare
        let back = false;
        this.cut.on("back", () => (back = true));

        // Execute
        this.cut.clickBackButton();

        // Verify
        assertThat(back, eq(true), "went back");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
