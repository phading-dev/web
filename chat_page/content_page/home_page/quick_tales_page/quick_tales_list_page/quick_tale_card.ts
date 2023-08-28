import EventEmitter = require("events");
import { AT_USER } from "../../../../common/at_user";
import { SCHEME } from "../../../../common/color_scheme";
import { IconButton, TooltipPosition } from "../../../../common/icon_button";
import {
  createAngerIcon,
  createCommentIcon,
  createDoubleArrowsIcon,
  createEllipsisIcon,
  createFilledHeartIcon,
  createFilledThumbUpIcon,
  createHeartIcon,
  createPinIcon,
  createThumbUpIcon,
} from "../../../../common/icons";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { WEB_SERVICE_CLIENT } from "../../../../common/web_service_client";
import { CARD_WIDTH } from "./styles";
import { reactToTale } from "@phading/tale_service_interface/client_requests";
import { QuickTaleCard as QuickTaleCardData } from "@phading/tale_service_interface/tale_card";
import { TaleContext } from "@phading/tale_service_interface/tale_context";
import { TaleReaction } from "@phading/tale_service_interface/tale_reaction";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface QuickTaleCard {
  on(event: "imagesLoaded", listener: () => void): this;
  on(event: "pin", listener: (context: TaleContext) => void): this;
  on(
    event: "viewImages",
    listener: (imagePaths: Array<string>, index: number) => void
  ): this;
  on(event: "actionsLineTranstionEnded", listener: () => void): this;
}

export class QuickTaleCard extends EventEmitter {
  private static CONTENT_LINE_HEIGHT = 1.8;
  private static ACTION_BUTTON_SIZE = 5;

  public body: HTMLDivElement;
  public observee: HTMLDivElement;
  // Visible for testing
  public showMoreButton: HTMLDivElement;
  public showLessButton: HTMLDivElement;
  public showCommentsButton: IconButton;
  public actionsExpandButton: IconButton;
  public actionsCollapseButton: IconButton;
  public loveButton: IconButton;
  public lovedButton: IconButton;
  public likeButton: IconButton;
  public likedButton: IconButton;
  public dislikeButton: IconButton;
  public dislikedButton: IconButton;
  public hateButton: IconButton;
  public hatedButton: IconButton;
  public userInfoChip: HTMLDivElement;
  public previewImages = new Array<HTMLImageElement>();

  private textContent: HTMLDivElement;
  private actionsLine: HTMLDivElement;

  public constructor(
    public cardData: QuickTaleCardData,
    pinned: boolean,
    private webServiceClient: WebServiceClient
  ) {
    super();
    let dateFormatter = new Intl.DateTimeFormat(navigator.language, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });

