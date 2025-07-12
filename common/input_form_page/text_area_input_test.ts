import path = require("path");
import { normalizeBody } from "../normalize_body";
import { setTabletView } from "../view_port";
import { TextAreaInputWithErrorMsg } from "./text_area_input";
import { E } from "@selfage/element/factory";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "TextAreaInputTest",
  cases: [
    new (class implements TestCase {
      public name =
        "DefaultTextAreaInput_InvalidWithErrors_Valid_InvalidWithoutErrors";
      private cut: TextAreaInputWithErrorMsg;
      private followingLine: HTMLDivElement;
      public async execute() {
        // Execute
        await setTabletView();
        this.cut = new TextAreaInputWithErrorMsg(
          "Input",
          "width: 50rem;",
          {},
          "",
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
        this.cut.validate();
        this.followingLine = E.div(
          {
            style: `font-size: 1.4rem; color: black;`,
          },
          E.text("following lines...."),
        );
        document.body.append(this.cut.body, this.followingLine);

        // Verify
        assertThat(
          this.cut.isValid,
          eq(false),
          "Initial empty input is invalid",
        );
        assertThat(refreshed, eq(false), "No refresh for initialization");
        await asyncAssertScreenshot(
          path.join(__dirname, "/text_area_input_default.png"),
          path.join(__dirname, "/golden/text_area_input_default.png"),
          path.join(__dirname, "/text_area_input_default_diff.png"),
          { fullPage: true },
        );

        // Execute
        this.cut.value = "12345678901";
        this.cut.dispatchInput();

        // Verify
        assertThat(this.cut.isValid, eq(false), "Too long input is invalid");
        assertThat(refreshed, eq(true), "Refresh after input");
        await asyncAssertScreenshot(
          path.join(__dirname, "/text_area_input_with_error.png"),
          path.join(__dirname, "/golden/text_area_input_with_error.png"),
          path.join(__dirname, "/text_area_input_with_error_diff.png"),
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
          path.join(__dirname, "/text_area_input_valid.png"),
          path.join(__dirname, "/golden/text_area_input_valid.png"),
          path.join(__dirname, "/text_area_input_valid_diff.png"),
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
          path.join(__dirname, "/text_area_input_invalid_without_error.png"),
          path.join(__dirname, "/golden/text_area_input_default.png"),
          path.join(
            __dirname,
            "/text_area_input_invalid_without_error_diff.png",
          ),
          { fullPage: true },
        );
      }
      public tearDown() {
        this.cut.remove();
        this.followingLine.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "DefaultValue";
      private cut: TextAreaInputWithErrorMsg;
      public async execute() {
        // Execute
        await setTabletView();
        this.cut = new TextAreaInputWithErrorMsg(
          "Label",
          "",
          { type: "text" },
          "123",
          (value) => {
            return { valid: true };
          },
        );
        this.cut.validate();
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/text_area_input_default_value.png"),
          path.join(__dirname, "/golden/text_area_input_default_value.png"),
          path.join(__dirname, "/text_area_input_default_value_diff.png"),
          { fullPage: true },
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
