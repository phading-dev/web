import path = require("path");
import { normalizeBody } from "../normalize_body";
import { setTabletView } from "../view_port";
import { TextInputWithErrorMsg } from "./text_input";
import { keyboardDown, keyboardUp } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "TextInputTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_InvalidWithErrors_Valid_InvalidWithoutErrors";
      private cut: TextInputWithErrorMsg;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = new TextInputWithErrorMsg(
          "Input",
          "width: 100%;",
          {
            type: "text",
            autocomplete: "username",
          },
          (value) => {
            if (!value) {
              return { valid: false };
            } else if (value.length > 10) {
              return {
                valid: false,
                errorMsg: "Too long.",
              };
            } else {
              return { valid: true };
            }
          },
        );
        let refreshed = false;
        this.cut.on("refresh", () => (refreshed = true));

        // Execute
        this.cut.enable();
        document.body.append(this.cut.body);

        // Verify
        assertThat(
          this.cut.isValid,
          eq(false),
          "Initial empty input is invalid",
        );
        assertThat(refreshed, eq(false), "No refresh for initialization");
        await asyncAssertScreenshot(
          path.join(__dirname, "/text_input_default.png"),
          path.join(__dirname, "/golden/text_input_default.png"),
          path.join(__dirname, "/text_input_default_diff.png"),
          { fullPage: true },
        );

        // Execute
        this.cut.value = "12345678901";
        this.cut.dispatchInput();

        // Verify
        assertThat(this.cut.isValid, eq(false), "Too long input is invalid");
        assertThat(refreshed, eq(true), "Refresh after input");
        await asyncAssertScreenshot(
          path.join(__dirname, "/text_input_with_error.png"),
          path.join(__dirname, "/golden/text_input_with_error.png"),
          path.join(__dirname, "/text_input_with_error_diff.png"),
          { fullPage: true },
        );

        // Execute
        this.cut.disable();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/text_input_disabled.png"),
          path.join(__dirname, "/golden/text_input_disabled.png"),
          path.join(__dirname, "/text_input_disabled_diff.png"),
          { fullPage: true },
        );

        // Execute
        this.cut.enable();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/text_input_enabled_with_error.png"),
          path.join(__dirname, "/golden/text_input_with_error.png"),
          path.join(__dirname, "/text_input_enabled_with_error_diff.png"),
          { fullPage: true },
        );

        // Prepare
        refreshed = false;

        // Execute
        this.cut.value = "123456";
        this.cut.dispatchInput();

        // Verify
        assertThat(this.cut.isValid, eq(true), "valid input");
        assertThat(refreshed, eq(true), "Refresh after input 2");
        await asyncAssertScreenshot(
          path.join(__dirname, "/text_input_valid.png"),
          path.join(__dirname, "/golden/text_input_valid.png"),
          path.join(__dirname, "/text_input_valid_diff.png"),
          { fullPage: true },
        );

        // Prepare
        refreshed = false;

        // Execute
        this.cut.value = "";
        this.cut.dispatchInput();

        // Verify
        assertThat(this.cut.isValid, eq(false), "empty input again");
        assertThat(refreshed, eq(true), "Refresh after input 3");
        await asyncAssertScreenshot(
          path.join(__dirname, "/text_input_invalid_without_error.png"),
          path.join(__dirname, "/golden/text_input_default.png"),
          path.join(__dirname, "/text_input_invalid_without_error_diff.png"),
          { fullPage: true },
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "SubmitEvent";
      private cut: TextInputWithErrorMsg;
      public async execute() {
        // Prepare
        this.cut = new TextInputWithErrorMsg(
          "Label",
          "",
          { type: "text" },
          (value) => {
            return { valid: true };
          },
        ).enable();
        document.body.append(this.cut.body);
        let submitted = false;
        this.cut.on("action", () => (submitted = true));

        // Execute
        this.cut.focus();
        await keyboardDown("Enter");
        await keyboardUp("Enter");

        // Verify
        assertThat(submitted, eq(true), "submitted");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
