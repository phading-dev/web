import EventEmitter = require("events");
import { SCHEME } from "./color_scheme";
import { FONT_M } from "./sizes";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface OptionEntry<T> {
  kind: T;
  localizedMsg: string;
}

export interface DropdownEntry<T> {
  on(event: "select", listener: (value: T) => void): this;
}

export class DropdownEntry<T> extends EventEmitter {
  public static create<T>(optionEntry: OptionEntry<T>): DropdownEntry<T> {
    return new DropdownEntry(optionEntry);
  }

  private body_: HTMLDivElement;

  public constructor(private optionEntry: OptionEntry<T>) {
    super();
    this.body_ = E.div(
      {
        class: "dropdown-entry",
        style: `width: 100%; padding: .4rem; box-sizing: border-box; font-size: ${FONT_M}rem;`,
      },
      E.text(this.optionEntry.localizedMsg),
    );
    this.lowlight();

    this.body_.addEventListener("pointerover", () => this.highlight());
    this.body_.addEventListener("pointerout", () => this.lowlight());
    this.body_.addEventListener("click", () => this.select());
  }

  private lowlight(): void {
    this.body_.style.color = SCHEME.neutral0;
  }

  private highlight(): void {
    this.body_.style.color = SCHEME.primary0;
  }

  public select(): void {
    this.emit("select", this.optionEntry.kind);
  }

  public get body() {
    return this.body_;
  }
}

export interface DropdownList<T> {
  on(event: "select", listener: (selectedKind: T) => void): this;
}

export class DropdownList<T> extends EventEmitter {
  public static create<T>(
    optionEntries: Array<OptionEntry<T>>,
    value: T,
    customStyle = "",
  ): DropdownList<T> {
    return new DropdownList(optionEntries, value, customStyle);
  }

  public selectedKind: T;
  public body: HTMLDivElement;
  public selectedOption = new Ref<HTMLDivElement>();
  private selectedOptionText = new Ref<HTMLDivElement>();
  private optionList = new Ref<HTMLDivElement>();
  public dropdownEntries: Array<DropdownEntry<T>>;

  public constructor(
    private optionEntries: Array<OptionEntry<T>>,
    value: T,
    customStyle: string,
  ) {
    super();
    this.dropdownEntries = optionEntries.map((optionEntry) =>
      DropdownEntry.create(optionEntry),
    );
    this.body = E.div(
      {
        class: "dropdown-list-container",
        style: `position: relative; cursor: pointer; border-bottom: .1rem solid ${SCHEME.neutral1}; ${customStyle}`,
      },
      E.divRef(
        this.selectedOption,
        {
          class: "dropdown-list-selected-option",
          style: `display: flex; flex-flow: row nowrap; justify-content: space-between; align-items: center; gap: .4rem; padding: 0 .4rem;`,
        },
        E.divRef(this.selectedOptionText, {
          class: "dropdown-list-selected-option-text",
          style: `padding: .4rem 0; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        }),
        E.div({
          class: "dropdown-list-option-arrow",
          style: `border-left: .4rem solid transparent; border-right: .4rem solid transparent; border-top: .8rem solid ${SCHEME.neutral1};`,
        }),
      ),
      E.divRef(
        this.optionList,
        {
          class: "dropdown-list-option-list",
          style: `position: absolute; background-color: ${SCHEME.neutral4}; width: 100%;`,
        },
        ...this.dropdownEntries.map((dropdownEntry) => dropdownEntry.body),
      ),
    );
    this.setValue(value);

    this.dropdownEntries.forEach((dropdownEntry) => {
      dropdownEntry.on("select", (value) => this.selectValue(value));
    });
    this.body.addEventListener("click", () => this.toggleOptionList());
  }

  public setValue(value: T): void {
    let optionEntry = this.optionEntries.find(
      (option) => option.kind === value,
    );
    this.selectedKind = optionEntry.kind;
    this.selectedOptionText.val.textContent = optionEntry.localizedMsg;
    this.optionList.val.style.display = "none";
  }

  private selectValue(value: T): void {
    this.setValue(value);
    this.emit("select", this.selectedKind);
  }

  private toggleOptionList(): void {
    if (this.optionList.val.style.display === "none") {
      this.optionList.val.style.display = "block";
    } else {
      this.optionList.val.style.display = "none";
    }
  }

  public remove(): void {
    return this.body.remove();
  }
}
