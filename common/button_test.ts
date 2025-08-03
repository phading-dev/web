import path = require("path");
import {
  BlockingButton,
  FilledButton,
  OutlineButton,
  TextButton,
} from "./button";
import { normalizeBody } from "./normalize_body";
import { setTabletView } from "./view_port";
import { E } from "@selfage/element/factory";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

class RenderCase implements TestCase {
  private container: HTMLDivElement;
  public constructor(
    public name: string,
    private buttonFactoryFn: () => BlockingButton,
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
    await setTabletView();
    let resolveFn: Function;
    let resolvablePromise = new Promise<void>((resolve) => {
      resolveFn = resolve;
    });
    let cut = this.buttonFactoryFn().addAction(() => resolvablePromise);
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
    cut.click();

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
  name: "ButtonTest",
  cases: [
    new RenderCase(
      "RenderFilledButton",
      () =>
        new BlockingButton(new FilledButton().append(E.text("some button"))),
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
      () =>
        new BlockingButton(new OutlineButton().append(E.text("some button"))),
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
      () => new BlockingButton(new TextButton().append(E.text("some button"))),
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
      name: "PassResponseToAction",
      async execute() {
        // Prepare
        let actioned = false;
        let cut = new BlockingButton<number>(new FilledButton("")).addAction(
          async () => {
            return 1;
          },
          (error, response) => {
            assertThat(response, eq(1), "action response");
            actioned = true;
          },
        );

        // Execute
        cut.click();
        await new Promise<void>((resolve) => setTimeout(resolve));

        // Verify
        assertThat(actioned, eq(true), "actioned");
      },
    },
    {
      name: "DisabledButtonNotClickable",
      async execute() {
        // Prepare
        let actioned = false;
        let cut = new BlockingButton(new FilledButton("")).addAction(
          async () => {
            actioned = true;
          },
        );

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
