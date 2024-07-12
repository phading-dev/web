import EventEmitter = require("events");
import { SCHEME } from "..//color_scheme";
import {
  BlockingButton,
  FilledBlockingButton,
  TextBlockingButton,
} from "../blocking_button";
import { IconButton, TooltipPosition } from "../icon_button";
import { createArrowIcon } from "../icons";
import { LOCALIZED_TEXT } from "../locales/localized_text";
import { PAGE_BACKGROUND_STYLE, PAGE_MEDIUM_CARD_STYLE } from "../page_style";
import { FONT_L, FONT_M, ICON_M } from "../sizes";
import { InputField } from "./input_field";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export interface InputFormPage<Request, Response> {
  on(event: "submitted", listener: () => void): this;
  on(event: "submitError", listener: () => void): this;
  on(event: "secondaryActionSuccess", listener: () => void): this;
  on(event: "secondaryActionError", listener: () => void): this;
  on(event: "back", listener: () => void): this;
}

export class InputFormPage<Request, Response> extends EventEmitter {
  public static create<Request, Response>(
    title: string,
    lines: Array<HTMLElement>,
    inputs: Array<InputField<Request>>,
    submitButtonLabel: string,
    submitRequestFn: (request: Request) => Promise<Response>,
    postSubmitFn: (response: Response, error?: Error) => string,
    initRequest: Request,
  ): InputFormPage<Request, Response> {
    return new InputFormPage(
      title,
      lines,
      inputs,
      submitButtonLabel,
      submitRequestFn,
      postSubmitFn,
      initRequest,
    );
  }

  public body: HTMLDivElement;
  private card = new Ref<HTMLFormElement>();
  private buttonsLine = new Ref<HTMLDivElement>();
  private submitButton = new Ref<BlockingButton>();
  private actionError = new Ref<HTMLDivElement>();
  private backButton = new Ref<IconButton>();
  private secondaryBlockingButton = new Ref<BlockingButton>();
  private secondaryActionCustomFn: () => Promise<void>;
  private postSecondaryActionCustomFn: (error?: Error) => string;
  private response: Response;

  public constructor(
    title: string,
    lines: Array<HTMLElement>,
    private inputs: Array<InputField<Request>>,
    submitButtonLabel: string,
    private submitRequestFn: (request: Request) => Promise<Response>,
    private postSubmitFn: (response: Response, error?: Error) => string,
    private request: Request,
  ) {
    super();
    this.body = E.div(
      {
        class: "input-form",
        style: PAGE_BACKGROUND_STYLE,
      },
      E.formRef(
        this.card,
        {
          class: "input-form-card",
          style: `${PAGE_MEDIUM_CARD_STYLE} display: flex; flex-flow: column nowrap; gap: 2rem;`,
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
            style: `display: flex; flex-flow: row-reverse nowrap; gap: 1rem;`,
          },
          assign(
            this.submitButton,
            FilledBlockingButton.create(``).append(E.text(submitButtonLabel)),
          ).body,
        ),
        E.divRef(
          this.actionError,
          {
            class: "input-form-action-error",
            style: `visibility: hidden; align-self: flex-end; font-size: ${FONT_M}rem; color: ${SCHEME.error0};`,
          },
          E.text("1"),
        ),
      ),
    );

    this.refreshSubmitButton();
    for (let input of this.inputs) {
      input.on("validated", () => this.refreshSubmitButton());
      input.on("submit", () => this.submitButton.val.click());
    }
    this.submitButton.val.on("action", () => this.submitRequest());
    this.submitButton.val.on("postAction", (error) =>
      this.postSubmitRequest(error),
    );
  }

  private async submitRequest(): Promise<void> {
    this.actionError.val.style.visibility = "hidden";
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
      this.actionError.val.style.visibility = "visible";
      this.actionError.val.textContent = errorMsg;
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
      this.submitButton.val.enable();
    } else {
      this.submitButton.val.disable();
    }
  }

  public addBackButton(): this {
    this.card.val.append(
      assign(
        this.backButton,
        IconButton.create(
          ICON_M,
          1,
          `position: absolute; top: 0; left: 0;`,
          createArrowIcon(SCHEME.neutral1),
          TooltipPosition.BOTTOM,
          LOCALIZED_TEXT.backLabel,
        ).enable(),
      ).body,
    );
    this.backButton.val.on("action", () => this.emit("back"));
    return this;
  }

  public addSecondaryBlockingButton(
    buttonLabel: string,
    actionFn: () => Promise<void>,
    postActionFn: (error?: Error) => string,
  ): this {
    this.buttonsLine.val.append(
      assign(
        this.secondaryBlockingButton,
        TextBlockingButton.create(``)
          .append(E.text(buttonLabel))
          .enable()
          .show(),
      ).body,
    );
    this.secondaryActionCustomFn = actionFn;
    this.postSecondaryActionCustomFn = postActionFn;

    this.secondaryBlockingButton.val.on("action", () =>
      this.secondaryBlockingButtonAction(),
    );
    this.secondaryBlockingButton.val.on("postAction", (error) =>
      this.postSecondaryButtonAction(error),
    );
    return this;
  }

  private async secondaryBlockingButtonAction(): Promise<void> {
    this.actionError.val.style.visibility = "hidden";
    await this.secondaryActionCustomFn();
  }

  private postSecondaryButtonAction(error?: Error): void {
    if (error) {
      console.error(error);
    }
    let errorMsg = this.postSecondaryActionCustomFn(error);
    if (errorMsg) {
      this.actionError.val.style.visibility = "visible";
      this.actionError.val.textContent = errorMsg;
      this.emit("secondaryActionError");
    } else {
      this.emit("secondaryActionSuccess");
    }
  }

  public remove(): void {
    this.body.remove();
  }

  // Visible for testing
  public submit(): void {
    this.submitButton.val.click();
  }
  public clickBackButton(): void {
    this.backButton.val.click();
  }
  public clickSecondaryBlockingButton(): void {
    this.secondaryBlockingButton.val.click();
  }
}
