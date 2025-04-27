import path from "path";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import "../../../common/normalize_body";
import { TEST_RUNNER } from "@selfage/puppeteer_test_runner";
import { PlayPage } from "./body";

TEST_RUNNER.run({
  name: "PlayPageTest",
  cases: [
    new (class {
      public name = "PlayPage";
      private cut: PlayPage;
      public async execute() {
        // Prepare
        let cut = PlayPage.create();

        // Execute
        document.body.append(cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_default.png"),
          path.join(__dirname, "/golden/play_page_default.png"),
          path.join(__dirname, "/play_page_default_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
