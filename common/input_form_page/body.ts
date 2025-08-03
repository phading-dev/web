import EventEmitter = require("events");
import { SCHEME } from "..//color_scheme";
import {
  BlockingButton,
  FilledButton,
  IconButton,
  TextButton,
  createBackButton,
} from "../button";
import { ePageWithCenterForm } from "../page_elements";
import { FONT_M, GAP_2X, GAP_d_5X, LINE_HEIGHT_M, PAGE_MAX_WIDTH_M } from "../sizes";
import { InputField } from "./input_field";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export interface InputFormPage<PrimaryResponse, SecondaryResponse> {
  on(event: "back", listener: () => void): this;
  on(event: "primaryDone", listener: () => void): this;
  on(event: "secondaryDone", listener: () => void): this;
}

export class InputFormPage<
  PrimaryResponse,
  SecondaryResponse = void,
> extends EventEmitter {
  public body: HTMLDivElement;
  private card = new Ref<HTMLFormElement>();
  private buttonsContainer = new Ref<HTMLDivElement>();
  private actionError = new Ref<HTMLDivElement>();
  public primaryButton = new Ref<BlockingButton<PrimaryResponse>>();
  public backButton = new Ref<IconButton>();
  public secondaryButton = new Ref<BlockingButton<SecondaryResponse>>();
  private primaryActionFn: () => Promise<PrimaryResponse>;
  private postPrimaryActionFn: (
    error?: Error,
    response?: PrimaryResponse,
  ) => string;
  private secondaryActionFn: () => Promise<SecondaryResponse>;
  private postSecondaryActionFn: (
    error?: Error,
    response?: SecondaryResponse,
  ) => string;
  private inputs = new Set<InputField>();

  public constructor(
    options: { customPageStyle?: string; customCardStyle?: string } = {},
  ) {
    super();
    this.body = ePageWithCenterForm(
      this.card,
      options.customPageStyle ?? "",
      `max-width: ${PAGE_MAX_WIDTH_M}rem; display: flex; flex-flow: column nowrap; gap: ${GAP_2X}rem; ${options.customCardStyle ?? ""}`,
    );
  }

  public addLines(...lines: Array<HTMLElement>): this {
    this.card.val.append(...lines);
    return this;
  }

  public addButtonsContainerAndPrimaryButton(
    buttonLabel: string,
    primaryActionFn: () => Promise<PrimaryResponse>,
    postPrimaryActionFn: (error?: Error, response?: PrimaryResponse) => string,
  ): this {
    this.primaryActionFn = primaryActionFn;
    this.postPrimaryActionFn = postPrimaryActionFn;

    this.card.val.append(
      E.divRef(
        this.buttonsContainer,
        {
          class: "input-form-buttons-container",
          style: `width: 100%; display: flex; flex-flow: column nowrap; gap: ${GAP_d_5X}rem;`,
        },
        E.divRef(this.actionError, {
          class: "input-form-action-error",
          style: `display: none; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.error0}; text-align: center; align-self: center;`,
        }),
        assign(
          this.primaryButton,
          new BlockingButton<PrimaryResponse>(
            new FilledButton("width: 100%;").append(E.text(buttonLabel)),
          ),
        ).body,
      ),
    );
    this.primaryButton.val.addAction(
      () => this.primaryAction(),
      (error, response) => this.postPrimaryAction(error, response),
    );
    return this;
  }

  private primaryAction(): Promise<PrimaryResponse> {
    this.actionError.val.style.display = "none";
    this.inputs.forEach((input) => input.disable());
    return this.primaryActionFn();
  }

  private postPrimaryAction(error?: Error, response?: PrimaryResponse): void {
    if (error) {
      console.error(error);
    }
    let errorMsg = this.postPrimaryActionFn(error, response);
    if (errorMsg) {
      this.actionError.val.style.display = "block";
      this.actionError.val.textContent = errorMsg;
    }
    this.inputs.forEach((input) => input.enable());
    this.emit("primaryDone");
  }

  public addInputs(...inputs: Array<InputField>): this {
    for (let input of inputs) {
      this.inputs.add(input);
      input
        .on("refresh", () => this.refreshPrimaryButton())
        .on("action", () => this.primaryButton.val.click())
        .enable();
    }
    this.refreshPrimaryButton();
    return this;
  }

  public removeInputs(...inputs: Array<InputField>): void {
    for (let input of inputs) {
      this.inputs.delete(input);
      input.removeAllListeners();
    }
    this.refreshPrimaryButton();
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
    this.card.val.append(assign(this.backButton, createBackButton()).body);
    this.backButton.val.addAction(() => this.emit("back"));
    return this;
  }

  public addSecondaryButton(
    buttonLabel: string,
    actionFn: () => Promise<SecondaryResponse>,
    postActionFn: (error?: Error, response?: SecondaryResponse) => string,
  ): this {
    this.secondaryActionFn = actionFn;
    this.postSecondaryActionFn = postActionFn;

    this.buttonsContainer.val.append(
      assign(
        this.secondaryButton,
        new BlockingButton<SecondaryResponse>(
          new TextButton("width: 100%;").append(E.text(buttonLabel)),
        ),
      ).body,
    );
    this.secondaryButton.val.addAction(
      () => this.secondaryBlockingButtonAction(),
      (error, response) => this.postSecondaryButtonAction(error, response),
    );
    return this;
  }

  private secondaryBlockingButtonAction(): Promise<SecondaryResponse> {
    this.actionError.val.style.display = "none";
    return this.secondaryActionFn();
  }

  private postSecondaryButtonAction(
    error?: Error,
    response?: SecondaryResponse,
  ): void {
    if (error) {
      console.error(error);
    }
    let errorMsg = this.postSecondaryActionFn(error, response);
    if (errorMsg) {
      this.actionError.val.style.display = "block";
      this.actionError.val.textContent = errorMsg;
    }
    this.emit("secondaryDone");
  }

  public remove(): void {
    this.body.remove();
    this.removeAllListeners();
  }

  // For testing purposes
  public clickPrimaryButton(): void {
    this.primaryButton.val.click();
  }
  public clickSecondaryButton(): void {
    this.secondaryButton.val.click();
  }
  public clickBackButton(): void {
    this.backButton.val.click();
  }
}
