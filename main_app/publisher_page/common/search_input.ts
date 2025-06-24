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

export interface SearchInput {
  on(event: "list", listener: (seasonState: SeasonState) => void): this;
  on(
    event: "search",
    listener: (seasonState: SeasonState, query: string) => void,
  ): this;
}

export class SearchInput extends EventEmitter {
  public body: HTMLDivElement;
  public searchInput = new Ref<HTMLInputElement>();
  public searchActionButton = new Ref<SimpleIconButton>();
  public searchOptionDraft = new Ref<OptionPill<SeasonState>>();
  public searchOptionPublished = new Ref<OptionPill<SeasonState>>();
  public searchOptionArchived = new Ref<OptionPill<SeasonState>>();
  private searchOptionsGroup: RadioOptionsGroup<SeasonState>;

  public constructor(seasonState: SeasonState, query?: string) {
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
          this.searchOptionDraft,
          new OptionPill(
            LOCALIZED_TEXT.seasonStateDraftOptionLabel,
            SeasonState.DRAFT,
          ),
        ).body,
        assign(
          this.searchOptionPublished,
          new OptionPill(
            LOCALIZED_TEXT.seasonStatePublishedOptionLabel,
            SeasonState.PUBLISHED,
          ),
        ).body,
        assign(
          this.searchOptionArchived,
          new OptionPill(
            LOCALIZED_TEXT.seasonStateArchivedOptionLabel,
            SeasonState.ARCHIVED,
          ),
        ).body,
      ),
    );
    this.searchInput.val.addEventListener("keydown", (event) =>
      this.keydownSearchInput(event),
    );
    this.searchActionButton.val.on("action", () => this.executeSearch());
    this.searchOptionsGroup = new RadioOptionsGroup<SeasonState>([
      this.searchOptionDraft.val,
      this.searchOptionPublished.val,
      this.searchOptionArchived.val,
    ])
      .setValue(seasonState)
      .on("select", () => this.executeSearch());
  }

  private keydownSearchInput(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      this.executeSearch();
    }
  }

  private executeSearch(): void {
    let query = this.searchInput.val.value.trim();
    if (!query) {
      this.emit("list", this.searchOptionsGroup.value);
    } else {
      this.emit("search", this.searchOptionsGroup.value, query);
    }
  }
}
