import path = require("path");
import { SCHEME } from "./color_scheme";
import { normalizeBody } from "./normalize_body";
import { OptionPill, OptionTab, RadioOptionsGroup } from "./option_buttons";
import { setTabletView } from "./view_port";
import { E } from "@selfage/element/factory";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

enum ValueType {
  WALK,
  RUN,
}

TEST_RUNNER.run({
  name: "OptionButtonsTest",
  cases: [
    new (class implements TestCase {
      public name = "OptionPills_ChooseTheSamePill_ChooseSecondPill";
      private container: HTMLDivElement;
      public async execute() {
        // Execute
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; background-color: ${SCHEME.neutral4}; display: flex; flex-flow: row nowrap; gap: 10px;`,
        });
        document.body.append(this.container);
        let walkOption = new OptionPill("Walk", ValueType.WALK);
        let runOption = new OptionPill("Run", ValueType.RUN);

        // Execute
        this.container.append(walkOption.body, runOption.body);
        let selectedValue: ValueType;
        let cut = new RadioOptionsGroup([walkOption, runOption]);
        cut.on("select", (value) => {
          selectedValue = value;
        });
        cut.setValue(ValueType.WALK);

        // Verify
        assertThat(selectedValue, eq(undefined), "no selected value");
        await asyncAssertScreenshot(
          path.join(__dirname, "/option_pills_default.png"),
          path.join(__dirname, "/golden/option_pills_default.png"),
          path.join(__dirname, "/option_pills_default_diff.png"),
          { fullPage: true },
        );

        // Execute
        walkOption.click();

        // Verify
        assertThat(
          selectedValue,
          eq(undefined),
          "not selecting the same value",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/option_pills_same_option.png"),
          path.join(__dirname, "/golden/option_pills_default.png"),
          path.join(__dirname, "/option_pills_same_option_diff.png"),
          { fullPage: true },
        );

        // Execute
        runOption.click();

        // Verify
        assertThat(selectedValue, eq(ValueType.RUN), "selected another value");
        await asyncAssertScreenshot(
          path.join(__dirname, "/option_pills_select_second.png"),
          path.join(__dirname, "/golden/option_pills_select_second.png"),
          path.join(__dirname, "/option_pills_select_second_diff.png"),
          { fullPage: true },
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "OptionTabs_ChooseTheSameTab_ChooseSecondTab";
      private container: HTMLDivElement;
      public async execute() {
        // Execute
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; background-color: ${SCHEME.neutral4}; display: flex; flex-flow: row nowrap;`,
        });
        document.body.append(this.container);
        let walkOption = new OptionTab("Walk", ValueType.WALK, "width: 100px;");
        let runOption = new OptionTab("Run", ValueType.RUN, "width: 100px;");

        // Execute
        this.container.append(walkOption.body, runOption.body);
        let selectedValue: ValueType;
        let cut = new RadioOptionsGroup([walkOption, runOption]);
        cut.on("select", (value) => {
          selectedValue = value;
        });
        cut.setValue(ValueType.WALK);

        // Verify
        assertThat(selectedValue, eq(undefined), "no selected value");
        await asyncAssertScreenshot(
          path.join(__dirname, "/option_tabs_default.png"),
          path.join(__dirname, "/golden/option_tabs_default.png"),
          path.join(__dirname, "/option_tabs_default_diff.png"),
          { fullPage: true },
        );

        // Execute
        walkOption.click();

        // Verify
        assertThat(
          selectedValue,
          eq(undefined),
          "not selecting the same value",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/option_tabs_same_option.png"),
          path.join(__dirname, "/golden/option_tabs_default.png"),
          path.join(__dirname, "/option_tabs_same_option_diff.png"),
          { fullPage: true },
        );

        // Execute
        runOption.click();

        // Verify
        assertThat(selectedValue, eq(ValueType.RUN), "selected another value");
        await asyncAssertScreenshot(
          path.join(__dirname, "/option_tabs_select_second.png"),
          path.join(__dirname, "/golden/option_tabs_select_second.png"),
          path.join(__dirname, "/option_tabs_select_second_diff.png"),
          { fullPage: true },
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
