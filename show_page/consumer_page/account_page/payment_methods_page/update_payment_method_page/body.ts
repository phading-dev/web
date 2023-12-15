import EventEmitter = require("events");
import {
  BlockingButton,
  FilledBlockingButton,
  TextBlockingButton,
} from "../../../../../common/blocking_button";
import { SCHEME } from "../../../../../common/color_scheme";
import {
  OptionButton,
  OptionInput,
} from "../../../../../common/input_form_page/option_input";
import { BASIC_INPUT_STYLE } from "../../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import { MenuItem } from "../../../../../common/menu_item/body";
import { createBackMenuItem } from "../../../../../common/menu_item/factory";
import {
  MEDIUM_CARD_STYLE,
  PAGE_STYLE,
} from "../../../../../common/page_style";
import { createCardBrandIcon } from "../common/card_brand_icons";
import { getCardBrandName } from "../common/card_brand_name";
import {
  deletePaymentMethod,
  updatePaymentMethod,
} from "@phading/billing_service_interface/client_requests";
import { UpdatePaymentMethodRequestBody } from "@phading/billing_service_interface/interface";
import { PaymentMethodMasked } from "@phading/billing_service_interface/payment_method_masked";
import { PaymentMethodPriority } from "@phading/billing_service_interface/payment_method_priority";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface UpdatePaymentMethodPage {
  on(event: "back", listener: () => void): this;
  on(event: "updateError", listener: () => void): this;
  on(event: "updated", listener: () => void): this;
  on(event: "deleteError", listener: () => void): this;
  on(event: "deleted", listener: () => void): this;
}

// Only handles card-type payment method for now.
export class UpdatePaymentMethodPage extends EventEmitter {
  private body_: HTMLDivElement;
  private expMonthInput_: HTMLInputElement;
  private expYearInput_: HTMLInputElement;
  private priorityOptionInput_: OptionInput<
    PaymentMethodPriority,
    UpdatePaymentMethodRequestBody
  >;
  private deleteButton_: BlockingButton;
  private updateButton_: BlockingButton;
  private actionError: HTMLDivElement;
  private backMenuItem_: MenuItem;
  private expMonth?: number;
  private expYear?: number;

