import EventEmitter = require("events");
import { SCHEME } from "./color_scheme";
import { E, ElementAttributeMap } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export declare interface VerticalTextInputWithErrorMsg {
  on(event: "enter", listener: () => Promise<void> | void): this;
}

export class VerticalTextInputWithErrorMsg extends EventEmitter {
  public body: HTMLDivElement;
  private input: HTMLInputElement;
  private errorMsg: HTMLDivElement;

  public constructor(
    label: string,
    customStyle: string,
    otherInputAttributes: ElementAttributeMap
  ) {
    super();
    let inputRef = new Ref<HTMLInputElement>();
    let errorMsgRef = new Ref<HTMLDivElement>();
    this.body = E.div(
      {
        class: "text-input",
        style: `display: flex; flex-flow: column nowrap; ${customStyle}`,
      },
      E.div(
        {
          class: "text-input-label",
          style: `font-size: 1.4rem; line-height: 2rem; color: ${SCHEME.neutral0};`,
        },
        E.text(label)
      ),
      E.inputRef(inputRef, {
        class: "text-input-input",
        style: `padding: 0; margin: 0; outline: none; border: 0; background-color: initial; width: 100%; font-size: 1.4rem; font-family: initial; line-height: 2rem; color: ${SCHEME.neutral0}; border-bottom: .1rem solid;`,
        ...otherInputAttributes,
      }),
      E.divRef(errorMsgRef, {
        class: "text-input-error-label",
        style: `align-self: flex-end; font-size: 1.2rem; line-height: 1; height: 1.6rem; padding: .2rem 0; box-sizing: border-box; color: ${SCHEME.error0};`,
      })
    );
    this.input = inputRef.val;
    this.errorMsg = errorMsgRef.val;
    this.hideError();

    this.input.addEventListener("keydown", (event) => this.keydown(event));
  }

  public static create(
    label: string,
    customStyle: string,
    otherInputAttributes: ElementAttributeMap = {}
  ): VerticalTextInputWithErrorMsg {
    return new VerticalTextInputWithErrorMsg(
      label,
      customStyle,
      otherInputAttributes
    );
  }

  private keydown(event: KeyboardEvent): void {
    if (event.code !== "Enter") {
      return;
    }
    this.emit("enter");
  }

  public async enter(): Promise<void> {
    await Promise.all(this.listeners("enter").map((callback) => callback()));
  }

  public showError(desc: string): void {
    this.errorMsg.textContent = desc;
    this.input.style.borderColor = SCHEME.error0;
  }

  public hideError(): void {
    this.errorMsg.textContent = "";
    this.input.style.borderColor = SCHEME.neutral2;
  }

  public setValue(value: string): void {
    this.input.value = value;
  }

  public getValue(): string {
    return this.input.value;
  }
}
