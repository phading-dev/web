import EventEmitter = require("events");
import { SCHEME } from "../../../../../common/color_scheme";
import { HoverObserver, Mode } from "../../../../../common/hover_observer";
import { TooltipPosition } from "../../../../../common/icon_button";
import { LikeDislikeButtons } from "../../../../../common/like_dislike_buttons";
import { Comment } from "@phading/comment_service_interface/frontend/show/comment";
import { DanmakuSettings } from "@phading/product_service_interface/consumer/frontend/show/player_settings";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export interface DanmakuElementComponent {
  on(event: "occupyEnded", listener: () => void): this;
  on(event: "displayEnded", listener: () => void): this;
  on(event: "postLike", listener: () => void): this;
}

export class DanmakuElement extends EventEmitter {
  public static create(
    danmakuSettings: DanmakuSettings,
    comment: Comment,
  ): DanmakuElement {
    return new DanmakuElement(
      (callback, delay) => window.setTimeout(callback, delay),
      (id) => window.clearTimeout(id),
      (element) => window.getComputedStyle(element),
      danmakuSettings,
      comment,
    );
  }

  private static FONT_SIZE_SCALE = 1 / 10;

  public body: HTMLDivElement;
  private content = new Ref<HTMLDivElement>();
  private likeDislikeButtons = new Ref<LikeDislikeButtons>();
  private hoverObserver: HoverObserver;
  private canvasWidth: number;
  private posX: number;
  private posY: number;
  private playAfterLeaving: boolean;
  private playByPlayer: boolean;
  private endOccupyTimeoutId: number;
  private endDisplayTimeoutId: number;

  public constructor(
    private setTimeout: (callback: () => void, delay: number) => number,
    private clearTimeout: (id: number) => void,
    private getComputedStyle: (element: HTMLElement) => CSSStyleDeclaration,
    private danmakuSettings: DanmakuSettings,
    comment: Comment,
  ) {
    super();
    this.body = E.div(
      {
        class: "danmaku-element",
        style: `position: absolute; bottom: 100%; right: 0; padding: .2rem; visibility: hidden;`,
      },
      E.divRef(
        this.content,
        {
          class: "danmaku-element-content",
          style: `white-space: nowrap; line-height: 1; color: ${SCHEME.neutral0}; text-shadow: -.1rem 0 .1rem ${SCHEME.neutral4}, 0 .1rem .1rem ${SCHEME.neutral4}, .1rem 0 .1rem ${SCHEME.neutral4}, 0 -.1rem .1rem ${SCHEME.neutral4};`,
        },
        E.text(comment.content),
      ),
      assign(
        this.likeDislikeButtons,
        LikeDislikeButtons.create(
          `position: absolute; top: 100%; right: 0; display: flex; flex-flow: row nowrap; gap: .5rem;`,
          0.5,
          TooltipPosition.LEFT,
        )
          .disable()
          .hide(),
      ).body,
    );

    this.render();
    this.leaveToResume();
    this.hoverObserver = HoverObserver.create(this.body, Mode.HOVER_DELAY_LEAVE)
      .on("hover", () => this.hoverToPause())
      .on("leave", () => this.leaveToResume());
  }

  private render(): void {
    this.content.val.style.opacity = `${this.danmakuSettings.opacity / 100}`;
    this.content.val.style.fontSize = `${
      this.danmakuSettings.fontSize * DanmakuElement.FONT_SIZE_SCALE
    }rem`;
    this.content.val.style.fontFamily = this.danmakuSettings.fontFamily;
  }

  private leaveToResume(): void {
    this.playAfterLeaving = true;
    this.tryStartTransition();
  }

  private tryStartTransition(): void {
    if (this.playAfterLeaving && this.playByPlayer) {
      this.startTransition();
    }
  }

  private startTransition(): void {
    if (this.posX > 0) {
      let remainingDuration = this.posX / this.danmakuSettings.speed;
      this.endOccupyTimeoutId = this.setTimeout(() => {
        this.emit("occupyEnded");
      }, remainingDuration * 1000);
    } else {
      this.emit("occupyEnded");
    }
    if (this.posX > -this.canvasWidth) {
      let duration =
        (this.canvasWidth + this.posX) / this.danmakuSettings.speed;
      this.body.style.transition = `transform ${duration}s linear`;
      this.transform(-this.canvasWidth);
      this.endDisplayTimeoutId = this.setTimeout(() => {
        this.emit("displayEnded");
      }, duration * 1000);
    } else {
      this.emit("displayEnded");
    }
  }

  private transform(posX: number): void {
    this.body.style.transform = `translate3d(${posX}px, ${this.posY}px, 0)`;
  }

  private async hoverToPause(): Promise<void> {
    this.playAfterLeaving = false;
    this.pauseTransition();
  }

  private pauseTransition(): void {
    this.clearAllTimeouts();
    this.posX = this.getPosXComputed();
    this.transform(this.posX);
    this.body.style.transition = `none`;
    // Force reflow.
    this.body.offsetHeight;
  }

  private getPosXComputed(): number {
    return new DOMMatrix(this.getComputedStyle(this.body).transform).m41;
  }

  private clearAllTimeouts(): void {
    this.clearTimeout(this.endOccupyTimeoutId);
    this.clearTimeout(this.endDisplayTimeoutId);
  }

  public getOffsetHeight(): number {
    return this.body.offsetHeight;
  }

  public setReadyToPlay(posY: number, canvasWidth: number): void {
    this.canvasWidth = canvasWidth;
    this.posX = this.body.offsetWidth;
    this.posY = posY;
    this.body.style.bottom = "";
    this.body.style.top = "0";
    this.transform(this.posX);
    this.body.style.transition = `none`;
    this.body.style.visibility = "visible";
    // Force reflow.
    this.body.offsetHeight;
  }

  public play(): void {
    this.playByPlayer = true;
    this.tryStartTransition();
  }

  public pause(): void {
    this.playByPlayer = false;
    this.pauseTransition();
  }

  public reRender(): void {
    this.tryPauseTransition();
    this.render();
    this.tryStartTransition();
  }

  private tryPauseTransition(): void {
    if (this.playAfterLeaving && this.playByPlayer) {
      this.pauseTransition();
    }
  }

  public updateCanvasSize(canvasWidth: number): void {
    this.canvasWidth = canvasWidth;
    this.tryPauseTransition();
    this.tryStartTransition();
  }

  public remove(): void {
    this.clearAllTimeouts();
    this.body.remove();
  }

  // Visible for testing
  public hover(): void {
    this.hoverObserver.emit("hover");
  }
  public leave(): void {
    this.hoverObserver.emit("leave");
  }
}
