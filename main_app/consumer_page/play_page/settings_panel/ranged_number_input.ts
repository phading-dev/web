import EventEmitter from "events";
import { IconButton } from "../../../../common/button";
import { SCHEME } from "../../../../common/color_scheme";
import { createMinusIcon, createPlusIcon } from "../../../../common/icons";
import { COMMON_BASIC_INPUT_WITHOUT_PADDING_STYLE } from "../../../../common/input_styles";
import { NumberRange } from "../../../../common/number_range";
import {
  BORDER_RADIUS_S,
  BORDER_WIDTH_1,
  ICON_BUTTON_M,
  ICON_M,
} from "../../../../common/sizes";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export interface RangedNumberInput {
  on(event: "changed", listener: (value: number) => void): this;
}

export class RangedNumberInput extends EventEmitter {
  public body: HTMLDivElement;
  public minusButton = new Ref<IconButton>();
  public input = new Ref<HTMLInputElement>();
  public plusButton = new Ref<IconButton>();

  public constructor(
    private numberRange: NumberRange,
    public value: number,
    private step: number,
  ) {
    super();
    this.body = E.div(
      {
        class: "ranged-number-input",
        style: `border: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral1}; border-radius: ${BORDER_RADIUS_S}rem; display: flex; flex-flow: row nowrap; align-items: center;`,
      },
      assign(
        this.minusButton,
        new IconButton(ICON_BUTTON_M, ICON_M, createMinusIcon("currentColor")),
      ).body,
      E.inputRef(this.input, {
        class: "ranged-number-input-input",
        style: `${COMMON_BASIC_INPUT_WITHOUT_PADDING_STYLE} width: 3rem; text-align: center;`,
        value: `${value}`,
      }),
      assign(
        this.plusButton,
        new IconButton(ICON_BUTTON_M, ICON_M, createPlusIcon("currentColor")),
      ).body,
    );
    this.refreshButtons();
    this.minusButton.val.addAction(() => this.decrement());
    this.plusButton.val.addAction(() => this.increment());
    this.input.val.addEventListener("blur", () => this.inputValue());
    this.input.val.addEventListener("keydown", (event) =>
      this.enterValue(event),
    );
  }

  private decrement() {
    this.value = this.numberRange.getValidValue(this.value - this.step);
    this.input.val.value = `${this.value}`;
    this.refreshButtons();
    this.emit("changed", this.value);
  }

  private increment() {
    this.value = this.numberRange.getValidValue(this.value + this.step);
    this.input.val.value = `${this.value}`;
    this.refreshButtons();
    this.emit("changed", this.value);
  }

  private inputValue() {
    this.value = this.numberRange.getValidValue(parseInt(this.input.val.value));
    this.input.val.value = `${this.value}`;
    this.refreshButtons();
    this.emit("changed", this.value);
  }

  private enterValue(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      this.inputValue();
    }
  }

  private refreshButtons() {
    if (this.value <= this.numberRange.minValue) {
      this.minusButton.val.disable();
    } else {
      this.minusButton.val.enable();
    }
    if (this.value >= this.numberRange.maxValue) {
      this.plusButton.val.disable();
    } else {
      this.plusButton.val.enable();
    }
  }

  public reset(): void {
    this.value = this.numberRange.defaultValue;
    this.input.val.value = `${this.value}`;
  }
}
