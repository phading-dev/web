import "../normalize_body";
import path = require("path");
import { OptionButton, RadioOptionInput } from "./option_input";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

enum ValueType {
  WALK,
  RUN,
}

TEST_RUNNER.run({
  name: "RadioOptionInputTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_ChooseSecondOption";
      private cut: RadioOptionInput<ValueType>;
      public async execute() {
        // Execute
        let selectedValue: ValueType;
        this.cut = new RadioOptionInput(
          "Choose",
          "",
          [
            new OptionButton("Walk", ValueType.WALK, ""),
            new OptionButton("Run", ValueType.RUN, ""),
          ],
          ValueType.WALK,
          (value) => {
            selectedValue = value;
          },
        );
        document.body.append(this.cut.body);

        // Verify
        assertThat(selectedValue, eq(ValueType.WALK), "selected value");
        await asyncAssertScreenshot(
          path.join(__dirname, "/option_input_default.png"),
          path.join(__dirname, "/golden/option_input_default.png"),
          path.join(__dirname, "/option_input_default_diff.png"),
          { fullPage: true },
        );

        // Execute
        this.cut.optionButtons[1].click();

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
        this.cut.remove();
      }
    })(),
  ],
});
