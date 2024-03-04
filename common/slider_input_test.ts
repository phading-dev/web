import path = require("path");
import { Orientation, SliderInput } from "./slider_input";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import "./normalize_body";

TEST_RUNNER.run({
  name: "SliderInputTest",
  cases: [
    new (class implements TestCase {
      public name = "Horizontal_Move_Stop";
      private cut: SliderInput;
      public async execute() {
        // Prepare
        await setViewport(400, 400);
        let valueCaptured: number;
        this.cut = new SliderInput(
          Orientation.HORIZONTAL,
          10,
          "",
          {
            start: 0,
            end: 100,
          },
          10
        ).on("change", (value) => (valueCaptured = value));

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_horizontal.png"),
          path.join(__dirname, "/golden/slider_input_horizontal.png"),
          path.join(__dirname, "/slider_input_horizontal_diff.png")
        );

        // Execute
        this.cut.body.dispatchEvent(
          new PointerEvent("pointermove", {
            screenX: 100,
            screenY: 0,
          })
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_not_moving.png"),
          path.join(__dirname, "/golden/slider_input_horizontal.png"),
          path.join(__dirname, "/slider_input_not_moving_diff.png")
        );

        // Execute
        this.cut.body.dispatchEvent(
          new PointerEvent("pointerdown", {
            screenX: 90,
            screenY: 10,
          })
        );

        // Verify
        assertThat(valueCaptured, eq(90), "value 1");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_start_moving.png"),
          path.join(__dirname, "/golden/slider_input_start_moving.png"),
          path.join(__dirname, "/slider_input_start_moving_diff.png")
        );

        // Execute
        this.cut.body.dispatchEvent(
          new PointerEvent("pointermove", {
            screenX: 80,
            screenY: 0,
          })
        );

        // Verify
        assertThat(valueCaptured, eq(80), "value 2");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_moving.png"),
          path.join(__dirname, "/golden/slider_input_moving.png"),
          path.join(__dirname, "/slider_input_moving_diff.png")
        );

        // Execute
        this.cut.body.dispatchEvent(
          new PointerEvent("pointermove", {
            screenX: 0,
            screenY: 10,
          })
        );

        // Verify
        assertThat(valueCaptured, eq(0), "value 3");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_moving_2.png"),
          path.join(__dirname, "/golden/slider_input_moving_2.png"),
          path.join(__dirname, "/slider_input_moving_2_diff.png")
        );

        // Execute
        this.cut.body.dispatchEvent(
          new PointerEvent("pointerup", {
            screenX: 80,
            screenY: 10,
          })
        );

        // Verify
        this.cut.body.dispatchEvent(
          new PointerEvent("pointermove", {
            screenX: 80,
            screenY: 10,
          })
        );
        assertThat(valueCaptured, eq(0), "value 4");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_pointer_up.png"),
          path.join(__dirname, "/golden/slider_input_moving_2.png"),
          path.join(__dirname, "/slider_input_pointer_up_diff.png")
        );

        // Execute
        this.cut.body.dispatchEvent(
          new PointerEvent("pointerdown", {
            screenX: 100,
            screenY: 10,
          })
        );

        // Verify
        assertThat(valueCaptured, eq(100), "value 5");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_moving_3.png"),
          path.join(__dirname, "/golden/slider_input_moving_3.png"),
          path.join(__dirname, "/slider_input_moving_3_diff.png")
        );

        // Execute
        this.cut.body.dispatchEvent(
          new PointerEvent("pointerout", {
            screenX: 0,
            screenY: 10,
          })
        );

        // Verify
        this.cut.body.dispatchEvent(
          new PointerEvent("pointermove", {
            screenX: 0,
            screenY: 10,
          })
        );
        assertThat(valueCaptured, eq(100), "value 6");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_pointer_out.png"),
          path.join(__dirname, "/golden/slider_input_moving_3.png"),
          path.join(__dirname, "/slider_input_pointer_out_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Vertical_Move_Stop";
      private cut: SliderInput;
      public async execute() {
        // Prepare
        await setViewport(400, 400);
        let valueCaptured: number;
        this.cut = new SliderInput(
          Orientation.VERTICAL,
          10,
          "",
          {
            start: 0,
            end: 100,
          },
          10
        ).on("change", (value) => (valueCaptured = value));

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_vertical.png"),
          path.join(__dirname, "/golden/slider_input_vertical.png"),
          path.join(__dirname, "/slider_input_vertical_diff.png")
        );

        // Execute
        this.cut.body.dispatchEvent(
          new PointerEvent("pointerdown", {
            screenX: 10,
            screenY: 10,
          })
        );

        // Verify
        assertThat(valueCaptured, eq(90), "value 1");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_vertical_start_moving.png"),
          path.join(
            __dirname,
            "/golden/slider_input_vertical_start_moving.png"
          ),
          path.join(__dirname, "/slider_input_vertical_start_moving_diff.png")
        );

        // Execute
        this.cut.body.dispatchEvent(
          new PointerEvent("pointermove", {
            screenX: 0,
            screenY: 20,
          })
        );

        // Verify
        assertThat(valueCaptured, eq(80), "value 2");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_vertical_moving.png"),
          path.join(__dirname, "/golden/slider_input_vertical_moving.png"),
          path.join(__dirname, "/slider_input_vertical_moving_diff.png")
        );

        // Execute
        this.cut.body.dispatchEvent(
          new PointerEvent("pointermove", {
            screenX: 10,
            screenY: 100,
          })
        );

        // Verify
        assertThat(valueCaptured, eq(0), "value 3");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_vertical_moving_2.png"),
          path.join(__dirname, "/golden/slider_input_vertical_moving_2.png"),
          path.join(__dirname, "/slider_input_vertical_moving_2_diff.png")
        );

        // Execute
        this.cut.body.dispatchEvent(
          new PointerEvent("pointermove", {
            screenX: 10,
            screenY: 0,
          })
        );

        // Verify
        assertThat(valueCaptured, eq(100), "value 4");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_vertical_moving_3.png"),
          path.join(__dirname, "/golden/slider_input_vertical_moving_3.png"),
          path.join(__dirname, "/slider_input_vertical_moving_3_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
