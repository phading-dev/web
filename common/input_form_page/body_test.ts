import path = require("path");
import { normalizeBody } from "../normalize_body";
import { eFormTitle } from "../page_elements";
import { setDesktopView, setPhoneView, setTabletView } from "../view_port";
import { InputFormPage } from "./body";
import { ErrorInput } from "./error_input";
import { TextInputWithErrorMsg } from "./text_input";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

interface Response {
  used?: boolean;
}

TEST_RUNNER.run({
  name: "InputFormPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "Default_ValidInput_AddErrorInput_RemoveErrorInput_SubmitError_ErrorInResponse_SubmitSuccess";
      private cut: InputFormPage<Response>;
      public async execute() {
        // Prepare
        await setDesktopView();
        let inputValue: string;
        let input = new TextInputWithErrorMsg(
          "Input",
          "",
          { type: "text" },
          (value) => {
            inputValue = value;
            if (!value) {
              return { valid: false };
            } else {
              return { valid: true };
            }
          },
        );
        let errorInput = new ErrorInput("Fake error input");
        let callError: Error;
        let actioned: boolean;
        let response: Response;

        // Execute
        this.cut = new InputFormPage<Response>()
          .addLines(eFormTitle("A title"), input.body)
          .addButtonsContainerAndPrimaryButton(
            "Update",
            async () => {
              actioned = true;
              if (callError) {
                throw callError;
              } else {
                return response;
              }
            },
            (error, response) => {
              if (error) {
                return "Failed to submit";
              } else if (response.used) {
                return "Username is used";
              } else {
                return "";
              }
            },
          )
          .addInputs(input);
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
        assertThat(inputValue, eq("Joe"), "input value");
        await asyncAssertScreenshot(
          path.join(__dirname, "/input_form_page_valid.png"),
          path.join(__dirname, "/golden/input_form_page_valid.png"),
          path.join(__dirname, "/input_form_page_valid_diff.png"),
        );

        // Execute
        this.cut.addInputs(errorInput);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/input_form_page_error_input.png"),
          path.join(__dirname, "/golden/input_form_page_error_input.png"),
          path.join(__dirname, "/input_form_page_error_input_diff.png"),
        );

        // Execute
        this.cut.removeInputs(errorInput);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/input_form_page_no_error_input.png"),
          path.join(__dirname, "/golden/input_form_page_valid.png"),
          path.join(__dirname, "/input_form_page_no_error_input_diff.png"),
        );

        // Prepare
        callError = new Error("Fake error");

        // Execute
        this.cut.clickPrimaryButton();
        await new Promise<void>((resolve) =>
          this.cut.once("primaryDone", resolve),
        );

        // Verify
        assertThat(actioned, eq(true), "actioned");
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
          this.cut.once("primaryDone", resolve),
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
        this.cut.clickPrimaryButton();
        await new Promise<void>((resolve) =>
          this.cut.once("primaryDone", resolve),
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
      public name =
        "SecondaryDeleteButton_DeleteFailed_PhoneView_DeleteSucceeded";
      private cut: InputFormPage<Response>;
      public async execute() {
        // Prepare
        await setTabletView();
        let input = new TextInputWithErrorMsg(
          "Input",
          "",
          { type: "text" },
          (value) => {
            return { valid: false };
          },
        );
        let deleteError: Error;

        // Execute
        this.cut = new InputFormPage<Response>()
          .addLines(eFormTitle("A title"), input.body)
          .addButtonsContainerAndPrimaryButton(
            "Update",
            async () => {
              return {};
            },
            () => {
              return "";
            },
          )
          .addSecondaryButton(
            "Delete",
            async () => {
              if (deleteError) {
                throw deleteError;
              }
            },
            (error, response) => {
              if (error) {
                return "Failed to delete delete delete delete!!!";
              } else {
                return "";
              }
            },
          )
          .addInputs(input);
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
        this.cut.secondaryButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.once("secondaryDone", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/input_form_page_delete_error.png"),
          path.join(__dirname, "/golden/input_form_page_delete_error.png"),
          path.join(__dirname, "/input_form_page_delete_error_diff.png"),
        );

        // Execute
        await setPhoneView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/input_form_page_delete_error_phone_view.png"),
          path.join(
            __dirname,
            "/golden/input_form_page_delete_error_phone_view.png",
          ),
          path.join(
            __dirname,
            "/input_form_page_delete_error_phone_view_diff.png",
          ),
        );

        // Cleanup
        deleteError = undefined;
        await setTabletView();

        // Execute
        this.cut.secondaryButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.once("secondaryDone", resolve),
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
      private cut: InputFormPage<Response>;
      public async execute() {
        // Prepare
        await setDesktopView();
        let input = new TextInputWithErrorMsg(
          "Input",
          "",
          { type: "text" },
          (value) => {
            return { valid: false };
          },
        );

        // Execute
        this.cut = new InputFormPage<Response>()
          .addLines(eFormTitle("A title"), input.body)
          .addButtonsContainerAndPrimaryButton(
            "Update",
            async () => {
              return {};
            },
            () => {
              return "";
            },
          )
          .addBackButton()
          .addInputs(input);
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
        this.cut.backButton.val.click();

        // Verify
        assertThat(back, eq(true), "went back");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ManyInputs_ScrollToBottom";
      private cut: InputFormPage<Response>;
      public async execute() {
        // Prepare
        await setPhoneView();
        let inputs: TextInputWithErrorMsg[] = [];
        for (let i = 0; i < 77; i++) {
          inputs.push(
            new TextInputWithErrorMsg(
              `Input ${i + 1}`,
              "",
              { type: "text" },
              (value) => {
                return { valid: false };
              },
            ),
          );
        }

        // Execute
        this.cut = new InputFormPage<Response>()
          .addLines(eFormTitle("A title"), ...inputs.map((input) => input.body))
          .addButtonsContainerAndPrimaryButton(
            "Update",
            async () => {
              return {};
            },
            () => {
              return "";
            },
          )
          .addInputs(...inputs);
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/input_form_page_many_inputs.png"),
          path.join(__dirname, "/golden/input_form_page_many_inputs.png"),
          path.join(__dirname, "/input_form_page_many_inputs_diff.png"),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/input_form_page_many_inputs_scroll_to_bottom.png",
          ),
          path.join(
            __dirname,
            "/golden/input_form_page_many_inputs_scroll_to_bottom.png",
          ),
          path.join(
            __dirname,
            "/input_form_page_many_inputs_scroll_to_bottom_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
