import EventEmitter = require("events");
import { FILLED_BUTTON_STYLE } from "../../../../common/button_styles";
import { SCHEME } from "../../../../common/color_scheme";
import { createLoadIcon } from "../../../../common/icons";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { LARGE_CARD_STYLE, PAGE_STYLE } from "../../../../common/page_style";
import { PRODUCT_RECOMMENDATION_SERVICE_CLIENT } from "../../../../common/web_service_client";
import { ShowItem } from "./show_item";
import { recommendShows } from "@phading/product_recommendation_service_interface/consumer/show_app/web/client_requests";
import { ShowSnapshot } from "@phading/product_service_interface/consumer/show_app/show";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface ListPage {
  on(event: "play", listener: (showId: string) => void): this;
  on(event: "focusUser", listener: (accountId: string) => void): this;
  on(event: "loaded", listener: () => void): this;
  on(event: "loadedAll", listener: () => void): this;
}

export class ListPage extends EventEmitter {
  public static create(): ListPage {
    return new ListPage(ShowItem.create, PRODUCT_RECOMMENDATION_SERVICE_CLIENT);
  }

  private body_: HTMLDivElement;
  private contentContainer: HTMLDivElement;
  private loadingSection: HTMLDivElement;
  private tryReloadButton_: HTMLDivElement;
  private loadingIcon: HTMLDivElement;
  private loadingObserver: IntersectionObserver;
  private showItems_ = new Set<ShowItem>();
  private moreContentLoaded: boolean;

  public constructor(
    private createShowItem: (show: ShowSnapshot) => ShowItem,
    private webServiceClient: WebServiceClient
  ) {
    super();
    let contentContainerRef = new Ref<HTMLDivElement>();
    let loadingSectionRef = new Ref<HTMLDivElement>();
    let tryReloadButtonRef = new Ref<HTMLDivElement>();
    let loadingIconRef = new Ref<HTMLDivElement>();
    this.body_ = E.div(
      {
        class: "list-shows",
        style: PAGE_STYLE,
      },
      E.div(
        {
          class: "list-shows-card",
          style: `${LARGE_CARD_STYLE} display: flex; flex-flow: column nowrap; align-items: center;`,
        },
        E.divRef(contentContainerRef, {
          class: "list-shows-content-container",
          style: `display: flex; flex-flow: row wrap; justify-content: space-around; gap: 2rem;`,
        }),
        E.divRef(
          loadingSectionRef,
          {
            class: "list-shows-loading-section",
            style: `display: flex; flex-flow: column nowrap; align-items: center; padding-top: 2rem; gap: 2rem;`,
          },
          E.div(
            {
              class: "list-shows-end-of-loading",
              style: `font-size: 1.4rem; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.noMoreContent)
          ),
          E.divRef(
            tryReloadButtonRef,
            {
              class: "list-shows-load-button",
              style: `${FILLED_BUTTON_STYLE} background-color: ${SCHEME.primary1};`,
            },
            E.text(LOCALIZED_TEXT.tryReloadLabel)
          ),
          E.divRef(
            loadingIconRef,
            {
              class: "list-shows-loading-icon",
              style: `height: 3rem;`,
            },
            createLoadIcon(SCHEME.neutral1)
          )
        )
      )
    );
    this.contentContainer = contentContainerRef.val;
    this.loadingSection = loadingSectionRef.val;
    this.tryReloadButton_ = tryReloadButtonRef.val;
    this.loadingIcon = loadingIconRef.val;

    this.loadingIcon.animate(
      [
        {
          transform: "rotate(0deg)",
        },
        {
          transform: "rotate(360deg)",
        },
      ],
      {
        duration: 2000,
        iterations: Infinity,
      }
    );
    this.tryReloadButton_.addEventListener("click", () => this.loadMore());
    this.loadingObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.loadMore();
      }
    });
    this.loadMore();
  }

  private async loadMore(): Promise<void> {
    this.unobserveLoading();
    this.tryReloadButton_.style.display = "none";
    this.loadingIcon.style.display = "block";
    try {
      await this.loadMoreAndTryRemoveOldContent();
    } catch (e) {
      console.log(e);
    }
    this.tryObserveLoading();
    this.tryReloadButton_.style.display = "block";
    this.loadingIcon.style.display = "none";
  }

  private tryObserveLoading(): void {
    if (this.moreContentLoaded) {
      this.loadingObserver.observe(this.loadingSection);
    }
  }

  private unobserveLoading(): void {
    this.loadingObserver.unobserve(this.loadingSection);
  }

  public async loadMoreAndTryRemoveOldContent(): Promise<void> {
    let response = await recommendShows(this.webServiceClient, {});

    for (let show of response.shows) {
      let item = this.createShowItem(show)
        .on("play", (showId) => this.emit("play", showId))
        .on("focusUser", (accountId) => this.emit("focusUser", accountId));
      this.contentContainer.append(item.body);
      this.showItems_.add(item);
    }

    let itemsToRemove = new Array<ShowItem>();
    for (let show of this.showItems_) {
      let bottom = show.body.getBoundingClientRect().bottom;
      if (bottom < 0) {
        itemsToRemove.push(show);
      } else {
        break;
      }
    }
    for (let item of itemsToRemove) {
      item.remove();
      this.showItems_.delete(item);
    }

    if (response.shows.length > 0) {
      this.moreContentLoaded = true;
      this.emit("loaded");
    } else {
      this.moreContentLoaded = false;
      this.emit("loadedAll");
    }
  }

  public get body() {
    return this.body_;
  }

  public remove(): void {
    this.body_.remove();
  }

  // Visible for testing
  public get showItems() {
    return this.showItems_;
  }
}
