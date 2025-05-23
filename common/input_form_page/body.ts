import EventEmitter = require("events");
import { SCHEME } from "..//color_scheme";
import {
  BlockingButton,
  FilledBlockingButton,
  TextBlockingButton,
} from "../blocking_button";
import { SimpleIconButton, createBackButton } from "../icon_button";
import {
  PAGE_CENTER_CARD_BACKGROUND_STYLE,
  PAGE_MEDIUM_CENTER_CARD_STYLE,
} from "../page_style";
import { FONT_L, FONT_M } from "../sizes";
import { InputWithErrorMsg } from "./input_with_error_msg";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export interface InputFormPage<PrimaryResponse, SecondaryResponse> {
  on(
    event: "handlePrimarySuccess",
    listener: (response: PrimaryResponse) => void,
  ): this;
  on(event: "primaryDone", listener: () => void): this;
  on(
    event: "handleSecondarySuccess",
    listener: (response: SecondaryResponse) => void,
  ): this;
  on(event: "secondaryDone", listener: () => void): this;
  on(event: "back", listener: () => void): this;
}

export class InputFormPage<
  PrimaryResponse,
  SecondaryResponse = void,
> extends EventEmitter {
  public body: HTMLDivElement;
  private card = new Ref<HTMLFormElement>();
  private buttonsLine = new Ref<HTMLDivElement>();
  private actionError = new Ref<HTMLDivElement>();
  public primaryButton = new Ref<BlockingButton<PrimaryResponse>>();
  public backButton = new Ref<SimpleIconButton>();
  public secondaryBlockingButton = new Ref<BlockingButton<SecondaryResponse>>();
  private primaryActionFn: () => Promise<PrimaryResponse>;
  private postPrimaryActionFn: (
    response?: PrimaryResponse,
    error?: Error,
  ) => string;
  private secondaryActionFn: () => Promise<SecondaryResponse>;
  private postSecondaryActionFn: (
    response?: SecondaryResponse,
    error?: Error,
  ) => string;

  public constructor(
    title: string,
    lines: Array<HTMLElement>,
    private inputs: Array<InputWithErrorMsg>,
    primaryButtonLabel: string,
  ) {
    super();
    this.body = E.div(
      {
        class: "input-form",
        style: PAGE_CENTER_CARD_BACKGROUND_STYLE,
      },
      E.formRef(
        this.card,
        {
          class: "input-form-card",
          style: `${PAGE_MEDIUM_CENTER_CARD_STYLE} display: flex; flex-flow: column nowrap; gap: 2rem;`,
        },
        E.div(
          {
            class: "input-form-title",
            style: `align-self: center; font-size: ${FONT_L}rem; color: ${SCHEME.neutral0}; max-width: 80%;`,
          },
          E.text(title),
        ),
        ...lines,
        E.divRef(
          this.buttonsLine,
          {
            class: "input-form-buttons-line",
            style: `width: 100%; display: flex; flex-flow: row-reverse wrap; justify-content: flex-start; align-items: center; gap: 2rem;`,
          },
          assign(
            this.primaryButton,
            FilledBlockingButton.create<PrimaryResponse>().append(
              E.text(primaryButtonLabel),
            ),
          ).body,
          E.divRef(
            this.actionError,
            {
              class: "input-form-action-error",
              style: `visibility: hidden; font-size: ${FONT_M}rem; color: ${SCHEME.error0};`,
            },
            E.text("1"),
          ),
        ),
      ),
    );
    this.refreshPrimaryButton();

    for (let input of this.inputs) {
      input.on("validated", () => this.refreshPrimaryButton());
      input.on("action", () => this.primaryButton.val.click());
    }
    this.primaryButton.val.addAction(
      () => this.primaryAction(),
      (response, error) => this.postPrimaryAction(response, error),
    );
  }

  public addPrimaryAction(
    primaryActionFn: () => Promise<PrimaryResponse>,
    postPrimaryActionFn: (response?: PrimaryResponse, error?: Error) => string,
  ): this {
    this.primaryActionFn = primaryActionFn;
    this.postPrimaryActionFn = postPrimaryActionFn;
    return this;
  }

  private primaryAction(): Promise<PrimaryResponse> {
    this.actionError.val.style.visibility = "hidden";
    return this.primaryActionFn();
  }

  private postPrimaryAction(response?: PrimaryResponse, error?: Error): void {
    if (error) {
      console.error(error);
    }
    let errorMsg = this.postPrimaryActionFn(response, error);
    if (errorMsg) {
      this.actionError.val.style.visibility = "visible";
      this.actionError.val.textContent = errorMsg;
    } else {
      this.emit("handlePrimarySuccess", response);
    }
    this.emit("primaryDone");
  }

  private refreshPrimaryButton(): void {
    let allValid = true;
    for (let input of this.inputs) {
      if (!input.isValid) {
        allValid = false;
        break;
      }
    }
    if (allValid) {
      this.primaryButton.val.enable();
    } else {
      this.primaryButton.val.disable();
    }
  }

  public addBackButton(): this {
    this.card.val.append(
      assign(this.backButton, createBackButton().enable()).body,
    );
    this.backButton.val.on("action", () => this.emit("back"));
    return this;
  }

  public addSecondaryButton(
    buttonLabel: string,
    actionFn: () => Promise<SecondaryResponse>,
    postActionFn: (response?: SecondaryResponse, error?: Error) => string,
  ): this {
    this.primaryButton.val.body.after(
      assign(
        this.secondaryBlockingButton,
        TextBlockingButton.create<SecondaryResponse>()
          .append(E.text(buttonLabel))
          .enable()
          .show(),
      ).body,
    );
    this.secondaryActionFn = actionFn;
    this.postSecondaryActionFn = postActionFn;

    this.secondaryBlockingButton.val.addAction(
      () => this.secondaryBlockingButtonAction(),
      (response, error) => this.postSecondaryButtonAction(response, error),
    );
    return this;
  }

  private secondaryBlockingButtonAction(): Promise<SecondaryResponse> {
    this.actionError.val.style.visibility = "hidden";
    return this.secondaryActionFn();
  }

  private postSecondaryButtonAction(
    response?: SecondaryResponse,
    error?: Error,
  ): void {
    if (error) {
      console.error(error);
    }
    let errorMsg = this.postSecondaryActionFn(response, error);
    if (errorMsg) {
      this.actionError.val.style.visibility = "visible";
      this.actionError.val.textContent = errorMsg;
    } else {
      this.emit("handleSecondarySuccess", response);
    }
    this.emit("secondaryDone");
  }

  public remove(): void {
    this.body.remove();
  }

  // For testing purposes
  public clickPrimaryButton(): void {
    this.primaryButton.val.click();
  }
  public clickSecondaryButton(): void {
    this.secondaryBlockingButton.val.click();
  }
  public clickBackButton(): void {
    this.backButton.val.click();
  }
}
