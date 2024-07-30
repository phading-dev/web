import EventEmitter = require("events");
import { DropdownList, OptionEntry } from "../../../common/dropdown_list";
import { LABEL_STYLE } from "./styles";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export interface DropdownOption<T> {
  on(event: "update", listener: (value: T) => void): this;
}

export class DropdownOption<T> extends EventEmitter {
  public static create<T>(
    label: string,
    optionEntries: Array<OptionEntry<T>>,
    defaultValue: T,
    value: T,
  ): DropdownOption<T> {
    return new DropdownOption(label, optionEntries, defaultValue, value);
  }

  public body: HTMLDivElement;
  public dropdownList = new Ref<DropdownList<T>>();

  public constructor(
    label: string,
    optionEntries: Array<OptionEntry<T>>,
    private defaultValue: T,
    value: T,
  ) {
    super();
    this.body = E.div(
      {
        class: "dropdown-container",
        style: `display: flex; flex-flow: row nowrap; justify-content: space-between; align-items: center;`,
      },
      E.div(
        {
          class: "dropdown-label",
          style: LABEL_STYLE,
          title: label,
        },
        E.text(label),
      ),
      assign(
        this.dropdownList,
        DropdownList.create(optionEntries, value, "flex: 0 0 auto; width: 9rem;"),
      ).body,
    );

    this.dropdownList.val.on("select", (selectedKind: T) =>
      this.select(selectedKind),
    );
  }

  private select(selectedKind: T): void {
    this.emit("update", selectedKind);
  }

  public reset(): T {
    this.dropdownList.val.setValue(this.defaultValue);
    return this.defaultValue;
  }
}
