import path = require("path");
import { SCHEME } from "../color_scheme";
import { normalizeBody } from "../normalize_body";
import { OptionPill } from "../option_pills";
import { setTabletView } from "../view_port";
import { RadioOptionInput } from "./option_input";
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
  name: "RadioOptionInputTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_ChooseSecondOption";
      private container: HTMLDivElement;
      public async execute() {
        // Execute
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; background-color: ${SCHEME.neutral4};`,
        });
        document.body.append(this.container);

        // Execute
        let selectedValue: ValueType;
        let cut = new RadioOptionInput(
          "Choose",
          "",
          [
            new OptionPill("Walk", ValueType.WALK),
            new OptionPill("Run", ValueType.RUN),
          ],
          ValueType.WALK,
          (value) => {
            selectedValue = value;
          },
        );
        this.container.append(cut.body);

        // Verify
        assertThat(selectedValue, eq(ValueType.WALK), "selected value");
        await asyncAssertScreenshot(
          path.join(__dirname, "/option_input_default.png"),
          path.join(__dirname, "/golden/option_input_default.png"),
          path.join(__dirname, "/option_input_default_diff.png"),
          { fullPage: true },
        );

        // Execute
        cut.radioOptionPills.val.pills[1].click();

        // Verify
        assertThat(selectedValue, eq(ValueType.RUN), "selected value 2");
        await asyncAssertScreenshot(
          path.join(__dirname, "/option_input_select_second.png"),
          path.join(__dirname, "/golden/option_input_select_second.png"),
          path.join(__dirname, "/option_input_select_second_diff.png"),
          { fullPage: true },
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
