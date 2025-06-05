import EventEmitter = require("events");
import { SimpleIconButton } from "../../../common/icon_button";
import { createSearchIcon } from "../../../common/icons";
import { BASIC_INPUT_STYLE } from "../../../common/input_styles";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import {
  OptionPill,
  RadioOptionPillsGroup,
} from "../../../common/option_pills";
import { ICON_BUTTON_M, ICON_L } from "../../../common/sizes";
import { SearchTarget } from "@phading/web_interface/main/consumer/page";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export interface SearchInput {
  on(
    event: "search",
    listener: (searchTarget: SearchTarget, query: string) => void,
  ): this;
}

export class SearchInput extends EventEmitter {
  public body: HTMLDivElement;
  public searchInput = new Ref<HTMLInputElement>();
  public searchActionButton = new Ref<SimpleIconButton>();
  public searchOptionSeason = new Ref<OptionPill<SearchTarget>>();
  public searchOptionPublisher = new Ref<OptionPill<SearchTarget>>();
  private searchOptionGroup: RadioOptionPillsGroup<SearchTarget>;

  public constructor(searchTarget: SearchTarget, query?: string) {
    super();
    this.body = E.div(
      {
        class: "search-input",
        style: `display: flex; flex-flow: column nowrap;`,
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
          class: "search-input-option",
          style: `display: flex; flex-flow: row nowrap; gap: 1rem; align-items: center;`,
        },
        assign(
          this.searchOptionSeason,
          new OptionPill(
            LOCALIZED_TEXT.searchTargetSeasonLabel,
            SearchTarget.SEASON,
          ),
        ).body,
        assign(
          this.searchOptionPublisher,
          new OptionPill(
            LOCALIZED_TEXT.searchTargetPublisherLabel,
            SearchTarget.PUBLISHER,
          ),
        ).body,
      ),
    );
    this.searchInput.val.addEventListener("keydown", (event) =>
      this.keydownSearchInput(event),
    );
    this.searchActionButton.val.on("action", () => this.executeSearch());
    this.searchOptionGroup = new RadioOptionPillsGroup<SearchTarget>([
      this.searchOptionSeason.val,
      this.searchOptionPublisher.val,
    ])
      .setValue(searchTarget)
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
      return;
    }
    this.emit("search", this.searchOptionGroup.value, query);
  }
}
