import smallImage = require("./test_data/small.jpg");
import tallImage = require("./test_data/tall.webp");
import userImage = require("./test_data/user_image.jpg");
import wideImage = require("./test_data/wide.png");
import path = require("path");
import { IconButton } from "../../../../common/icon_button";
import { QuickTaleCard } from "./quick_tale_card";
import { REACT_TO_TALE_REQUEST_BODY } from "@phading/tale_service_interface/interface";
import { TaleReaction } from "@phading/tale_service_interface/tale_reaction";
import { eqMessage } from "@selfage/message/test_matcher";
import {
  deleteFile,
  screenshot,
  setViewport,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq, eqArray } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "../../../../common/normalize_body";

class RenderCase implements TestCase {
  private cut: QuickTaleCard;
  public constructor(
    public name: string,
    private option: {
      text?: string;
      images?: Array<string>;
      pinned?: boolean;
    },
    private screenshotPath: string,
    private screenshotGoldenPath: string,
    private screenshotDiffPath: string
  ) {}
  public async execute() {
    // Prepare
    await setViewport(800, 800);
    this.cut = new QuickTaleCard(
      {
        metadata: {
          avatarSmallPath: userImage,
          username: "some-name",
          userNatureName: "Some Name",
          createdTimestamp: Date.parse("2022-10-11"),
        },
        text: this.option.text,
        imagePaths: this.option.images,
      },
      this.option.pinned,
      undefined
    );

    // Execute
    document.body.appendChild(this.cut.body);

    // Verify
    await asyncAssertScreenshot(
      this.screenshotPath,
      this.screenshotGoldenPath,
      this.screenshotDiffPath,
      { fullPage: true }
    );
  }
  public tearDown() {
    this.cut.remove();
  }
}

class UndoReactionCase implements TestCase {
  private cut: QuickTaleCard;
  public constructor(
    public name: string,
    private getReactionButtonFn: (cut: QuickTaleCard) => IconButton,
    private getUndoReactionButtonFn: (cut: QuickTaleCard) => IconButton,
    private screenshotPath: string,
    private screenshotBaselinePath: string,
    private screenshotDiffPath: string
  ) {}
  public async execute() {
    // Prepare
    await setViewport(800, 800);
    let webServiceClientMock = new (class extends WebServiceClient {
      public requestCaptured: any;
      public constructor() {
        super(undefined, undefined);
      }
      public send(request: any) {
        this.requestCaptured = request;
        return {} as any;
      }
    })();
    this.cut = new QuickTaleCard(
      {
        metadata: {
          taleId: "id1",
          avatarSmallPath: userImage,
          username: "some-name",
          userNatureName: "Some Name",
          createdTimestamp: Date.parse("2022-10-11"),
        },
        text: "blahblahblahblah\nsomethingsomething",
      },
      false,
      webServiceClientMock
    );
    document.body.appendChild(this.cut.body);
    document.body.clientHeight; // Force reflow
    // Expand actions
    this.cut.actionsExpandButton.click();
    await new Promise<void>((resolve) =>
      this.cut.once("actionsLineTranstionEnded", resolve)
    );
    await screenshot(this.screenshotBaselinePath, { fullPage: true });
    this.getReactionButtonFn(this.cut).click();

    // Execute
    this.getUndoReactionButtonFn(this.cut).click();

    // Verify
    assertThat(
      webServiceClientMock.requestCaptured.body,
      eqMessage({ taleId: "id1" }, REACT_TO_TALE_REQUEST_BODY),
      "request"
    );
    await asyncAssertScreenshot(
      this.screenshotPath,
      this.screenshotBaselinePath,
      this.screenshotDiffPath,
      { fullPage: true }
    );
    await deleteFile(this.screenshotBaselinePath);
  }
  public tearDown() {
    this.cut.remove();
  }
}

