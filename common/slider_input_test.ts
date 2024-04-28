import path = require("path");
import { Orientation, SliderInput } from "./slider_input";
import {
  mouseDown,
  mouseMove,
  mouseUp,
  setViewport,
  touchEnd,
  touchMove,
  touchStart,
  touchTap,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import "./normalize_body";

TEST_RUNNER.run({
  name: "SliderInputTest",
  environment: {
    setUp: () => {
      document.body.style.margin = "2rem";
    },
    tearDown: () => {
      document.body.style.margin = "";
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Horizontal_TouchMove_TouchMoveTo0_TouchMoveTo100";
      private cut: SliderInput;
      public async execute() {
        // Prepare
        await setViewport(200, 200);
        let valueCaptured: number;
        this.cut = new SliderInput(
          Orientation.HORIZONTAL,
          10,
          "",
          {
            start: 0,
            end: 100,
          },
          10,
        ).on("change", (value) => (valueCaptured = value));

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_horizontal.png"),
          path.join(__dirname, "/golden/slider_input_horizontal.png"),
          path.join(__dirname, "/slider_input_horizontal_diff.png"),
        );

        // Execute
        await touchStart(25, 25);

        // Verify
        assertThat(valueCaptured, eq(5), "value 1");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_started_moving.png"),
          path.join(__dirname, "/golden/slider_input_started_moving.png"),
          path.join(__dirname, "/slider_input_started_moving_diff.png"),
        );

        // Execute
        await touchMove(80, 25);

        // Verify
        assertThat(valueCaptured, eq(60), "value 2");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_moving.png"),
          path.join(__dirname, "/golden/slider_input_moving.png"),
          path.join(__dirname, "/slider_input_moving_diff.png"),
        );

        // Execute
        await touchMove(0, 60);

        // Verify
        assertThat(valueCaptured, eq(0), "value 3");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_moving_to_0.png"),
          path.join(__dirname, "/golden/slider_input_moving_to_0.png"),
          path.join(__dirname, "/slider_input_moving_to_0_diff.png"),
        );

        // Execute
        await touchEnd();

        // Verify
        await touchTap(25, 5);
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_moving_to_0_ended.png"),
          path.join(__dirname, "/golden/slider_input_moving_to_0.png"),
          path.join(__dirname, "/slider_input_moving_to_0_ended_diff.png"),
        );

        // Execute
        await touchStart(25, 25);
        await touchMove(150, 0);
        await touchEnd();

        // Verify
        assertThat(valueCaptured, eq(100), "value 5");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_moving_to_100.png"),
          path.join(__dirname, "/golden/slider_input_moving_to_100.png"),
          path.join(__dirname, "/slider_input_moving_to_100_diff.png"),
          {
            threshold: 0.001,
          },
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Vertical_MouseMove_MouseMoveTo0_MouseMoveTo100";
      private cut: SliderInput;
      public async execute() {
        // Prepare
        await setViewport(200, 200);
        let valueCaptured: number;
        this.cut = new SliderInput(
          Orientation.VERTICAL,
          10,
          "",
          {
            start: 0,
            end: 100,
          },
          10,
        ).on("change", (value) => (valueCaptured = value));

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_vertical.png"),
          path.join(__dirname, "/golden/slider_input_vertical.png"),
          path.join(__dirname, "/slider_input_vertical_diff.png"),
        );

        // Execute
        await mouseMove(25, 25, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_vertical_not_moved.png"),
          path.join(__dirname, "/golden/slider_input_vertical.png"),
          path.join(__dirname, "/slider_input_vertical_not_moved_diff.png"),
        );

        // Execute
        await mouseDown();

        // Verify
        assertThat(valueCaptured, eq(95), "value 1");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_vertical_started_moving.png"),
          path.join(
            __dirname,
            "/golden/slider_input_vertical_started_moving.png",
          ),
          path.join(
            __dirname,
            "/slider_input_vertical_started_moving_diff.png",
          ),
        );

        // Execute
        await mouseMove(25, 40, 1);

        // Verify
        assertThat(valueCaptured, eq(80), "value 2");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_vertical_moving.png"),
          path.join(__dirname, "/golden/slider_input_vertical_moving.png"),
          path.join(__dirname, "/slider_input_vertical_moving_diff.png"),
        );

        // Execute
        await mouseMove(60, 150, 1);

        // Verify
        assertThat(valueCaptured, eq(0), "value 3");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_vertical_moving_to_0.png"),
          path.join(__dirname, "/golden/slider_input_vertical_moving_to_0.png"),
          path.join(__dirname, "/slider_input_vertical_moving_to_0_diff.png"),
        );

        // Execute
        await mouseUp();
        await mouseMove(25, 25, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_vertical_up_not_moved.png"),
          path.join(__dirname, "/golden/slider_input_vertical_moving_to_0.png"),
          path.join(__dirname, "/slider_input_vertical_up_not_moved_diff.png"),
        );

        // Execute
        await mouseDown();
        await mouseMove(0, 0, 1);

        // Verify
        assertThat(valueCaptured, eq(100), "value 4");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_input_vertical_moving_to_100.png"),
          path.join(
            __dirname,
            "/golden/slider_input_vertical_moving_to_100.png",
          ),
          path.join(__dirname, "/slider_input_vertical_moving_to_100_diff.png"),
          {
            threshold: 0.001,
          },
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
