import {
  BlockingButton,
  FilledBlockingButton,
  OutlineBlockingButton,
  TextBlockingButton,
} from "./blocking_button";
import { normalizeBody } from "./normalize_body";
import { E } from "@selfage/element/factory";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/test_runner";

normalizeBody();

class RenderCase implements TestCase {
  private container: HTMLDivElement;
  public constructor(
    public name: string,
    private buttonFactoryFn: (
      enabled: boolean,
      ...childNodes: Array<Node>
    ) => BlockingButton,
    private renderScreenshotPath: string,
    private renderScreenshotGoldenPath: string,
    private renderScreenshotDiffPath: string,
    private disabledScreenshotPath: string,
    private disabledScreenshotGoldenPath: string,
    private disabledScreenshotDiffPath: string,
    private enabledScreenshotPath: string,
    private enabledScreenshotGoldenPath: string,
    private enabledScreenshotDiffPath: string
  ) {}
  public async execute() {
    // Prepare
    let cut = this.buttonFactoryFn(true, E.text("some button")).show();
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
      this.renderScreenshotDiffPath
    );

    // Execute
    cut.body.click();

    // Verify
    await asyncAssertScreenshot(
      this.disabledScreenshotPath,
      this.disabledScreenshotGoldenPath,
      this.disabledScreenshotDiffPath
    );

    // Execute
    resolveFn();

    // Verify
    await asyncAssertScreenshot(
      this.enabledScreenshotPath,
      this.enabledScreenshotGoldenPath,
      this.enabledScreenshotDiffPath
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
      __dirname + "/filled_blocking_button_render.png",
      __dirname + "/golden/filled_blocking_button_render.png",
      __dirname + "/filled_blocking_button_render_diff.png",
      __dirname + "/filled_blocking_button_disabled.png",
      __dirname + "/golden/filled_blocking_button_disabled.png",
      __dirname + "/filled_blocking_button_disabled_diff.png",
      __dirname + "/filled_blocking_button_enabled.png",
      __dirname + "/golden/filled_blocking_button_render.png",
      __dirname + "/filled_blocking_button_enabled.png"
    ),
    new RenderCase(
      "RenderOutlineButton",
      OutlineBlockingButton.create,
      __dirname + "/outline_blocking_button_render.png",
      __dirname + "/golden/outline_blocking_button_render.png",
      __dirname + "/outline_blocking_button_render_diff.png",
      __dirname + "/outline_blocking_button_disabled.png",
      __dirname + "/golden/outline_blocking_button_disabled.png",
      __dirname + "/outline_blocking_button_disabled_diff.png",
      __dirname + "/outline_blocking_button_enabled.png",
      __dirname + "/golden/outline_blocking_button_render.png",
      __dirname + "/outline_blocking_button_enabled.png"
    ),
    new RenderCase(
      "RenderTextButton",
      TextBlockingButton.create,
      __dirname + "/text_blocking_button_render.png",
      __dirname + "/golden/text_blocking_button_render.png",
      __dirname + "/text_blocking_button_render_diff.png",
      __dirname + "/text_blocking_button_disabled.png",
      __dirname + "/golden/text_blocking_button_disabled.png",
      __dirname + "/text_blocking_button_disabled_diff.png",
      __dirname + "/text_blocking_button_enabled.png",
      __dirname + "/golden/text_blocking_button_render.png",
      __dirname + "/text_blocking_button_enabled.png"
    ),
  ],
});
