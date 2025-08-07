import EventEmitter = require("events");
import { IconButton } from "../../../common/button";
import { SCHEME } from "../../../common/color_scheme";
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
  GAP_0_5X,
  ICON_BUTTON_M,
  ICON_L,
  PAGE_MAX_WIDTH_M,
} from "../../../common/sizes";
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
  public searchActionButton = new Ref<IconButton>();
  public searchOptionSeason = new Ref<OptionPill<SearchTarget>>();
  public searchOptionPublisher = new Ref<OptionPill<SearchTarget>>();
  private searchOptionsGroup: RadioOptionsGroup<SearchTarget>;

  public constructor(searchTarget: SearchTarget, query?: string) {
    super();
    this.body = E.div(
      {
        class: "search-input",
        style: `padding: 0 ${GAP_0_5X}rem; display: flex; flex-flow: row nowrap; justify-content: center;`,
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
            class: "search-input-option",
            style: `display: flex; flex-flow: row wrap; gap: ${GAP_1X}rem; align-items: center;`,
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
      ),
    );
    this.searchInput.val.addEventListener("keydown", (event) =>
      this.keydownSearchInput(event),
    );
    this.searchActionButton.val.addAction(() => this.executeSearch());
    this.searchOptionsGroup = new RadioOptionsGroup<SearchTarget>([
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
    this.emit("search", this.searchOptionsGroup.value, query);
  }
}
