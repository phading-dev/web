import path = require("path");
import { SCHEME } from "./color_scheme";
import { normalizeBody } from "./normalize_body";
import { OptionPill, RadioOptionPills } from "./option_pills";
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
  name: "RadioOptionPillsTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_ChooseSecondOption";
      private container: HTMLDivElement;
      public async execute() {
        // Execute
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; background-color: ${SCHEME.neutral4}; display: flex; flex-flow: row nowrap; gap: 1rem;`,
        });
        document.body.append(this.container);

        // Execute
        let selectedValue: ValueType;
        let cut = new RadioOptionPills([
          new OptionPill("Walk", ValueType.WALK),
          new OptionPill("Run", ValueType.RUN),
        ]);
        cut.on("selected", (value) => {
          selectedValue = value;
        });
        this.container.append(...cut.elements);
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
        cut.pills[1].click();

        // Verify
        assertThat(selectedValue, eq(ValueType.RUN), "selected value");
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
  ],
});
