import { FILLED_BUTTON_STYLE } from "./button_styles";
import { SCHEME } from "./color_scheme";
import { createLoadingIcon } from "./icons";
import { LOCALIZED_TEXT } from "./locales/localized_text";
import { FONT_M } from "./sizes";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";
import { EventEmitter } from "events";

export interface ScrollLoadingSection {
  on(event: "loaded", listener: () => void): this;
}

export class ScrollLoadingSection extends EventEmitter {
  public body: HTMLDivElement;
  public tryReloadButton = new Ref<HTMLDivElement>();
  private loadingIcon = new Ref<HTMLDivElement>();
  private load: () => Promise<boolean>;
  private loadingObserver: IntersectionObserver;
  public hasMore: boolean;

  public constructor() {
    super();
    this.body = E.div(
      {
        class: "loading-section",
        style: `display: flex; flex-flow: column nowrap; align-items: center; padding: 2rem; gap: 2rem;`,
      },
      E.div(
        {
          class: "loading-section-end-of-loading",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(LOCALIZED_TEXT.noMoreContent),
      ),
      E.divRef(
        this.tryReloadButton,
        {
          class: "loading-section-load-button",
          style: `${FILLED_BUTTON_STYLE}`,
        },
        E.text(LOCALIZED_TEXT.tryReloadLabel),
      ),
      E.divRef(
        this.loadingIcon,
        {
          class: "loading-section-loading-icon",
          style: `height: 3rem; padding .5rem; box-sizing: border-box;`,
        },
        createLoadingIcon(SCHEME.neutral1),
      ),
    );
  }

  public startLoading(load: () => Promise<boolean>): void {
    this.load = load;
    this.loadingObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.loadMore();
      }
    });
    this.loadMore();

    this.tryReloadButton.val.addEventListener("click", () => this.loadMore());
  }

  private async loadMore(): Promise<void> {
    this.loadingObserver.unobserve(this.body);
    this.tryReloadButton.val.style.display = "none";
    this.loadingIcon.val.style.display = "block";
    try {
      this.hasMore = await this.load();
    } catch (e) {
      console.log(e);
      this.hasMore = false;
    }
    if (this.hasMore) {
      this.loadingObserver.observe(this.body);
    }
    this.tryReloadButton.val.style.display = "block";
    this.loadingIcon.val.style.display = "none";
    this.emit("loaded");
  }
}
