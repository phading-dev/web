import EventEmitter = require("events");
import { SCHEME } from "../../../../../common/color_scheme";
import { BASIC_INPUT_STYLE } from "../../../../../common/input_form_page/text_input";
import { NumberRange } from "../../../../../common/number_range";
import { FONT_M } from "../../../../../common/sizes";
import { Orientation, Slider } from "../../../../../common/slider";
import { INPUT_WIDTH, LABEL_STYLE } from "./styles";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export interface SilderWithTextOption {
  on(event: "update", listener: (value: number) => void): this;
}

export class SilderWithTextOption extends EventEmitter {
  public static create(
    label: string,
    numberRange: NumberRange,
    value: number,
  ): SilderWithTextOption {
    return new SilderWithTextOption(label, numberRange, value);
  }

  public body: HTMLDivElement;
  public valueInput = new Ref<HTMLInputElement>();
  public slider = new Ref<Slider>();

  public constructor(
    label: string,
    private numberRange: NumberRange,
    value: number,
  ) {
    super();
    this.body = E.div(
      { class: "slider-with-text-option" },
      E.div(
        {
          class: "slider-with-text-option-input-line",
          style: `margin-bottom: .5rem; display: flex; flex-flow: row nowrap; justify-content: space-between; align-items: center;`,
        },
        E.div(
          {
            class: "slider-with-text-option-label",
            style: LABEL_STYLE,
            title: label,
          },
          E.text(label),
        ),
        E.inputRef(this.valueInput, {
          class: "slider-with-text-option-value-input",
          style: `${BASIC_INPUT_STYLE} width: ${INPUT_WIDTH}rem; text-align: center;`,
          value: `${value}`,
        }),
      ),
      E.div(
        {
          class: "slider-with-text-option-bar-line",
          style: `display: flex; flex-flow: row nowrap; align-items: center; gap: 1rem;`,
        },
        E.div(
          {
            class: "slider-with-text-option-min-value-label",
            style: `font-size: ${FONT_M}rem; line-height: 100%; color: ${SCHEME.neutral0};`,
          },
          E.text(`${numberRange.minValue}`),
        ),
        assign(
          this.slider,
          Slider.create(
            Orientation.HORIZONTAL,
            "",
            "1rem",
            this.numberRange.minValue,
            this.numberRange.maxValue,
            "flex: 1 1 0; min-width: 0;",
            value,
          ),
        ).body,
        E.div(
          {
            class: "slider-with-text-option-min-value-label",
            style: `font-size: ${FONT_M}rem; line-height: 100%; color: ${SCHEME.neutral0};`,
          },
          E.text(`${numberRange.maxValue}`),
        ),
      ),
    );
    this.slider.val.on("change", (value) => this.changeBySlider(value));
    this.valueInput.val.addEventListener("keydown", (event) =>
      this.enter(event),
    );
    this.valueInput.val.addEventListener("blur", () => this.changeByInput());
    return this;
  }

  private changeBySlider(value: number): void {
    value = Math.round(value);
    this.valueInput.val.value = `${value}`;
    this.emit("update", value);
  }

  private enter(event: KeyboardEvent): void {
    if (event.code === "Enter") {
      this.changeByInput();
    }
  }

  private changeByInput(): void {
    let value = this.numberRange.getValidValue(
      parseInt(this.valueInput.val.value),
    );
    this.valueInput.val.value = `${value}`;
    this.slider.val.setValue(value);
    this.emit("update", value);
  }

  public reset(): number {
    this.valueInput.val.value = `${this.numberRange.defaultValue}`;
    this.slider.val.setValue(this.numberRange.defaultValue);
    return this.numberRange.defaultValue;
  }
}
