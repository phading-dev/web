import EventEmitter = require("events");
import { SCHEME } from "../../../common/color_scheme";
import { IconButton } from "../../../common/button";
import { createSearchIcon } from "../../../common/icons";
import {
  COMMON_BASIC_INPUT_WITHOUT_PADDING_STYLE,
  INPUT_SIDE_PADDING,
} from "../../../common/input_styles";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { OptionPill, RadioOptionsGroup } from "../../../common/option_buttons";
import {
  BORDER_RADIUS_S,
  BORDER_WIDTH_1,
  GAP_1X,
  GAP_d_5X,
  ICON_BUTTON_M,
  ICON_L,
  PAGE_MAX_WIDTH_M,
} from "../../../common/sizes";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export enum SeasonStateWithAll {
  DRAFT = 1,
  PUBLISHED = 2,
  ARCHIVED = 3,
  TAKEN_DOWN = 4,
  ALL = 5,
}

export interface SearchInput {
  on(event: "list", listener: (seasonState?: SeasonState) => void): this;
  on(
    event: "search",
    listener: (query: string, seasonState?: SeasonState) => void,
  ): this;
}

export class SearchInput extends EventEmitter {
  public body: HTMLDivElement;
  public searchInput = new Ref<HTMLInputElement>();
  public searchActionButton = new Ref<IconButton>();
  public searchOptionAll = new Ref<OptionPill<SeasonStateWithAll>>();
  public searchOptionDraft = new Ref<OptionPill<SeasonStateWithAll>>();
  public searchOptionPublished = new Ref<OptionPill<SeasonStateWithAll>>();
  public searchOptionArchived = new Ref<OptionPill<SeasonStateWithAll>>();
  public searchOptionTakenDown = new Ref<OptionPill<SeasonStateWithAll>>();
  private searchOptionsGroup: RadioOptionsGroup<SeasonStateWithAll>;

  public constructor(query?: string, seasonState?: SeasonState) {
    super();
    this.body = E.div(
      {
        class: "search-input",
        style: `padding: 0 ${GAP_d_5X}rem; display: flex; flex-flow: row nowrap; justify-content: center;`,
      },
      E.div(
        {
          class: "search-input-centered",
          style: `width: 100%; max-width: ${PAGE_MAX_WIDTH_M}rem; display: flex; flex-flow: column nowrap;`,
        },
        E.div(
          {
            class: "search-input-line",
            style: `width: 100%; box-sizing: border-box; display: flex; flex-flow: row nowrap; align-items: center; border: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral1}; border-radius: ${BORDER_RADIUS_S}rem;`,
          },
          E.inputRef(this.searchInput, {
            class: "search-input-field",
            style: `${COMMON_BASIC_INPUT_WITHOUT_PADDING_STYLE} padding-left: ${INPUT_SIDE_PADDING}rem; flex: 1 0 0;`,
            value: query ?? "",
          }),
          assign(
            this.searchActionButton,
            new IconButton(
              ICON_BUTTON_M,
              ICON_L,
              createSearchIcon("currentColor"),
            ),
          ).body,
        ),
        E.div({
          style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
        }),
        E.div(
          {
            class: "publisher-page-search-bar-state-option",
            style: `display: flex; flex-flow: row nowrap; gap: ${GAP_1X}rem; align-items: center;`,
          },
          assign(
            this.searchOptionAll,
            new OptionPill(
              LOCALIZED_TEXT.seasonStateAllOptionLabel,
              SeasonStateWithAll.ALL,
            ),
          ).body,
          assign(
            this.searchOptionDraft,
            new OptionPill(
              LOCALIZED_TEXT.seasonStateDraftLabel,
              SeasonStateWithAll.DRAFT,
            ),
          ).body,
          assign(
            this.searchOptionPublished,
            new OptionPill(
              LOCALIZED_TEXT.seasonStatePublishedLabel,
              SeasonStateWithAll.PUBLISHED,
            ),
          ).body,
          assign(
            this.searchOptionArchived,
            new OptionPill(
              LOCALIZED_TEXT.seasonStateArchivedLabel,
              SeasonStateWithAll.ARCHIVED,
            ),
          ).body,
          assign(
            this.searchOptionTakenDown,
            new OptionPill(
              LOCALIZED_TEXT.seasonStateTakenDownLabel,
              SeasonStateWithAll.TAKEN_DOWN,
            ),
          ).body,
        ),
      ),
    );
    this.searchInput.val.addEventListener("keydown", (event) =>
      this.keydownSearchInput(event),
    );
    this.searchActionButton.val.addAction(() => this.executeSearch());
    this.searchOptionsGroup = new RadioOptionsGroup<SeasonStateWithAll>([
      this.searchOptionAll.val,
      this.searchOptionDraft.val,
      this.searchOptionPublished.val,
      this.searchOptionArchived.val,
      this.searchOptionTakenDown.val,
    ])
      .setValue(this.toSeasonStateWithAll(seasonState))
      .on("select", () => this.executeSearch());
  }

  private toSeasonState(state: SeasonStateWithAll): SeasonState {
    switch (state) {
      case SeasonStateWithAll.DRAFT:
        return SeasonState.DRAFT;
      case SeasonStateWithAll.PUBLISHED:
        return SeasonState.PUBLISHED;
      case SeasonStateWithAll.ARCHIVED:
        return SeasonState.ARCHIVED;
      case SeasonStateWithAll.TAKEN_DOWN:
        return SeasonState.TAKEN_DOWN;
      case SeasonStateWithAll.ALL:
        return undefined;
    }
  }

  private toSeasonStateWithAll(state?: SeasonState): SeasonStateWithAll {
    switch (state) {
      case SeasonState.DRAFT:
        return SeasonStateWithAll.DRAFT;
      case SeasonState.PUBLISHED:
        return SeasonStateWithAll.PUBLISHED;
      case SeasonState.ARCHIVED:
        return SeasonStateWithAll.ARCHIVED;
      case SeasonState.TAKEN_DOWN:
        return SeasonStateWithAll.TAKEN_DOWN;
      default:
        return SeasonStateWithAll.ALL;
    }
  }

  private keydownSearchInput(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      this.executeSearch();
    }
  }

  private executeSearch(): void {
    let query = this.searchInput.val.value.trim();
    if (!query) {
      this.emit("list", this.toSeasonState(this.searchOptionsGroup.value));
    } else {
      this.emit(
        "search",
        query,
        this.toSeasonState(this.searchOptionsGroup.value),
      );
    }
  }
}
