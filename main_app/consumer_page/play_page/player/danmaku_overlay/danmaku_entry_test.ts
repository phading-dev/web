import path = require("path");
import { normalizeBody } from "../../../../../common/normalize_body";
import { setTabletView } from "../../../../../common/view_port";
import { DanmakuEntry } from "./danmaku_entry";
import { ChatOverlaySettings } from "@phading/user_service_interface/web/self/video_player_settings";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq, isArray } from "@selfage/test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "DanmakuEntryTest",
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
      private cut: DanmakuEntry;
      public async execute() {
        // Prepare
        await setTabletView();
        let settings: ChatOverlaySettings = {
          opacity: 80,
          fontSize: 20,
          danmakuSettings: {
            speed: 100,
          },
        };
        let callbacks = new Array<Function>();
        let delaysMs = new Array<number>();
        let timeoutIdToReturn = 0;
        let timeoutIdsCleared = new Array<number>();
        let transformMatrixToReturn: string;
        this.cut = new DanmakuEntry(
          (callback, delay) => {
            callbacks.push(callback);
            delaysMs.push(delay);
            return timeoutIdToReturn++;
          },
          (id) => {
            timeoutIdsCleared.push(id);
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
          path.join(__dirname, "/danmaku_entry_created.png"),
          path.join(__dirname, "/golden/non_exist.png"),
          path.join(__dirname, "/danmaku_entry_created.png"),
        );

        // Execute
        let height = this.cut.body.offsetHeight;

        // Verify
        assertThat(height, eq(24), "content height");

        // Execute
        this.cut.setStartPosition(20, 600);

        // Verify
        // The width of the content is 197px.
        assertThat(
          this.cut.body.style.transform,
          eq("translate3d(197px, 20px, 0px)"),
          "starting transform",
        );
        assertThat(
          this.cut.body.style.transition,
          eq("none"),
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
        // (600px + 197px) / 100 (speed) = 7.97s
        assertThat(
          this.cut.body.style.transition,
          eq("transform 7.97s linear"),
          "transitioning",
        );
        // 197px / 100 (speed) * 1000 = 1970 ms.
        // (600px + 197px) / 100 (speed) * 1000 = 7970 ms.
        assertThat(
          delaysMs,
          isArray([eq(1970), eq(7970)]),
          "delay until fully displayed and hidden",
        );

        // Prepare
        let fullyDisplayed = 0;
        let fullyHidden = 0;
        this.cut.on("fullyDisplayed", () => fullyDisplayed++);
        this.cut.on("fullyHidden", () => fullyHidden++);

        // Execute
        callbacks[0]();

        // Verify
        assertThat(fullyDisplayed, eq(1), "fully displayed");
        assertThat(fullyHidden, eq(0), "not hidden yet");

        // Execute
        callbacks[1]();

        // Verify
        assertThat(fullyDisplayed, eq(1), "fully displayed still");
        assertThat(fullyHidden, eq(1), "fully hidden");

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
          eq("none"),
          "paused transition",
        );
        assertThat(
          timeoutIdsCleared,
          isArray([eq(0), eq(1)]),
          "cleared both timeouts",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_entry_paused.png"),
          path.join(__dirname, "/golden/danmaku_entry_paused.png"),
          path.join(__dirname, "/danmaku_entry_paused_diff.png"),
        );

        // Prepare
        callbacks = new Array<Function>();
        delaysMs = new Array<number>();

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
          eq("transform 5.9s linear"),
          "resumed transitioning",
        );
        // (600px - 10px) / 100 (speed) * 1000 = 5900s
        assertThat(delaysMs, isArray([eq(5900)]), "delay until display ended");
        assertThat(fullyDisplayed, eq(2), "fully displayed second time");
        assertThat(fullyHidden, eq(1), "not hidden again yet");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Play_UpdateCanvasSize_ReachedEnd_Pause_ReRender_Play";
      private cut: DanmakuEntry;
      public async execute() {
        // Prepare
        await setTabletView();
        let settings: ChatOverlaySettings = {
          opacity: 80,
          fontSize: 20,
          danmakuSettings: {
            speed: 100,
          },
        };
        let transformMatrixToReturn: string;
        this.cut = new DanmakuEntry(
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
        this.cut.body.offsetHeight;
        this.cut.setStartPosition(20, 600);
        this.cut.play();

        let fullyDisplayed = 0;
        let fullyHidden = 0;
        this.cut.on("fullyDisplayed", () => fullyDisplayed++);
        this.cut.on("fullyHidden", () => fullyHidden++);

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
          eq("transform 3.9s linear"),
          "resumed transitioning",
        );
        assertThat(fullyDisplayed, eq(1), "fully displayed");
        assertThat(fullyHidden, eq(0), "not hidden yet");

        // Prepare
        transformMatrixToReturn = "matrix(1,0,0,1,-410,0)";
        settings.fontSize = 30;
        this.cut.pause();

        // Execute
        this.cut.applySettings();

        // Verify
        assertThat(
          fullyDisplayed,
          eq(1),
          "no more fully displayed because paused",
        );
        assertThat(fullyHidden, eq(0), "still not hidden because paused");
        await asyncAssertScreenshot(
          path.join(__dirname, "/danmaku_entry_larger_font.png"),
          path.join(__dirname, "/golden/danmaku_entry_larger_font.png"),
          path.join(__dirname, "/danmaku_entry_larger_font_diff.png"),
        );

        // Execute
        this.cut.play();

        // Verify
        assertThat(fullyDisplayed, eq(2), "full displayed second time");
        assertThat(fullyHidden, eq(1), "fully hidden");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