    let userInfoChipRef = new Ref<HTMLDivElement>();
    let actionsExpandButtonRef = new Ref<IconButton>();
    let actionsLineRef = new Ref<HTMLDivElement>();
    let actionsCollapseButtonRef = new Ref<IconButton>();
    let loveButtonRef = new Ref<IconButton>();
    let lovedButtonRef = new Ref<IconButton>();
    let likeButtonRef = new Ref<IconButton>();
    let likedButtonRef = new Ref<IconButton>();
    let dislikeButtonRef = new Ref<IconButton>();
    let dislikedButtonRef = new Ref<IconButton>();
    let hateButtonRef = new Ref<IconButton>();
    let hatedButtonRef = new Ref<IconButton>();
    this.body = E.div(
      {
        class: "quick-tale-card",
        style: `display: flex; flex-flow: column nowrap; gap: 1rem; width: ${CARD_WIDTH}; padding: .6rem 1.2rem; border-bottom: .1rem solid ${SCHEME.neutral2}; box-sizing: border-box; overflow: hidden; background-color: ${SCHEME.neutral4};`,
      },
      ...this.createTextContent(cardData.text),
      ...this.createPreviewImages(cardData.imagePaths),
      E.div(
        {
          class: "quick-tale-card-meta-line",
          style: `position: relative; display: flex; flex-flow: row nowrap; align-items: center; gap: 1rem; width: 100%;`,
        },
        E.divRef(
          userInfoChipRef,
          {
            class: "quick-tale-card-user-info",
            style: `flex: 1 1 auto; display: flex; flex-flow: row nowrap; align-items: center; gap: 1rem; overflow: hidden;`,
          },
          E.image({
            class: "quick-tale-card-user-picture",
            style: `flex: 0 0 auto; width: 4.8rem; height: 4.8rem; border-radius: 4.8rem;`,
            src: cardData.metadata.avatarSmallPath,
          }),
          E.div(
            {
              class: "quick-tale-card-user-names",
              style: `display: flex; flex-flow: column nowrap;`,
            },
            E.div(
              {
                class: "quick-tale-card-user-nature-name",
                style: `font-size: 1.6rem; color: ${SCHEME.neutral0};`,
              },
              E.text(cardData.metadata.userNatureName)
            ),
            E.div(
              {
                class: "quick-tale-card-username",
                style: `font-size: 1.4rem; color: ${SCHEME.neutral2};`,
              },
              E.text(AT_USER + cardData.metadata.username)
            )
          )
        ),
        E.div(
          {
            class: "quick-tale-card-created-timestamp",
            style: `flex: 0 0 auto; font-size: 1.4rem; color: ${SCHEME.neutral2};`,
          },
          E.text(
            dateFormatter.format(new Date(cardData.metadata.createdTimestamp))
          )
        ),
        this.tryCreateCommentButtonOrPinnedButton(pinned),
        assign(
          actionsExpandButtonRef,
          IconButton.create(
            `width: ${QuickTaleCard.ACTION_BUTTON_SIZE}rem; height: ${QuickTaleCard.ACTION_BUTTON_SIZE}rem; box-sizing: border-box; padding: 1rem; cursor: pointer;`,
            createEllipsisIcon(SCHEME.neutral2),
            TooltipPosition.TOP,
            LOCALIZED_TEXT.actionsExpandLabel
          ).show()
        ).body,
        E.divRef(
          actionsLineRef,
          {
            class: "quick-tale-card-actions-line",
            style: `position: absolute; height: 100%; background-color: ${SCHEME.neutral4}; right: 0; top: 0; transition: width .3s linear; overflow: hidden; display: flex; flex-flow: row-reverse nowrap; justify-content: space-between; align-items: center;`,
          },
          assign(
            actionsCollapseButtonRef,
            IconButton.create(
              `position: relative; width: ${QuickTaleCard.ACTION_BUTTON_SIZE}rem; height: ${QuickTaleCard.ACTION_BUTTON_SIZE}rem; box-sizing: border-box; padding: 1.7rem; rotate: 180deg; cursor: pointer;`,
              createDoubleArrowsIcon(SCHEME.neutral2),
              TooltipPosition.TOP,
              LOCALIZED_TEXT.actionsCollapseLabel
            )
          ).body,
          assign(
            loveButtonRef,
            IconButton.create(
              `width: ${QuickTaleCard.ACTION_BUTTON_SIZE}rem; height: ${QuickTaleCard.ACTION_BUTTON_SIZE}rem; box-sizing: border-box;padding: 1.3rem; cursor: pointer;`,
              createHeartIcon(SCHEME.neutral1),
              TooltipPosition.TOP,
              LOCALIZED_TEXT.loveTaleLabel
            )
          ).body,
          assign(
            lovedButtonRef,
            IconButton.create(
              `width: ${QuickTaleCard.ACTION_BUTTON_SIZE}rem; height: ${QuickTaleCard.ACTION_BUTTON_SIZE}rem; box-sizing: border-box; padding: 1.3rem; cursor: pointer;`,
              createFilledHeartIcon(SCHEME.heart),
              TooltipPosition.TOP,
              LOCALIZED_TEXT.undoLoveTaleLabel
            )
          ).body,
          assign(
            likeButtonRef,
            IconButton.create(
              `width: ${QuickTaleCard.ACTION_BUTTON_SIZE}rem; height: ${QuickTaleCard.ACTION_BUTTON_SIZE}rem; box-sizing: border-box;padding: 1.3rem; cursor: pointer;`,
              createThumbUpIcon(SCHEME.neutral1),
              TooltipPosition.TOP,
              LOCALIZED_TEXT.likeTaleLabel
            )
          ).body,
          assign(
            likedButtonRef,
            IconButton.create(
              `width: ${QuickTaleCard.ACTION_BUTTON_SIZE}rem; height: ${QuickTaleCard.ACTION_BUTTON_SIZE}rem; box-sizing: border-box; padding: 1.3rem; cursor: pointer;`,
              createFilledThumbUpIcon(SCHEME.thumbUp),
              TooltipPosition.TOP,
              LOCALIZED_TEXT.undoLikeTaleLabel
            )
          ).body,
          assign(
            dislikeButtonRef,
            IconButton.create(
              `width: ${QuickTaleCard.ACTION_BUTTON_SIZE}rem; height: ${QuickTaleCard.ACTION_BUTTON_SIZE}rem; box-sizing: border-box;padding: 1.3rem; rotate: 180deg; cursor: pointer;`,
              createThumbUpIcon(SCHEME.neutral1),
              TooltipPosition.TOP,
              LOCALIZED_TEXT.dislikeTaleLabel
            )
          ).body,
          assign(
            dislikedButtonRef,
            IconButton.create(
              `width: ${QuickTaleCard.ACTION_BUTTON_SIZE}rem; height: ${QuickTaleCard.ACTION_BUTTON_SIZE}rem; box-sizing: border-box; padding: 1.3rem; rotate: 180deg; cursor: pointer;`,
              createFilledThumbUpIcon(SCHEME.thumbUp),
              TooltipPosition.TOP,
              LOCALIZED_TEXT.undoDislikeTaleLabel
            )
          ).body,
          assign(
            hateButtonRef,
            IconButton.create(
              `width: ${QuickTaleCard.ACTION_BUTTON_SIZE}rem; height: ${QuickTaleCard.ACTION_BUTTON_SIZE}rem; box-sizing: border-box;padding: 1.3rem; cursor: pointer;`,
              createAngerIcon(SCHEME.neutral1),
              TooltipPosition.TOP,
              LOCALIZED_TEXT.hateTaleLabel
            )
          ).body,
          assign(
            hatedButtonRef,
            IconButton.create(
              `width: ${QuickTaleCard.ACTION_BUTTON_SIZE}rem; height: ${QuickTaleCard.ACTION_BUTTON_SIZE}rem; box-sizing: border-box; padding: 1.3rem; cursor: pointer;`,
              createAngerIcon(SCHEME.anger),
              TooltipPosition.TOP,
              LOCALIZED_TEXT.undoHateTaleLabel
            )
          ).body
        )
      )
    );
    this.observee = this.body;
    this.userInfoChip = userInfoChipRef.val;
    this.actionsExpandButton = actionsExpandButtonRef.val;
    this.actionsLine = actionsLineRef.val;
    this.actionsCollapseButton = actionsCollapseButtonRef.val;
    this.loveButton = loveButtonRef.val;
    this.lovedButton = lovedButtonRef.val;
    this.likeButton = likeButtonRef.val;
    this.likedButton = likedButtonRef.val;
    this.dislikeButton = dislikeButtonRef.val;
    this.dislikedButton = dislikedButtonRef.val;
    this.hateButton = hateButtonRef.val;
    this.hatedButton = hatedButtonRef.val;

