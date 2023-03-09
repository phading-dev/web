import { SCHEME } from "./color_scheme";
import { IconButton, TooltipPosition } from "./icon_button";
import { createCommentIcon } from "./icons";
import { normalizeBody } from "./normalize_body";
import { E } from "@selfage/element/factory";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/test_runner";

normalizeBody();

class RenderOversizeCentering implements TestCase {
  private container: HTMLDivElement;
  public constructor(
    public name: string,
    private position: TooltipPosition,
    private screenshotPath: string,
    private screenshotGoldenPath: string,
    private screenshotDiffPath: string
  ) {}
  public async execute() {
    // Prepare
    let cut = new IconButton(
      `width: 1rem; height: 1rem;`,
      createCommentIcon(SCHEME.neutral1),
      this.position,
      "some text"
    ).show();
    this.container = E.div(
      {
        style: `display: inline-block; background-color: red; margin: 10rem;`,
      },
      cut.body
    );
    document.body.append(this.container);

    // Execute
    cut.body.dispatchEvent(new MouseEvent("mouseenter"));
    await new Promise<void>((resolve) => cut.once("tooltipShowed", resolve));

    // Verify
    await asyncAssertScreenshot(
      this.screenshotPath,
      this.screenshotGoldenPath,
      this.screenshotDiffPath,
      { fullPage: true }
    );
  }
  public tearDown() {
    this.container.remove();
  }
}

class RenderCenteringWithin implements TestCase {
  private container: HTMLDivElement;
  public constructor(
    public name: string,
    private position: TooltipPosition,
    private screenshotPath: string,
    private screenshotGoldenPath: string,
    private screenshotDiffPath: string
  ) {}
  public async execute() {
    // Prepare
    let cut = new IconButton(
      `width: 12rem; height: 12rem;`,
      createCommentIcon(SCHEME.neutral1),
      this.position,
      "some text"
    ).show();
    this.container = E.div(
      {
        style: `display: inline-block; background-color: red; margin: 10rem;`,
      },
      cut.body
    );
    document.body.append(this.container);

    // Execute
    cut.body.dispatchEvent(new MouseEvent("mouseenter"));
    await new Promise<void>((resolve) => cut.once("tooltipShowed", resolve));

    // Verify
    await asyncAssertScreenshot(
      this.screenshotPath,
      this.screenshotGoldenPath,
      this.screenshotDiffPath,
      { fullPage: true }
    );
  }
  public tearDown() {
    this.container.remove();
  }
}

TEST_RUNNER.run({
  name: "IconButtonTest",
  cases: [
    new RenderOversizeCentering(
      "RenderOversizeTop",
      TooltipPosition.TOP,
      __dirname + "/icon_button_render_oversize_top.png",
      __dirname + "/golden/icon_button_render_oversize_top.png",
      __dirname + "/icon_button_render_oversize_top_diff.png"
    ),
    new RenderOversizeCentering(
      "RenderOversizeRight",
      TooltipPosition.RIGHT,
      __dirname + "/icon_button_render_oversize_right.png",
      __dirname + "/golden/icon_button_render_oversize_right.png",
      __dirname + "/icon_button_render_oversize_right_diff.png"
    ),
    new RenderOversizeCentering(
      "RenderOversizeBottom",
      TooltipPosition.BOTTOM,
      __dirname + "/icon_button_render_oversize_bottom.png",
      __dirname + "/golden/icon_button_render_oversize_bottom.png",
      __dirname + "/icon_button_render_oversize_bottom_diff.png"
    ),
    new RenderOversizeCentering(
      "RenderOversizeLeft",
      TooltipPosition.LEFT,
      __dirname + "/icon_button_render_oversize_left.png",
      __dirname + "/golden/icon_button_render_oversize_left.png",
      __dirname + "/icon_button_render_oversize_left_diff.png"
    ),
    new RenderCenteringWithin(
      "RenderWithinTop",
      TooltipPosition.TOP,
      __dirname + "/icon_button_render_within_top.png",
      __dirname + "/golden/icon_button_render_within_top.png",
      __dirname + "/icon_button_render_within_top_diff.png"
    ),
    new RenderCenteringWithin(
      "RenderWithinRight",
      TooltipPosition.RIGHT,
      __dirname + "/icon_button_render_within_right.png",
      __dirname + "/golden/icon_button_render_within_right.png",
      __dirname + "/icon_button_render_within_right_diff.png"
    ),
    new RenderCenteringWithin(
      "RenderWithinBottom",
      TooltipPosition.BOTTOM,
      __dirname + "/icon_button_render_within_bottom.png",
      __dirname + "/golden/icon_button_render_within_bottom.png",
      __dirname + "/icon_button_render_within_bottom_diff.png"
    ),
    new RenderCenteringWithin(
      "RenderWithinLeft",
      TooltipPosition.LEFT,
      __dirname + "/icon_button_render_within_left.png",
      __dirname + "/golden/icon_button_render_within_left.png",
      __dirname + "/icon_button_render_within_left_diff.png"
    ),
  ],
});
