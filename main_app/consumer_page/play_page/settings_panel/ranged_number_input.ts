import EventEmitter from "events";
import { SCHEME } from "../../../../common/color_scheme";
import { createMinusIcon, createPlusIcon } from "../../../../common/icons";
import { BASIC_INPUT_STYLE } from "../../../../common/input_styles";
import { NumberRange } from "../../../../common/number_range";
import { ICON_BUTTON_M, ICON_M } from "../../../../common/sizes";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface RangedNumberInput {
  on(event: "changed", listener: (value: number) => void): this;
}

export class RangedNumberInput extends EventEmitter {
  public body: HTMLDivElement;
  public minusButton = new Ref<HTMLDivElement>();
  public input = new Ref<HTMLInputElement>();
  public plusButton = new Ref<HTMLDivElement>();

  public constructor(
    private numberRange: NumberRange,
    public value: number,
    private step: number,
  ) {
    super();
    this.body = E.div(
      {
        class: "ranged-number-input",
        style: `display: flex; flex-flow: row nowrap; align-items: center; gap: .5rem;`,
      },
      E.divRef(
        this.minusButton,
        {
          class: "ranged-number-input-minus-button",
          style: `cursor: pointer; width: ${ICON_BUTTON_M}rem; height: ${ICON_BUTTON_M}rem; box-sizing: border-box; padding: ${(ICON_BUTTON_M - ICON_M) / 2}rem;`,
        },
        createMinusIcon(SCHEME.neutral1),
      ),
      E.inputRef(this.input, {
        class: "ranged-number-input-input",
        style: `${BASIC_INPUT_STYLE} width: 4rem; text-align: center;`,
        value: `${value}`,
      }),
      E.divRef(
        this.plusButton,
        {
          class: "ranged-number-input-plus-button",
          style: `cursor: pointer; width: ${ICON_BUTTON_M}rem; height: ${ICON_BUTTON_M}rem; box-sizing: border-box; padding: ${(ICON_BUTTON_M - ICON_M) / 2}rem;`,
        },
        createPlusIcon(SCHEME.neutral1),
      ),
    );
    this.minusButton.val.addEventListener("click", () => this.decrement());
    this.plusButton.val.addEventListener("click", () => this.increment());
    this.input.val.addEventListener("blur", () => this.inputValue());
    this.input.val.addEventListener("keydown", (event) =>
      this.enterValue(event),
    );
  }

  private decrement() {
    this.value = this.numberRange.getValidValue(this.value - this.step);
    this.input.val.value = `${this.value}`;
    this.emit("changed", this.value);
  }

  private increment() {
    this.value = this.numberRange.getValidValue(this.value + this.step);
    this.input.val.value = `${this.value}`;
    this.emit("changed", this.value);
  }

  private inputValue() {
    this.value = this.numberRange.getValidValue(parseInt(this.input.val.value));
    this.input.val.value = `${this.value}`;
    this.emit("changed", this.value);
  }

  private enterValue(event: KeyboardEvent): void {
    if (event.code === "Enter") {
      this.inputValue();
    }
  }

  public reset(): void {
    this.value = this.numberRange.defaultValue;
    this.input.val.value = `${this.value}`;
  }
}
