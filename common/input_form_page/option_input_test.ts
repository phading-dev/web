import path = require("path");
import { OptionButton, OptionInput } from "./option_input";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import "../normalize_body";

enum ValueType {
  WALK,
  RUN,
}

interface Request {
  movement?: ValueType;
}

TEST_RUNNER.run({
  name: "OptionInputTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_ChooseSecondOption";
      private cut: OptionInput<ValueType, Request>;
      public async execute() {
        // Execute
        this.cut = new OptionInput(
          "Choose",
          "",
          [
            new OptionButton("Walk", ValueType.WALK, ""),
            new OptionButton("Run", ValueType.RUN, ""),
          ],
          ValueType.WALK,
          (request, value) => {
            request.movement = value;
          }
        );
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/option_input_default.png"),
          path.join(__dirname, "/golden/option_input_default.png"),
          path.join(__dirname, "/option_input_default_diff.png"),
          { fullPage: true }
        );

        // Prepare
        let request: Request = {};

        // Execute
        this.cut.fillInRequest(request);

        // Verify
        assertThat(request.movement, eq(ValueType.WALK), "request is walk");

        // Execute
        this.cut.optionButtons[1].click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/option_input_select_second.png"),
          path.join(__dirname, "/golden/option_input_select_second.png"),
          path.join(__dirname, "/option_input_select_second_diff.png"),
          { fullPage: true }
        );

        // Execute
        this.cut.fillInRequest(request);

        // Verify
        assertThat(request.movement, eq(ValueType.RUN), "request is run");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
