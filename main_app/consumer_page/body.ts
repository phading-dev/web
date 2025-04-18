import EventEmitter = require("events");
import { AddBodiesFn } from "../../common/add_bodies_fn";
import { OUTLINE_BUTTON_STYLE } from "../../common/button_styles";
import { SCHEME } from "../../common/color_scheme";
import {
  createAccountIcon,
  createDoubleArrowsIcon,
  createHistoryIcon,
  createHomeIcon,
  createSearchIcon,
} from "../../common/icons";
import {
  OptionButton,
  RadioOptionInput,
} from "../../common/input_form_page/option_input";
import { LOCALIZED_TEXT } from "../../common/locales/localized_text";
import { FONT_M, FONT_S, ICON_BUTTON_M } from "../../common/sizes";
import { ConsumerPage as ConsumerPageUrl } from "@phading/web_interface/main/consumer/page";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";
import { BASIC_INPUT_STYLE } from "../../common/input_styles";

export enum SearchType {
  VIDEOS = "videos",
  PUBLISHERS = "publishers",
}

export interface ConsumerPage {
  on(event: "newUrl", listener: (newUrl: ConsumerPageUrl) => void): this;
  on(event: "goToAccount", listener: () => void): this;
}

export class ConsumerPage extends EventEmitter {
  public static create(appendBodies: AddBodiesFn): ConsumerPage {
    return new ConsumerPage(appendBodies);
  }

  private static NAVIGATION_BUTTON_STYLE = `flex: 1 0 0; padding: .7rem 0 .3rem 0; display: flex; flex-flow: column nowrap; align-items: center; gap: .3rem; cursor: pointer;`;
  private static NAVIGATION_ICON_STYLE = `width: 2.4rem; height: 2.4rem;`;
  private static NAVIGATION_TEXT_STYLE = `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`;

  private navigationBar = new Ref<HTMLDivElement>();
  public homeButton = new Ref<HTMLDivElement>();
  public exploreButton = new Ref<HTMLDivElement>();
  public activityButton = new Ref<HTMLDivElement>();
  public accountButton = new Ref<HTMLDivElement>();

  private searchOverlay = new Ref<HTMLDivElement>();
  public collapseButton = new Ref<HTMLDivElement>();
  public recentPremieresButton = new Ref<HTMLDivElement>();
  public topRatedButton = new Ref<HTMLDivElement>();
  public continueWatchButton = new Ref<HTMLDivElement>();
  public searchInput = new Ref<HTMLInputElement>();
  public searchButton = new Ref<HTMLDivElement>();
  private searchType: SearchType;

