import path = require("path");
import { DanmakuElement } from "./element";
import { DanmakuSettings } from "@phading/product_service_interface/consumer/frontend/show/player_settings";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq, isArray } from "@selfage/test_matcher";
import "../../../../common/normalize_body";

TEST_RUNNER.run({
  name: "DanmakuElement",
  environment: {
    setUp() {
      document.body.style.backgroundColor = "white";
    },
    tearDown() {
      document.body.style.backgroundColor = "";
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Play_Pause_Play";
      private cut: DanmakuElement;
      public async execute() {
        // Prepare
        await setViewport(600, 400);
        let settings: DanmakuSettings = {
          opacity: 80,
          fontSize: 20,
          fontFamily: "cursive",
          speed: 100,
        };
        let callbackCaptured = new Array<Function>();
        let delayCaptured = new Array<number>();
        let timeoutIdToReturn = 0;
        let timeoutIdCleared = new Array<number>();
        let transformMatrixToReturn: string;
        this.cut = new DanmakuElement(
          (callback, delay) => {
            callbackCaptured.push(callback);
            delayCaptured.push(delay);
            return timeoutIdToReturn++;
          },
          (id) => {
            timeoutIdCleared.push(id);
          },
          (element) => {
            return { transform: transformMatrixToReturn } as any;
          },
          settings,
          {
            content: "Some kind of content!",
          },
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_element_created.png"),
          path.join(__dirname, "/golden/non_exist.png"),
          path.join(__dirname, "/danmaku_element_created.png"),
        );

        // Execute
        let height = this.cut.getOffsetHeight();

        // Verify
        assertThat(height, eq(24), "content height");

        // Execute
        this.cut.setReadyToPlay(20, 600);

        // Verify
        // The width of the content is 208px.
        assertThat(
          this.cut.body.style.transform,
          eq("translate3d(208px, 20px, 0px)"),
          "starting transform",
        );
        assertThat(
          this.cut.body.style.transition,
          eq("none 0s ease 0s"),
          "transition not started",
        );
        assertThat(this.cut.body.style.visibility, eq("visible"), "visible");

        // Execute
        this.cut.play();

        // Verify
        assertThat(
          this.cut.body.style.transform,
          eq("translate3d(-600px, 20px, 0px)"),
          "target transform",
        );
        // (600px + 208px) / 100 (speed) = 8.08s
        assertThat(
          this.cut.body.style.transition,
          eq("transform 8.08s linear 0s"),
          "transitioning",
        );
        // 208px / 100 (speed) * 1000 = 2080 ms.
        // (600px + 208px) / 100 (speed) * 1000 = 8080 ms.
        assertThat(
          delayCaptured,
          isArray([eq(2080), eq(8080)]),
          "delay until occupy ended and display ended",
        );

        // Prepare
        let occupyEnded = 0;
        let displayEnded = 0;
        this.cut.on("occupyEnded", () => occupyEnded++);
        this.cut.on("displayEnded", () => displayEnded++);

        // Execute
        callbackCaptured[0]();

        // Verify
        assertThat(occupyEnded, eq(1), "occupy ended");
        assertThat(displayEnded, eq(0), "display not ended");

        // Execute
        callbackCaptured[1]();

        // Verify
        assertThat(occupyEnded, eq(1), "occupy not ended");
        assertThat(displayEnded, eq(1), "display ended");

        // Prepare
        // tx = -10, ty = 0
        transformMatrixToReturn = "matrix(1,0,0,1,-10,0)";

        // Execute
        this.cut.pause();

        // Verify
        assertThat(
          this.cut.body.style.transform,
          eq("translate3d(-10px, 20px, 0px)"),
          "paused transform",
        );
        assertThat(
          this.cut.body.style.transition,
          eq("none 0s ease 0s"),
          "stopped transition",
        );
        assertThat(
          timeoutIdCleared,
          isArray([eq(0), eq(1)]),
          "cleared both timeouts",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_element_paused.png"),
          path.join(__dirname, "/golden/danmaku_element_paused.png"),
          path.join(__dirname, "/danmaku_element_paused_diff.png"),
        );

        // Prepare
        callbackCaptured = new Array<Function>();
        delayCaptured = new Array<number>();

        // Execute
        this.cut.play();

        // Verify
        assertThat(
          this.cut.body.style.transform,
          eq("translate3d(-600px, 20px, 0px)"),
          "resumed target transform",
        );
        // (600px - 10px) / 100 (speed) = 5.9s
        assertThat(
          this.cut.body.style.transition,
          eq("transform 5.9s linear 0s"),
          "resumed transitioning",
        );
        // (600px - 10px) / 100 (speed) * 1000 = 5900s
        assertThat(
          delayCaptured,
          isArray([eq(5900)]),
          "delay until display ended",
        );
        assertThat(occupyEnded, eq(2), "occupy ended again");
        assertThat(displayEnded, eq(1), "display not ended again");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Play_UpdateCanvasSize_ReachedEnd_Pause_ReRender_Play";
      private cut: DanmakuElement;
      public async execute() {
        // Prepare
        await setViewport(600, 400);
        let settings: DanmakuSettings = {
          opacity: 80,
          fontSize: 20,
          fontFamily: "cursive",
          speed: 100,
        };
        let transformMatrixToReturn: string;
        this.cut = new DanmakuElement(
          (callback, delay) => {
            return 0;
          },
          (id) => {},
          (element) => {
            return { transform: transformMatrixToReturn } as any;
          },
          settings,
          {
            content: "Some kind of content!",
          },
        );
        document.body.append(this.cut.body);
        this.cut.getOffsetHeight();
        this.cut.setReadyToPlay(20, 600);
        this.cut.play();

        let occupyEnded = 0;
        let displayEnded = 0;
        this.cut.on("occupyEnded", () => occupyEnded++);
        this.cut.on("displayEnded", () => displayEnded++);

        transformMatrixToReturn = "matrix(1,0,0,1,-10,0)";

        // Execute
        this.cut.updateCanvasSize(400);

        // Verify
        assertThat(
          this.cut.body.style.transform,
          eq("translate3d(-400px, 20px, 0px)"),
          "resumed target transform",
        );
        // (400px - 10px) / 100 (speed) = 3.9s
        assertThat(
          this.cut.body.style.transition,
          eq("transform 3.9s linear 0s"),
          "resumed transitioning",
        );
        assertThat(occupyEnded, eq(1), "occupy ended");
        assertThat(displayEnded, eq(0), "display not ended");

        // Prepare
        transformMatrixToReturn = "matrix(1,0,0,1,-410,0)";
        settings.fontSize = 30;
        this.cut.pause();

        // Execute
        this.cut.reRender();

        // Verify
        assertThat(occupyEnded, eq(1), "not played because occupy not ended");
        assertThat(displayEnded, eq(0), "not played because display not ended");
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_element_larger_font.png"),
          path.join(__dirname, "/golden/danmaku_element_larger_font.png"),
          path.join(__dirname, "/danmaku_element_larger_font_diff.png"),
        );

        // Execute
        this.cut.play();

        // Verify
        assertThat(occupyEnded, eq(2), "occupy ended again");
        assertThat(displayEnded, eq(1), "display ended");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Play_Hover_LikeComment_Pause_Leave_Play";
      private cut: DanmakuElement;
      public async execute() {
        // Prepare
        await setViewport(600, 400);
        let settings: DanmakuSettings = {
          opacity: 80,
          fontSize: 20,
          fontFamily: "cursive",
          speed: 100,
        };
        let transformMatrixToReturn: string;
        this.cut = new DanmakuElement(
          (callback, delay) => {
            return 0;
          },
          (id) => {},
          (element) => {
            return { transform: transformMatrixToReturn } as any;
          },
          settings,
          {
            commentId: "id1",
            content: "Some kind of content!",
          },
        );
        document.body.append(this.cut.body);
        this.cut.getOffsetHeight();
        this.cut.setReadyToPlay(20, 600);
        this.cut.play();

        transformMatrixToReturn = "matrix(1,0,0,1,-10,0)";

        // Execute
        this.cut.hover();

        // Verify
        assertThat(
          this.cut.body.style.transform,
          eq("translate3d(-10px, 20px, 0px)"),
          "paused transform",
        );
        assertThat(
          this.cut.body.style.transition,
          eq("none 0s ease 0s"),
          "stopped transition",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_element_hover.png"),
          path.join(__dirname, "/golden/danmaku_element_hover.png"),
          path.join(__dirname, "/danmaku_element_hover_diff.png"),
        );

        // Execute
        this.cut.pause();
        this.cut.leave();

        // Verify
        assertThat(
          this.cut.body.style.transform,
          eq("translate3d(-10px, 20px, 0px)"),
          "paused transform",
        );
        assertThat(
          this.cut.body.style.transition,
          eq("none 0s ease 0s"),
          "stopped transition",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_element_leave.png"),
          path.join(__dirname, "/golden/danmaku_element_leave.png"),
          path.join(__dirname, "/danmaku_element_leave_diff.png"),
        );

        // Execute
        this.cut.play();

        // Verify
        assertThat(
          this.cut.body.style.transform,
          eq("translate3d(-600px, 20px, 0px)"),
          "paused transform",
        );
        // (600px - 10px) / 100 (speed) = 5.9s
        assertThat(
          this.cut.body.style.transition,
          eq("transform 5.9s linear 0s"),
          "resumed transitioning",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
