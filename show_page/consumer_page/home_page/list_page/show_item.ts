import EventEmitter = require("events");
import { SCHEME } from "../../../../common/color_scheme";
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

  private body_: HTMLDivElement;
  private userContainer_: HTMLDivElement;
  private coverImage: HTMLImageElement;

  public constructor(show: ShowSnapshot) {
    super();
    let dateFormatter = new Intl.DateTimeFormat(navigator.language, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    let userContainerRef = new Ref<HTMLDivElement>();
    let coverImageRef = new Ref<HTMLImageElement>();
    this.body_ = E.div(
      {
        class: "show-item",
        style: `flex: 0 0 auto; width: 35.2rem; aspect-ratio: 16/9;; border: .1rem solid ${SCHEME.neutral1}; border-radius: .5rem; overflow: hidden; position: relative; cursor: pointer;`,
      },
      E.div(
        {
          class: "show-item-metadata",
          style: `width: 100%; height: 100%; padding: 2rem; box-sizing: border-box; display: flex; flex-flow: column nowrap; justify-content: space-between;`,
        },
        E.div(
          {
            class: "show-item-content-metadata",
          },
          E.div(
            {
              class: "show-item-title",
              style: `font-size: 1.4rem; line-height: 1.6rem; max-height: 9.6rem; color: ${SCHEME.neutral0}; overflow: hidden;`,
            },
            E.text(show.name)
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
                style: `font-size: 1.2rem; color: ${SCHEME.neutral1};`,
              },
              E.text(dateFormatter.format(new Date(show.publishedTime * 1000)))
            ),
            E.div(
              {
                class: "show-item-length",
                style: `font-size: 1.2rem; color: ${SCHEME.neutral1};`,
              },
              E.text(ShowItem.formatLength(show.length))
            )
          )
        ),
        E.divRef(
          userContainerRef,
          {
            class: "show-item-publisher",
            style: `display: flex; flex-flow: row nowrap; align-items: center; gap: .5rem;`,
          },
          E.image({
            class: "show-item-publisher-avatar",
            style: `flex: 0 0 auto; width: 3.2rem; height: 3.2rem; border-radius: 3.2rem;`,
            src: show.publisher.avatarSmallPath,
          }),
          E.div(
            {
              class: "show-item-publisher-name",
              style: `flex: 1 0 0; font-size: 1.2rem; line-height: 1.6rem; max-height: 3.2rem; color: ${SCHEME.neutral0}; overflow: hidden;`,
            },
            E.text(show.publisher.naturalName)
          )
        )
      ),
      E.imageRef(coverImageRef, {
        class: "show-item-cover-image",
        style: `width: 100%; height: 100%; position: absolute; top: 0; left: 0; transform: translateX(0); transition: transform .3s linear;`,
        src: show.coverImagePath,
      })
    );
    this.userContainer_ = userContainerRef.val;
    this.coverImage = coverImageRef.val;

    this.body_.addEventListener("click", () => this.emit("play", show.showId));
    this.userContainer_.addEventListener("click", (event) => {
      event.stopPropagation();
      this.emit("focusUser", show.publisher.accountId);
    });
    this.body_.addEventListener("mouseenter", () => this.hideCoverImage());
    this.body_.addEventListener("mouseleave", () => this.showCoverImage());
  }

  private static formatLength(length: number): string {
    let secondsStr = (length % 60).toString().padStart(2, "0");
    let minutesStr = (Math.floor(length / 60) % 60).toString().padStart(2, "0");
    let hours = Math.floor(length / 60 / 60);
    if (hours == 0) {
      return `${minutesStr}:${secondsStr}`;
    } else {
      return `${hours.toString().padStart(2, "0")}:${minutesStr}:${secondsStr}`;
    }
  }

  private hideCoverImage(): void {
    this.coverImage.style.transform = "translateX(100%)";
  }

  private showCoverImage(): void {
    this.coverImage.style.transform = "translateX(0)";
  }

  public get body() {
    return this.body_;
  }

  public remove(): void {
    this.body_.remove();
  }

  // Visible for testing
  public click(): void {
    this.body_.click();
  }
  public clickUser(): void {
    this.userContainer_.click();
  }
  public mouseenter(): void {
    this.body_.dispatchEvent(new MouseEvent("mouseenter"));
  }
  public mouseleave(): void {
    this.body_.dispatchEvent(new MouseEvent("mouseleave"));
  }
}
