import path = require("path");
import { normalizeBody } from "../../../../../common/normalize_body";
import { setTabletView } from "../../../../../common/view_port";
import { DanmakuOverlay } from "./body";
import { DanmakuEntryMock } from "./danmaku_entry_mock";
import { Comment } from "@phading/comment_service_interface/show/web/comment";
import {
  ChatOverlaySettings,
  StackingMethod,
} from "@phading/user_service_interface/web/self/video_player_settings";
import { E } from "@selfage/element/factory";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { Ref } from "@selfage/ref";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";

normalizeBody();

let SETTINGS: ChatOverlaySettings = {
  fontSize: 18,
  opacity: 80,
  danmakuSettings: {
    density: 100,
    speed: 100,
    stackingMethod: StackingMethod.RANDOM,
  },
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
  name: "DanmakuOverlayTest",
  environment: {
    setUp() {
      container = E.div({
        style: `width: 40rem; height: 30rem; overflow: hidden; position: relative; background-color: white;`,
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
        "RandomOne_FilledBothUpAndDown_ReleaseOccupied_FilledBottomUp_SomeFullyHidden";
      private cut: DanmakuOverlay;
      public async execute() {
        // Prepare
        await setTabletView();
        let commentCount = new Ref<number>(0);
        let randomNum: number;
        let pausedPosX: number;
        let settings: ChatOverlaySettings = JSON.parse(
          JSON.stringify(SETTINGS),
        );
        let danmakuEntryMocks = new Array<DanmakuEntryMock>();
        this.cut = new DanmakuOverlay(
          (settings, comment) => {
            let entry = new DanmakuEntryMock(pausedPosX, settings, comment);
            danmakuEntryMocks.push(entry);
            return entry;
          },
          () => randomNum,
          settings,
        );
        container.append(this.cut.body);
        // Allow for resize observer to catch back
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        randomNum = 0.15;
        pausedPosX = 5;

        // Execute
        this.cut.play();
        this.cut.add([createComment(commentCount.val++)]);
        this.cut.pause();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_overlay_one_comment.png"),
          path.join(__dirname, "/golden/danmaku_overlay_one_comment.png"),
          path.join(__dirname, "/danmaku_overlay_one_comment_diff.png"),
        );

        // Execute
        this.cut.add(createMultipleComments(commentCount, 15));
        this.cut.pause();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_overlay_filled.png"),
          path.join(__dirname, "/golden/danmaku_overlay_filled.png"),
          path.join(__dirname, "/danmaku_overlay_filled_diff.png"),
        );

        // Prepare
        randomNum = 0.999;

        // Execute
        danmakuEntryMocks[0].pausedPosX = -200;
        danmakuEntryMocks[0].emit("fullyDisplayed");
        danmakuEntryMocks[2].pausedPosX = -200;
        danmakuEntryMocks[2].emit("fullyDisplayed");
        danmakuEntryMocks[8].pausedPosX = -200;
        danmakuEntryMocks[8].emit("fullyDisplayed");
        this.cut.add(createMultipleComments(commentCount, 20));
        this.cut.pause();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/danmaku_overlay_released_occupied_and_filled.png",
          ),
          path.join(
            __dirname,
            "/golden/danmaku_overlay_released_occupied_and_filled.png",
          ),
          path.join(
            __dirname,
            "/danmaku_overlay_released_occupied_and_filled_diff.png",
          ),
        );

        // Execute
        danmakuEntryMocks[0].emit("fullyHidden");
        danmakuEntryMocks[2].emit("fullyHidden");
        danmakuEntryMocks[8].emit("fullyHidden");
        danmakuEntryMocks[16].emit("fullyDisplayed");
        danmakuEntryMocks[16].emit("fullyHidden");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_overlay_some_fully_hidden.png"),
          path.join(__dirname, "/golden/danmaku_overlay_some_fully_hidden.png"),
          path.join(__dirname, "/danmaku_overlay_some_fully_hidden_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TopDown_ApplySettings";
      private cut: DanmakuOverlay;
      public async execute() {
        // Prepare
        await setTabletView();
        let commentCount = new Ref<number>();
        commentCount.val = 0;
        let pausedPosX: number;
        let settings: ChatOverlaySettings = JSON.parse(
          JSON.stringify(SETTINGS),
        );
        settings.danmakuSettings.stackingMethod = StackingMethod.TOP_DOWN;
        this.cut = new DanmakuOverlay(
          (settings, comment) =>
            new DanmakuEntryMock(pausedPosX, settings, comment),
          () => 0,
          settings,
        );
        container.append(this.cut.body);
        // Allow for resize observer to catch back
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        pausedPosX = 5;

        // Execute
        this.cut.add(createMultipleComments(commentCount, 5));
        this.cut.pause();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_overlay_simple_top_down.png"),
          path.join(__dirname, "/golden/danmaku_overlay_simple_top_down.png"),
          path.join(__dirname, "/danmaku_overlay_simple_top_down_diff.png"),
        );

        // Prepare
        settings.opacity = 50;
        settings.fontSize = 12;

        // Execute
        this.cut.applySettings();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_overlay_apply_settings.png"),
          path.join(__dirname, "/golden/danmaku_overlay_apply_settings.png"),
          path.join(__dirname, "/danmaku_overlay_apply_settings_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "HalfDensity_AddTopDown_AddBottomUp";
      private cut: DanmakuOverlay;
      public async execute() {
        // Prepare
        await setTabletView();
        let commentCount = new Ref<number>(0);
        let randomNum: number;
        let pausedPosX: number;
        let settings: ChatOverlaySettings = JSON.parse(
          JSON.stringify(SETTINGS),
        );
        settings.danmakuSettings.stackingMethod = StackingMethod.TOP_DOWN;
        settings.danmakuSettings.density = 50;
        let danmakuEntryMocks = new Array<DanmakuEntryMock>();
        this.cut = new DanmakuOverlay(
          (settings, comment) => {
            let entry = new DanmakuEntryMock(pausedPosX, settings, comment);
            danmakuEntryMocks.push(entry);
            return entry;
          },
          () => randomNum,
          settings,
        );
        container.append(this.cut.body);
        // Allow for resize observer to catch back
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        pausedPosX = 5;

        // Execute
        this.cut.add(createMultipleComments(commentCount, 5));
        this.cut.pause();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_overlay_half_density_top_down.png"),
          path.join(
            __dirname,
            "/golden/danmaku_overlay_half_density_top_down.png",
          ),
          path.join(
            __dirname,
            "/danmaku_overlay_half_density_top_down_diff.png",
          ),
        );

        // Prepare
        danmakuEntryMocks[3].emit("fullyDisplayed");
        danmakuEntryMocks[3].emit("fullyHidden");
        danmakuEntryMocks[4].emit("fullyDisplayed");
        danmakuEntryMocks[4].emit("fullyHidden");
        settings.danmakuSettings.stackingMethod = StackingMethod.RANDOM;
        randomNum = 0.999;

        // Execute
        this.cut.add(createMultipleComments(commentCount, 10));
        this.cut.pause();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_overlay_half_density_bottom_up.png"),
          path.join(
            __dirname,
            "/golden/danmaku_overlay_half_density_bottom_up.png",
          ),
          path.join(
            __dirname,
            "/danmaku_overlay_half_density_bottom_up_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "NotEnoughVertialRoom";
      private cut: DanmakuOverlay;
      public async execute() {
        // Prepare
        await setTabletView();
        let commentCount = new Ref<number>(0);
        let pausedPosX: number;
        let settings: ChatOverlaySettings = JSON.parse(
          JSON.stringify(SETTINGS),
        );
        settings.fontSize = 300;
        this.cut = new DanmakuOverlay(
          (settings, comment) =>
            new DanmakuEntryMock(pausedPosX, settings, comment),
          () => 0,
          settings,
        );
        container.append(this.cut.body);
        // Allow for resize observer to catch back
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        pausedPosX = 5;

        // Execute
        this.cut.add(createMultipleComments(commentCount, 9));
        this.cut.pause();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_overlay_no_room.png"),
          path.join(__dirname, "/golden/danmaku_overlay_no_room.png"),
          path.join(__dirname, "/danmaku_overlay_no_room_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