  public constructor(appendBodies: AddBodiesFn) {
    super();
    appendBodies(
      E.divRef(
        this.navigationBar,
        {
          class: "multi-section-navigation-bar-container",
          style: `position: fixed; left: 0; bottom: 0; z-index: 1; width: 100%; flex-flow: row nowrap; justify-content: center; align-items: center;`,
        },
        E.div(
          {
            class: "multi-section-navigation-bar",
            style: `background-color: ${SCHEME.neutral4}; box-shadow: 0 0 .5rem ${SCHEME.neutral1}; width: 100%; max-width: 60rem; border-top-left-radius: .5rem; border-top-right-radius: .5rem; display: flex; flex-flow: row nowrap; gap: 1rem;`,
          },
          E.divRef(
            this.homeButton,
            {
              class: "multi-section-navigation-bar-multi-section-button",
              style: ConsumerPage.NAVIGATION_BUTTON_STYLE,
            },
            E.div(
              {
                class: "multi-section-navigation-bar-multi-section-icon",
                style: ConsumerPage.NAVIGATION_ICON_STYLE,
              },
              createHomeIcon(SCHEME.neutral1),
            ),
            E.div(
              {
                class: "multi-section-navigation-bar-multi-section-text",
                style: ConsumerPage.NAVIGATION_TEXT_STYLE,
              },
              E.text(LOCALIZED_TEXT.homeLabel),
            ),
          ),
          E.divRef(
            this.exploreButton,
            {
              class: "multi-section-navigation-bar-explore-button",
              style: ConsumerPage.NAVIGATION_BUTTON_STYLE,
            },
            E.div(
              {
                class: "multi-section-navigation-bar-explore-icon",
                style: ConsumerPage.NAVIGATION_ICON_STYLE,
              },
              createSearchIcon(SCHEME.neutral1),
            ),
            E.div(
              {
                class: "multi-section-navigation-bar-explore-text",
                style: ConsumerPage.NAVIGATION_TEXT_STYLE,
              },
              E.text(LOCALIZED_TEXT.exploreLabel),
            ),
          ),
          E.divRef(
            this.activityButton,
            {
              class: "multi-section-navigation-bar-activity-button",
              style: ConsumerPage.NAVIGATION_BUTTON_STYLE,
            },
            E.div(
              {
                class: "multi-section-navigation-bar-activity-icon",
                style: ConsumerPage.NAVIGATION_ICON_STYLE,
              },
              createHistoryIcon(SCHEME.neutral1),
            ),
            E.div(
              {
                class: "multi-section-navigation-bar-activity-text",
                style: ConsumerPage.NAVIGATION_TEXT_STYLE,
              },
              E.text(LOCALIZED_TEXT.activityLabel),
            ),
          ),
          E.divRef(
            this.accountButton,
            {
              class: "multi-section-navigation-bar-account-button",
              style: ConsumerPage.NAVIGATION_BUTTON_STYLE,
            },
            E.div(
              {
                class: "multi-section-navigation-bar-account-icon",
                style: ConsumerPage.NAVIGATION_ICON_STYLE,
              },
              createAccountIcon(SCHEME.neutral1),
            ),
            E.div(
              {
                class: "multi-section-navigation-bar-account-text",
                style: ConsumerPage.NAVIGATION_TEXT_STYLE,
              },
              E.text(LOCALIZED_TEXT.accountLabel),
            ),
          ),
        ),
      ),
      E.divRef(
        this.searchOverlay,
        {
          class: "multi-section-search-overlay-container",
          style: `position: fixed; left: 0; z-index: 2; width: 100%; display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; transition: top .2s;`,
        },
        E.div(
          {
            class: "multi-section-search-overlay",
            style: `background-color: ${SCHEME.neutral4}; box-shadow: 0 0 .5rem ${SCHEME.neutral1}; width: 100%; max-width: 60rem; box-sizing: border-box; padding: 2rem; border-top-left-radius: .5rem; border-top-right-radius: .5rem; position: relative; display: flex; flex-flow: column nowrap; gap: 1rem;`,
          },
          E.divRef(
            this.collapseButton,
            {
              class: "multi-section-search-collapse-icon-button",
              style: `position: absolute; top: 0; left: 50%; transform: translate(-50%, 0); width: ${ICON_BUTTON_M}rem; box-sizing: border-box; padding: .7rem; cursor: pointer;`,
            },
            createDoubleArrowsIcon(
              SCHEME.neutral1,
              "transform: rotate(-90deg);",
            ),
          ),
          E.div(
            {
              class: "multi-section-search-quick-access-title",
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.quickAccessLabel),
          ),
          E.div(
            {
              class: "multi-section-search-quick-access-items",
              style: `display: flex; flex-flow: row wrap; gap: 1rem;`,
            },
            E.divRef(
              this.recentPremieresButton,
              {
                class: "multi-section-search-recent-premieres",
                style: `${OUTLINE_BUTTON_STYLE}`,
              },
              E.text(LOCALIZED_TEXT.recentPremieresLabel),
            ),
            E.divRef(
              this.topRatedButton,
              {
                class: "multi-section-search-top-rated",
                style: `${OUTLINE_BUTTON_STYLE}`,
              },
              E.text(LOCALIZED_TEXT.topRatedLabel),
            ),
            E.divRef(
              this.continueWatchButton,
              {
                class: "multi-section-search-continue-watching",
                style: `${OUTLINE_BUTTON_STYLE}`,
              },
              E.text(LOCALIZED_TEXT.continueWatchingLabel),
            ),
          ),
          E.div(
            {
              class: "multi-section-search-bar-line",
              style: `width: 100%; display: flex; flex-flow: row nowrap; align-items: center; gap: 1rem;`,
            },
            E.inputRef(this.searchInput, {
              class: "multi-section-search-bar-input",
              style: `${BASIC_INPUT_STYLE} flex: 1 0 0;`,
            }),
            E.divRef(
              this.searchButton,
              {
                class: "multi-section-search-bar-icon",
                style: `width: ${ICON_BUTTON_M}rem; height: ${ICON_BUTTON_M}rem; box-sizing: border-box; padding: .6rem; cursor: pointer;`,
              },
              createSearchIcon(SCHEME.neutral1),
            ),
          ),
          RadioOptionInput.create(
            "Search for",
            "",
            [
              OptionButton.create("Videos", SearchType.VIDEOS, ""),
              OptionButton.create("Publishers", SearchType.PUBLISHERS, ""),
            ],
            SearchType.VIDEOS,
            (value) => {
              this.searchType = value;
            },
          ).body,
        ),
      ),
    );
    this.showNavgationBar();

    // this.homeButton.val.addEventListener("click", () => this.refresh());
    this.exploreButton.val.addEventListener("click", () =>
      this.showSearchOverlay(),
    );
    this.searchOverlay.val.addEventListener("transitionend", () =>
      this.endSearchOverlayTransition(),
    );
    this.collapseButton.val.addEventListener("click", () =>
      this.showNavgationBar(),
    );
    this.recentPremieresButton.val.addEventListener("click", () =>
      this.emit("listRecentPremieres"),
    );
    this.topRatedButton.val.addEventListener("click", () =>
      this.emit("listTopRated"),
    );
    this.continueWatchButton.val.addEventListener("click", () =>
      this.emit("listContinueWatching"),
    );
    this.searchInput.val.addEventListener("keydown", (event) =>
      this.enterSearch(event),
    );
    this.searchButton.val.addEventListener("click", () =>
      this.validateOrSearch(),
    );
    this.activityButton.val.addEventListener("click", () =>
      this.emit("goToActivity"),
    );
    this.accountButton.val.addEventListener("click", () =>
      this.emit("goToAccount"),
    );
  }

  private showNavgationBar() {
    this.navigationBar.val.style.display = `flex`;
    this.searchOverlay.val.style.top = `100%`;
    this.searchOverlay.val.style.bottom = `auto`;
  }

  private endSearchOverlayTransition() {
    this.searchOverlay.val.style.top = `auto`;
    this.searchOverlay.val.style.bottom = `0`;
  }

  private showSearchOverlay() {
    this.searchOverlay.val.style.top = `calc(100% - ${this.searchOverlay.val.scrollHeight}px)`;
    this.navigationBar.val.style.display = `none`;
    this.searchInput.val.focus();
  }

  private enterSearch(event: KeyboardEvent) {
    if (event.code === "Enter") {
      this.validateOrSearch();
    }
  }

  private validateOrSearch() {
    if (this.searchInput.val.value.trim() === "") {
      return;
    } else {
      this.emit("search", this.searchType, this.searchInput.val.value);
    }
  }

  public applyUrl(newUrl?: ConsumerPageUrl): this {
    return this;
  }

  public remove(): void {
    this.navigationBar.val.remove();
    this.searchOverlay.val.remove();
  }
}
