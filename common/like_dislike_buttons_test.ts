import path = require("path");
import { SCHEME } from "./color_scheme";
import { IconButton, TooltipPosition } from "./icon_button";
import { LikeDislikeButtons, Liking } from "./like_dislike_buttons";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import "./normalize_body";

class SendErrorAndSent implements TestCase {
  private cut: LikeDislikeButtons;
  public constructor(
    public name: string,
    private initLiking: Liking,
    private initActualFile: string,
    private initExpectedFile: string,
    private initDiffFile: string,
    private getButton: (cut: LikeDislikeButtons) => IconButton,
    private expectedLiking: Liking,
    private disabledActualFile: string,
    private disabledExpectedFile: string,
    private disabledDiffFile: string,
    private errorActualFile: string,
    private errorDiffFile: string,
    private successActualFile: string,
    private successExpectedFile: string,
    private successDiffFile: string,
  ) {}
  public async execute() {
    // Prepare
    await setViewport(300, 200);
    this.cut = new LikeDislikeButtons(
      `width: 30rem; padding: 0 1rem; box-sizing: border-box; background-color: ${SCHEME.neutral4}; display: flex; flex-flow: row nowrap; gap: .5rem;`,
      0.7,
      TooltipPosition.BOTTOM,
    ).enable(this.initLiking);

    // Execute
    document.body.append(this.cut.body);

    // Verify
    await asyncAssertScreenshot(
      this.initActualFile,
      this.initExpectedFile,
      this.initDiffFile,
    );

    // Prepare
    let likingCaptured: Liking;
    let promiseToReturn: Promise<void>;
    this.cut.on("like", (liking) => {
      likingCaptured = liking;
      return promiseToReturn;
    });
    let rejectFn: (error: any) => void;
    promiseToReturn = new Promise<void>(
      (resolve, reject) => (rejectFn = reject),
    );

    // Execute
    this.getButton(this.cut).click();

    // Verify
    assertThat(likingCaptured, eq(this.expectedLiking), "expected liking");
    await asyncAssertScreenshot(
      this.disabledActualFile,
      this.disabledExpectedFile,
      this.disabledDiffFile,
    );

    // Execute
    let error = new Error("fake error");
    rejectFn(error);
    let returnedError = await new Promise<any>((resolve) =>
      this.cut.once("postLike", (error) => {
        resolve(error);
      }),
    );

    // Verify
    assertThat(returnedError, eq(error), "error");
    await asyncAssertScreenshot(
      this.errorActualFile,
      this.initExpectedFile,
      this.errorDiffFile,
    );

    // Prepare
    promiseToReturn = Promise.resolve();

    // Execute
    this.getButton(this.cut).click();
    returnedError = await new Promise<any>((resolve) =>
      this.cut.once("postLike", (error) => {
        resolve(error);
      }),
    );

    // Verify
    assertThat(returnedError, eq(undefined), "no error");
    await asyncAssertScreenshot(
      this.successActualFile,
      this.successExpectedFile,
      this.successDiffFile,
    );
  }
  public tearDown() {
    this.cut.remove();
  }
}

