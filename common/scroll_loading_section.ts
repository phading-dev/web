import { SCHEME } from "./color_scheme";
import { createLoadingIcon } from "./icons";
import { LOCALIZED_TEXT } from "./locales/localized_text";
import { FONT_M, ICON_XL } from "./sizes";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";
import { EventEmitter } from "events";

export interface ScrollLoadingSection {
  on(event: "loaded", listener: () => void): this;
}

export class ScrollLoadingSection extends EventEmitter {
  public body: HTMLDivElement;
  private endOfLoading = new Ref<HTMLDivElement>();
  private loadingIcon = new Ref<HTMLDivElement>();
  private loadFn: () => Promise<boolean>;
  private loadingObserver: IntersectionObserver;
  public hasMore: boolean;

  public constructor(endOfLoadingText = LOCALIZED_TEXT.noMoreContent) {
    super();
    this.body = E.div(
      {
        class: "loading-section",
        style: `display: flex; flex-flow: column nowrap; align-items: center; padding: 2rem; gap: 2rem;`,
      },
      E.divRef(
        this.endOfLoading,
        {
          class: "loading-section-end-of-loading",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; line-height: ${ICON_XL}rem;`,
        },
        E.text(endOfLoadingText),
      ),
      E.divRef(
        this.loadingIcon,
        {
          class: "loading-section-loading-icon",
          style: `height: ${ICON_XL}rem; padding .5rem; box-sizing: border-box;`,
        },
        createLoadingIcon(SCHEME.neutral1),
      ),
    );
  }

  public addLoadAction(loadFn: () => Promise<boolean>): this {
    this.loadFn = loadFn;
    this.loadingObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.load();
      }
    });
    return this;
  }

  public async load(): Promise<void> {
    this.loadingObserver.unobserve(this.body);
    this.endOfLoading.val.style.display = "none";
    this.loadingIcon.val.style.display = "block";
    try {
      this.hasMore = await this.loadFn();
    } catch (e) {
      console.log(e);
      this.hasMore = false;
    }
    if (this.hasMore) {
      this.loadingObserver.observe(this.body);
    }
    this.endOfLoading.val.style.display = "block";
    this.loadingIcon.val.style.display = "none";
    this.emit("loaded");
  }

  public stopLoading(): void {
    this.loadingObserver?.disconnect();
  }
}
