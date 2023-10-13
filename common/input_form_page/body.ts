import EventEmitter = require("events");
import { SCHEME } from "..//color_scheme";
import { FilledBlockingButton } from "../blocking_button";
import { LOCALIZED_TEXT } from "../locales/localized_text";
import { MEDIUM_CARD_STYLE, PAGE_STYLE } from "../page_style";
import { VerticalTextInputWithErrorMsg } from "../text_input";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export interface InputFormPage<Request, Response> {
  on(event: "submitted", listener: () => void): this;
  on(event: "submitError", listener: () => void): this;
}

export class InputFormPage<Request, Response> extends EventEmitter {
  public static create<Request, Response>(
    title: string,
    inputs: Array<VerticalTextInputWithErrorMsg<Request>>,
    submitRequestFn: (request: Request) => Promise<Response>,
    getSubmitErrorMsgFn: (response: Response, error?: Error) => string,
    initRequest: Request
  ): InputFormPage<Request, Response> {
    return new InputFormPage(
      title,
      inputs,
      initRequest,
      submitRequestFn,
      getSubmitErrorMsgFn
    );
  }

  private container: HTMLDivElement;
  private submitButton: FilledBlockingButton;
  private submitError: HTMLDivElement;
  private response: Response;

  public constructor(
    title: string,
    private inputs: Array<VerticalTextInputWithErrorMsg<Request>>,
    private request: Request,
    private submitRequestFn: (request: Request) => Promise<Response>,
    private getSubmitErrorMsgFn: (response: Response, error?: Error) => string
  ) {
    super();
    let submitButtonRef = new Ref<FilledBlockingButton>();
    let submitErrorRef = new Ref<HTMLDivElement>();
    this.container = E.div(
      {
        class: "input-form-page",
        style: PAGE_STYLE,
      },
      E.div(
        {
          class: "input-form-card",
          style: `${MEDIUM_CARD_STYLE} display: flex; flex-flow: column nowrap; gap: 2rem;`,
        },
        E.div(
          {
            class: "input-form-title",
            style: `font-size: 1.6rem; color: ${SCHEME.neutral0};`,
          },
          E.text(title)
        ),
        ...inputs.map((input) => input.body),
        assign(
          submitButtonRef,
          FilledBlockingButton.create(
            `align-self: flex-end;`,
            E.text(LOCALIZED_TEXT.updateButtonLabel)
          )
        ).body,
        E.divRef(
          submitErrorRef,
          {
            class: "input-form-submit-error",
            style: `visibility: hidden; align-self: flex-end; font-size: 1.4rem; color: ${SCHEME.error0};`,
          },
          E.text("1")
        )
      )
    );
    this.submitButton = submitButtonRef.val;
    this.submitError = submitErrorRef.val;

    this.refreshSubmitButton();
    for (let input of this.inputs) {
      input.on("validated", () => this.refreshSubmitButton());
      input.on("submit", () => this.submitButton.click());
    }
    this.submitButton.on("action", () => this.submitRequest());
    this.submitButton.on("postAction", (error) =>
      this.postSubmitRequest(this.response, error)
    );
  }

  private async submitRequest(): Promise<void> {
    this.submitError.style.visibility = "hidden";
    for (let input of this.inputs) {
      input.fillInRequest(this.request);
    }
    this.response = await this.submitRequestFn(this.request);
  }

  private postSubmitRequest(response: Response, error?: Error): void {
    if (error) {
      console.error(error);
    }
    let errorMsg = this.getSubmitErrorMsgFn(this.response, error);
    if (errorMsg) {
      this.submitError.style.visibility = "visible";
      this.submitError.textContent = errorMsg;
      this.emit("submitError");
    } else {
      this.emit("submitted");
    }
  }

  private refreshSubmitButton(): void {
    let allValid = true;
    for (let input of this.inputs) {
      if (!input.isValid) {
        allValid = false;
        break;
      }
    }
    if (allValid) {
      this.submitButton.enable();
    } else {
      this.submitButton.disable();
    }
  }

  public get body(): HTMLDivElement {
    return this.container;
  }

  public remove(): void {
    this.container.remove();
  }

  // Visible for testing
  public submit(): void {
    this.submitButton.click();
  }
}
