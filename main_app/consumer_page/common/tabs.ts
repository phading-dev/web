import EventEmitter = require("events");
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { OptionTab, RadioOptionsGroup } from "../../../common/option_buttons";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export enum ActivityTab {
  HISTORY,
  WATCH_LATER,
  USAGE,
}

export interface ActivityTabsOption {
  on(event: "select", listener: (value: ActivityTab) => void): this;
}

export class ActivityTabsOption extends EventEmitter {
  public body: HTMLDivElement;
  public watchHistoryTab = new Ref<OptionTab<ActivityTab>>();
  public watchLaterTab = new Ref<OptionTab<ActivityTab>>();
  public usageTab = new Ref<OptionTab<ActivityTab>>();
  private tabsGroup: RadioOptionsGroup<ActivityTab>;

  public constructor() {
    super();
    this.body = E.div(
      {
        class: `history-page-tabs`,
        style: `display: flex; flex-flow: row nowrap; align-items: flex-end; justify-content: center;`,
      },
      assign(
        this.watchHistoryTab,
        new OptionTab(
          LOCALIZED_TEXT.watchHistoryTitle,
          ActivityTab.HISTORY,
          `box-sizing: border-box; flex: 1 0 0; max-width: 20rem; text-align: center;`,
        ),
      ).body,
      assign(
        this.watchLaterTab,
        new OptionTab(
          LOCALIZED_TEXT.watchLaterTitle,
          ActivityTab.WATCH_LATER,
          `box-sizing: border-box; flex: 1 0 0; max-width: 20rem; text-align: center;`,
        ),
      ).body,
      assign(
        this.usageTab,
        new OptionTab(
          LOCALIZED_TEXT.usageTitle,
          ActivityTab.USAGE,
          `box-sizing: border-box; flex: 1 0 0; max-width: 20rem; text-align: center;`,
        ),
      ).body,
    );
    this.tabsGroup = new RadioOptionsGroup<ActivityTab>([
      this.watchHistoryTab.val,
      this.watchLaterTab.val,
      this.usageTab.val,
    ]).on("select", (value) => this.emit("select", value));
  }

  public setValue(value: ActivityTab): this {
    this.tabsGroup.setValue(value);
    return this;
  }
}
