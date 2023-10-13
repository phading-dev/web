import path = require("path");
import { VerticalTextInputWithErrorMsg } from "./text_input";
import { E } from "@selfage/element/factory";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import "./normalize_body";

interface Request {
  username?: string;
}

TEST_RUNNER.run({
  name: "TextInputTest",
  cases: [
    new (class implements TestCase {
      public name =
        "DefaultVerticalTextInput_InvalidWithErrors_Valid_InvalidWithoutErrors";
      private cut: VerticalTextInputWithErrorMsg<Request>;
      private followingLine: HTMLDivElement;
      public async execute() {
        // Execute
        this.cut = VerticalTextInputWithErrorMsg.create(
          "Input",
          "width: 50rem;",
          {
            type: "text",
            autocomplete: "username",
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
          },
          (request, value) => {
            request.username = value;
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
          path.join(__dirname, "/vertical_text_input_default.png"),
          path.join(__dirname, "/golden/vertical_text_input_default.png"),
          path.join(__dirname, "/vertical_text_input_default_diff.png"),
          { fullPage: true }
        );

        // Execute
        this.cut.inputEle.value = "12345678901";
        this.cut.dispatchInput();
        await new Promise<void>((resolve) => this.cut.on("validated", resolve));

        // Verify
        assertThat(this.cut.isValid, eq(false), "Too long input is invalid");
        await asyncAssertScreenshot(
          path.join(__dirname, "/vertical_text_input_with_error.png"),
          path.join(__dirname, "/golden/vertical_text_input_with_error.png"),
          path.join(__dirname, "/vertical_text_input_with_error_diff.png"),
          { fullPage: true }
        );

        // Execute
        this.cut.inputEle.value = "123456";
        this.cut.dispatchInput();
        await new Promise<void>((resolve) => this.cut.on("validated", resolve));

        // Verify
        assertThat(this.cut.isValid, eq(true), "valid input");
        await asyncAssertScreenshot(
          path.join(__dirname, "/vertical_text_input_valid.png"),
          path.join(__dirname, "/golden/vertical_text_input_valid.png"),
          path.join(__dirname, "/vertical_text_input_valid_diff.png"),
          { fullPage: true }
        );

        // Execute
        this.cut.inputEle.value = "";
        this.cut.dispatchInput();
        await new Promise<void>((resolve) => this.cut.on("validated", resolve));

        // Verify
        assertThat(this.cut.isValid, eq(false), "empty input again");
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/vertical_text_input_invalid_without_error.png"
          ),
          path.join(__dirname, "/golden/vertical_text_input_default.png"),
          path.join(
            __dirname,
            "/vertical_text_input_invalid_without_error_diff.png"
          ),
          { fullPage: true }
        );
      }
      public tearDown() {
        this.cut.remove();
        this.followingLine.remove();
      }
    })(),
    {
      name: "SubmitEvent",
      execute() {
        // Prepare
        let cut = VerticalTextInputWithErrorMsg.create<Request>(
          "Label",
          "",
          { type: "text" },
          (value) => {
            return { valid: true };
          },
          (request, value) => {
            request.username = value;
          }
        );
        let submitted = false;
        cut.on("submit", () => (submitted = true));

        // Execute
        cut.dispatchEnter();

        // Verify
        assertThat(submitted, eq(true), "submitted");
      },
    },
    {
      name: "FillInRequest",
      execute() {
        // Prepare
        let cut = VerticalTextInputWithErrorMsg.create<Request>(
          "Label",
          "",
          { type: "text" },
          (value) => {
            return { valid: true };
          },
          (request, value) => {
            request.username = value;
          }
        );
        cut.inputEle.value = "123";
        let request: Request = {};

        // Execute
        cut.fillInRequest(request);

        // Verify
        assertThat(request.username, eq("123"), "username filled in");
      },
    },
  ],
});
