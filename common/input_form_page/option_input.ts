import EventEmitter = require("events");
import { SCHEME } from "../color_scheme";
import { OptionPill, RadioOptionsGroup } from "../option_buttons";
import { FONT_M, GAP_1X, GAP_0_25X, LINE_HEIGHT_M } from "../sizes";
import { InputField } from "./input_field";
import { E } from "@selfage/element/factory";

export class RadioOptionInput<ValueType>
  extends EventEmitter
  implements InputField
{
  public body: HTMLDivElement;
  private radioOptionsGroup: RadioOptionsGroup<ValueType>;

  public constructor(
    label: string,
    customStyle: string,
    private options: Array<OptionPill<ValueType>>,
    private selectValueFn: (value: ValueType) => void,
  ) {
    super();
    this.body = E.div(
      {
        class: "options-input",
        style: `display: flex; flex-flow: column nowrap; ${customStyle}`,
      },
      E.div(
        {
          class: "options-input-label",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(label),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_0_25X}rem;`,
      }),
      E.div(
        {
          class: "options-list",
          style: `display: flex; flex-flow: row wrap; align-items: center; gap: ${GAP_1X}rem;`,
        },
        ...options.map((option) => option.body),
      ),
    );
    this.radioOptionsGroup = new RadioOptionsGroup(options).on(
      "select",
      (value) => this.selectValueFn(value),
    );
  }

  public setValue(value: ValueType): this {
    this.radioOptionsGroup.setValue(value);
    this.selectValueFn(value);
    return this;
  }

  public enable(): this {
    this.options.forEach((option) => option.enable());
    return this;
  }

  public disable(): this {
    this.options.forEach((option) => option.disable());
    return this;
  }

  public get isValid() {
    return true;
  }
}
