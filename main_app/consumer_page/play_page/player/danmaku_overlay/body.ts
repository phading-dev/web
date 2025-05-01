import { getRootFontSize } from "../../../../../common/root_font_size";
import { DanmakuEntry } from "./danmaku_entry";
import { Comment } from "@phading/comment_service_interface/show/web/comment";
import {
  ChatOverlaySettings,
  StackingMethod,
} from "@phading/user_service_interface/web/self/video_player_settings";
import { E } from "@selfage/element/factory";

export class DanmakuOverlay {
  public static create(settings: ChatOverlaySettings): DanmakuOverlay {
    return new DanmakuOverlay(
      DanmakuEntry.create,
      () => Math.random(),
      settings,
    );
  }

  public body: HTMLDivElement;
  private resizeObserver: ResizeObserver;
  private width: number;
  private height: number;
  private playing: boolean;
  private occupied = new Array<number>();
  public danmakuEntries = new Set<DanmakuEntry>();

  public constructor(
    private createDanmakuEntry: (
      settings: ChatOverlaySettings,
      comment: Comment,
    ) => DanmakuEntry,
    private random: () => number,
    private settings: ChatOverlaySettings,
  ) {
    this.body = E.div({
      class: "danmaku-overlay",
      style: `width: 100%; height: 100%;`,
    });
    this.pause();

    this.resizeObserver = new ResizeObserver((entries) =>
      this.updateCanvasSize(entries[0]),
    );
    this.resizeObserver.observe(this.body);
  }

  private updateCanvasSize(entry: ResizeObserverEntry): void {
    let newWidth: number;
    if (entry.contentBoxSize) {
      newWidth = entry.contentBoxSize[0].inlineSize;
      this.height = entry.contentBoxSize[0].blockSize;
    } else {
      newWidth = entry.contentRect.width;
      this.height = entry.contentRect.height;
    }
    if (newWidth !== this.width) {
      this.width = newWidth;
      this.danmakuEntries.forEach((entry) => {
        entry.updateCanvasSize(this.width);
      });
    }
    while (this.occupied.length < this.height) {
      this.occupied.push(0);
    }
  }

  public add(comments: Array<Comment>): void {
    if (!this.height) {
      // If ResizeObserver hasn't caught up, skip adding comments.
      return;
    }
    let rootFontSize = getRootFontSize();
    for (let comment of comments) {
      this.tryStartPlaying(comment, rootFontSize);
    }
  }

  private tryStartPlaying(comment: Comment, rootFontSize: number): void {
    let entry = this.createDanmakuEntry(this.settings, comment);
    this.body.append(entry.body);

    let entryHeight = entry.body.offsetHeight;
    let startY = 0;
    let endY = this.height; // Exclusive
    if (endY - startY - entryHeight < 0) {
      entry.remove();
      return;
    }

    let marginAround =
      Math.floor(entryHeight / (this.settings.danmakuSettings.density / 100)) -
      entryHeight;
    let occupyScore = 0;
    let initY = this.getInitY(startY, endY, entryHeight);
    let headY = initY - marginAround;
    let tailY = initY + entryHeight + marginAround; // Exclusive
    for (let i = Math.max(0, headY); i < Math.min(endY, tailY); i++) {
      occupyScore += this.occupied[i];
    }

    let posYDown = this.findPosYDownward(
      initY,
      headY,
      tailY,
      occupyScore,
      entryHeight,
      startY,
      endY,
    );
    let posYUp = this.findPosYUpward(
      initY,
      headY,
      tailY,
      occupyScore,
      startY,
      endY,
    );
    if (posYDown < 0 && posYUp < 0) {
      entry.remove();
      return;
    }

    let posY: number;
    if (posYDown < 0) {
      posY = posYUp;
    } else if (posYUp < 0) {
      posY = posYDown;
    } else if (posYDown - initY > initY - posYUp) {
      posY = posYUp;
    } else {
      posY = posYDown;
    }

    for (let i = posY; i < posY + entryHeight; i++) {
      this.occupied[i]++;
    }
    this.danmakuEntries.add(entry);
    entry.once("fullyDisplayed", () => this.releaseOccupied(posY, entryHeight));
    entry.once("fullyHidden", () => this.removeEntry(entry));
    entry.setStartPosition(posY, this.width);
    if (this.playing) {
      entry.play();
    }
  }

  private getInitY(startY: number, endY: number, entryHeight: number): number {
    switch (this.settings.danmakuSettings.stackingMethod) {
      case StackingMethod.TOP_DOWN:
        return startY;
      case StackingMethod.RANDOM:
        return (
          Math.floor(this.random() * (endY - startY - entryHeight + 1)) + startY
        );
    }
    return ((): never => {})();
  }

  private findPosYDownward(
    posY: number,
    headY: number,
    tailY: number,
    score: number,
    entryHeight: number,
    startY: number,
    endY: number,
  ): number {
    while (score > 0 && posY + entryHeight < endY) {
      posY++;
      headY++;
      tailY++;
      if (headY - 1 >= startY) {
        score -= this.occupied[headY - 1];
      }
      if (tailY <= endY) {
        score += this.occupied[tailY - 1];
      }
    }
    if (score > 0) {
      return -1;
    } else {
      return posY;
    }
  }

  private findPosYUpward(
    posY: number,
    headY: number,
    tailY: number,
    score: number,
    startY: number,
    endY: number,
  ): number {
    while (score > 0 && posY > startY) {
      posY--;
      headY--;
      tailY--;
      if (headY >= startY) {
        score += this.occupied[headY];
      }
      if (tailY < endY) {
        score -= this.occupied[tailY];
      }
    }
    if (score > 0) {
      return -1;
    } else {
      return posY;
    }
  }

  private releaseOccupied(posY: number, entryHeight: number): void {
    for (let i = posY; i < posY + entryHeight; i++) {
      this.occupied[i]--;
    }
  }

  private removeEntry(entry: DanmakuEntry): void {
    entry.remove();
    this.danmakuEntries.delete(entry);
  }

  public play(): void {
    this.playing = true;
    this.danmakuEntries.forEach((entry) => {
      entry.play();
    });
  }

  public pause(): void {
    this.playing = false;
    this.danmakuEntries.forEach((entry) => {
      entry.pause();
    });
  }

  public applySettings(): void {
    this.danmakuEntries.forEach((entry) => {
      entry.applySettings();
    });
  }

  public remove(): void {
    this.resizeObserver.disconnect();
    this.danmakuEntries.forEach((entry) => {
      entry.remove();
    });
    this.body.remove();
  }
}
