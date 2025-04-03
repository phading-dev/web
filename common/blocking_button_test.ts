import "./normalize_body";
import path = require("path");
import {
  BlockingButton,
  FilledBlockingButton,
  OutlineBlockingButton,
  TextBlockingButton,
} from "./blocking_button";
import { E } from "@selfage/element/factory";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

class RenderCase implements TestCase {
  private container: HTMLDivElement;
  public constructor(
    public name: string,
    private buttonFactoryFn: (customeStyle: string) => BlockingButton,
    private renderScreenshotPath: string,
    private renderScreenshotGoldenPath: string,
    private renderScreenshotDiffPath: string,
    private disabledScreenshotPath: string,
    private disabledScreenshotGoldenPath: string,
    private disabledScreenshotDiffPath: string,
    private enabledScreenshotPath: string,
    private enabledScreenshotGoldenPath: string,
    private enabledScreenshotDiffPath: string,
  ) {}
  public async execute() {
    // Prepare
    await setViewport(200, 200);
    let cut = this.buttonFactoryFn("")
      .append(E.text("some button"))
      .enable()
      .show();
    let resolveFn: Function;
    let resovablePromise = new Promise<void>((resolve) => {
      resolveFn = resolve;
    });
    cut.on("action", () => resovablePromise);
    this.container = E.div({}, cut.body);

    // Execute
    document.body.append(this.container);
    // Verify
    await asyncAssertScreenshot(
      this.renderScreenshotPath,
      this.renderScreenshotGoldenPath,
      this.renderScreenshotDiffPath,
      {
        threshold: 0.05,
      },
    );

    // Execute
    cut.body.click();

    // Verify
    await asyncAssertScreenshot(
      this.disabledScreenshotPath,
      this.disabledScreenshotGoldenPath,
      this.disabledScreenshotDiffPath,
    );

    // Execute
    resolveFn();

    // Verify
    await asyncAssertScreenshot(
      this.enabledScreenshotPath,
      this.enabledScreenshotGoldenPath,
      this.enabledScreenshotDiffPath,
    );
  }
  public tearDown() {
    this.container.remove();
  }
}

TEST_RUNNER.run({
  name: "BlockingButtonTest",
  cases: [
    new RenderCase(
      "RenderFilledButton",
      FilledBlockingButton.create,
      path.join(__dirname, "/filled_blocking_button_default.png"),
      path.join(__dirname, "/golden/filled_blocking_button_default.png"),
      path.join(__dirname, "/filled_blocking_button_default_diff.png"),
      path.join(__dirname, "/filled_blocking_button_disabled.png"),
      path.join(__dirname, "/golden/filled_blocking_button_disabled.png"),
      path.join(__dirname, "/filled_blocking_button_disabled_diff.png"),
      path.join(__dirname, "/filled_blocking_button_enabled.png"),
      path.join(__dirname, "/golden/filled_blocking_button_default.png"),
      path.join(__dirname, "/filled_blocking_button_enabled_diff.png"),
    ),
    new RenderCase(
      "RenderOutlineButton",
      OutlineBlockingButton.create,
      path.join(__dirname, "/outline_blocking_button_default.png"),
      path.join(__dirname, "/golden/outline_blocking_button_default.png"),
      path.join(__dirname, "/outline_blocking_button_default_diff.png"),
      path.join(__dirname, "/outline_blocking_button_disabled.png"),
      path.join(__dirname, "/golden/outline_blocking_button_disabled.png"),
      path.join(__dirname, "/outline_blocking_button_disabled_diff.png"),
      path.join(__dirname, "/outline_blocking_button_enabled.png"),
      path.join(__dirname, "/golden/outline_blocking_button_default.png"),
      path.join(__dirname, "/outline_blocking_button_enabled_diff.png"),
    ),
    new RenderCase(
      "RenderTextButton",
      TextBlockingButton.create,
      path.join(__dirname, "/text_blocking_button_default.png"),
      path.join(__dirname, "/golden/text_blocking_button_default.png"),
      path.join(__dirname, "/text_blocking_button_default_diff.png"),
      path.join(__dirname, "/text_blocking_button_disabled.png"),
      path.join(__dirname, "/golden/text_blocking_button_disabled.png"),
      path.join(__dirname, "/text_blocking_button_disabled_diff.png"),
      path.join(__dirname, "/text_blocking_button_enabled.png"),
      path.join(__dirname, "/golden/text_blocking_button_default.png"),
      path.join(__dirname, "/text_blocking_button_enabled_diff.png"),
    ),
    {
      name: "DisabledButtonNotClickable",
      async execute() {
        // Prepare
        let actioned = false;
        let cut = FilledBlockingButton.create("");
        cut.on("action", async () => {
          actioned = true;
        });

        // Execute
        cut.disable();
        cut.click();
        await new Promise<void>((resolve) => setTimeout(resolve));

        // Verify
        assertThat(actioned, eq(false), "no action");
      },
    },
  ],
});