TEST_RUNNER.run({
  name: "QuickTaleCardTest",
  cases: [
    new RenderCase(
      "RenderOneWideImage",
      {
        images: [wideImage],
      },
      path.join(__dirname, "/quick_tale_card_render_one_wide_image.png"),
      path.join(__dirname, "/golden/quick_tale_card_render_one_wide_image.png"),
      path.join(__dirname, "/quick_tale_card_render_one_wide_image_diff.png")
    ),
    new RenderCase(
      "RenderOneTallImage",
      {
        images: [tallImage],
      },
      path.join(__dirname, "/quick_tale_card_render_one_tall_image.png"),
      path.join(__dirname, "/golden/quick_tale_card_render_one_tall_image.png"),
      path.join(__dirname, "/quick_tale_card_render_one_tall_image_diff.png")
    ),
    new RenderCase(
      "RenderOneSmallImageOnly",
      {
        text: "blahblahblahblah\nsomethingsomething",
        images: [smallImage],
      },
      path.join(
        __dirname,
        "/quick_tale_card_render_one_small_image_with_text.png"
      ),
      path.join(
        __dirname,
        "/golden/quick_tale_card_render_one_small_image_with_text.png"
      ),
      path.join(
        __dirname,
        "/quick_tale_card_render_one_small_image_with_text_diff.png"
      )
    ),
    new RenderCase(
      "RenderFourImages",
      {
        images: [smallImage, userImage, wideImage, tallImage],
      },
      path.join(__dirname, "/quick_tale_card_render_4_images.png"),
      path.join(__dirname, "/golden/quick_tale_card_render_4_images.png"),
      path.join(__dirname, "/quick_tale_card_render_4_images_diff.png")
    ),
    new (class implements TestCase {
      public name = "ViewOneImage";
      public async execute() {
        // Prepare
        let cut = new QuickTaleCard(
          {
            metadata: {
              avatarSmallPath: userImage,
              username: "some-name",
              userNatureName: "Some Name",
              createdTimestamp: Date.parse("2022-10-11"),
            },
            imagePaths: [smallImage],
          },
          false,
          undefined
        );
        let imagePathsCaptured: Array<string>;
        let indexCaptured: number;
        cut.on("viewImages", (imagePaths, index) => {
          imagePathsCaptured = imagePaths;
          indexCaptured = index;
        });

        // Execute
        cut.previewImages[0].click();

        // Verify
        assertThat(imagePathsCaptured, eqArray([eq(smallImage)]), "image URLs");
        assertThat(indexCaptured, eq(0), "index");
      }
    })(),
    new (class implements TestCase {
      public name = "ViewImages";
      public async execute() {
        // Prepare
        let cut = new QuickTaleCard(
          {
            metadata: {
              avatarSmallPath: userImage,
              username: "some-name",
              userNatureName: "Some Name",
              createdTimestamp: Date.parse("2022-10-11"),
            },
            imagePaths: [smallImage, tallImage, wideImage],
          },
          false,
          undefined
        );
        let imagePathsCaptured: Array<string>;
        let indexCaptured: number;
        cut.on("viewImages", (imagePaths, index) => {
          imagePathsCaptured = imagePaths;
          indexCaptured = index;
        });
        let expectedImagePaths = [eq(smallImage), eq(tallImage), eq(wideImage)];

        // Execute
        cut.previewImages[0].click();

        // Verify
        assertThat(
          imagePathsCaptured,
          eqArray(expectedImagePaths),
          "image URLs 0"
        );
        assertThat(indexCaptured, eq(0), "index");

        // Execute
        cut.previewImages[1].click();

        // Verify
        assertThat(
          imagePathsCaptured,
          eqArray(expectedImagePaths),
          "image URLs 1"
        );
        assertThat(indexCaptured, eq(1), "index");

        // Execute
        cut.previewImages[2].click();

        // Verify
        assertThat(
          imagePathsCaptured,
          eqArray(expectedImagePaths),
          "image URLs 2"
        );
        assertThat(indexCaptured, eq(2), "index");
      }
    })(),
    new RenderCase(
      "RenderTextOnly",
      {
        text: "blahblahblahblah\nsomethingsomething\n3rdline\n4thline",
      },
      path.join(__dirname, "/quick_tale_card_render_text_only.png"),
      path.join(__dirname, "/golden/quick_tale_card_render_text_only.png"),
      path.join(__dirname, "/quick_tale_card_render_text_only_diff.png")
    ),
    new RenderCase(
      "RenderPinned",
      {
        text: "blahblahblahblah\nsomethingsomething\n3rdline\n4thline",
        pinned: true,
      },
      path.join(__dirname, "/quick_tale_card_render_pinned.png"),
      path.join(__dirname, "/golden/quick_tale_card_render_pinned.png"),
      path.join(__dirname, "/quick_tale_card_render_pinned_diff.png")
    ),
    new (class implements TestCase {
      public name = "MultiLinesText";
      private cut: QuickTaleCard;
      public async execute() {
        // Prepare
        await setViewport(800, 800);
        this.cut = new QuickTaleCard(
          {
            metadata: {
              avatarSmallPath: userImage,
              username: "some-name",
              userNatureName: "Some Name",
              createdTimestamp: Date.parse("2022-10-11"),
            },
            text: "hahah\nhahah\nhahah\nhahah\nhahah\nhahah\nhahah\nhahah\nhahah\nhahah\nhahah\nhahah\nhahah\nhahah\n",
          },
          false,
          undefined
        );

        // Execute
        document.body.appendChild(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_tale_card_show_3_lines.png"),
          path.join(__dirname, "/golden/quick_tale_card_show_3_lines.png"),
          path.join(__dirname, "/quick_tale_card_show_3_lines_diff.png"),
          { fullPage: true }
        );

        // Execute
        this.cut.showMoreButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_tale_card_show_more_lines.png"),
          path.join(__dirname, "/golden/quick_tale_card_show_more_lines.png"),
          path.join(__dirname, "/quick_tale_card_show_more_lines_diff.png"),
          { fullPage: true }
        );

        // Execute
        this.cut.showLessButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_tale_card_show_3_lines.png"),
          path.join(__dirname, "/golden/quick_tale_card_show_3_lines.png"),
          path.join(__dirname, "/quick_tale_card_show_3_lines_diff.png"),
          { fullPage: true }
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "RenderActionsLine";
      private cut: QuickTaleCard;
      public async execute() {
        // Prepare
        await setViewport(800, 800);
        this.cut = new QuickTaleCard(
          {
            metadata: {
              avatarSmallPath: userImage,
              username: "some-name",
              userNatureName: "Some Name",
              createdTimestamp: Date.parse("2022-10-11"),
            },
            text: "blahblahblahblah\nsomethingsomething",
          },
          false,
          undefined
        );
        document.body.appendChild(this.cut.body);
        await screenshot(
          path.join(
            __dirname,
            "/quick_tale_card_render_no_actions_baseline.png"
          ),
          { fullPage: true }
        );

        // Execute
        this.cut.actionsExpandButton.click();
        await new Promise<void>((resolve) => {
          this.cut.once("actionsLineTranstionEnded", resolve);
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_tale_card_actions_expanded.png"),
          path.join(__dirname, "/golden/quick_tale_card_actions_expanded.png"),
          path.join(__dirname, "/quick_tale_card_actions_expanded_diff.png"),
          { fullPage: true }
        );

        // Execute
        this.cut.actionsCollapseButton.click();
        await new Promise<void>((resolve) => {
          this.cut.once("actionsLineTranstionEnded", resolve);
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_tale_card_actions_collapsed.png"),
          path.join(
            __dirname,
            "/quick_tale_card_render_no_actions_baseline.png"
          ),
          path.join(__dirname, "/quick_tale_card_actions_collapsed_diff.png"),
          { fullPage: true }
        );
        await deleteFile(
          path.join(
            __dirname,
            "/quick_tale_card_render_no_actions_baseline.png"
          )
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "SwitchReactions";
      private cut: QuickTaleCard;
      public async execute() {
        // Prepare
        await setViewport(800, 800);
        let webServiceClientMock = new (class extends WebServiceClient {
          public requestCaptured: any;
          public constructor() {
            super(undefined, undefined);
          }
          public send(request: any) {
            this.requestCaptured = request;
            return {} as any;
          }
        })();
        this.cut = new QuickTaleCard(
          {
            metadata: {
              taleId: "id1",
              avatarSmallPath: userImage,
              username: "some-name",
              userNatureName: "Some Name",
              createdTimestamp: Date.parse("2022-10-11"),
            },
            text: "blahblahblahblah\nsomethingsomething",
          },
          false,
          webServiceClientMock
        );
        document.body.appendChild(this.cut.body);
        document.body.clientHeight; // Force reflow.
        this.cut.actionsExpandButton.click();
        await new Promise<void>((resolve) =>
          this.cut.once("actionsLineTranstionEnded", resolve)
        );

        // Execute
        this.cut.loveButton.click();

        // Verify
        assertThat(
          webServiceClientMock.requestCaptured.body,
          eqMessage(
            { taleId: "id1", reaction: TaleReaction.LOVE },
            REACT_TO_TALE_REQUEST_BODY
          ),
          "love request"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_tale_card_loved.png"),
          path.join(__dirname, "/golden/quick_tale_card_loved.png"),
          path.join(__dirname, "/quick_tale_card_loved_diff.png"),
          { fullPage: true }
        );

        // Execute
        this.cut.likeButton.click();

        // Verify
        assertThat(
          webServiceClientMock.requestCaptured.body,
          eqMessage(
            { taleId: "id1", reaction: TaleReaction.LIKE },
            REACT_TO_TALE_REQUEST_BODY
          ),
          "like request"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_tale_card_liked.png"),
          path.join(__dirname, "/golden/quick_tale_card_liked.png"),
          path.join(__dirname, "/quick_tale_card_liked_diff.png"),
          { fullPage: true }
        );

        // Execute
        this.cut.dislikeButton.click();

        // Verify
        assertThat(
          webServiceClientMock.requestCaptured.body,
          eqMessage(
            { taleId: "id1", reaction: TaleReaction.DISLIKE },
            REACT_TO_TALE_REQUEST_BODY
          ),
          "dislike request"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_tale_card_disliked.png"),
          path.join(__dirname, "/golden/quick_tale_card_disliked.png"),
          path.join(__dirname, "/quick_tale_card_disliked_diff.png"),
          { fullPage: true }
        );

        // Execute
        this.cut.hateButton.click();

        // Verify
        assertThat(
          webServiceClientMock.requestCaptured.body,
          eqMessage(
            { taleId: "id1", reaction: TaleReaction.HATE },
            REACT_TO_TALE_REQUEST_BODY
          ),
          "hate request"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_tale_card_hated.png"),
          path.join(__dirname, "/golden/quick_tale_card_hated.png"),
          path.join(__dirname, "/quick_tale_card_hated_diff.png"),
          { fullPage: true }
        );

        // Execute
        this.cut.loveButton.click();

        // Verify

        assertThat(
          webServiceClientMock.requestCaptured.body,
          eqMessage(
            { taleId: "id1", reaction: TaleReaction.LOVE },
            REACT_TO_TALE_REQUEST_BODY
          ),
          "love request"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_tale_card_loved.png"),
          path.join(__dirname, "/golden/quick_tale_card_loved.png"),
          path.join(__dirname, "/quick_tale_card_loved_diff.png"),
          { fullPage: true }
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new UndoReactionCase(
      "UndoLove",
      (cut) => cut.loveButton,
      (cut) => cut.lovedButton,
      path.join(__dirname, "/quick_tale_card_undo_love.png"),
      path.join(__dirname, "/quick_tale_card_undo_love_baseline.png"),
      path.join(__dirname, "/quick_tale_card_undo_love_diff.png")
    ),
    new UndoReactionCase(
      "UndoLike",
      (cut) => cut.likeButton,
      (cut) => cut.likedButton,
      path.join(__dirname, "/quick_tale_card_undo_like.png"),
      path.join(__dirname, "/quick_tale_card_undo_like_baseline.png"),
      path.join(__dirname, "/quick_tale_card_undo_like_diff.png")
    ),
    new UndoReactionCase(
      "UndoDislike",
      (cut) => cut.dislikeButton,
      (cut) => cut.dislikedButton,
      path.join(__dirname, "/quick_tale_card_undo_dislike.png"),
      path.join(__dirname, "/quick_tale_card_undo_dislike_baseline.png"),
      path.join(__dirname, "/quick_tale_card_undo_dislike_diff.png")
    ),
    new UndoReactionCase(
      "UndoHate",
      (cut) => cut.hateButton,
      (cut) => cut.hatedButton,
      path.join(__dirname, "/quick_tale_card_undo_hate.png"),
      path.join(__dirname, "/quick_tale_card_undo_hate_baseline.png"),
      path.join(__dirname, "/quick_tale_card_undo_hate_diff.png")
    ),
  ],
});
