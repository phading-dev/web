import path = require("path");
import { DanmakuCanvas } from "./body";
import { DanmakuElementMock } from "./element_mock";
import { Comment } from "@phading/comment_service_interface/show_app/comment";
import {
  DanmakuSettings,
  StackingMethod,
} from "@phading/product_service_interface/consumer/show_app/player_settings";
import { E } from "@selfage/element/factory";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { Ref } from "@selfage/ref";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import "../../../../../../common/normalize_body";

let SETTINGS: DanmakuSettings = {
  enable: true,
  stackingMethod: StackingMethod.RANDOM,
  density: 100,
  topMargin: 0,
  bottomMargin: 0,
  fontSize: 18,
  opacity: 80,
  speed: 100,
  fontFamily: "cursive",
};

function createComment(index: number): Comment {
  return {
    content: `Some content ${index}!`,
  };
}

function createMultipleComments(
  totalCount: Ref<number>,
  upTo: number,
): Array<Comment> {
  let comments = new Array<Comment>();
  for (; totalCount.val < upTo; totalCount.val++) {
    comments.push(createComment(totalCount.val));
  }
  return comments;
}

let container: HTMLDivElement;

TEST_RUNNER.run({
  name: "DanmakuCanvasTest",
  environment: {
    setUp() {
      container = E.div({
        style: `width: 100vw; height: 100vh; background-color: white;`,
      });
      document.body.append(container);
    },
    tearDown() {
      container.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name =
        "RandomOne_FilledBothUpAndDown_ReleaseOccupied_FilledBottomUp_DisplayEnded_DisabledWithNothingAdded_EnabledAndAddedWthTopDown";
      private cut: DanmakuCanvas;
      public async execute() {
        // Prepare
        await setViewport(400, 300);
        let elementCount = new Ref<number>();
        elementCount.val = 0;
        let randomNum: number;
        let pausedPosX: number;
        let allElementsMock = new Array<DanmakuElementMock>();
        let settings: DanmakuSettings = { ...SETTINGS };
        this.cut = new DanmakuCanvas(
          () => randomNum,
          (danmakuSettigns, comment) => {
            let element = new DanmakuElementMock(
              pausedPosX,
              danmakuSettigns,
              comment,
            );
            allElementsMock.push(element);
            return element;
          },
          0,
          settings,
        );
        container.append(this.cut.body);
        // Allow for resize observer to catch back
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        randomNum = 0.15;
        pausedPosX = 5;

        // Execute
        this.cut.play();
        this.cut.add([createComment(elementCount.val++)]);
        this.cut.pause();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_canvas_one_element.png"),
          path.join(__dirname, "/golden/danmaku_canvas_one_element.png"),
          path.join(__dirname, "/danmaku_canvas_one_element_diff.png"),
        );

        // Execute
        this.cut.add(createMultipleComments(elementCount, 13));
        this.cut.pause();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_canvas_filled.png"),
          path.join(__dirname, "/golden/danmaku_canvas_filled.png"),
          path.join(__dirname, "/danmaku_canvas_filled_diff.png"),
        );

        // Prepare
        randomNum = 0.999;

        // Execute
        allElementsMock[0].pausedPosX = -200;
        allElementsMock[0].emit("occupyEnded");
        allElementsMock[2].pausedPosX = -200;
        allElementsMock[2].emit("occupyEnded");
        allElementsMock[11].pausedPosX = -200;
        allElementsMock[11].emit("occupyEnded");
        this.cut.add(createMultipleComments(elementCount, 17));
        this.cut.pause();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_canvas_occupy_eneded_and_filled.png"),
          path.join(
            __dirname,
            "/golden/danmaku_canvas_occupy_eneded_and_filled.png",
          ),
          path.join(
            __dirname,
            "/danmaku_canvas_occupy_eneded_and_filled_diff.png",
          ),
        );

        // Execute
        allElementsMock[0].emit("displayEnded");
        allElementsMock[2].emit("displayEnded");
        allElementsMock[11].emit("displayEnded");
        allElementsMock[14].emit("occupyEnded");
        allElementsMock[14].emit("displayEnded");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_canvas_some_display_ended.png"),
          path.join(__dirname, "/golden/danmaku_canvas_some_display_ended.png"),
          path.join(__dirname, "/danmaku_canvas_some_display_ended_diff.png"),
        );

        // Prepare
        settings.enable = false;
        settings.stackingMethod = StackingMethod.TOP_DOWN;

        // Execute
        this.cut.updateSettings();
        this.cut.add([createComment(elementCount.val++)]);
        this.cut.pause();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_canvas_add_when_disabled.png"),
          path.join(__dirname, "/golden/empty.png"),
          path.join(__dirname, "/danmaku_canvas_add_when_disabled_diff.png"),
        );

        // Prepare
        settings.enable = true;
        settings.stackingMethod = StackingMethod.TOP_DOWN;

        // Execute
        this.cut.add(createMultipleComments(elementCount, 22));
        this.cut.pause();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_canvas_add_after_enabled.png"),
          path.join(__dirname, "/golden/danmaku_canvas_add_after_enabled.png"),
          path.join(__dirname, "/danmaku_canvas_add_after_enabled_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TopDown_Rerender";
      private cut: DanmakuCanvas;
      public async execute() {
        // Prepare
        await setViewport(400, 300);
        let elementCount = new Ref<number>();
        elementCount.val = 0;
        let pausedPosX: number;
        let settings: DanmakuSettings = { ...SETTINGS };
        this.cut = new DanmakuCanvas(
          () => 0,
          (danmakuSettigns, comment) =>
            new DanmakuElementMock(pausedPosX, danmakuSettigns, comment),
          0,
          settings,
        );
        container.append(this.cut.body);
        // Allow for resize observer to catch back
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        pausedPosX = 5;

        // Execute
        this.cut.add(createMultipleComments(elementCount, 5));
        this.cut.pause();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_canvas_simple_top_down.png"),
          path.join(__dirname, "/golden/danmaku_canvas_simple_top_down.png"),
          path.join(__dirname, "/danmaku_canvas_simple_top_down_diff.png"),
        );

        // Prepare
        settings.opacity = 50;
        settings.fontSize = 12;

        // Execute
        this.cut.updateSettings();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_canvas_rerender_elements.png"),
          path.join(__dirname, "/golden/danmaku_canvas_rerender_elements.png"),
          path.join(__dirname, "/danmaku_canvas_rerender_elements_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "HalfDensity_AddTopDown_AddBottomUp";
      private cut: DanmakuCanvas;
      public async execute() {
        // Prepare
        await setViewport(400, 300);
        let elementCount = new Ref<number>();
        elementCount.val = 0;
        let randomNum: number;
        let pausedPosX: number;
        let allElementsMock = new Array<DanmakuElementMock>();
        let settings: DanmakuSettings = {
          ...SETTINGS,
          stackingMethod: StackingMethod.TOP_DOWN,
          density: 50,
        };
        this.cut = new DanmakuCanvas(
          () => randomNum,
          (danmakuSettigns, comment) => {
            let element = new DanmakuElementMock(
              pausedPosX,
              danmakuSettigns,
              comment,
            );
            allElementsMock.push(element);
            return element;
          },
          0,
          settings,
        );
        container.append(this.cut.body);
        // Allow for resize observer to catch back
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        pausedPosX = 5;

        // Execute
        this.cut.add(createMultipleComments(elementCount, 8));
        this.cut.pause();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_canvas_half_density_top_down.png"),
          path.join(
            __dirname,
            "/golden/danmaku_canvas_half_density_top_down.png",
          ),
          path.join(
            __dirname,
            "/danmaku_canvas_half_density_top_down_diff.png",
          ),
        );

        // Prepare
        allElementsMock[5].emit("occupyEnded");
        allElementsMock[5].emit("displayEnded");
        allElementsMock[6].emit("occupyEnded");
        allElementsMock[6].emit("displayEnded");
        settings.stackingMethod = StackingMethod.RANDOM;
        randomNum = 0.999;

        // Execute
        this.cut.add(createMultipleComments(elementCount, 11));
        this.cut.pause();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_canvas_half_density_bottom_up.png"),
          path.join(
            __dirname,
            "/golden/danmaku_canvas_half_density_bottom_up.png",
          ),
          path.join(
            __dirname,
            "/danmaku_canvas_half_density_bottom_up_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TopAndBottomMargin_AddTopDown_AddBottomUp";
      private cut: DanmakuCanvas;
      public async execute() {
        // Prepare
        await setViewport(400, 380);
        let elementCount = new Ref<number>();
        elementCount.val = 0;
        let randomNum: number;
        let pausedPosX: number;
        let allElementsMock = new Array<DanmakuElementMock>();
        let settings: DanmakuSettings = {
          ...SETTINGS,
          stackingMethod: StackingMethod.TOP_DOWN,
          topMargin: 20,
          bottomMargin: 20,
        };
        this.cut = new DanmakuCanvas(
          () => randomNum,
          (danmakuSettigns, comment) => {
            let element = new DanmakuElementMock(
              pausedPosX,
              danmakuSettigns,
              comment,
            );
            allElementsMock.push(element);
            return element;
          },
          80,
          settings,
        );
        container.append(this.cut.body);
        // Allow for resize observer to catch back
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        pausedPosX = 5;

        // Execute
        this.cut.add(createMultipleComments(elementCount, 9));
        this.cut.pause();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_canvas_margins_top_down.png"),
          path.join(__dirname, "/golden/danmaku_canvas_margins_top_down.png"),
          path.join(__dirname, "/danmaku_canvas_margins_top_down_diff.png"),
        );

        // Prepare
        allElementsMock[0].emit("occupyEnded");
        allElementsMock[0].emit("displayEnded");
        allElementsMock[3].emit("occupyEnded");
        allElementsMock[3].emit("displayEnded");
        allElementsMock[6].emit("occupyEnded");
        allElementsMock[6].emit("displayEnded");
        allElementsMock[7].emit("occupyEnded");
        allElementsMock[7].emit("displayEnded");
        settings.stackingMethod = StackingMethod.RANDOM;
        randomNum = 0.999;

        // Execute
        this.cut.add(createMultipleComments(elementCount, 14));
        this.cut.pause();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_canvas_margins_bottom_up.png"),
          path.join(__dirname, "/golden/danmaku_canvas_margins_bottom_up.png"),
          path.join(__dirname, "/danmaku_canvas_margins_bottom_up_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TooMuchTopAndBottomMargin";
      private cut: DanmakuCanvas;
      public async execute() {
        // Prepare
        await setViewport(400, 380);
        let elementCount = new Ref<number>();
        elementCount.val = 0;
        let pausedPosX: number;
        let settings: DanmakuSettings = {
          ...SETTINGS,
          topMargin: 50,
          bottomMargin: 50,
        };
        this.cut = new DanmakuCanvas(
          () => 0,
          (danmakuSettigns, comment) =>
            new DanmakuElementMock(pausedPosX, danmakuSettigns, comment),
          80,
          settings,
        );
        container.append(this.cut.body);
        // Allow for resize observer to catch back
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        pausedPosX = 5;

        // Execute
        this.cut.add(createMultipleComments(elementCount, 9));
        this.cut.pause();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_canvas_no_room.png"),
          path.join(__dirname, "/golden/empty.png"),
          path.join(__dirname, "/danmaku_canvas_no_room_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
