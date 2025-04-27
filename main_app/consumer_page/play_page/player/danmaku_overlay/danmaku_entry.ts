import EventEmitter = require("events");
import { SCHEME } from "../../../../../common/color_scheme";
import { FONT_SIZE_SCALE } from "../scales";
import { Comment } from "@phading/comment_service_interface/show/web/comment";
import { ChatOverlaySettings } from "@phading/user_service_interface/web/self/video_player_settings";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface DanmakuEntry {
  on(event: "fullyDisplayed", listener: () => void): this;
  on(event: "fullyHidden", listener: () => void): this;
}

// Element is positioned at top: 0 and right: 0 and use transform to move.
// posY is fixed at a positive value.
// posX is moved from positive (right) to negative (left).
// When posX is 0, the element is fully displayed.
// When posX is -canvasWidth, the element is fully hidden.
export class DanmakuEntry extends EventEmitter {
  public static create(
    settings: ChatOverlaySettings,
    comment: Comment,
  ): DanmakuEntry {
    return new DanmakuEntry(
      (callback, delay) => window.setTimeout(callback, delay),
      (id) => window.clearTimeout(id),
      (element) => window.getComputedStyle(element),
      settings,
      comment,
    );
  }

  public body: HTMLDivElement;
  private content = new Ref<HTMLDivElement>();
  private canvasWidth: number;
  private posX: number;
  private posY: number;
  private playing = false;
  private endOccupyTimeoutId: number;
  private endDisplayTimeoutId: number;

  public constructor(
    private setTimeout: (callback: () => void, delay: number) => number,
    private clearTimeout: (id: number) => void,
    private getComputedStyle: (element: HTMLElement) => CSSStyleDeclaration,
    private settings: ChatOverlaySettings,
    comment: Comment,
  ) {
    super();
    this.body = E.div(
      {
        class: "danmaku-entry",
        style: `position: absolute; left: 100%; top: 0; padding: .2rem; visibility: hidden; pointer-events: none;`,
      },
      E.divRef(
        this.content,
        {
          class: "danmaku-entry-content",
          style: `white-space: nowrap; line-height: 1; color: ${SCHEME.neutral0}; text-shadow: -.1rem 0 .2rem ${SCHEME.neutral4}, 0 .1rem .2rem ${SCHEME.neutral4}, .1rem 0 .2rem ${SCHEME.neutral4}, 0 -.1rem .2rem ${SCHEME.neutral4};`,
        },
        E.text(comment.content),
      ),
    );
    this.render();
  }

  private render(): void {
    this.content.val.style.opacity = `${this.settings.opacity / 100}`;
    this.content.val.style.fontSize = `${
      this.settings.fontSize * FONT_SIZE_SCALE
    }rem`;
    this.content.val.style.fontFamily = this.settings.fontFamily;
  }

  private startTransition(): void {
    if (this.posX > 0) {
      let remainingDuration = this.posX / this.settings.danmakuSettings.speed;
      this.endOccupyTimeoutId = this.setTimeout(() => {
        this.emit("fullyDisplayed");
      }, remainingDuration * 1000);
    } else {
      this.emit("fullyDisplayed");
    }
    if (this.posX > -this.canvasWidth) {
      let duration =
        (this.canvasWidth + this.posX) / this.settings.danmakuSettings.speed;
      this.body.style.transition = `transform ${duration}s linear`;
      this.transform(-this.canvasWidth);
      this.endDisplayTimeoutId = this.setTimeout(() => {
        this.emit("fullyHidden");
      }, duration * 1000);
    } else {
      this.emit("fullyHidden");
    }
  }

  private pauseTransition(): void {
    this.clearAllTimeouts();
    this.posX = this.getPosXComputed();
    this.transform(this.posX);
    this.body.style.transition = `none`;
    // Force reflow.
    this.body.offsetHeight;
  }

  private transform(posX: number): void {
    this.body.style.transform = `translate3d(${posX}px, ${this.posY}px, 0)`;
  }

  private getPosXComputed(): number {
    return new DOMMatrix(this.getComputedStyle(this.body).transform).m41;
  }

  private clearAllTimeouts(): void {
    this.clearTimeout(this.endOccupyTimeoutId);
    this.clearTimeout(this.endDisplayTimeoutId);
  }

  public setStartPosition(posY: number, canvasWidth: number): void {
    this.canvasWidth = canvasWidth;
    this.posX = this.body.offsetWidth;
    this.posY = posY;
    this.body.style.left = "";
    this.body.style.right = "0";
    this.transform(this.posX);
    this.body.style.transition = `none`;
    this.body.style.visibility = "visible";
    // Force reflow.
    this.body.offsetHeight;
  }

  public play(): void {
    this.playing = true;
    this.startTransition();
  }

  public pause(): void {
    this.playing = false;
    this.pauseTransition();
  }

  private startTransitionIfPlaying(): void {
    if (this.playing) {
      this.startTransition();
    }
  }

  private pauseTransitionIfPlaying(): void {
    if (this.playing) {
      this.pauseTransition();
    }
  }

  public applySettings(): void {
    this.pauseTransitionIfPlaying();
    this.render();
    this.startTransitionIfPlaying();
  }

  public updateCanvasSize(canvasWidth: number): void {
    this.canvasWidth = canvasWidth;
    this.pauseTransitionIfPlaying();
    this.startTransitionIfPlaying();
  }

  public remove(): void {
    this.clearAllTimeouts();
    this.body.remove();
  }
}
