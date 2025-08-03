import EventEmitter = require("events");
import { SCHEME } from "./color_scheme";
import { TabSwitcher } from "./page_navigator";
import {
  BORDER_WIDTH_2,
  FONT_M,
  FONT_WEIGHT_600,
  GAP_d_5X,
  GAP_d_75X,
  LINE_HEIGHT_FOR_BUTTON_M,
  LINE_HEIGHT_M,
} from "./sizes";
import { E } from "@selfage/element/factory";

interface OptionButton<ValueType> {
  on(event: "select", listener: (value: ValueType) => void): this;
  value: ValueType;
  highlight(): this;
  lowlight(): this;
  click(): void;
}

export interface OptionPill<ValueType> {
  on(event: "select", listener: (value: ValueType) => void): this;
}

export class OptionPill<ValueType>
  extends EventEmitter
  implements OptionButton<ValueType>
{
  public body: HTMLDivElement;

  public constructor(
    label: string,
    private value_: ValueType,
    customStyle: string = "",
  ) {
    super();
    this.body = E.div(
      {
        class: "option-pill-button",
        style: `flex: 0 0 auto; font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; line-height: ${LINE_HEIGHT_FOR_BUTTON_M}rem; border-radius: ${LINE_HEIGHT_FOR_BUTTON_M}rem; padding: 0 ${GAP_d_75X}rem; border: ${BORDER_WIDTH_2}rem solid; ${customStyle}`,
      },
      E.text(label),
    );
    this.enable();
    this.lowlight();
    this.body.addEventListener("click", () => this.emit("select", this.value));
  }

  public get value(): ValueType {
    return this.value_;
  }

  public highlight(): this {
    this.body.style.color = SCHEME.primaryContrast0;
    this.body.style.borderColor = SCHEME.primary1;
    this.body.style.backgroundColor = SCHEME.primary1;
    return this;
  }

  public lowlight(): this {
    this.body.style.color = SCHEME.neutral0;
    this.body.style.borderColor = SCHEME.neutral1;
    this.body.style.backgroundColor = "transparent";
    return this;
  }

  public enable(): this {
    this.body.style.pointerEvents = "auto";
    this.body.style.cursor = "pointer";
    return this;
  }

  public disable(): this {
    this.body.style.pointerEvents = "none";
    this.body.style.cursor = "not-allowed";
    return this;
  }

  public click(): void {
    this.body.click();
  }
}

export class OptionTab<ValueType>
  extends EventEmitter
  implements OptionButton<ValueType>
{
  public body: HTMLDivElement;

  public constructor(
    label: string,
    private value_: ValueType,
    customStyle: string = "",
  ) {
    super();
    this.body = E.div(
      {
        class: "option-tab-button",
        style: `flex: 0 0 auto; display: flex; justify-content: center; font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; line-height: ${LINE_HEIGHT_M}rem; padding: ${GAP_d_5X}rem ${GAP_d_75X}rem; cursor: pointer; border-bottom: ${BORDER_WIDTH_2}rem solid; ${customStyle}`,
      },
      E.text(label),
    );

    this.lowlight();
    this.body.addEventListener("click", () => this.emit("select", this.value));
  }

  public get value(): ValueType {
    return this.value_;
  }

  public highlight(): this {
    this.body.style.color = SCHEME.primary0;
    this.body.style.borderBottomColor = SCHEME.primary1;
    return this;
  }

  public lowlight(): this {
    this.body.style.color = SCHEME.neutral0;
    this.body.style.borderBottomColor = SCHEME.neutral1;
    return this;
  }

  public click(): void {
    this.body.click();
  }
}

export interface RadioOptionsGroup<ValueType> {
  on(event: "select", listener: (value: ValueType) => void): this;
}

export class RadioOptionsGroup<ValueType> extends EventEmitter {
  private currentOption: OptionButton<ValueType>;
  private optionSwitcher = new TabSwitcher();

  public constructor(private options: Array<OptionButton<ValueType>>) {
    super();
    for (let option of this.options) {
      option.on("select", () => this.selectOption(option));
    }
  }

  private selectOption(option: OptionButton<ValueType>): void {
    if (this.currentOption !== option) {
      this.switchOption(option);
      this.emit("select", option.value);
    }
  }

  public setValue(value: ValueType): this {
    for (let option of this.options) {
      if (option.value === value) {
        this.switchOption(option);
        return this;
      }
    }
    throw new Error(`Value ${value} not found in options`);
  }

  private switchOption(option: OptionButton<ValueType>): void {
    this.optionSwitcher.goTo(
      () => {
        option.highlight();
        this.currentOption = option;
      },
      () => option.lowlight(),
    );
  }

  public get value() {
    return this.currentOption.value;
  }
}
