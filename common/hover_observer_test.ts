import { HoverObserver, Mode } from "./hover_observer";
import { E } from "@selfage/element/factory";
import { TEST_RUNNER } from "@selfage/puppeteer_test_runner";
import { assertThat, eq } from "@selfage/test_matcher";

TEST_RUNNER.run({
  name: "HoverObserverTest",
  cases: [
    {
      name: "Over_Move_Down_DelayedHide_Keydown_DelayedHide",
      execute: async () => {
        // Prepare
        let anchorElement = E.div({});
        let timeoutCounter = 0;
        let callbackCaptured: () => void;
        let delayCaptured: number;
        let idClearedCaptured: number;
        let detector = new HoverObserver(
          (callback, delay) => {
            callbackCaptured = callback;
            delayCaptured = delay;
            return ++timeoutCounter;
          },
          (id) => {
            idClearedCaptured = id;
          },
          anchorElement,
          Mode.HOVER_DELAY_LEAVE
        );
        let showedTimes = 0;
        detector.on("hover", () => {
          ++showedTimes;
        });
        let hiddenTimes = 0;
        detector.on("leave", () => {
          ++hiddenTimes;
        });

        // Execute
        anchorElement.dispatchEvent(new Event("pointerover"));

        // Verify
        assertThat(showedTimes, eq(1), "over and showed once");
        assertThat(delayCaptured, eq(3000), "delayed");
        assertThat(idClearedCaptured, eq(undefined), "nothing to clear");

        // Execute
        anchorElement.dispatchEvent(new Event("pointermove"));

        // Verify
        assertThat(showedTimes, eq(1), "moved but not show again");
        assertThat(idClearedCaptured, eq(1), "cleared 1");

        // Execute
        anchorElement.dispatchEvent(new Event("pointerdown"));

        // Verify
        assertThat(showedTimes, eq(1), "downed but not show again");
        assertThat(idClearedCaptured, eq(2), "cleared 2");

        // Execute
        callbackCaptured();

        // Verify
        assertThat(hiddenTimes, eq(1), "hide once");

        // Execute
        anchorElement.dispatchEvent(new Event("keydown"));

        // Verify
        assertThat(showedTimes, eq(2), "key down and show again");
        assertThat(delayCaptured, eq(3000), "delayed");
        assertThat(idClearedCaptured, eq(3), "cleared 3");

        // Execute
        callbackCaptured();

        // Verify
        assertThat(hiddenTimes, eq(2), "hide twice");
      },
    },
    {
      name: "Over_Out_Over_Move_DelayedShow_Down_DelayedHide_Keydown_DelayedShow_DelayedHide",
      execute: async () => {
        // Prepare
        let anchorElement = E.div({});
        let timeoutCounter = 0;
        let callbackCaptured: () => void;
        let delayCaptured: number;
        let idClearedCaptured: number;
        let detector = new HoverObserver(
          (callback, delay) => {
            callbackCaptured = callback;
            delayCaptured = delay;
            return ++timeoutCounter;
          },
          (id) => {
            idClearedCaptured = id;
          },
          anchorElement,
          Mode.DELAY_HOVER_DELAY_LEAVE
        );
        let showedTimes = 0;
        detector.on("hover", () => {
          ++showedTimes;
        });
        let hiddenTimes = 0;
        detector.on("leave", () => {
          ++hiddenTimes;
        });

        // Execute
        anchorElement.dispatchEvent(new Event("pointerover"));

        // Verify
        assertThat(showedTimes, eq(0), "not showed");
        assertThat(delayCaptured, eq(1000), "delayed");

        // Execute
        anchorElement.dispatchEvent(new Event("pointerout"));

        // Verify
        assertThat(idClearedCaptured, eq(1), "cleared show");

        // Execute
        anchorElement.dispatchEvent(new Event("pointerover"));

        // Verify
        assertThat(showedTimes, eq(0), "not showed yet");
        assertThat(delayCaptured, eq(1000), "delayed");
        assertThat(timeoutCounter, eq(2), "new timeout");

        // Execute
        anchorElement.dispatchEvent(new Event("pointermove"));

        // Verify
        assertThat(showedTimes, eq(0), "not showed yet 2");
        assertThat(timeoutCounter, eq(2), "same timeout");

        // Execute
        callbackCaptured();

        // Verify
        assertThat(showedTimes, eq(1), "showed");
        assertThat(timeoutCounter, eq(3), "timeout to hide");

        // Execute
        anchorElement.dispatchEvent(new Event("pointerdown"));

        // Verify
        assertThat(showedTimes, eq(1), "downed but not show again");
        assertThat(idClearedCaptured, eq(3), "clear 3");
        assertThat(timeoutCounter, eq(4), "timeout 2 to hide");

        // Execute
        callbackCaptured();

        // Verify
        assertThat(hiddenTimes, eq(1), "hide once");

        // Execute
        anchorElement.dispatchEvent(new Event("keydown"));
        callbackCaptured();

        // Verify
        assertThat(showedTimes, eq(2), "key down and show again");
        assertThat(delayCaptured, eq(3000), "delayed");
        assertThat(timeoutCounter, eq(6), "2 more timeouts to show and hide");

        // Execute
        callbackCaptured();

        // Verify
        assertThat(hiddenTimes, eq(2), "hide twice");
      },
    },
  ],
});