TEST_RUNNER.run({
  name: "LikeDislikeButtonsTest",
  cases: [
    new SendErrorAndSent(
      "NeutralToLike",
      Liking.NEUTRAL,
      path.join(__dirname, "/like_dislike_buttons_neutral.png"),
      path.join(__dirname, "/golden/like_dislike_buttons_neutral.png"),
      path.join(__dirname, "/like_dislike_buttons_neutral_diff.png"),
      (cut) => cut.thumbUpButton.val,
      Liking.LIKE,
      path.join(__dirname, "/like_dislike_buttons_disabled.png"),
      path.join(__dirname, "/golden/like_dislike_buttons_disabled.png"),
      path.join(__dirname, "/like_dislike_buttons_disabled_diff.png"),
      path.join(__dirname, "/like_dislike_buttons_failed_to_like.png"),
      path.join(__dirname, "/like_dislike_buttons_failed_to_like_diff.png"),
      path.join(__dirname, "/like_dislike_buttons_liked.png"),
      path.join(__dirname, "/golden/like_dislike_buttons_liked.png"),
      path.join(__dirname, "/like_dislike_buttons_liked_diff.png"),
    ),
    new SendErrorAndSent(
      "NeutralToDislike",
      Liking.NEUTRAL,
      path.join(__dirname, "/like_dislike_buttons_neutral_2.png"),
      path.join(__dirname, "/golden/like_dislike_buttons_neutral.png"),
      path.join(__dirname, "/like_dislike_buttons_neutral_2_diff.png"),
      (cut) => cut.thumbDownButton.val,
      Liking.DISLIKE,
      path.join(__dirname, "/like_dislike_buttons_disabled_2.png"),
      path.join(__dirname, "/golden/like_dislike_buttons_disabled.png"),
      path.join(__dirname, "/like_dislike_buttons_disabled_2_diff.png"),
      path.join(__dirname, "/like_dislike_buttons_failed_to_dislike_2.png"),
      path.join(
        __dirname,
        "/like_dislike_buttons_failed_to_dislike_2_diff.png",
      ),
      path.join(__dirname, "/like_dislike_buttons_disliked_2.png"),
      path.join(__dirname, "/golden/like_dislike_buttons_disliked.png"),
      path.join(__dirname, "/like_dislike_buttons_disliked_2_diff.png"),
    ),
    new SendErrorAndSent(
      "LikedToNeutral",
      Liking.LIKE,
      path.join(__dirname, "/like_dislike_buttons_liked_3.png"),
      path.join(__dirname, "/golden/like_dislike_buttons_liked.png"),
      path.join(__dirname, "/like_dislike_buttons_liked_3_diff.png"),
      (cut) => cut.thumbUpedButton.val,
      Liking.NEUTRAL,
      path.join(__dirname, "/like_dislike_buttons_disabled_3.png"),
      path.join(__dirname, "/golden/like_dislike_buttons_disabled.png"),
      path.join(__dirname, "/like_dislike_buttons_disabled_3_diff.png"),
      path.join(__dirname, "/like_dislike_buttons_failed_to_unlike_3.png"),
      path.join(__dirname, "/like_dislike_buttons_failed_to_unlike_3_diff.png"),
      path.join(__dirname, "/like_dislike_buttons_neutral_3.png"),
      path.join(__dirname, "/golden/like_dislike_buttons_neutral.png"),
      path.join(__dirname, "/like_dislike_buttons_neutral_3_diff.png"),
    ),
    new SendErrorAndSent(
      "LikedToDisliked",
      Liking.LIKE,
      path.join(__dirname, "/like_dislike_buttons_liked_4.png"),
      path.join(__dirname, "/golden/like_dislike_buttons_liked.png"),
      path.join(__dirname, "/like_dislike_buttons_liked_4_diff.png"),
      (cut) => cut.thumbDownButton.val,
      Liking.DISLIKE,
      path.join(__dirname, "/like_dislike_buttons_disabled_4.png"),
      path.join(__dirname, "/golden/like_dislike_buttons_disabled.png"),
      path.join(__dirname, "/like_dislike_buttons_disabled_4_diff.png"),
      path.join(__dirname, "/like_dislike_buttons_failed_to_dislike_4.png"),
      path.join(
        __dirname,
        "/like_dislike_buttons_failed_to_dislike_4_diff.png",
      ),
      path.join(__dirname, "/like_dislike_buttons_disliked_4.png"),
      path.join(__dirname, "/golden/like_dislike_buttons_disliked.png"),
      path.join(__dirname, "/like_dislike_buttons_disliked_4_diff.png"),
    ),
    new SendErrorAndSent(
      "DislikedToNeutral",
      Liking.DISLIKE,
      path.join(__dirname, "/like_dislike_buttons_disliked_5.png"),
      path.join(__dirname, "/golden/like_dislike_buttons_disliked.png"),
      path.join(__dirname, "/like_dislike_buttons_disliked_5_diff.png"),
      (cut) => cut.thumbDownedButton.val,
      Liking.NEUTRAL,
      path.join(__dirname, "/like_dislike_buttons_disabled_5.png"),
      path.join(__dirname, "/golden/like_dislike_buttons_disabled.png"),
      path.join(__dirname, "/like_dislike_buttons_disabled_5_diff.png"),
      path.join(__dirname, "/like_dislike_buttons_failed_to_undislike_5.png"),
      path.join(
        __dirname,
        "/like_dislike_buttons_failed_to_undislike_5_diff.png",
      ),
      path.join(__dirname, "/like_dislike_buttons_neutral_5.png"),
      path.join(__dirname, "/golden/like_dislike_buttons_neutral.png"),
      path.join(__dirname, "/like_dislike_buttons_neutral_5_diff.png"),
    ),
    new SendErrorAndSent(
      "DislikedToLiked",
      Liking.DISLIKE,
      path.join(__dirname, "/like_dislike_buttons_disliked_6.png"),
      path.join(__dirname, "/golden/like_dislike_buttons_disliked.png"),
      path.join(__dirname, "/like_dislike_buttons_disliked_6_diff.png"),
      (cut) => cut.thumbUpButton.val,
      Liking.LIKE,
      path.join(__dirname, "/like_dislike_buttons_disabled_6.png"),
      path.join(__dirname, "/golden/like_dislike_buttons_disabled.png"),
      path.join(__dirname, "/like_dislike_buttons_disabled_6_diff.png"),
      path.join(__dirname, "/like_dislike_buttons_failed_to_like_6.png"),
      path.join(__dirname, "/like_dislike_buttons_failed_to_like_6_diff.png"),
      path.join(__dirname, "/like_dislike_buttons_liked_6.png"),
      path.join(__dirname, "/golden/like_dislike_buttons_liked.png"),
      path.join(__dirname, "/like_dislike_buttons_liked_6_diff.png"),
    ),
    new (class implements TestCase {
      public name = "ShowTooltip";
      private cut: LikeDislikeButtons;
      public async execute() {
        // Prepare
        await setViewport(300, 200);
        this.cut = new LikeDislikeButtons(
          `width: 30rem; padding: 0 3rem; box-sizing: border-box; background-color: ${SCHEME.neutral4}; display: flex; flex-flow: row nowrap; gap: .5rem;`,
          0.7,
          TooltipPosition.BOTTOM,
        ).enable(Liking.NEUTRAL);
        this.cut.on("like", () => {
          return Promise.resolve();
        });
        document.body.append(this.cut.body);

        // Execute
        this.cut.thumbUpButton.val.hover();
        await new Promise<void>((resolve) =>
          this.cut.thumbUpButton.val.once("tooltipShowed", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/like_dislike_buttons_hover_thumb_up.png"),
          path.join(
            __dirname,
            "/golden/like_dislike_buttons_hover_thumb_up.png",
          ),
          path.join(__dirname, "/like_dislike_buttons_hover_thumb_up_diff.png"),
        );

        // Prepare
        this.cut.thumbUpButton.val.leave();
        this.cut.thumbUpButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.once("postLike", resolve),
        );

        // Execute
        this.cut.thumbUpedButton.val.hover();
        await new Promise<void>((resolve) =>
          this.cut.thumbUpedButton.val.once("tooltipShowed", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/like_dislike_buttons_hover_thumb_uped.png"),
          path.join(
            __dirname,
            "/golden/like_dislike_buttons_hover_thumb_uped.png",
          ),
          path.join(
            __dirname,
            "/like_dislike_buttons_hover_thumb_uped_diff.png",
          ),
        );

        // Prepare
        this.cut.thumbUpedButton.val.leave();

        // Execute
        this.cut.thumbDownButton.val.hover();
        await new Promise<void>((resolve) =>
          this.cut.thumbDownButton.val.once("tooltipShowed", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/like_dislike_buttons_hover_thumb_down.png"),
          path.join(
            __dirname,
            "/golden/like_dislike_buttons_hover_thumb_down.png",
          ),
          path.join(
            __dirname,
            "/like_dislike_buttons_hover_thumb_down_diff.png",
          ),
        );

        // Prepare
        this.cut.thumbDownButton.val.leave();
        this.cut.thumbDownButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.once("postLike", resolve),
        );

        // Execute
        this.cut.thumbDownedButton.val.hover();
        await new Promise<void>((resolve) =>
          this.cut.thumbDownedButton.val.once("tooltipShowed", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/like_dislike_buttons_hover_thumb_downed.png"),
          path.join(
            __dirname,
            "/golden/like_dislike_buttons_hover_thumb_downed.png",
          ),
          path.join(
            __dirname,
            "/like_dislike_buttons_hover_thumb_downed_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
