import path = require("path");
import {
  BlockingIconButton,
  IconButton,
  IconTooltipButton,
  TooltipPosition,
} from "./icon_button";
import { createCommentIcon } from "./icons";
import { normalizeBody } from "./normalize_body";
import { setTabletView } from "./view_port";
import { E } from "@selfage/element/factory";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

let container: HTMLDivElement;

class RenderOversizeCentering implements TestCase {
  private cut: IconButton;
  public constructor(
    public name: string,
    private position: TooltipPosition,
    private screenshotPath: string,
    private screenshotGoldenPath: string,
    private screenshotDiffPath: string,
  ) {}
  public async execute() {
    // Prepare
    await setTabletView();
    this.cut = new IconButton(
      2,
      0,
      "",
      createCommentIcon("currentColor"),
      this.position,
      "some text",
    ).enable();
    container.append(this.cut.body);

    // Execute
    this.cut.hover();
    await new Promise<void>((resolve) =>
      this.cut.once("tooltipShowed", resolve),
    );

    // Verify
    await asyncAssertScreenshot(
      this.screenshotPath,
      this.screenshotGoldenPath,
      this.screenshotDiffPath,
      { fullPage: true },
    );
  }
  public tearDown() {
    this.cut.remove();
  }
}

class RenderCenteringWithin implements TestCase {
  private cut: IconButton;
  public constructor(
    public name: string,
    private position: TooltipPosition,
    private screenshotPath: string,
    private screenshotGoldenPath: string,
    private screenshotDiffPath: string,
  ) {}
  public async execute() {
    // Prepare
    await setTabletView();
    this.cut = new IconButton(
      20,
      3,
      "",
      createCommentIcon("currentColor"),
      this.position,
      "some text",
    ).enable();
    container.append(this.cut.body);

    // Execute
    this.cut.hover();
    await new Promise<void>((resolve) =>
      this.cut.once("tooltipShowed", resolve),
    );

    // Verify
    await asyncAssertScreenshot(
      this.screenshotPath,
      this.screenshotGoldenPath,
      this.screenshotDiffPath,
      { fullPage: true },
    );
  }
  public tearDown() {
    this.cut.remove();
  }
}

