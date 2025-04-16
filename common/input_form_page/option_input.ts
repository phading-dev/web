import EventEmitter = require("events");
import { SCHEME } from "../color_scheme";
import { FONT_M, LINE_HEIGHT_M } from "../sizes";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface OptionButton<ValueType> {
  on(event: "select", listener: (value: ValueType) => void): this;
}

export class OptionButton<ValueType> extends EventEmitter {
  public static create<ValueType>(
    label: string,
    value: ValueType,
    customStyle: string,
  ): OptionButton<ValueType> {
    return new OptionButton(label, value, customStyle);
  }

  private container: HTMLDivElement;

  public constructor(
    label: string,
    private value_: ValueType,
    customStyle: string,
  ) {
    super();
    this.container = E.div(
      {
        class: "option-button",
        style: `flex: 0 0 auto; display: flex; justify-content: center; align-items: center; font-size: ${FONT_M}rem; border-radius: ${LINE_HEIGHT_M}rem; cursor: pointer; ${customStyle}`,
      },
      E.text(label),
    );

    this.container.addEventListener("click", () => this.select());
  }

  public get body(): HTMLDivElement {
    return this.container;
  }

  public get value(): ValueType {
    return this.value_;
  }

  public select(): this {
    this.container.style.color = SCHEME.primary0;
    this.container.style.padding = ".4rem .9rem";
    this.container.style.border = `.2rem solid ${SCHEME.primary1}`;
    this.emit("select", this.value);
    return this;
  }

  public unselect(): this {
    this.container.style.color = SCHEME.neutral0;
    this.container.style.padding = ".5rem 1rem";
    this.container.style.border = `.1rem solid ${SCHEME.neutral1}`;
    return this;
  }

  // Visible for testing
  public click(): void {
    this.container.click();
  }
}

export class RadioOptionInput<ValueType> extends EventEmitter {
  public static create<ValueType>(
    label: string,
    customStyle: string,
    options: Array<OptionButton<ValueType>>,
    defaultValue: ValueType,
    selectValueFn: (value: ValueType) => void,
  ): RadioOptionInput<ValueType> {
    return new RadioOptionInput(
      label,
      customStyle,
      options,
      defaultValue,
      selectValueFn,
    );
  }

  private container: HTMLDivElement;
  private value_: ValueType;
  private lastOption: OptionButton<ValueType>;

  public constructor(
    label: string,
    customStyle: string,
    private options: Array<OptionButton<ValueType>>,
    defaultValue: ValueType,
    private selectValueFn: (value: ValueType) => void,
  ) {
    super();
    let optionsListRef = new Ref<HTMLDivElement>();
    this.container = E.div(
      {
        class: "options-input",
        style: `display: flex; flex-flow: column nowrap; gap: 1rem; ${customStyle}`,
      },
      E.div(
        {
          class: "options-input-label",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(label),
      ),
      E.divRef(optionsListRef, {
        class: "options-list",
        style: `display: flex; flex-flow: row wrap; align-items: center; gap: 1.5rem;`,
      }),
    );

    for (let i = 0; i < options.length; i++) {
      let optionButton = options[i];
      optionsListRef.val.append(optionButton.body);
      optionButton.on("select", () => this.selectOption(optionButton));

      if (optionButton.value === defaultValue) {
        optionButton.select();
      } else {
        optionButton.unselect();
      }
    }
  }

  private selectOption(optionButton: OptionButton<ValueType>): void {
    if (this.lastOption) {
      this.lastOption.unselect();
    }
    this.lastOption = optionButton;
    this.value_ = optionButton.value;
    this.selectValueFn(this.value_);
  }

  public get body() {
    return this.container;
  }

  public remove(): void {
    this.container.remove();
  }

  // Visible for testing
  public get optionButtons() {
    return this.options;
  }
}
