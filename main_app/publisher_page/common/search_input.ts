import EventEmitter = require("events");
import { SimpleIconButton } from "../../../common/icon_button";
import { createSearchIcon } from "../../../common/icons";
import { BASIC_INPUT_STYLE } from "../../../common/input_styles";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { OptionPill, RadioOptionsGroup } from "../../../common/option_buttons";
import { ICON_BUTTON_M, ICON_L } from "../../../common/sizes";
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
  public searchActionButton = new Ref<SimpleIconButton>();
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
        style: `padding: 0 1rem; display: flex; flex-flow: column nowrap;`,
      },
      E.div(
        {
          class: "search-input-line",
          style: `width: 100%; box-sizing: border-box; display: flex; flex-flow: row nowrap; align-items: center; gap: 1rem;`,
        },
        E.inputRef(this.searchInput, {
          class: "search-input-field",
          style: `${BASIC_INPUT_STYLE} flex: 1 0 0;`,
          value: query ?? "",
        }),
        assign(
          this.searchActionButton,
          new SimpleIconButton(
            ICON_BUTTON_M,
            ICON_L,
            createSearchIcon("currentColor"),
          ),
        ).body,
      ),
      E.div({
        style: `flex: 0 0 auto; height: 1rem;`,
      }),
      E.div(
        {
          class: "publisher-page-search-bar-state-option",
          style: `display: flex; flex-flow: row nowrap; gap: 1rem; align-items: center;`,
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
    );
    this.searchInput.val.addEventListener("keydown", (event) =>
      this.keydownSearchInput(event),
    );
    this.searchActionButton.val.on("action", () => this.executeSearch());
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
