import EventEmitter = require("events");
import { SCHEME } from "./color_scheme";
import { IconButton, TooltipPosition } from "./icon_button";
import { createFilledThumbUpIcon } from "./icons";
import { LOCALIZED_TEXT } from "./locales/localized_text";
import { ICON_S } from "./sizes";
import { Liking } from "@phading/comment_service_interface/show_app/comment";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export interface LikeDislikeButtons {
  on(event: "like", listener: (liking: Liking) => Promise<void>): this;
  on(event: "postLike", listener: (error?: Error) => void): this;
}

export class LikeDislikeButtons extends EventEmitter {
  public static create(
    containerStyle: string,
    iconPadding: number, // rem
    tooltipPosition: TooltipPosition
  ): LikeDislikeButtons {
    return new LikeDislikeButtons(containerStyle, iconPadding, tooltipPosition);
  }

  private container: HTMLDivElement;
  private thumbUpButton_: IconButton;
  private thumbUpedButton_: IconButton;
  private thumbDownButton_: IconButton;
  private thumbDownedButton_: IconButton;
  private liking: Liking;

  public constructor(
    containerStyle: string,
    iconPadding: number,
    tooltipPosition: TooltipPosition
  ) {
    super();
    let thumbUpButtonRef = new Ref<IconButton>();
    let thumbUpIconRef = new Ref<SVGSVGElement>();
    let thumbUpedButtonRef = new Ref<IconButton>();
    let thumbUpedIconRef = new Ref<SVGSVGElement>();
    let thumbDownButtonRef = new Ref<IconButton>();
    let thumbDownIconRef = new Ref<SVGSVGElement>();
    let thumbDownedButtonRef = new Ref<IconButton>();
    let thumbDownedIconRef = new Ref<SVGSVGElement>();
    this.container = E.div(
      {
        class: "like-dislike-buttons-container",
        style: containerStyle,
      },
      assign(
        thumbUpButtonRef,
        IconButton.create(
          `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: ${iconPadding}rem; box-sizing: border-box;`,
          assign(thumbUpIconRef, createFilledThumbUpIcon(SCHEME.neutral2)),
          tooltipPosition,
          LOCALIZED_TEXT.likeButtonLabel,
          () => {
            thumbUpIconRef.val.style.fill = SCHEME.neutral2;
          },
          () => {
            thumbUpIconRef.val.style.fill = SCHEME.neutral3;
          }
        )
      ).body,
      assign(
        thumbUpedButtonRef,
        IconButton.create(
          `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: ${iconPadding}rem; box-sizing: border-box;`,
          assign(thumbUpedIconRef, createFilledThumbUpIcon(SCHEME.primary1)),
          tooltipPosition,
          LOCALIZED_TEXT.likedButtonLabel,
          () => {
            thumbUpedIconRef.val.style.fill = SCHEME.primary1;
          },
          () => {
            thumbUpedIconRef.val.style.fill = SCHEME.neutral3;
          }
        )
      ).body,
      assign(
        thumbDownButtonRef,
        IconButton.create(
          `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: ${iconPadding}rem; box-sizing: border-box;`,
          assign(
            thumbDownIconRef,
            createFilledThumbUpIcon(
              SCHEME.neutral2,
              `transform: rotate(180deg);`
            )
          ),
          tooltipPosition,
          LOCALIZED_TEXT.dislikeButtonLabel,
          () => {
            thumbDownIconRef.val.style.fill = SCHEME.neutral2;
          },
          () => {
            thumbDownIconRef.val.style.fill = SCHEME.neutral3;
          }
        )
      ).body,
      assign(
        thumbDownedButtonRef,
        IconButton.create(
          `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: ${iconPadding}rem; box-sizing: border-box;`,
          assign(
            thumbDownedIconRef,
            createFilledThumbUpIcon(
              SCHEME.primary1,
              `transform: rotate(180deg);`
            )
          ),
          tooltipPosition,
          LOCALIZED_TEXT.dislikedButtonLabel,
          () => {
            thumbDownedIconRef.val.style.fill = SCHEME.primary1;
          },
          () => {
            thumbDownedIconRef.val.style.fill = SCHEME.neutral3;
          }
        )
      ).body
    );
    this.thumbUpButton_ = thumbUpButtonRef.val;
    this.thumbUpedButton_ = thumbUpedButtonRef.val;
    this.thumbDownButton_ = thumbDownButtonRef.val;
    this.thumbDownedButton_ = thumbDownedButtonRef.val;

    this.thumbUpButton_.on("action", () => this.handleLike(Liking.LIKE));
    this.thumbUpedButton_.on("action", () => this.handleLike(Liking.NEUTRAL));
    this.thumbDownButton_.on("action", () => this.handleLike(Liking.DISLIKE));
    this.thumbDownedButton_.on("action", () => this.handleLike(Liking.NEUTRAL));
  }

  private async handleLike(newLiking: Liking): Promise<void> {
    this.disable();
    try {
      await Promise.all(
        this.listeners("like").map((callback) => callback(newLiking))
      );
    } catch (e) {
      console.log(e);
      this.enable(this.liking);
      this.emit("postLike", e);
      return;
    }
    this.enable(newLiking);
    this.emit("postLike");
  }

  private disable(): void {
    this.thumbUpButton_.disable();
    this.thumbUpedButton_.disable();
    this.thumbDownButton_.disable();
    this.thumbDownedButton_.disable();
  }

  public enable(liking: Liking): this {
    this.thumbUpButton_.enable();
    this.thumbUpedButton_.enable();
    this.thumbDownButton_.enable();
    this.thumbDownedButton_.enable();

    this.liking = liking;
    switch (liking) {
      case Liking.NEUTRAL:
        this.thumbUpButton_.show();
        this.thumbUpedButton_.hide();
        this.thumbDownButton_.show();
        this.thumbDownedButton_.hide();
        break;
      case Liking.LIKE:
        this.thumbUpButton_.hide();
        this.thumbUpedButton_.show();
        this.thumbDownButton_.show();
        this.thumbDownedButton_.hide();
        break;
      case Liking.DISLIKE:
        this.thumbUpButton_.show();
        this.thumbUpedButton_.hide();
        this.thumbDownButton_.hide();
        this.thumbDownedButton_.show();
        break;
    }
    return this;
  }

  public get body() {
    return this.container;
  }

  public remove(): void {
    this.container.remove();
  }

  // Visible for testing
  public get thumbUpButton() {
    return this.thumbUpButton_;
  }
  public get thumbUpedButton() {
    return this.thumbUpedButton_;
  }
  public get thumbDownButton() {
    return this.thumbDownButton_;
  }
  public get thumbDownedButton() {
    return this.thumbDownedButton_;
  }
}