    this.hideActions();
    if (cardData.metadata.reaction === TaleReaction.LOVE) {
      this.loveButton.hide();
    } else {
      this.lovedButton.hide();
    }
    if (cardData.metadata.reaction === TaleReaction.LIKE) {
      this.likeButton.hide();
    } else {
      this.likedButton.hide();
    }
    if (cardData.metadata.reaction === TaleReaction.DISLIKE) {
      this.dislikeButton.hide();
    } else {
      this.dislikedButton.hide();
    }
    if (cardData.metadata.reaction === TaleReaction.HATE) {
      this.hateButton.hide();
    } else {
      this.hatedButton.hide();
    }
    this.userInfoChip.addEventListener("click", () =>
      this.emit("pin", { userId: cardData.metadata.userId } as TaleContext)
    );
    this.actionsExpandButton.on("action", () => this.showActions());
    this.actionsCollapseButton.on("action", () => this.hideActions());
    this.actionsLine.addEventListener("transitionend", () =>
      this.emit("actionsLineTranstionEnded")
    );
    this.loveButton.on("action", () => this.love());
    this.lovedButton.on("action", () => this.unlove());
    this.likeButton.on("action", () => this.like());
    this.likedButton.on("action", () => this.unlike());
    this.dislikeButton.on("action", () => this.dislike());
    this.dislikedButton.on("action", () => this.undislike());
    this.hateButton.on("action", () => this.hate());
    this.hatedButton.on("action", () => this.unhate());
  }

  public static create(
    cardData: QuickTaleCardData,
    pinned: boolean
  ): QuickTaleCard {
    return new QuickTaleCard(cardData, pinned, WEB_SERVICE_CLIENT);
  }

  private createTextContent(text?: string): Array<HTMLElement> {
    if (!text) {
      return [];
    }

    let textContentRef = new Ref<HTMLDivElement>();
    let showMoreButtonRef = new Ref<HTMLDivElement>();
    let showLessButtonRef = new Ref<HTMLDivElement>();
    let wrapper = E.div(
      {
        class: "quick-tale-card-text-content-wrapper",
      },
      E.divRef(
        textContentRef,
        {
          class: "quick-tale-card-text-content",
          style: `font-size: 1.6rem; line-height: ${
            QuickTaleCard.CONTENT_LINE_HEIGHT
          }rem; white-space: pre-wrap; color: ${SCHEME.neutral0}; max-height: ${
            QuickTaleCard.CONTENT_LINE_HEIGHT * 4
          }rem; overflow: hidden;`,
        },
        E.text(text)
      ),
      E.divRef(
        showMoreButtonRef,
        {
          class: "quick-tale-card-text-content-show-more-button",
          style: `display: none; font-size: 1.4rem; line-height: ${QuickTaleCard.CONTENT_LINE_HEIGHT}rem; color: ${SCHEME.primary0}; cursor: pointer;`,
        },
        E.text(LOCALIZED_TEXT.showMoreButtonLabel)
      ),
      E.divRef(
        showLessButtonRef,
        {
          class: "quick-tale-card-text-content-show-less-button",
          style: `display: none; font-size: 1.4rem; line-height: ${QuickTaleCard.CONTENT_LINE_HEIGHT}rem; color: ${SCHEME.neutral2};cursor: pointer;`,
        },
        E.text(LOCALIZED_TEXT.showLessButtonLabel)
      )
    );
    this.textContent = textContentRef.val;
    this.showMoreButton = showMoreButtonRef.val;
    this.showLessButton = showLessButtonRef.val;

    this.onTextContentRendered(() =>
      this.checkTextContentHeightAndInitButtons()
    );
    this.showMoreButton.addEventListener("click", () => this.showMoreContent());
    this.showLessButton.addEventListener("click", () => this.showLessContent());
    return [wrapper];
  }

  private onTextContentRendered(listener: () => void): void {
    let resizeObserver = new ResizeObserver((entries) => {
      listener();
      resizeObserver.unobserve(this.textContent);
    });
    resizeObserver.observe(this.textContent);
  }

  private checkTextContentHeightAndInitButtons(): void {
    if (this.textContent.scrollHeight <= this.textContent.clientHeight) {
      return;
    }
    this.textContent.style.maxHeight = "unset";
    this.showLessContent();
  }

  private showMoreContent(): void {
    this.textContent.style.height = "unset";
    this.showMoreButton.style.display = "none";
    this.showLessButton.style.display = "block";
  }

  private showLessContent(): void {
    this.textContent.style.height = `${
      QuickTaleCard.CONTENT_LINE_HEIGHT * 3
    }rem`;
    this.showMoreButton.style.display = "block";
    this.showLessButton.style.display = "none";
  }

  private createPreviewImages(imagePaths?: Array<string>): Array<HTMLElement> {
    if (!imagePaths || imagePaths.length === 0) {
      return [];
    } else if (imagePaths.length === 1) {
      return [
        this.createSinglePreviewImage(imagePaths[0], () =>
          this.emit("imagesLoaded")
        ),
      ];
    } else {
      let loadedCount = 0;
      return [
        E.div(
          {
            class: "quick-tale-card-images",
            style: `display: flex; flex-flow: row wrap; column-gap: 1.5rem; row-gap: 1rem; align-items: center;`,
          },
          ...imagePaths.map((imagePath, index, imagePaths) =>
            this.createTilePreviewImage(imagePath, index, imagePaths, () => {
              loadedCount += 1;
              if (loadedCount >= imagePaths.length) {
                this.emit("imagesLoaded");
              }
            })
          )
        ),
      ];
    }
  }

  private createSinglePreviewImage(
    imagePath: string,
    onload: () => void
  ): HTMLElement {
    let imageElement = E.image({
      class: "quick-tale-card-single-preview-image",
      style: `flex: 0 0 auto; align-self: center; cursor: pointer;`,
      src: imagePath,
    });
    this.previewImages.push(imageElement);
    imageElement.onload = () => {
      if (imageElement.naturalHeight > imageElement.naturalWidth) {
        imageElement.style.maxHeight = `25rem`;
      } else {
        imageElement.style.maxWidth = `25rem`;
      }
      onload();
    };
    imageElement.addEventListener("click", () =>
      this.emit("viewImages", [imagePath], 0)
    );
    return imageElement;
  }

  private createTilePreviewImage(
    imagePath: string,
    index: number,
    imagePaths: Array<string>,
    onload: () => void
  ): HTMLElement {
    let imageElementRef = new Ref<HTMLImageElement>();
    let container = E.div(
      {
        class: "quick-tale-card-tile-preview-image-container",
        style: `flex: 0 0 auto; width: 18.1rem; height: 18.1rem; overflow: hidden; display: flex; flex-flow: row nowrap; justify-content: center; align-items: center;`,
      },
      E.imageRef(imageElementRef, {
        class: "quick-tale-card-tile-preview-image",
        style: `flex: 0 0 auto; cursor: pointer;`,
        src: imagePath,
      })
    );
    let imageElement = imageElementRef.val;
    this.previewImages.push(imageElement);
    imageElement.onload = () => {
      if (imageElement.naturalHeight > imageElement.naturalWidth) {
        imageElement.style.width = `100%`;
      } else {
        imageElement.style.height = `100%`;
      }
      onload();
    };
    imageElement.addEventListener("click", () =>
      this.emit("viewImages", imagePaths, index)
    );
    return container;
  }

  private tryCreateCommentButtonOrPinnedButton(
    pinned: boolean
  ): HTMLButtonElement {
    if (pinned) {
      return IconButton.create(
        `width: ${QuickTaleCard.ACTION_BUTTON_SIZE}rem; height: ${QuickTaleCard.ACTION_BUTTON_SIZE}rem; box-sizing: border-box; padding: 1.3rem; margin-left: 1rem;`,
        createPinIcon(SCHEME.primary1),
        TooltipPosition.TOP,
        LOCALIZED_TEXT.pinnedLabel
      ).show().body;
    } else {
      this.showCommentsButton = IconButton.create(
        `width: ${QuickTaleCard.ACTION_BUTTON_SIZE}rem; height: ${QuickTaleCard.ACTION_BUTTON_SIZE}rem; box-sizing: border-box; padding: 1.2rem; margin-left: 1rem; cursor: pointer;`,
        createCommentIcon(SCHEME.neutral2),
        TooltipPosition.TOP,
        LOCALIZED_TEXT.showRepliesLabel
      ).show();
      this.showCommentsButton.on("action", () =>
        this.emit("pin", {
          taleId: this.cardData.metadata.taleId,
        } as TaleContext)
      );
      return this.showCommentsButton.body;
    }
  }

  private hideActions(): void {
    this.actionsLine.style.width = `0`;
  }

  private showActions(): void {
    this.actionsLine.style.width = `100%`;
  }

  private love(): void {
    this.resetAllReactionButtons();
    this.loveButton.hide();
    this.lovedButton.show();
    this.react(TaleReaction.LOVE);
  }

  private resetAllReactionButtons(): void {
    this.loveButton.show();
    this.lovedButton.hide();
    this.likeButton.show();
    this.likedButton.hide();
    this.dislikeButton.show();
    this.dislikedButton.hide();
    this.hateButton.show();
    this.hatedButton.hide();
  }

  private async react(reaction?: TaleReaction): Promise<void> {
    await reactToTale(this.webServiceClient, {
      taleId: this.cardData.metadata.taleId,
      reaction,
    });
  }

  private unlove(): void {
    this.loveButton.show();
    this.lovedButton.hide();
    this.react();
  }

  private like(): void {
    this.resetAllReactionButtons();
    this.likeButton.hide();
    this.likedButton.show();
    this.react(TaleReaction.LIKE);
  }

  private unlike(): void {
    this.likeButton.show();
    this.likedButton.hide();
    this.react();
  }

  private dislike(): void {
    this.resetAllReactionButtons();
    this.dislikeButton.hide();
    this.dislikedButton.show();
    this.react(TaleReaction.DISLIKE);
  }

  private undislike(): void {
    this.dislikeButton.show();
    this.dislikedButton.hide();
    this.react();
  }

  private hate(): void {
    this.resetAllReactionButtons();
    this.hateButton.hide();
    this.hatedButton.show();
    this.react(TaleReaction.HATE);
  }

  private unhate(): void {
    this.hateButton.show();
    this.hatedButton.hide();
    this.react();
  }

  public remove(): void {
    this.body.remove();
  }
}
