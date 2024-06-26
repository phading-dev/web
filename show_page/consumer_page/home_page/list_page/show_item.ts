import EventEmitter = require("events");
import { SCHEME } from "../../../../common/color_scheme";
import { HoverObserver, Mode } from "../../../../common/hover_observer";
import {
  AVATAR_S,
  FONT_M,
  FONT_S,
  LINE_HEIGHT_M,
} from "../../../../common/sizes";
import { formatSecondsAsHHMMSS } from "../../../../common/timestamp_formatter";
import { ShowSnapshot } from "@phading/product_service_interface/consumer/show_app/show";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface ShowItem {
  on(event: "play", listener: (showId: string) => void): this;
  on(event: "focusUser", listener: (accountId: string) => void): this;
}

export class ShowItem extends EventEmitter {
  public static create(show: ShowSnapshot): ShowItem {
    return new ShowItem(show);
  }

  public body: HTMLDivElement;
  private clickCapturer = new Ref<HTMLDivElement>();
  private contentMetadata = new Ref<HTMLDivElement>();
  private userContainer = new Ref<HTMLDivElement>();
  private coverImage = new Ref<HTMLImageElement>();
  private hoverObserver: HoverObserver;

  public constructor(show: ShowSnapshot) {
    super();
    let dateFormatter = new Intl.DateTimeFormat(navigator.language, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    this.body = E.div(
      {
        class: "show-item",
        style: `flex: 0 0 auto; width: 35.2rem; aspect-ratio: 16/9;; border: .1rem solid ${SCHEME.neutral1}; border-radius: .5rem; overflow: hidden; position: relative; cursor: pointer;`,
      },
      E.divRef(this.clickCapturer, {
        class: "show-item-click-capturer",
        style: `position: absolute; left: 0; top: 0; width: 100%; height: 100%;`,
      }),
      E.div(
        {
          class: "show-item-metadata",
          style: `width: 100%; height: 100%; padding: 2rem; box-sizing: border-box; display: flex; flex-flow: column nowrap; justify-content: space-between;`,
        },
        E.divRef(
          this.contentMetadata,
          {
            class: "show-item-content-metadata",
          },
          E.div(
            {
              class: "show-item-title",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; max-height: ${
                LINE_HEIGHT_M * 6
              }rem; color: ${SCHEME.neutral0}; overflow: hidden;`,
            },
            E.text(show.name),
          ),
          E.div({
            style: `height: .5rem;`,
          }),
          E.div(
            {
              class: "show-item-extra-info-line",
              style: `flex: 0 0 auto; display: flex; flex-flow: row nowrap; justify-content: space-between;`,
            },
            E.div(
              {
                class: "show-item-published-time",
                style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral1};`,
              },
              E.text(dateFormatter.format(new Date(show.publishedTime * 1000))),
            ),
            E.div(
              {
                class: "show-item-length",
                style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral1};`,
              },
              E.text(formatSecondsAsHHMMSS(show.length)),
            ),
          ),
        ),
        E.divRef(
          this.userContainer,
          {
            class: "show-item-publisher",
            style: `display: flex; flex-flow: row nowrap; align-items: center; gap: .5rem;`,
          },
          E.image({
            class: "show-item-publisher-avatar",
            style: `flex: 0 0 auto; width: ${AVATAR_S}rem; height: ${AVATAR_S}rem; border-radius: ${AVATAR_S}rem;`,
            src: show.publisher.avatarSmallPath,
          }),
          E.div(
            {
              class: "show-item-publisher-name",
              style: `flex: 1 1 0; min-width: 0; font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_M}rem; max-height: ${LINE_HEIGHT_M * 2}rem; color: ${SCHEME.neutral0}; overflow: hidden;`,
            },
            E.text(show.publisher.naturalName),
          ),
        ),
      ),
      E.imageRef(this.coverImage, {
        class: "show-item-cover-image",
        style: `width: 100%; height: 100%; position: absolute; top: 0; left: 0; transform: translateX(0); transition: transform .3s linear;`,
        src: show.coverImagePath,
      }),
    );

    this.hoverObserver = HoverObserver.create(
      this.body,
      Mode.DELAY_HOVER_DELAY_LEAVE,
    )
      .on("hover", () => this.hideCoverImage())
      .on("leave", () => this.showCoverImage());
    this.clickCapturer.val.addEventListener("click", () =>
      this.emit("play", show.showId),
    );
    this.contentMetadata.val.addEventListener("click", () =>
      this.emit("play", show.showId),
    );
    this.coverImage.val.addEventListener("click", () =>
      this.emit("play", show.showId),
    );
    this.userContainer.val.addEventListener("click", () =>
      this.emit("focusUser", show.publisher.accountId),
    );
  }

  private hideCoverImage(): void {
    this.coverImage.val.style.transform = "translateX(100%)";
  }

  private showCoverImage(): void {
    this.coverImage.val.style.transform = "translateX(0)";
  }

  public remove(): void {
    this.body.remove();
  }

  // Visible for testing
  public click(): void {
    this.clickCapturer.val.click();
  }
  public clickUser(): void {
    this.userContainer.val.click();
  }
  public hover(): void {
    this.hoverObserver.emit("hover");
  }
  public leave(): void {
    this.hoverObserver.emit("leave");
  }
}
