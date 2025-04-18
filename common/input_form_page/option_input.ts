import { SCHEME } from "../color_scheme";
import { OptionPill, RadioOptionPills } from "../option_pills";
import { FONT_M } from "../sizes";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export class RadioOptionInput<ValueType> {
  public static create<ValueType>(
    label: string,
    customStyle: string,
    options: Array<OptionPill<ValueType>>,
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

  public body: HTMLDivElement;
  public radioOptionPills = new Ref<RadioOptionPills<ValueType>>();

  public constructor(
    label: string,
    customStyle: string,
    options: Array<OptionPill<ValueType>>,
    defaultValue: ValueType,
    private selectValueFn: (value: ValueType) => void,
  ) {
    this.body = E.div(
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
      E.div(
        {
          class: "options-list",
          style: `display: flex; flex-flow: row wrap; align-items: center; gap: 1.5rem;`,
        },
        ...assign(this.radioOptionPills, RadioOptionPills.create(options))
          .elements,
      ),
    );
    this.radioOptionPills.val.setValue(defaultValue);
    this.selectValueFn(defaultValue);

    this.radioOptionPills.val.on("selected", (value) =>
      this.selectValueFn(value),
    );
  }
}
