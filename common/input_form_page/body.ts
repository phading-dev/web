import EventEmitter = require("events");
import { SCHEME } from "..//color_scheme";
import {
  BlockingButton,
  FilledBlockingButton,
  TextBlockingButton,
} from "../blocking_button";
import { MEDIUM_CARD_STYLE, PAGE_STYLE } from "../page_style";
import { FONT_L, FONT_M } from "../sizes";
import { InputField } from "./input_field";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export interface InputFormPage<Request, Response> {
  on(event: "submitted", listener: () => void): this;
  on(event: "submitError", listener: () => void): this;
  on(event: "secondaryActionSuccess", listener: () => void): this;
  on(event: "secondaryActionError", listener: () => void): this;
}

export class InputFormPage<Request, Response> extends EventEmitter {
  public static create<Request, Response>(
    title: string,
    lines: Array<HTMLElement>,
    inputs: Array<InputField<Request>>,
    submitButtonLabel: string,
    submitRequestFn: (request: Request) => Promise<Response>,
    postSubmitFn: (response: Response, error?: Error) => string,
    initRequest: Request
  ): InputFormPage<Request, Response> {
    return new InputFormPage(
      title,
      lines,
      inputs,
      submitButtonLabel,
      submitRequestFn,
      postSubmitFn,
      initRequest
    );
  }

  private body_: HTMLDivElement;
  private buttonsLine: HTMLDivElement;
  private submitButton: BlockingButton;
  private secondaryButton: BlockingButton;
  private secondaryActionCustomFn: () => Promise<void>;
  private postSecondaryActionCustomFn: (error?: Error) => string;
  private actionError: HTMLDivElement;
  private response: Response;

  public constructor(
    title: string,
    lines: Array<HTMLElement>,
    private inputs: Array<InputField<Request>>,
    submitButtonLabel: string,
    private submitRequestFn: (request: Request) => Promise<Response>,
    private postSubmitFn: (response: Response, error?: Error) => string,
    private request: Request
  ) {
    super();
    let buttonsLineRef = new Ref<HTMLDivElement>();
    let submitButtonRef = new Ref<BlockingButton>();
    let actionErrorRef = new Ref<HTMLDivElement>();
    this.body_ = E.div(
      {
        class: "input-form",
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
            style: `align-self: center; font-size: ${FONT_L}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(title)
        ),
        ...lines,
        E.divRef(
          buttonsLineRef,
          {
            class: "input-form-buttons-line",
            style: `display: flex; flex-flow: row-reverse nowrap; gap: 1rem;`,
          },
          assign(
            submitButtonRef,
            FilledBlockingButton.create(``).append(E.text(submitButtonLabel))
          ).body
        ),
        E.divRef(
          actionErrorRef,
          {
            class: "input-form-action-error",
            style: `visibility: hidden; align-self: flex-end; font-size: ${FONT_M}rem; color: ${SCHEME.error0};`,
          },
          E.text("1")
        )
      )
    );
    this.buttonsLine = buttonsLineRef.val;
    this.submitButton = submitButtonRef.val;
    this.actionError = actionErrorRef.val;

    this.refreshSubmitButton();
    for (let input of this.inputs) {
      input.on("validated", () => this.refreshSubmitButton());
      input.on("submit", () => this.submitButton.click());
    }
    this.submitButton.on("action", () => this.submitRequest());
    this.submitButton.on("postAction", (error) =>
      this.postSubmitRequest(error)
    );
  }

  private async submitRequest(): Promise<void> {
    this.actionError.style.visibility = "hidden";
    for (let input of this.inputs) {
      input.fillInRequest(this.request);
    }
    this.response = await this.submitRequestFn(this.request);
  }

  private postSubmitRequest(error?: Error): void {
    if (error) {
      console.error(error);
    }
    let errorMsg = this.postSubmitFn(this.response, error);
    if (errorMsg) {
      this.actionError.style.visibility = "visible";
      this.actionError.textContent = errorMsg;
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

  public addSecondaryButton(
    buttonLabel: string,
    actionFn: () => Promise<void>,
    postActionFn: (error?: Error) => string
  ): this {
    let secondaryButtonRef = new Ref<BlockingButton>();
    this.buttonsLine.append(
      assign(
        secondaryButtonRef,
        TextBlockingButton.create(``)
          .append(E.text(buttonLabel))
          .enable()
          .show()
      ).body
    );
    this.secondaryButton = secondaryButtonRef.val;
    this.secondaryActionCustomFn = actionFn;
    this.postSecondaryActionCustomFn = postActionFn;

    this.secondaryButton.on("action", () => this.secondaryButtonAction());
    this.secondaryButton.on("postAction", (error) =>
      this.postSecondaryButtonAction(error)
    );
    return this;
  }

  private async secondaryButtonAction(): Promise<void> {
    this.actionError.style.visibility = "hidden";
    await this.secondaryActionCustomFn();
  }

  private postSecondaryButtonAction(error?: Error): void {
    if (error) {
      console.error(error);
    }
    let errorMsg = this.postSecondaryActionCustomFn(error);
    if (errorMsg) {
      this.actionError.style.visibility = "visible";
      this.actionError.textContent = errorMsg;
      this.emit("secondaryActionError");
    } else {
      this.emit("secondaryActionSuccess");
    }
  }

  public get body() {
    return this.body_;
  }

  public remove(): void {
    this.body_.remove();
  }

  // Visible for testing
  public submit(): void {
    this.submitButton.click();
  }
  public clickSecondaryButton(): void {
    this.secondaryButton.click();
  }
}
