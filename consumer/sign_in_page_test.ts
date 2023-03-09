import { normalizeBody } from "./common/normalize_body";
import { SignInPage } from "./sign_in_page";
import { E } from "@selfage/element/factory";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/test_runner";

normalizeBody();

TEST_RUNNER.run({
  name: "SignInPageTest",
  cases: [
    new (class implements TestCase {
      public name = "RenderTall";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await puppeteerSetViewport(1000, 1000);
        let cut = new SignInPage(undefined, undefined);
        this.container = E.div({}, cut.body);
        document.body.appendChild(this.container);

        // Execute
        cut.show();

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/sign_in_page_tall_render.png",
          __dirname + "/golden/sign_in_page_tall_render.png",
          __dirname + "/sign_in_page_tall_render_diff.png"
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "RenderShort";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await puppeteerSetViewport(1000, 150);
        let cut = new SignInPage(undefined, undefined);
        this.container = E.div({}, cut.body);
        document.body.appendChild(this.container);

        // Execute
        cut.show();

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/sign_in_page_short_render.png",
          __dirname + "/golden/sign_in_page_short_render.png",
          __dirname + "/sign_in_page_short_render_diff.png"
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/sign_in_page_short_scroll_to_bottom.png",
          __dirname + "/golden/sign_in_page_short_scroll_to_bottom.png",
          __dirname + "/sign_in_page_short_scroll_to_bottom_diff.png"
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
