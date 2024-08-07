import EventEmitter = require("events");
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

// TODO: Needs a new set of outlined icons to be filled when chosen.
export class LikeDislikeButtons extends EventEmitter {
  public static create(
    containerStyle: string,
    iconPadding: number, // rem
    tooltipPosition: TooltipPosition,
  ): LikeDislikeButtons {
    return new LikeDislikeButtons(containerStyle, iconPadding, tooltipPosition);
  }

  public body: HTMLDivElement;
  public thumbUpButton = new Ref<IconButton>();
  public thumbUpedButton = new Ref<IconButton>();
  public thumbDownButton = new Ref<IconButton>();
  public thumbDownedButton = new Ref<IconButton>();
  private liking: Liking;
  private displayStyle: string;

  public constructor(
    containerStyle: string,
    iconPadding: number,
    tooltipPosition: TooltipPosition,
  ) {
    super();
    this.body = E.div(
      {
        class: "like-dislike-buttons",
        style: `transition: opacity .2s; ${containerStyle}`,
      },
      assign(
        this.thumbUpButton,
        IconButton.create(
          ICON_S,
          iconPadding,
          ``,
          createFilledThumbUpIcon("currentColor"),
          tooltipPosition,
          LOCALIZED_TEXT.likeButtonLabel,
        ),
      ).body,
      assign(
        this.thumbUpedButton,
        IconButton.create(
          ICON_S,
          iconPadding,
          ``,
          createFilledThumbUpIcon("currentColor"),
          tooltipPosition,
          LOCALIZED_TEXT.likedButtonLabel,
        ),
      ).body,
      assign(
        this.thumbDownButton,
        IconButton.create(
          ICON_S,
          iconPadding,
          ``,
          createFilledThumbUpIcon(
            "currenetColor",
            `transform: rotate(180deg);`,
          ),
          tooltipPosition,
          LOCALIZED_TEXT.dislikeButtonLabel,
        ),
      ).body,
      assign(
        this.thumbDownedButton,
        IconButton.create(
          ICON_S,
          iconPadding,
          ``,
          createFilledThumbUpIcon("currentColor", `transform: rotate(180deg);`),
          tooltipPosition,
          LOCALIZED_TEXT.dislikedButtonLabel,
        ),
      ).body,
    );

    this.setLiking(Liking.NEUTRAL);
    this.displayStyle = this.body.style.display;
    this.thumbUpButton.val.on("action", () => this.handleLike(Liking.LIKE));
    this.thumbUpedButton.val.on("action", () =>
      this.handleLike(Liking.NEUTRAL),
    );
    this.thumbDownButton.val.on("action", () =>
      this.handleLike(Liking.DISLIKE),
    );
    this.thumbDownedButton.val.on("action", () =>
      this.handleLike(Liking.NEUTRAL),
    );
  }

  private setLiking(liking: Liking): void {
    this.liking = liking;
    switch (liking) {
      case Liking.NEUTRAL:
        this.thumbUpButton.val.show();
        this.thumbUpedButton.val.hide();
        this.thumbDownButton.val.show();
        this.thumbDownedButton.val.hide();
        break;
      case Liking.LIKE:
        this.thumbUpButton.val.hide();
        this.thumbUpedButton.val.show();
        this.thumbDownButton.val.show();
        this.thumbDownedButton.val.hide();
        break;
      case Liking.DISLIKE:
        this.thumbUpButton.val.show();
        this.thumbUpedButton.val.hide();
        this.thumbDownButton.val.hide();
        this.thumbDownedButton.val.show();
        break;
    }
  }

  private async handleLike(newLiking: Liking): Promise<void> {
    this.disable();
    try {
      await Promise.all(
        this.listeners("like").map((callback) => callback(newLiking)),
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
    this.thumbUpButton.val.disable();
    this.thumbUpedButton.val.disable();
    this.thumbDownButton.val.disable();
    this.thumbDownedButton.val.disable();
    return this;
  }

  public enable(liking: Liking): this {
    this.thumbUpButton.val.enable();
    this.thumbUpedButton.val.enable();
    this.thumbDownButton.val.enable();
    this.thumbDownedButton.val.enable();
    this.setLiking(liking);
    return this;
  }

  public show(): this {
    this.body.style.display = this.displayStyle;
    // Force reflow.
    this.body.offsetHeight;
    this.body.style.opacity = "1";
    return this;
  }

  public hide(): this {
    this.body.style.opacity = "0";
    this.body.style.display = "none";
    return this;
  }

  public remove(): void {
    this.body.remove();
  }
}
