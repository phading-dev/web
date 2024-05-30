import EventEmitter = require("events");
import { SCHEME } from "../../../../../../common/color_scheme";
import { HoverObserver, Mode } from "../../../../../../common/hover_observer";
import { TooltipPosition } from "../../../../../../common/icon_button";
import { LikeDislikeButtons } from "../../../../../../common/like_dislike_buttons";
import { COMMENT_SERVICE_CLIENT } from "../../../../../../common/web_service_client";
import {
  Comment,
  Liking,
} from "@phading/comment_service_interface/show_app/comment";
import {
  getCommentLiking,
  likeComment,
} from "@phading/comment_service_interface/show_app/web/client_requests";
import { DanmakuSettings } from "@phading/product_service_interface/consumer/show_app/player_settings";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

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
      COMMENT_SERVICE_CLIENT,
      (callback, delay) => window.setTimeout(callback, delay),
      (id) => window.clearTimeout(id),
      (element) => window.getComputedStyle(element),
      danmakuSettings,
      comment,
    );
  }

  private static FONT_SIZE_SCALE = 1 / 10;

  private body_: HTMLDivElement;
  private content: HTMLDivElement;
  private likeDislikeButtons_: LikeDislikeButtons;
  private hoverObserver: HoverObserver;
  private canvasWidth: number;
  private posX: number;
  private posY: number;
  private playAfterLeaving: boolean;
  private playByPlayer: boolean;
  private liking?: Liking;
  private endOccupyTimeoutId: number;
  private endDisplayTimeoutId: number;

  public constructor(
    private webServiceClient: WebServiceClient,
    private setTimeout: (callback: () => void, delay: number) => number,
    private clearTimeout: (id: number) => void,
    private getComputedStyle: (element: HTMLElement) => CSSStyleDeclaration,
    private danmakuSettings: DanmakuSettings,
    private comment: Comment,
  ) {
    super();
    let contentRef = new Ref<HTMLDivElement>();
    let likeDislikeButtonsRef = new Ref<LikeDislikeButtons>();
    this.body_ = E.div(
      {
        class: "danmaku-element",
        style: `position: absolute; bottom: 100%; right: 0; padding: .2rem; visibility: hidden;`,
      },
      E.divRef(
        contentRef,
        {
          class: "danmaku-element-content",
          style: `white-space: nowrap; line-height: 1; color: ${SCHEME.neutral0}; text-shadow: -.1rem 0 .1rem ${SCHEME.neutral4}, 0 .1rem .1rem ${SCHEME.neutral4}, .1rem 0 .1rem ${SCHEME.neutral4}, 0 -.1rem .1rem ${SCHEME.neutral4};`,
        },
        E.text(comment.content),
      ),
      assign(
        likeDislikeButtonsRef,
        LikeDislikeButtons.create(
          `position: absolute; top: 100%; right: 0; display: flex; flex-flow: row nowrap; gap: .5rem;`,
          0.5,
          TooltipPosition.LEFT,
        ).disable(),
      ).body,
    );
    this.content = contentRef.val;
    this.likeDislikeButtons_ = likeDislikeButtonsRef.val;

    this.render();
    this.leaveToResume();
    this.hoverObserver = HoverObserver.create(
      this.body_,
      Mode.HOVER_DELAY_LEAVE,
    )
      .on("hover", () => this.hoverToPause())
      .on("leave", () => this.leaveToResume());
    this.likeDislikeButtons_.on("like", (liking) => this.likeComment(liking));
    this.likeDislikeButtons_.on("postLike", () => this.emit("postLike"));
  }

  private render(): void {
    this.content.style.opacity = `${this.danmakuSettings.opacity / 100}`;
    this.content.style.fontSize = `${
      this.danmakuSettings.fontSize * DanmakuElement.FONT_SIZE_SCALE
    }rem`;
    this.content.style.fontFamily = this.danmakuSettings.fontFamily;
  }

  private leaveToResume(): void {
    this.likeDislikeButtons_.hide();
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
      this.body_.style.transition = `transform ${duration}s linear`;
      this.transform(-this.canvasWidth);
      this.endDisplayTimeoutId = this.setTimeout(() => {
        this.emit("displayEnded");
      }, duration * 1000);
    } else {
      this.emit("displayEnded");
    }
  }

  private transform(posX: number): void {
    this.body_.style.transform = `translate3d(${posX}px, ${this.posY}px, 0)`;
  }

  private async hoverToPause(): Promise<void> {
    this.likeDislikeButtons_.show();
    this.playAfterLeaving = false;
    this.pauseTransition();
    if (!this.liking) {
      let response = await getCommentLiking(this.webServiceClient, {
        commentId: this.comment.commentId,
      });
      this.likeDislikeButtons_.enable(response.liking);
    }
  }

  private pauseTransition(): void {
    this.clearAllTimeouts();
    this.posX = this.getPosXComputed();
    this.transform(this.posX);
    this.body_.style.transition = `none`;
    // Force reflow.
    this.body_.offsetHeight;
  }

  private getPosXComputed(): number {
    return new DOMMatrix(this.getComputedStyle(this.body).transform).m41;
  }

  private clearAllTimeouts(): void {
    this.clearTimeout(this.endOccupyTimeoutId);
    this.clearTimeout(this.endDisplayTimeoutId);
  }

  public getOffsetHeight(): number {
    return this.body_.offsetHeight;
  }

  public setReadyToPlay(posY: number, canvasWidth: number): void {
    this.canvasWidth = canvasWidth;
    this.posX = this.body_.offsetWidth;
    this.posY = posY;
    this.body_.style.bottom = "";
    this.body_.style.top = "0";
    this.transform(this.posX);
    this.body_.style.transition = `none`;
    this.body_.style.visibility = "visible";
    // Force reflow.
    this.body_.offsetHeight;
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

  private async likeComment(liking: Liking): Promise<void> {
    await likeComment(this.webServiceClient, {
      commentId: this.comment.commentId,
      liking,
    });
  }

  public get body() {
    return this.body_;
  }

  public remove(): void {
    this.clearAllTimeouts();
    this.body_.remove();
  }

  // Visible for testing
  public hover(): void {
    this.hoverObserver.emit("hover");
  }
  public leave(): void {
    this.hoverObserver.emit("leave");
  }
  public get likeDislikeButtons() {
    return this.likeDislikeButtons_;
  }
}
