import smallImage = require("./test_data/small.jpg");
import tallImage = require("./test_data/tall.webp");
import userImage = require("./test_data/user_image.jpg");
import wideImage = require("./test_data/wide.png");
import { IconButton } from "../../../common/icon_button";
import { normalizeBody } from "../../../common/normalize_body";
import { QuickTaleCard } from "./quick_tale_card";
import { REACT_TO_TALE_REQUEST_BODY } from "@phading/tale_service_interface/interface";
import { TaleReaction } from "@phading/tale_service_interface/tale_reaction";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq, eqArray } from "@selfage/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/test_runner";
import { WebServiceClient } from "@selfage/web_service_client";
import "@selfage/puppeteer_test_executor_api";

normalizeBody();

class RenderCase implements TestCase {
  private container: HTMLDivElement;
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
    let cut = new QuickTaleCard(
      {
        metadata: {
          avatarSmallPath: userImage,
          username: "some-name",
          userNatureName: "Some Name",
          createdTimestamp: Date.parse("2022-10-11"),
        },
        text: this.option.text,
        images: this.option.images,
      },
      this.option.pinned,
      undefined
    );
    this.container = E.div({}, cut.body);
    document.body.style.width = "800px";

    // Execute
    document.body.appendChild(this.container);

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

class UndoReactionCase implements TestCase {
  private container: HTMLDivElement;
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
    let cut = new QuickTaleCard(
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
    this.container = E.div({}, cut.body);
    document.body.style.width = "800px";
    document.body.appendChild(this.container);
    document.body.clientHeight; // Force reflow
    // Expand actions
    cut.actionsExpandButton.click();
    await new Promise<void>((resolve) =>
      cut.once("actionsLineTranstionEnded", resolve)
    );
    await puppeteerScreenshot(this.screenshotBaselinePath, { fullPage: true });
    this.getReactionButtonFn(cut).click();

    // Execute
    this.getUndoReactionButtonFn(cut).click();

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
    await puppeteerDeleteFile(this.screenshotBaselinePath);
  }
  public tearDown() {
    this.container.remove();
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
      __dirname + "/quick_tale_card_render_one_wide_image.png",
      __dirname + "/golden/quick_tale_card_render_one_wide_image.png",
      __dirname + "/quick_tale_card_render_one_wide_image_diff.png"
    ),
    new RenderCase(
      "RenderOneTallImage",
      {
        images: [tallImage],
      },
      __dirname + "/quick_tale_card_render_one_tall_image.png",
      __dirname + "/golden/quick_tale_card_render_one_tall_image.png",
      __dirname + "/quick_tale_card_render_one_tall_image_diff.png"
    ),
    new RenderCase(
      "RenderOneSmallImageOnly",
      {
        text: "blahblahblahblah\nsomethingsomething",
        images: [smallImage],
      },
      __dirname + "/quick_tale_card_render_one_small_image_with_text.png",
      __dirname +
        "/golden/quick_tale_card_render_one_small_image_with_text.png",
      __dirname + "/quick_tale_card_render_one_small_image_with_text_diff.png"
    ),
    new RenderCase(
      "RenderFourImages",
      {
        images: [smallImage, userImage, wideImage, tallImage],
      },
      __dirname + "/quick_tale_card_render_4_images.png",
      __dirname + "/golden/quick_tale_card_render_4_images.png",
      __dirname + "/quick_tale_card_render_4_images_diff.png"
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
            images: [smallImage],
          },
          false,
          undefined
        );
        let imageUrlsCaptured: Array<string>;
        let indexCaptured: number;
        cut.on("viewImages", (imageUrls, index) => {
          imageUrlsCaptured = imageUrls;
          indexCaptured = index;
        });

        // Execute
        cut.previewImages[0].click();

