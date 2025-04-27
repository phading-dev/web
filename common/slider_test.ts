import path = require("path");
import { normalizeBody } from "./normalize_body";
import { Orientation, Slider } from "./slider";
import { setTabletView } from "./view_port";
import {
  mouseDown,
  mouseMove,
  mouseUp,
  touchEnd,
  touchMove,
  touchStart,
  touchTap,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "SliderTest",
  environment: {
    setUp: () => {
      document.body.style.margin = "2rem";
    },
    tearDown: () => {
      document.body.style.margin = "0";
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Horizontal_TouchMove_TouchMoveTo0_TouchMoveTo100";
      private cut: Slider;
      public async execute() {
        // Prepare
        await setTabletView();
        let valueCaptured: number;
        this.cut = new Slider(
          Orientation.HORIZONTAL,
          `10rem`,
          `1rem`,
          0,
          100,
          "",
          10,
        ).on("change", (value) => (valueCaptured = value));

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_horizontal.png"),
          path.join(__dirname, "/golden/slider_horizontal.png"),
          path.join(__dirname, "/slider_horizontal_diff.png"),
        );

        // Execute
        await touchStart(25, 25);

        // Verify
        assertThat(valueCaptured, eq(5), "value 1");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_started_moving.png"),
          path.join(__dirname, "/golden/slider_started_moving.png"),
          path.join(__dirname, "/slider_started_moving_diff.png"),
        );

        // Execute
        await touchMove(80, 25);

        // Verify
        assertThat(valueCaptured, eq(60), "value 2");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_moving.png"),
          path.join(__dirname, "/golden/slider_moving.png"),
          path.join(__dirname, "/slider_moving_diff.png"),
        );

        // Execute
        await touchMove(0, 60);

        // Verify
        assertThat(valueCaptured, eq(0), "value 3");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_moving_to_0.png"),
          path.join(__dirname, "/golden/slider_moving_to_0.png"),
          path.join(__dirname, "/slider_moving_to_0_diff.png"),
        );

        // Execute
        await touchEnd();

        // Verify
        await touchTap(25, 5);
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_moving_to_0_ended.png"),
          path.join(__dirname, "/golden/slider_moving_to_0.png"),
          path.join(__dirname, "/slider_moving_to_0_ended_diff.png"),
        );

        // Execute
        await touchStart(25, 25);
        await touchMove(150, 0);
        await touchEnd();

        // Verify
        assertThat(valueCaptured, eq(100), "value 5");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_moving_to_100.png"),
          path.join(__dirname, "/golden/slider_moving_to_100.png"),
          path.join(__dirname, "/slider_moving_to_100_diff.png"),
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
      private cut: Slider;
      public async execute() {
        // Prepare
        await setTabletView();
        let valueCaptured: number;
        this.cut = new Slider(
          Orientation.VERTICAL,
          `10rem`,
          `1rem`,
          0,
          100,
          "",
          10,
        ).on("change", (value) => (valueCaptured = value));

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_vertical.png"),
          path.join(__dirname, "/golden/slider_vertical.png"),
          path.join(__dirname, "/slider_vertical_diff.png"),
        );

        // Execute
        await mouseMove(25, 25, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_vertical_not_moved.png"),
          path.join(__dirname, "/golden/slider_vertical.png"),
          path.join(__dirname, "/slider_vertical_not_moved_diff.png"),
        );

        // Execute
        await mouseDown();

        // Verify
        assertThat(valueCaptured, eq(95), "value 1");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_vertical_started_moving.png"),
          path.join(__dirname, "/golden/slider_vertical_started_moving.png"),
          path.join(__dirname, "/slider_vertical_started_moving_diff.png"),
        );

        // Execute
        await mouseMove(25, 40, 1);

        // Verify
        assertThat(valueCaptured, eq(80), "value 2");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_vertical_moving.png"),
          path.join(__dirname, "/golden/slider_vertical_moving.png"),
          path.join(__dirname, "/slider_vertical_moving_diff.png"),
        );

        // Execute
        await mouseMove(60, 150, 1);

        // Verify
        assertThat(valueCaptured, eq(0), "value 3");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_vertical_moving_to_0.png"),
          path.join(__dirname, "/golden/slider_vertical_moving_to_0.png"),
          path.join(__dirname, "/slider_vertical_moving_to_0_diff.png"),
        );

        // Execute
        await mouseUp();
        await mouseMove(25, 25, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_vertical_up_not_moved.png"),
          path.join(__dirname, "/golden/slider_vertical_moving_to_0.png"),
          path.join(__dirname, "/slider_vertical_up_not_moved_diff.png"),
        );

        // Execute
        await mouseDown();
        await mouseMove(0, 0, 1);

        // Verify
        assertThat(valueCaptured, eq(100), "value 4");
        await asyncAssertScreenshot(
          path.join(__dirname, "/slider_vertical_moving_to_100.png"),
          path.join(__dirname, "/golden/slider_vertical_moving_to_100.png"),
          path.join(__dirname, "/slider_vertical_moving_to_100_diff.png"),
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