  public constructor(
    private webServiceClient: WebServiceClient,
    private paymentMethod: PaymentMethodMasked
  ) {
    super();
    let expMonthInputRef = new Ref<HTMLInputElement>();
    let expYearInputRef = new Ref<HTMLInputElement>();
    let priorityOptionInputRef = new Ref<
      OptionInput<PaymentMethodPriority, UpdatePaymentMethodRequestBody>
    >();
    let deleteButtonRef = new Ref<BlockingButton>();
    let updateButtonRef = new Ref<BlockingButton>();
    let actionErrorRef = new Ref<HTMLDivElement>();
    this.body_ = E.div(
      {
        class: "update-payment-method",
        style: PAGE_STYLE,
      },
      E.div(
        {
          class: "update-payment-method-container",
          style: `${MEDIUM_CARD_STYLE} display: flex; flex-flow: column nowrap; gap: 2rem;`,
        },
        E.div(
          {
            class: "update-payment-method-title",
            style: `font-size: 1.6rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.updatePaymentMethodTitle)
        ),
        E.div(
          {
            class: "update-payment-method-card-info",
            style: `display: flex; flex-flow: row nowrap; gap: 1rem; align-items: center;`,
          },
          E.div(
            {
              class: "update-payment-method-card-brand-icon",
              style: `width: 5rem;`,
            },
            createCardBrandIcon(paymentMethod.card.brand)
          ),
          E.div(
            {
              class: "update-payment-method-card-brand-digits",
              style: `font-size: 1.4rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              `${getCardBrandName(paymentMethod.card.brand)} •••• ${
                paymentMethod.card.lastFourDigits
              }`
            )
          )
        ),
        E.div(
          {
            class: "update-payment-method-card-expiration-inputs",
            style: `display: flex; flex-flow: row nowrap; align-items: center; gap: .5rem;`,
          },
          E.div(
            {
              class: "update-payment-method-card-expiration-label",
              style: `font-size: 1.4rem; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.updatePaymentMethodExpiresLabel)
          ),
          E.div({
            style: `width: .5rem;`,
          }),
          E.inputRef(expMonthInputRef, {
            class: "update-payment-method-card-expiration-month-input",
            style: `${BASIC_INPUT_STYLE} width: 3rem; text-align: center; border-color: ${SCHEME.neutral1};`,
            placeholder: "MM",
          }),
          E.div(
            {
              style: `font-size: 1.4rem; color: ${SCHEME.neutral1};`,
            },
            E.text("/")
          ),
          E.inputRef(expYearInputRef, {
            class: "update-payment-method-card-expiration-year-input",
            style: `${BASIC_INPUT_STYLE} width: 6rem; text-align: center; border-color: ${SCHEME.neutral1};`,
            placeholder: "YYYY",
          })
        ),
        assign(
          priorityOptionInputRef,
          OptionInput.create(
            LOCALIZED_TEXT.cardIsSavedAsLabel,
            "",
            [
              OptionButton.create(
                LOCALIZED_TEXT.cardIsUsedAsPrimaryPaymentMethodLabel,
                PaymentMethodPriority.PRIMARY,
                ""
              ),
              OptionButton.create(
                LOCALIZED_TEXT.cardIsUsedAsBackupPaymentMethodLabel,
                PaymentMethodPriority.BACKUP,
                ""
              ),
              OptionButton.create(
                LOCALIZED_TEXT.cardIsSavedForFutureLabel,
                PaymentMethodPriority.NORMAL,
                ""
              ),
            ],
            paymentMethod.priority,
            (request, value) => {
              request.paymentMethodUpdates.priority = value;
            }
          )
        ).body,
        E.div(
          {
            class: "update-payment-method-card-buttons",
            style: `display: flex; flex-flow: row nowrap; justify-content: flex-end; gap: 2rem;`,
          },
          assign(
            deleteButtonRef,
            TextBlockingButton.create("")
              .append(E.text(LOCALIZED_TEXT.deleteButtonLabel))
              .enable()
              .show()
          ).body,
          assign(
            updateButtonRef,
            FilledBlockingButton.create("")
              .append(E.text(LOCALIZED_TEXT.updateButtonLabel))
              .enable()
              .show()
          ).body
        ),
        E.divRef(
          actionErrorRef,
          {
            class: "update-payment-method-card-error-message",
            style: `visibility: hidden; align-self: flex-end; font-size: 1.4rem; color: ${SCHEME.error0};`,
          },
          E.text("1")
        )
      )
    );
    this.expMonthInput_ = expMonthInputRef.val;
    this.expYearInput_ = expYearInputRef.val;
    this.priorityOptionInput_ = priorityOptionInputRef.val;
    this.deleteButton_ = deleteButtonRef.val;
    this.updateButton_ = updateButtonRef.val;
    this.actionError = actionErrorRef.val;

    this.backMenuItem_ = createBackMenuItem();

    this.expMonthInput_.addEventListener("input", () =>
      this.normalizeExpMonth()
    );
    this.expYearInput_.addEventListener("input", () => this.normalizeExpYear());
    this.updateButton_.on("action", () => this.updatePaymentMethod());
    this.updateButton_.on("postAction", (error) =>
      this.postUpdatePaymentMethod(error)
    );
    this.deleteButton_.on("action", () => this.deletePaymentMethod());
    this.deleteButton_.on("postAction", (error) =>
      this.postDeletePaymentMethod(error)
    );

    this.backMenuItem_.on("action", () => this.emit("back"));
  }

  private normalizeExpMonth(): void {
    let expMonth = Number.parseInt(this.expMonthInput_.value);
    if (isNaN(expMonth) || expMonth <= 0 || expMonth > 12) {
      this.expMonthInput_.value = "";
      this.expMonth = undefined;
    } else {
      this.expMonth = expMonth;
    }
  }

  private normalizeExpYear(): void {
    let expYear = Number.parseInt(this.expYearInput_.value);
    if (isNaN(expYear) || expYear <= 0) {
      this.expYearInput_.value = "";
      this.expYear = undefined;
    } else {
      this.expYear = expYear;
    }
  }

  private async updatePaymentMethod(): Promise<void> {
    this.actionError.style.visibility = "hidden";
    let request: UpdatePaymentMethodRequestBody = {
      paymentMethodUpdates: {
        id: this.paymentMethod.id,
      },
    };
    this.priorityOptionInput_.fillInRequest(request);
    if (this.expMonth && this.expYear) {
      request.paymentMethodUpdates.card = {
        expMonth: this.expMonth,
        expYear: this.expYear,
      };
    }
    await updatePaymentMethod(this.webServiceClient, request);
  }

  private postUpdatePaymentMethod(error?: Error): void {
    if (error) {
      this.actionError.textContent = LOCALIZED_TEXT.updateGenericFailure;
      this.actionError.style.visibility = "visible";
      this.emit("updateError");
    } else {
      this.emit("updated");
    }
  }

  private async deletePaymentMethod(): Promise<void> {
    this.actionError.style.visibility = "hidden";
    await deletePaymentMethod(this.webServiceClient, {
      id: this.paymentMethod.id,
    });
  }

  private postDeletePaymentMethod(error?: Error): void {
    if (error) {
      this.actionError.textContent = LOCALIZED_TEXT.deletePaymentMethodFailure;
      this.actionError.style.visibility = "visible";
      this.emit("deleteError");
    } else {
      this.emit("deleted");
    }
  }

  public get body() {
    return this.body_;
  }
  public get menuBody() {
    return this.backMenuItem_.body;
  }

  public remove(): void {
    this.body_.remove();
    this.backMenuItem_.remove();
  }

  // Visible for testing
  public get expMonthInput() {
    return this.expMonthInput_;
  }
  public get expYearInput() {
    return this.expYearInput_;
  }
  public get priorityOptionInput() {
    return this.priorityOptionInput_;
  }
  public get updateButton() {
    return this.updateButton_;
  }
  public get deleteButton() {
    return this.deleteButton_;
  }
}
