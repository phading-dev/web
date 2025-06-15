import EventEmitter = require("events");
import { SCHEME } from "../color_scheme";
import { FONT_M } from "../sizes";
import { InputField } from "./input_field";
import { E } from "@selfage/element/factory";

export class ErrorInput extends EventEmitter implements InputField {
  public body: HTMLDivElement;

  public constructor(error: string) {
    super();
    this.body = E.div(
      {
        class: "forced-invalid-input",
        style: `font-size: ${FONT_M}rem; color: ${SCHEME.error0};`,
      },
      E.text(error),
    );
  }

  public validate(): void {
    this.emit("validation");
  }

  public get isValid(): boolean {
    return false;
  }
}