        // Verify
        assertThat(imageUrlsCaptured, eqArray([eq(smallImage)]), "image URLs");
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
            images: [smallImage, tallImage, wideImage],
          },
          false,
          undefined
        );
        let imageUrlsCaptured: Array<string>;
        let indexCaptured: number;
        cut.on("viewImages", (imageUrls, index) => {
          imageUrlsCaptured = imageUrls;
          indexCaptured = index;
        });
        let expectedImageUrls = [eq(smallImage), eq(tallImage), eq(wideImage)];

        // Execute
        cut.previewImages[0].click();

        // Verify
        assertThat(
          imageUrlsCaptured,
          eqArray(expectedImageUrls),
          "image URLs 0"
        );
        assertThat(indexCaptured, eq(0), "index");

        // Execute
        cut.previewImages[1].click();

        // Verify
        assertThat(
          imageUrlsCaptured,
          eqArray(expectedImageUrls),
          "image URLs 1"
        );
        assertThat(indexCaptured, eq(1), "index");

        // Execute
        cut.previewImages[2].click();

        // Verify
        assertThat(
          imageUrlsCaptured,
          eqArray(expectedImageUrls),
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
      __dirname + "/quick_tale_card_render_text_only.png",
      __dirname + "/golden/quick_tale_card_render_text_only.png",
      __dirname + "/quick_tale_card_render_text_only_diff.png"
    ),
    new RenderCase(
      "RenderPinned",
      {
        text: "blahblahblahblah\nsomethingsomething\n3rdline\n4thline",
        pinned: true,
      },
      __dirname + "/quick_tale_card_render_pinned.png",
      __dirname + "/golden/quick_tale_card_render_pinned.png",
      __dirname + "/quick_tale_card_render_pinned_diff.png"
    ),
    new (class implements TestCase {
      public name = "MultiLinesText";
      private container: HTMLDivElement;
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
            text: "hahah\nhahah\nhahah\nhahah\nhahah\nhahah\nhahah\nhahah\nhahah\nhahah\nhahah\nhahah\nhahah\nhahah\n",
          },
          false,
          undefined
        );
        this.container = E.div({}, cut.body);
        document.body.style.width = "800px";

        // Execute
        document.body.appendChild(this.container);

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/quick_tale_card_show_3_lines.png",
          __dirname + "/golden/quick_tale_card_show_3_lines.png",
          __dirname + "/quick_tale_card_show_3_lines_diff.png",
          { fullPage: true }
        );

        // Execute
        cut.showMoreButton.click();

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/quick_tale_card_show_more_lines.png",
          __dirname + "/golden/quick_tale_card_show_more_lines.png",
          __dirname + "/quick_tale_card_show_more_lines_diff.png",
          { fullPage: true }
        );

        // Execute
        cut.showLessButton.click();

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/quick_tale_card_show_3_lines.png",
          __dirname + "/golden/quick_tale_card_show_3_lines.png",
          __dirname + "/quick_tale_card_show_3_lines_diff.png",
          { fullPage: true }
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "RenderActionsLine";
      private container: HTMLDivElement;
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
            text: "blahblahblahblah\nsomethingsomething",
          },
          false,
          undefined
        );
        this.container = E.div({}, cut.body);
        document.body.style.width = "800px";
        document.body.appendChild(this.container);
        await puppeteerScreenshot(
          __dirname + "/quick_tale_card_render_no_actions_baseline.png",
          { fullPage: true }
        );

        // Execute
        cut.actionsExpandButton.click();
        await new Promise<void>((resolve) => {
          cut.once("actionsLineTranstionEnded", resolve);
        });

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/quick_tale_card_actions_expanded.png",
          __dirname + "/golden/quick_tale_card_actions_expanded.png",
          __dirname + "/quick_tale_card_actions_expanded_diff.png",
          { fullPage: true }
        );

        // Execute
        cut.actionsCollapseButton.click();
        await new Promise<void>((resolve) => {
          cut.once("actionsLineTranstionEnded", resolve);
        });

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/quick_tale_card_actions_collapsed.png",
          __dirname + "/quick_tale_card_render_no_actions_baseline.png",
          __dirname + "/quick_tale_card_actions_collapsed_diff.png",
          { fullPage: true }
        );
        await puppeteerDeleteFile(
          __dirname + "/quick_tale_card_render_no_actions_baseline.png"
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "SwitchReactions";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
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
        let cut = new QuickTaleCard(
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
        this.container = E.div({}, cut.body);
        document.body.style.width = "800px";
        document.body.appendChild(this.container);
        document.body.clientHeight; // Force reflow.
        cut.actionsExpandButton.click();
        await new Promise<void>((resolve) =>
          cut.once("actionsLineTranstionEnded", resolve)
        );

        // Execute
        cut.loveButton.click();

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
          __dirname + "/quick_tale_card_loved.png",
          __dirname + "/golden/quick_tale_card_loved.png",
          __dirname + "/quick_tale_card_loved_diff.png",
          { fullPage: true }
        );

        // Execute
        cut.likeButton.click();

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
          __dirname + "/quick_tale_card_liked.png",
          __dirname + "/golden/quick_tale_card_liked.png",
          __dirname + "/quick_tale_card_liked_diff.png",
          { fullPage: true }
        );

        // Execute
        cut.dislikeButton.click();

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
          __dirname + "/quick_tale_card_disliked.png",
          __dirname + "/golden/quick_tale_card_disliked.png",
          __dirname + "/quick_tale_card_disliked_diff.png",
          { fullPage: true }
        );

        // Execute
        cut.hateButton.click();

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
          __dirname + "/quick_tale_card_hated.png",
          __dirname + "/golden/quick_tale_card_hated.png",
          __dirname + "/quick_tale_card_hated_diff.png",
          { fullPage: true }
        );

        // Execute
        cut.loveButton.click();

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
          __dirname + "/quick_tale_card_loved.png",
          __dirname + "/golden/quick_tale_card_loved.png",
          __dirname + "/quick_tale_card_loved_diff.png",
          { fullPage: true }
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new UndoReactionCase(
      "UndoLove",
      (cut) => cut.loveButton,
      (cut) => cut.lovedButton,
      __dirname + "/quick_tale_card_undo_love.png",
      __dirname + "/quick_tale_card_undo_love_baseline.png",
      __dirname + "/quick_tale_card_undo_love_diff.png"
    ),
    new UndoReactionCase(
      "UndoLike",
      (cut) => cut.likeButton,
      (cut) => cut.likedButton,
      __dirname + "/quick_tale_card_undo_like.png",
      __dirname + "/quick_tale_card_undo_like_baseline.png",
      __dirname + "/quick_tale_card_undo_like_diff.png"
    ),
    new UndoReactionCase(
      "UndoDislike",
      (cut) => cut.dislikeButton,
      (cut) => cut.dislikedButton,
      __dirname + "/quick_tale_card_undo_dislike.png",
      __dirname + "/quick_tale_card_undo_dislike_baseline.png",
      __dirname + "/quick_tale_card_undo_dislike_diff.png"
    ),
    new UndoReactionCase(
      "UndoHate",
      (cut) => cut.hateButton,
      (cut) => cut.hatedButton,
      __dirname + "/quick_tale_card_undo_hate.png",
      __dirname + "/quick_tale_card_undo_hate_baseline.png",
      __dirname + "/quick_tale_card_undo_hate_diff.png"
    ),
  ],
});
