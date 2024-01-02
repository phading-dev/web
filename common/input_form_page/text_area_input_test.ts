import path = require("path");
import { TextAreaInputWithErrorMsg } from "./text_area_input";
import { E } from "@selfage/element/factory";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import "../normalize_body";

interface Request {
  username?: string;
}

TEST_RUNNER.run({
  name: "TextAreaInputTest",
  cases: [
    new (class implements TestCase {
      public name =
        "DefaultTextAreaInput_InvalidWithErrors_Valid_InvalidWithoutErrors";
      private cut: TextAreaInputWithErrorMsg<Request>;
      private followingLine: HTMLDivElement;
      public async execute() {
        // Execute
        this.cut = TextAreaInputWithErrorMsg.create(
          "Input",
          "width: 50rem;",
          {},
          "",
          (request, value) => {
            request.username = value;
          },
          (value) => {
            if (value.length > 10) {
              return {
                valid: false,
                errorMsg: "Too long.",
              };
            } else if (value.length === 0) {
              return { valid: false };
            } else {
              return { valid: true };
            }
          }
        );
        await new Promise<void>((resolve) => this.cut.on("validated", resolve));
        this.followingLine = E.div(
          {
            style: `font-size: 1.4rem; color: black;`,
          },
          E.text("following lines....")
        );
        document.body.append(this.cut.body, this.followingLine);

        // Verify
        assertThat(
          this.cut.isValid,
          eq(false),
          "Initial empty input is invalid"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/text_area_input_default.png"),
          path.join(__dirname, "/golden/text_area_input_default.png"),
          path.join(__dirname, "/text_area_input_default_diff.png"),
          { fullPage: true }
        );

        // Execute
        this.cut.value = "12345678901";
        this.cut.dispatchInput();
        await new Promise<void>((resolve) => this.cut.on("validated", resolve));

        // Verify
        assertThat(this.cut.isValid, eq(false), "Too long input is invalid");
        await asyncAssertScreenshot(
          path.join(__dirname, "/text_area_input_with_error.png"),
          path.join(__dirname, "/golden/text_area_input_with_error.png"),
          path.join(__dirname, "/text_area_input_with_error_diff.png"),
          { fullPage: true }
        );

        // Execute
        this.cut.value = "123456";
        this.cut.dispatchInput();
        await new Promise<void>((resolve) => this.cut.on("validated", resolve));

        // Verify
        assertThat(this.cut.isValid, eq(true), "valid input");
        await asyncAssertScreenshot(
          path.join(__dirname, "/text_area_input_valid.png"),
          path.join(__dirname, "/golden/text_area_input_valid.png"),
          path.join(__dirname, "/text_area_input_valid_diff.png"),
          { fullPage: true }
        );

        // Execute
        this.cut.value = "";
        this.cut.dispatchInput();
        await new Promise<void>((resolve) => this.cut.on("validated", resolve));

        // Verify
        assertThat(this.cut.isValid, eq(false), "empty input again");
        await asyncAssertScreenshot(
          path.join(__dirname, "/text_area_input_invalid_without_error.png"),
          path.join(__dirname, "/golden/text_area_input_default.png"),
          path.join(
            __dirname,
            "/text_area_input_invalid_without_error_diff.png"
          ),
          { fullPage: true }
        );
      }
      public tearDown() {
        this.cut.remove();
        this.followingLine.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "DefaultValue_FillInRequest";
      private cut: TextAreaInputWithErrorMsg<Request>;
      public async execute() {
        // Execute
        this.cut = TextAreaInputWithErrorMsg.create<Request>(
          "Label",
          "",
          { type: "text" },
          "123",
          (request, value) => {
            request.username = value;
          },
          (value) => {
            return { valid: true };
          }
        );
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/text_area_input_default_value.png"),
          path.join(__dirname, "/golden/text_area_input_default_value.png"),
          path.join(__dirname, "/text_area_input_default_value_diff.png"),
          { fullPage: true }
        );

        // Prepare
        let request: Request = {};

        // Execute
        this.cut.fillInRequest(request);

        // Verify
        assertThat(request.username, eq("123"), "username filled in");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
