import EventEmitter = require("events");
import { SCHEME } from "./color_scheme";
import { IconButton, TooltipPosition } from "./icon_button";
import { createFilledThumbUpIcon } from "./icons";
import { LOCALIZED_TEXT } from "./locales/localized_text";
import { ICON_S } from "./sizes";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export enum Liking {
  NEUTRAL = 1,
  LIKE = 2,
  DISLIKE = 3,
}

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

  private body_: HTMLDivElement;
  private thumbUpButton_: IconButton;
  private thumbUpedButton_: IconButton;
  private thumbDownButton_: IconButton;
  private thumbDownedButton_: IconButton;
  private liking: Liking;
  private displayStyle: string;

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
    this.body_ = E.div(
      {
        class: "like-dislike-buttons",
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

    this.setLiking(Liking.NEUTRAL);
    this.displayStyle = this.body_.style.display;
    this.thumbUpButton_.on("action", () => this.handleLike(Liking.LIKE));
    this.thumbUpedButton_.on("action", () => this.handleLike(Liking.NEUTRAL));
    this.thumbDownButton_.on("action", () => this.handleLike(Liking.DISLIKE));
    this.thumbDownedButton_.on("action", () => this.handleLike(Liking.NEUTRAL));
  }

  private setLiking(liking: Liking): void {
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

  public disable(): this {
    this.thumbUpButton_.disable();
    this.thumbUpedButton_.disable();
    this.thumbDownButton_.disable();
    this.thumbDownedButton_.disable();
    return this;
  }

  public enable(liking: Liking): this {
    this.thumbUpButton_.enable();
    this.thumbUpedButton_.enable();
    this.thumbDownButton_.enable();
    this.thumbDownedButton_.enable();
    this.setLiking(liking);
    return this;
  }

  public get body() {
    return this.body_;
  }

  public remove(): void {
    this.body_.remove();
  }

  public show(): this {
    this.body_.style.display = this.displayStyle;
    return this;
  }

  public hide(): this {
    this.body_.style.display = "none";
    return this;
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
