import "../../common/normalize_body";
import path from "path";
import { setTabletView } from "../../common/view_port";
import { ConsumerPage } from "./body";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";

TEST_RUNNER.run({
  name: "ConsumerPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Render";
      private cut: ConsumerPage;
      public async execute() {
        // Prepare
        await setTabletView();

        // Execute
        this.cut = new ConsumerPage((...bodies) =>
          document.body.append(...bodies),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page.png"),
          path.join(__dirname, "/golden/consumer_page.png"),
          path.join(__dirname, "/consumer_page_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
