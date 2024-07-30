import EventEmitter = require("events");
import { BASIC_INPUT_STYLE } from "../../../common/input_form_page/text_input";
import { INPUT_WIDTH, LABEL_STYLE } from "./styles";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface TextOption {
  on(event: "update", listener: (value: string) => void): this;
}

export class TextOption extends EventEmitter {
  public static create(
    label: string,
    defaultValue: string,
    value: string,
  ): TextOption {
    return new TextOption(label, defaultValue, value);
  }

  public body: HTMLDivElement;
  public input = new Ref<HTMLInputElement>();

  public constructor(
    label: string,
    private defaultValue: string,
    value: string,
  ) {
    super();
    this.body = E.div(
      {
        class: "text-input-option",
        style: `display: flex; flex-flow: row nowrap; justify-content: space-between; align-items: center; gap: 1rem;`,
      },
      E.div(
        {
          class: "text-input-option-label",
          style: LABEL_STYLE,
          title: label,
        },
        E.text(label),
      ),
      E.inputRef(this.input, {
        class: "text-input-option-input",
        style: `${BASIC_INPUT_STYLE} width: ${INPUT_WIDTH}rem; text-align: center;`,
        value: value,
      }),
    );

    this.input.val.addEventListener("keydown", (event) => this.enter(event));
    this.input.val.addEventListener("blur", () => this.updateValue());
  }

  private enter(event: KeyboardEvent): void {
    if (event.code === "Enter") {
      this.updateValue();
    }
  }

  private updateValue(): void {
    if (!this.input.val.value) {
      this.input.val.value = this.defaultValue;
    }
    this.emit("update", this.input.val.value);
  }

  public reset(): string {
    this.input.val.value = this.defaultValue;
    return this.defaultValue;
  }
}
