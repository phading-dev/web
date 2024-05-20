import EventEmitter = require("events");
import { LinkedList, LinkedNode } from "../../../../../../common/linked_list";
import { DanmakuElement } from "./element";
import { Comment } from "@phading/comment_service_interface/show_app/comment";
import {
  DanmakuSettings,
  StackingMethod,
} from "@phading/product_service_interface/consumer/show_app/player_settings";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface DanmakuCanvas {
  on(event: "passThroughClick", listener: () => void): this;
}

export class DanmakuCanvas extends EventEmitter {
  public static create(
    reservedBottomMargin: number /* px */,
    danmakuSettigns: DanmakuSettings,
  ): DanmakuCanvas {
    return new DanmakuCanvas(
      () => Math.random(),
      DanmakuElement.create,
      reservedBottomMargin,
      danmakuSettigns,
    );
  }

  private body_: HTMLDivElement;
  private clickCapturer: HTMLDivElement;
  private width: number;
  private height: number;
  private playing: boolean;
  private occupied = new Array<number>();
  private elements = new LinkedList<DanmakuElement>();

  public constructor(
    private random: () => number,
    private createDanmakuElement: (
      danmakuSettings: DanmakuSettings,
      comment: Comment,
    ) => DanmakuElement,
    private reservedBottomMargin: number /* px */,
    private danmakuSettigns: DanmakuSettings,
  ) {
    super();
    let clickCapturerRef = new Ref<HTMLDivElement>();
    this.body_ = E.div(
      {
        class: "danmaku-canvas",
        style: `width: 100%; height: 100%; position: absolute; top: 0; left: 0; overflow: hidden;`,
      },
      E.divRef(clickCapturerRef, {
        class: "danmaku-canvas-click-capturer",
        style: `position: absolute; left: 0; top: 0; width: 100%; height: 100%;`,
      }),
    );
    this.clickCapturer = clickCapturerRef.val;

    this.pause();
    new ResizeObserver((entries) => this.getNewSize(entries[0])).observe(
      this.body_,
    );
    this.clickCapturer.addEventListener("click", () =>
      this.emit("passThroughClick"),
    );
  }

  private getNewSize(entry: ResizeObserverEntry): void {
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
      this.elements.forEach((danmakuElement) => {
        danmakuElement.updateCanvasSize(this.width);
      });
    }
    while (this.occupied.length < this.height) {
      this.occupied.push(0);
    }
  }

  public add(comments: Array<Comment>): void {
    if (!this.danmakuSettigns.enable || !this.playing) {
      return;
    }
    for (let comment of comments) {
      this.tryStartPlaying(comment);
    }
  }

  private tryStartPlaying(comment: Comment): void {
    let element = this.createDanmakuElement(this.danmakuSettigns, comment);
    this.body_.append(element.body);

    let elementHeight = element.getOffsetHeight();
    let reducedHeight = this.height - this.reservedBottomMargin;
    let startY = Math.floor(
      (this.danmakuSettigns.topMargin / 100) * reducedHeight,
    );
    let endY =
      reducedHeight -
      Math.floor((this.danmakuSettigns.bottomMargin / 100) * reducedHeight); // Exclusive
    if (endY - startY - elementHeight < 0) {
      element.remove();
      return;
    }

    let marginAround =
      Math.floor(elementHeight / (this.danmakuSettigns.density / 100)) -
      elementHeight;
    let occupyScore = 0;
    let initY = this.getInitY(startY, endY, elementHeight);
    let headY = initY - marginAround;
    let tailY = initY + elementHeight + marginAround; // Exclusive
    for (let i = Math.max(0, headY); i < Math.min(endY, tailY); i++) {
      occupyScore += this.occupied[i];
    }

    let posYDown = this.findPosYDownward(
      initY,
      headY,
      tailY,
      occupyScore,
      elementHeight,
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
      element.remove();
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

    for (let i = posY; i < posY + elementHeight; i++) {
      this.occupied[i]++;
    }
    let node = this.elements.pushBack(element);
    element.once("occupyEnded", () =>
      this.releaseOccupied(posY, elementHeight),
    );
    element.once("displayEnded", () => this.removeNode(node));
    element.setReadyToPlay(posY, this.width);
    element.play();
  }

  private getInitY(
    startY: number,
    endY: number,
    elementHeight: number,
  ): number {
    switch (this.danmakuSettigns.stackingMethod) {
      case StackingMethod.TOP_DOWN:
        return startY;
      case StackingMethod.RANDOM:
        return (
          Math.floor(this.random() * (endY - startY - elementHeight + 1)) +
          startY
        );
    }
    return ((): never => {})();
  }

  private findPosYDownward(
    posY: number,
    headY: number,
    tailY: number,
    score: number,
    elementHeight: number,
    startY: number,
    endY: number,
  ): number {
    while (score > 0 && posY + elementHeight < endY) {
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

  private releaseOccupied(posY: number, elementHeight: number): void {
    for (let i = posY; i < posY + elementHeight; i++) {
      this.occupied[i]--;
    }
  }

  private removeNode(node: LinkedNode<DanmakuElement>): void {
    node.remove();
    node.value.remove();
  }

  public play(): void {
    this.playing = true;
    this.elements.forEach((danmakuElement) => {
      danmakuElement.play();
    });
  }

  public pause(): void {
    this.playing = false;
    this.elements.forEach((danmakuElement) => {
      danmakuElement.pause();
    });
  }

  public updateSettings(): void {
    if (!this.danmakuSettigns.enable) {
      this.elements.forEach((danmakuElement) => {
        danmakuElement.remove();
      });
      this.elements.clear();
      for (let i = 0; i < this.occupied.length; i++) {
        this.occupied[i] = 0;
      }
    } else {
      this.elements.forEach((danmakuElement) => {
        danmakuElement.reRender();
      });
    }
  }

  public get body() {
    return this.body_;
  }

  public remove(): void {
    this.body_.remove();
    this.elements.forEach((danmakuElement) => {
      danmakuElement.remove();
    });
  }
}
