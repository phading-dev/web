import EventEmitter = require("events");
import { SCHEME } from "./color_scheme";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface OptionButton<ValueType> {
  on(event: "select", listener: (value: ValueType) => void): this;
}

export class OptionButton<ValueType> extends EventEmitter {
  public static create<ValueType>(
    label: string,
    value: ValueType,
    customStyle: string
  ): OptionButton<ValueType> {
    return new OptionButton(label, value, customStyle);
  }

  private container: HTMLDivElement;

  public constructor(
    label: string,
    public value: ValueType,
    customStyle: string
  ) {
    super();
    this.container = E.div(
      {
        class: "option-button",
        style: `flex: 0 0 auto; display: flex; justify-content: center; align-items: center; padding: .8rem 1.2rem; font-size: 1.4rem; border: .1rem solid; border-radius: .5rem; cursor: pointer; ${customStyle}`,
      },
      E.text(label)
    );

    this.container.addEventListener("click", () => this.select());
  }

  public get body(): HTMLDivElement {
    return this.container;
  }

  public select(): this {
    this.container.style.color = SCHEME.primary0;
    this.container.style.borderColor = SCHEME.primary1;
    this.emit("select", this.value);
    return this;
  }

  public unselect(): this {
    this.container.style.color = SCHEME.neutral0;
    this.container.style.borderColor = SCHEME.neutral1;
    return this;
  }
}

export interface OptionInput<ValueType> {
  on(event: "select", listener: (value: ValueType) => void): this;
}

export class OptionInput<ValueType> extends EventEmitter {
  public static create<ValueType>(
    label: string,
    customStyle: string,
    options: Array<OptionButton<ValueType>>,
    defaultSelected: number
  ): OptionInput<ValueType> {
    return new OptionInput(label, customStyle, options, defaultSelected);
  }

  private container: HTMLDivElement;
  private value_: ValueType;
  private lastOption: OptionButton<ValueType>;

  public constructor(
    label: string,
    customStyle: string,
    // Visible for testing
    public options: Array<OptionButton<ValueType>>,
    defaultSelected: number
  ) {
    super();
    let optionsListRef = new Ref<HTMLDivElement>();
    this.container = E.div(
      {
        class: "options-input",
        style: `display: flex; flex-flow: column nowrap; ${customStyle}`,
      },
      E.div(
        {
          class: "options-input-label",
          style: `font-size: 1.4rem; color: ${SCHEME.neutral0};`,
        },
        E.text(label)
      ),
      E.div({
        style: `height: 1rem;`,
      }),
      E.divRef(optionsListRef, {
        class: "options-list",
        style: `display: flex; flex-flow: row wrap; align-items: center; gap: 1.5rem;`,
      })
    );

    for (let i = 0; i < options.length; i++) {
      let optionButton = options[i];
      optionsListRef.val.append(optionButton.body);
      optionButton.on("select", () => this.selectOption(optionButton));

      if (i == defaultSelected) {
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
    this.emit("select", this.value_);
  }

  public get body(): HTMLDivElement {
    return this.container;
  }

  public get value(): ValueType {
    return this.value_;
  }

  public remove(): void {
    this.container.remove();
  }
}
