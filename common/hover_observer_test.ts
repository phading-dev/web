import { HoverObserver, Mode } from "./hover_observer";
import { normalizeBody } from "./normalize_body";
import { setTabletView } from "./view_port";
import { E } from "@selfage/element/factory";
import {
  keyboardDown,
  mouseDown,
  mouseMove,
  touchEnd,
  touchMove,
  touchStart,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { Ref } from "@selfage/ref";
import { assertThat, eq, isArray } from "@selfage/test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "HoverObserverTest",
  cases: [
    new (class implements TestCase {
      public name = "MouseMoveOver_Move_Down_DelayedHide_Keydown_DelayedHide";
      private anchorElement: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        let inputRef = new Ref<HTMLInputElement>();
        this.anchorElement = E.div(
          {
            style: `margin: 10rem; width: 20rem; height: 20rem; background-color: black;`,
          },
          E.inputRef(inputRef, {}),
        );
        document.body.append(this.anchorElement);

        let timeoutCounter = 0;
        let callbackCaptured: () => void;
        let delayCaptured: number;
        let idClearedCaptured = new Array<number>();
        let observer = new HoverObserver(
          (callback, delay) => {
            callbackCaptured = callback;
            delayCaptured = delay;
            return ++timeoutCounter;
          },
          (id) => {
            idClearedCaptured.push(id);
          },
          this.anchorElement,
          Mode.HOVER_DELAY_LEAVE,
        );
        let showedTimes = 0;
        observer.on("hover", () => {
          ++showedTimes;
        });
        let hiddenTimes = 0;
        observer.on("leave", () => {
          ++hiddenTimes;
        });

        // Execute
        await mouseMove(101, 101, 1);

        // Verify
        assertThat(showedTimes, eq(1), "over and showed once");
        assertThat(delayCaptured, eq(3000), "delayed");
        assertThat(
          idClearedCaptured,
          isArray([eq(undefined), eq(1)]),
          "cleared 1",
        );

        // Prepare
        idClearedCaptured.length = 0;

        // Execute
        await mouseMove(102, 102, 1);

        // Verify
        assertThat(showedTimes, eq(1), "moved but not show again");
        assertThat(idClearedCaptured, isArray([eq(2)]), "cleared 2");

        // Prepare
        idClearedCaptured.length = 0;

        // Execute
        await mouseDown();

        // Verify
        assertThat(showedTimes, eq(1), "downed but not show again");
        assertThat(idClearedCaptured, isArray([eq(3)]), "cleared 3");

        // Execute
        callbackCaptured();

        // Verify
        assertThat(hiddenTimes, eq(1), "hide once");

        // Prepare
        idClearedCaptured.length = 0;

        // Execute
        inputRef.val.focus();
        await keyboardDown("A");

        // Verify
        assertThat(showedTimes, eq(2), "key down and show again");
        assertThat(delayCaptured, eq(3000), "delayed");
        assertThat(idClearedCaptured, isArray([eq(4)]), "cleared 4");

        // Execute
        callbackCaptured();

        // Verify
        assertThat(hiddenTimes, eq(2), "hide twice");
      }
      public tearDown() {
        this.anchorElement.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "TouchStart_End_NotShowed_Start_Move_DelayedShow_Move_DelayedHide_Keydown_DelayedShow_DelayedHide";
      private anchorElement: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        let inputRef = new Ref<HTMLInputElement>();
        this.anchorElement = E.div(
          {
            style: `margin: 10rem; width: 20rem; height: 20rem; background-color: black;`,
          },
          E.inputRef(inputRef, {}),
        );
        document.body.append(this.anchorElement);

        let timeoutCounter = 0;
        let callbackCaptured: () => void;
        let delayCaptured: number;
        let idClearedCaptured: number;
        let observer = new HoverObserver(
          (callback, delay) => {
            callbackCaptured = callback;
            delayCaptured = delay;
            return ++timeoutCounter;
          },
          (id) => {
            idClearedCaptured = id;
          },
          this.anchorElement,
          Mode.DELAY_HOVER_DELAY_LEAVE,
        );
        let showedTimes = 0;
        observer.on("hover", () => {
          ++showedTimes;
        });
        let hiddenTimes = 0;
        observer.on("leave", () => {
          ++hiddenTimes;
        });

        // Execute
        await touchStart(101, 101);

        // Verify
        assertThat(showedTimes, eq(0), "not showed");
        assertThat(delayCaptured, eq(1000), "delayed");

        // Execute
        await touchEnd();

        // Verify
        assertThat(idClearedCaptured, eq(1), "cleared show");

        // Execute
        await touchStart(102, 102);

        // Verify
        assertThat(showedTimes, eq(0), "not showed yet");
        assertThat(delayCaptured, eq(1000), "delayed");
        assertThat(timeoutCounter, eq(2), "new timeout");

        // Execute
        await touchMove(103, 103);

        // Verify
        assertThat(showedTimes, eq(0), "not showed yet 2");
        assertThat(timeoutCounter, eq(2), "same timeout");

        // Execute
        callbackCaptured();

        // Verify
        assertThat(showedTimes, eq(1), "showed");
        assertThat(timeoutCounter, eq(3), "timeout to hide");

        // Execute
        await touchMove(104, 104);

        // Verify
        assertThat(showedTimes, eq(1), "moved but not show again");
        assertThat(idClearedCaptured, eq(3), "clear 3");
        assertThat(timeoutCounter, eq(4), "timeout 2 to hide");

        // Execute
        callbackCaptured();

        // Verify
        assertThat(hiddenTimes, eq(1), "hide once");

        // Execute
        inputRef.val.focus();
        await keyboardDown("A");
        callbackCaptured();

        // Verify
        assertThat(showedTimes, eq(2), "key down and show again");
        assertThat(delayCaptured, eq(3000), "delayed");
        assertThat(timeoutCounter, eq(6), "2 more timeouts to show and hide");

        // Execute
        callbackCaptured();

        // Verify
        assertThat(hiddenTimes, eq(2), "hide twice");
      }
      public tearDown() {
        this.anchorElement.remove();
      }
    })(),
  ],
});
