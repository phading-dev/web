import path = require("path");
import { OptionButton, OptionInput } from "./option_input";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import "./normalize_body";

enum ValueType {
  WALK,
  RUN,
}

TEST_RUNNER.run({
  name: "OptionInputTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_ChooseSecondOption";
      private cut: OptionInput<ValueType>;
      public async execute() {
        // Execute
        this.cut = new OptionInput(
          "Choose",
          "",
          [
            new OptionButton("Walk", ValueType.WALK, ""),
            new OptionButton("Run", ValueType.RUN, ""),
          ],
          0
        );
        document.body.append(this.cut.body);

        // Verify
        assertThat(this.cut.value, eq(ValueType.WALK), "value is walk");
        await asyncAssertScreenshot(
          path.join(__dirname, "/option_input_default.png"),
          path.join(__dirname, "/golden/option_input_default.png"),
          path.join(__dirname, "/option_input_default_diff.png"),
          { fullPage: true }
        );

        // Prepare
        let valueCaptured: ValueType;
        this.cut.on("select", (value) => (valueCaptured = value));

        // Execute
        this.cut.options[1].body.click();

        // Verify
        assertThat(this.cut.value, eq(ValueType.RUN), "value is run");
        assertThat(valueCaptured, eq(ValueType.RUN), "value captured is run");
        await asyncAssertScreenshot(
          path.join(__dirname, "/option_input_select_second.png"),
          path.join(__dirname, "/golden/option_input_select_second.png"),
          path.join(__dirname, "/option_input_select_second_diff.png"),
          { fullPage: true }
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
