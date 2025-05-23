import { SCHEME } from "../color_scheme";
import { COMMON_BASIC_INPUT_STYLE } from "../input_styles";
import { FONT_M } from "../sizes";
import { InputWithErrorMsg, ValidationResult } from "./input_with_error_msg";
import { E, ElementAttributeMap } from "@selfage/element/factory";

export class TextInputWithErrorMsg extends InputWithErrorMsg {
  public constructor(
    label: string,
    customStyle: string,
    otherInputAttributes: ElementAttributeMap,
    validateAndTakeFn: (
      value: string,
    ) => Promise<ValidationResult> | ValidationResult,
  ) {
    super();
    this.construct(
      (errorMsg) =>
        E.div(
          {
            class: "text-input",
            style: `display: flex; flex-flow: column nowrap; ${customStyle}`,
          },
          E.div(
            {
              class: "text-input-label",
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(label),
          ),
          E.div({
            style: `height: 1rem;`,
          }),
          E.inputRef(this.input, {
            class: "text-input-input",
            style: `${COMMON_BASIC_INPUT_STYLE} width: 100%;`,
            ...otherInputAttributes,
          }),
          E.div({
            style: `height: .5rem;`,
          }),
          errorMsg,
        ),
      validateAndTakeFn,
    );
  }
}
