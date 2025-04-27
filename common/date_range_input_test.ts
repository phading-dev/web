import path from "path";
import { SCHEME } from "./color_scheme";
import { DateRangeInput, DateType } from "./date_range_input";
import { normalizeBody } from "./normalize_body";
import { setDesktopView, setPhoneView, setTabletView } from "./view_port";
import { E } from "@selfage/element/factory";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "DateRangeInputTest",
  cases: [
    new (class implements TestCase {
      public name = "MonthRangeInput_DesktopView_TabletView_PhoneView";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setDesktopView();
        this.container = E.div({
          style: `width: 100%; background-color: ${SCHEME.neutral4};`,
        });
        document.body.append(this.container);
        let cut = new DateRangeInput(DateType.MONTH, 3, `width: 100%;`).show();

        // Execute
        cut.setValues("2025-01", "2025-01");
        this.container.append(cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/date_range_input_month_desktop.png"),
          path.join(__dirname, "/golden/date_range_input_month_desktop.png"),
          path.join(__dirname, "/date_range_input_month_desktop_diff.png"),
        );

        // Execute
        await setTabletView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/date_range_input_month_tablet.png"),
          path.join(__dirname, "/golden/date_range_input_month_tablet.png"),
          path.join(__dirname, "/date_range_input_month_tablet_diff.png"),
        );

        // Execute
        await setPhoneView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/date_range_input_month_phone.png"),
          path.join(__dirname, "/golden/date_range_input_month_phone.png"),
          path.join(__dirname, "/date_range_input_month_phone_diff.png"),
        );

        // Prepare
        let isInvalid = false;
        cut.on("invalid", () => {
          isInvalid = true;
        });

        // Execute
        cut.startRangeInput.val.value = "2025-02";
        cut.startRangeInput.val.dispatchEvent(new Event("input"));

        // Verify
        assertThat(isInvalid, eq(true), "invalid event");

        // Prepare
        isInvalid = false;

        // Execute
        cut.endRangeInput.val.value = "2025-05";
        cut.endRangeInput.val.dispatchEvent(new Event("input"));

        // Verify
        assertThat(isInvalid, eq(true), "invalid event 2");

        // Prepare
        let hasInput = false;
        cut.on("input", () => {
          hasInput = true;
        });

        // Execute
        cut.endRangeInput.val.value = "2025-04";
        cut.endRangeInput.val.dispatchEvent(new Event("input"));
        let { startRange, endRange } = cut.getValues();

        // Verify
        assertThat(hasInput, eq(true), "input event");
        assertThat(startRange, eq("2025-02"), "start range");
        assertThat(endRange, eq("2025-04"), "end range");
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "DayRangeInput_DesktopView_TabletView_PhoneView";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setDesktopView();
        this.container = E.div({
          style: `width: 100%; background-color: ${SCHEME.neutral4};`,
        });
        document.body.append(this.container);
        let cut = new DateRangeInput(DateType.DAY, 3, `width: 100%;`).show();

        // Execute
        cut.setValues("2025-01-01", "2025-01-01");
        this.container.append(cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/date_range_input_day_desktop.png"),
          path.join(__dirname, "/golden/date_range_input_day_desktop.png"),
          path.join(__dirname, "/date_range_input_day_desktop_diff.png"),
        );

        // Execute
        await setTabletView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/date_range_input_day_tablet.png"),
          path.join(__dirname, "/golden/date_range_input_day_tablet.png"),
          path.join(__dirname, "/date_range_input_day_tablet_diff.png"),
        );

        // Execute
        await setPhoneView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/date_range_input_day_phone.png"),
          path.join(__dirname, "/golden/date_range_input_day_phone.png"),
          path.join(__dirname, "/date_range_input_day_phone_diff.png"),
        );

        // Prepare
        let isInvalid = false;
        cut.on("invalid", () => {
          isInvalid = true;
        });

        // Execute
        cut.startRangeInput.val.value = "2025-01-02";
        cut.startRangeInput.val.dispatchEvent(new Event("input"));

        // Verify
        assertThat(isInvalid, eq(true), "invalid event");

        // Prepare
        isInvalid = false;

        // Execute
        cut.endRangeInput.val.value = "2025-01-05";
        cut.endRangeInput.val.dispatchEvent(new Event("input"));

        // Verify
        assertThat(isInvalid, eq(true), "invalid event 2");

        // Prepare
        let hasInput = false;
        cut.on("input", () => {
          hasInput = true;
        });

        // Execute
        cut.endRangeInput.val.value = "2025-01-04";
        cut.endRangeInput.val.dispatchEvent(new Event("input"));
        let { startRange, endRange } = cut.getValues();

        // Verify
        assertThat(hasInput, eq(true), "input event");
        assertThat(startRange, eq("2025-01-02"), "start range");
        assertThat(endRange, eq("2025-01-04"), "end range");
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
