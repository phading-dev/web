import path = require("path");
import {
  VerticalTextInputValue,
  VerticalTextInputWithErrorMsg,
} from "./text_input";
import { E } from "@selfage/element/factory";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import "./normalize_body";

enum InputField {
  USERNAME,
}

TEST_RUNNER.run({
  name: "TextInputTest",
  cases: [
    new (class implements TestCase {
      public name = "RenderVerticalTextInput";
      private cut: VerticalTextInputWithErrorMsg<InputField>;
      private followingLine: HTMLDivElement;
      public async execute() {
        // Prepare
        let validInputs = new Set<InputField>();

        // Execute
        this.cut = VerticalTextInputWithErrorMsg.create(
          "Input",
          "width: 50rem;",
          {
            type: "text",
            autocomplete: "username",
          },
          validInputs,
          InputField.USERNAME
        );
        this.followingLine = E.div(
          {
            style: `font-size: 1.4rem; color: black;`,
          },
          E.text("following lines....")
        );
        document.body.append(this.cut.body, this.followingLine);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/vertical_text_input_render.png"),
          path.join(__dirname, "/golden/vertical_text_input_render.png"),
          path.join(__dirname, "/vertical_text_input_render_diff.png"),
          { fullPage: true }
        );

        // Execute
        this.cut.setAsInvalid("Failed to validate.");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/vertical_text_input_with_error.png"),
          path.join(__dirname, "/golden/vertical_text_input_with_error.png"),
          path.join(__dirname, "/vertical_text_input_with_error_diff.png"),
          { fullPage: true }
        );

        // Execute
        this.cut.setAsValid();

        // Verify
        assertThat(
          validInputs.has(InputField.USERNAME),
          eq(true),
          "valid input"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/vertical_text_input_valid.png"),
          path.join(__dirname, "/golden/vertical_text_input_render.png"),
          path.join(__dirname, "/vertical_text_input_valid_diff.png"),
          { fullPage: true }
        );

        // Execute
        this.cut.setAsInvalid();

        // Verify
        assertThat(
          validInputs.has(InputField.USERNAME),
          eq(false),
          "invalid input"
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/vertical_text_input_invalid_without_error.png"
          ),
          path.join(__dirname, "/golden/vertical_text_input_render.png"),
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
      name: "DispatchInputEvent",
      execute() {
        // Prepare
        let cut = VerticalTextInputWithErrorMsg.create(
          "Label",
          "",
          { type: "text" },
          new Set(),
          InputField.USERNAME
        );
        let triggered = false;
        cut.on("input", () => (triggered = true));

        // Execute
        cut.dispatchInput();

        // Verify
        assertThat(triggered, eq(true), "triggered");
      },
    },
    {
      name: "DispatchEnterEvent",
      execute() {
        // Prepare
        let cut = VerticalTextInputWithErrorMsg.create(
          "Label",
          "",
          { type: "text" },
          new Set(),
          InputField.USERNAME
        );
        let triggered = false;
        cut.on("enter", () => (triggered = true));

        // Execute
        cut.dispatchEnter();

        // Verify
        assertThat(triggered, eq(true), "triggered");
      },
    },
    new (class implements TestCase {
      public name = "RenderTextInputValue";
      private cut: VerticalTextInputValue;
      private followingLine: HTMLDivElement;
      public async execute() {
        // Execute
        this.cut = VerticalTextInputValue.create(
          "Input",
          "Value",
          "width: 50rem;",
          ""
        );
        this.followingLine = E.div(
          {
            style: `font-size: 1.4rem; color: black;`,
          },
          E.text("following lines....")
        );
        document.body.append(this.cut.body, this.followingLine);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/vertical_text_input_value_render.png"),
          path.join(__dirname, "/golden/vertical_text_input_value_render.png"),
          path.join(__dirname, "/vertical_text_input_value_render_diff.png"),
          { fullPage: true }
        );
      }
      public tearDown() {
        this.cut.remove();
        this.followingLine.remove();
      }
    })(),
  ],
});
