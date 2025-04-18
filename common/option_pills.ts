import EventEmitter = require("events");
import { SCHEME } from "./color_scheme";
import { FONT_M, LINE_HEIGHT_M } from "./sizes";
import { E } from "@selfage/element/factory";

export interface OptionPill<ValueType> {
  on(event: "selected", listener: (value: ValueType) => void): this;
}

export class OptionPill<ValueType> extends EventEmitter {
  public static create<ValueType>(
    label: string,
    value: ValueType,
    customStyle?: string,
  ): OptionPill<ValueType> {
    return new OptionPill(label, value, customStyle);
  }

  private container: HTMLDivElement;

  public constructor(
    label: string,
    private value_: ValueType,
    customStyle: string = "",
  ) {
    super();
    this.container = E.div(
      {
        class: "option-pill-button",
        style: `flex: 0 0 auto; display: flex; justify-content: center; align-items: center; font-size: ${FONT_M}rem; border-radius: ${LINE_HEIGHT_M}rem; padding: .4rem .9rem; border: .2rem solid; cursor: pointer; ${customStyle}`,
      },
      E.text(label),
    );

    this.container.addEventListener("click", () => this.selected());
  }

  public get body(): HTMLDivElement {
    return this.container;
  }

  public get value(): ValueType {
    return this.value_;
  }

  private selected(): this {
    this.highlight();
    this.emit("selected", this.value);
    return this;
  }

  public highlight(): this {
    this.container.style.color = SCHEME.primary0;
    this.container.style.borderColor = SCHEME.primary1;
    return this;
  }

  public lowlight(): this {
    this.container.style.color = SCHEME.neutral0;
    this.container.style.borderColor = SCHEME.neutral1;
    return this;
  }

  public click(): void {
    this.container.click();
  }
}

export interface RadioOptionPills<ValueType> {
  on(event: "selected", listener: (value: ValueType) => void): this;
}

export class RadioOptionPills<ValueType> extends EventEmitter {
  public static create<ValueType>(
    pills: Array<OptionPill<ValueType>>,
  ): RadioOptionPills<ValueType> {
    return new RadioOptionPills<ValueType>(pills);
  }

  private currentPill: OptionPill<ValueType>;

  public constructor(public pills: Array<OptionPill<ValueType>>) {
    super();
    for (let pill of this.pills) {
      pill.lowlight();
      pill.on("selected", () => this.selectedOption(pill));
    }
  }

  private selectedOption(pill: OptionPill<ValueType>): void {
    this.setCurrentPill(pill);
    this.emit("selected", pill.value);
  }

  private setCurrentPill(pill: OptionPill<ValueType>): void {
    if (this.currentPill) {
      this.currentPill.lowlight();
    }
    this.currentPill = pill;
  }

  public setValue(value: ValueType): this {
    for (let pill of this.pills) {
      if (pill.value === value) {
        pill.highlight();
        this.setCurrentPill(pill);
        return this;
      }
    }
    throw new Error(`Value ${value} not found in pills`);
  }

  public get value() {
    return this.currentPill.value;
  }

  public get elements(): Array<HTMLElement> {
    return this.pills.map((pill) => pill.body);
  }
}