TEST_RUNNER.run({
  name: "IconButtonTest",
  environment: {
    setUp() {
      container = E.div({
        style: `display: inline-block; background-color: black; margin: 10rem;`,
      });
      document.body.append(container);
    },
    tearDown() {
      container.remove();
    },
  },
  cases: [
    new RenderOversizeCentering(
      "RenderOversizeTop",
      TooltipPosition.TOP,
      path.join(__dirname, "/icon_button_oversize_top.png"),
      path.join(__dirname, "/golden/icon_button_oversize_top.png"),
      path.join(__dirname, "/icon_button_oversize_top_diff.png"),
    ),
    new RenderOversizeCentering(
      "RenderOversizeRight",
      TooltipPosition.RIGHT,
      path.join(__dirname, "/icon_button_oversize_right.png"),
      path.join(__dirname, "/golden/icon_button_oversize_right.png"),
      path.join(__dirname, "/icon_button_oversize_right_diff.png"),
    ),
    new RenderOversizeCentering(
      "RenderOversizeBottom",
      TooltipPosition.BOTTOM,
      path.join(__dirname, "/icon_button_oversize_bottom.png"),
      path.join(__dirname, "/golden/icon_button_oversize_bottom.png"),
      path.join(__dirname, "/icon_button_oversize_bottom_diff.png"),
    ),
    new RenderOversizeCentering(
      "RenderOversizeLeft",
      TooltipPosition.LEFT,
      path.join(__dirname, "/icon_button_oversize_left.png"),
      path.join(__dirname, "/golden/icon_button_oversize_left.png"),
      path.join(__dirname, "/icon_button_oversize_left_diff.png"),
    ),
    new RenderCenteringWithin(
      "RenderWithinTop",
      TooltipPosition.TOP,
      path.join(__dirname, "/icon_button_within_top.png"),
      path.join(__dirname, "/golden/icon_button_within_top.png"),
      path.join(__dirname, "/icon_button_within_top_diff.png"),
    ),
    new RenderCenteringWithin(
      "RenderWithinRight",
      TooltipPosition.RIGHT,
      path.join(__dirname, "/icon_button_within_right.png"),
      path.join(__dirname, "/golden/icon_button_within_right.png"),
      path.join(__dirname, "/icon_button_within_right_diff.png"),
    ),
    new RenderCenteringWithin(
      "RenderWithinBottom",
      TooltipPosition.BOTTOM,
      path.join(__dirname, "/icon_button_within_bottom.png"),
      path.join(__dirname, "/golden/icon_button_within_bottom.png"),
      path.join(__dirname, "/icon_button_within_bottom_diff.png"),
    ),
    new RenderCenteringWithin(
      "RenderWithinLeft",
      TooltipPosition.LEFT,
      path.join(__dirname, "/icon_button_within_left.png"),
      path.join(__dirname, "/golden/icon_button_within_left.png"),
      path.join(__dirname, "/icon_button_within_left_diff.png"),
    ),
    new (class implements TestCase {
      public name = "PointerLeft";
      private cut: IconButton;
      public async execute() {
        // Prepare
        this.cut = new IconButton(
          12,
          2,
          "",
          createCommentIcon("currentColor"),
          TooltipPosition.BOTTOM,
          "some text",
        ).enable();
        container.append(this.cut.body);
        this.cut.hover();
        await new Promise<void>((resolve) =>
          this.cut.once("tooltipShowed", resolve),
        );

        // Execute
        this.cut.leave();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/icon_button_left.png"),
          path.join(__dirname, "/golden/icon_button_left.png"),
          path.join(__dirname, "/icon_button_left_diff.png"),
          { fullPage: true },
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    {
      name: "Action",
      execute: () => {
        // Prepare
        let cut = new IconButton(
          12,
          2,
          "",
          createCommentIcon("currentColor"),
          TooltipPosition.BOTTOM,
          "some text",
        ).enable();
        let clicked = false;
        cut.on("action", () => (clicked = true));

        // Execute
        cut.click();

        // Verify
        assertThat(clicked, eq(true), "clicked");
      },
    },
    new (class implements TestCase {
      public name = "IconTooltipButton_ClickToShowTooltip";
      private cut: IconTooltipButton;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = new IconTooltipButton(
          12,
          2,
          "",
          createCommentIcon("currentColor"),
          TooltipPosition.BOTTOM,
          "some text",
        );
        container.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/icon_tooltip_button_default.png"),
          path.join(__dirname, "/golden/icon_tooltip_button_default.png"),
          path.join(__dirname, "/icon_tooltip_button_default_diff.png"),
          { fullPage: true },
        );

        // Execute
        this.cut.click();
        await new Promise<void>((resolve) =>
          this.cut.once("tooltipShowed", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/icon_tooltip_button_show.png"),
          path.join(__dirname, "/golden/icon_tooltip_button_show.png"),
          path.join(__dirname, "/icon_tooltip_button_show_diff.png"),
          { fullPage: true },
        );

        // Execute
        this.cut.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/icon_tooltip_button_hide.png"),
          path.join(__dirname, "/golden/icon_tooltip_button_default.png"),
          path.join(__dirname, "/icon_tooltip_button_hide_diff.png"),
          { fullPage: true },
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "BlockingIconButton_HoverToShowTooltip_ClickToBlock";
      private cut: BlockingIconButton;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = new BlockingIconButton(
          12,
          2,
          "",
          createCommentIcon("currentColor"),
          TooltipPosition.BOTTOM,
          "some text",
        ).enable();
        container.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/blocking_icon_button_default.png"),
          path.join(__dirname, "/golden/blocking_icon_button_default.png"),
          path.join(__dirname, "/blocking_icon_button_default_diff.png"),
          { fullPage: true },
        );

        // Execute
        this.cut.hover();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/blocking_icon_button_show_tooltip.png"),
          path.join(__dirname, "/golden/blocking_icon_button_show_tooltip.png"),
          path.join(__dirname, "/blocking_icon_button_show_tooltip_diff.png"),
          { fullPage: true },
        );

        // Execute
        this.cut.leave();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/blocking_icon_button_hide_tooltip.png"),
          path.join(__dirname, "/golden/blocking_icon_button_default.png"),
          path.join(__dirname, "/blocking_icon_button_hide_tooltip_diff.png"),
          { fullPage: true },
        );

        // Prepare
        let resolveFn: Function;
        let promise = new Promise<void>((resolve) => (resolveFn = resolve));
        this.cut.addAction(() => promise);

        // Execute
        this.cut.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/blocking_icon_button_blocking.png"),
          path.join(__dirname, "/golden/blocking_icon_button_blocking.png"),
          path.join(__dirname, "/blocking_icon_button_blocking_diff.png"),
          { fullPage: true },
        );

        // Execute
        resolveFn();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/blocking_icon_button_resolved.png"),
          path.join(__dirname, "/golden/blocking_icon_button_default.png"),
          path.join(__dirname, "/blocking_icon_button_resolved_diff.png"),
          { fullPage: true },
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
