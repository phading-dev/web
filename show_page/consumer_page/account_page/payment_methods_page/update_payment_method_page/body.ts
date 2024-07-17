import EventEmitter = require("events");
import { SCHEME } from "../../../../../common/color_scheme";
import { InputFormPage } from "../../../../../common/input_form_page/body";
import {
  OptionButton,
  OptionInput,
} from "../../../../../common/input_form_page/option_input";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import { FONT_M } from "../../../../../common/sizes";
import { COMMERCE_SERVICE_CLIENT } from "../../../../../common/web_service_client";
import { createCardBrandIcon } from "../common/card_brand_icons";
import { getCardBrandName } from "../common/card_brand_name";
import { ExpMonthInput, ExpYearInput } from "./exp_date_input";
import {
  deletePaymentMethod,
  updatePaymentMethod,
} from "@phading/commerce_service_interface/consumer/frontend/client_requests";
import {
  UpdatePaymentMethodRequestBody,
  UpdatePaymentMethodResponse,
} from "@phading/commerce_service_interface/consumer/frontend/interface";
import { PaymentMethodMasked } from "@phading/commerce_service_interface/consumer/frontend/payment_method_masked";
import { PaymentMethodPriority } from "@phading/commerce_service_interface/consumer/frontend/payment_method_priority";
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
  public static create(
    paymentMethod: PaymentMethodMasked,
  ): UpdatePaymentMethodPage {
    return new UpdatePaymentMethodPage(COMMERCE_SERVICE_CLIENT, paymentMethod);
  }

  public inputFormPage: InputFormPage<
    UpdatePaymentMethodRequestBody,
    UpdatePaymentMethodResponse
  >;
  public expMonthInput = new Ref<ExpMonthInput>();
  public expYearInput = new Ref<ExpYearInput>();
  public priorityOptionInput = new Ref<
    OptionInput<PaymentMethodPriority, UpdatePaymentMethodRequestBody>
  >();

  public constructor(
    private webServiceClient: WebServiceClient,
    private paymentMethod: PaymentMethodMasked,
  ) {
    super();
    this.inputFormPage = InputFormPage.create(
      LOCALIZED_TEXT.updatePaymentMethodTitle,
      [
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
            createCardBrandIcon(paymentMethod.card.brand),
          ),
          E.div(
            {
              class: "update-payment-method-card-brand-digits",
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              `${getCardBrandName(paymentMethod.card.brand)} •••• ${
                paymentMethod.card.lastFourDigits
              }`,
            ),
          ),
        ),
        E.div(
          {
            class: "update-payment-method-card-expiration-inputs",
            style: `display: flex; flex-flow: row nowrap; align-items: center; gap: .5rem;`,
          },
          E.div(
            {
              class: "update-payment-method-card-expiration-label",
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.updatePaymentMethodExpiresLabel),
          ),
          E.div({
            style: `width: .5rem;`,
          }),
          assign(
            this.expMonthInput,
            new ExpMonthInput(paymentMethod.card.expMonth),
          ).body,
          E.div(
            {
              style: `font-size: 1.4rem; color: ${SCHEME.neutral1};`,
            },
            E.text("/"),
          ),
          assign(
            this.expYearInput,
            new ExpYearInput(paymentMethod.card.expYear),
          ).body,
        ),
        assign(
          this.priorityOptionInput,
          OptionInput.create(
            LOCALIZED_TEXT.cardIsSavedAsLabel,
            "",
            [
              OptionButton.create(
                LOCALIZED_TEXT.cardIsUsedAsPrimaryPaymentMethodLabel,
                PaymentMethodPriority.PRIMARY,
                "",
              ),
              OptionButton.create(
                LOCALIZED_TEXT.cardIsUsedAsBackupPaymentMethodLabel,
                PaymentMethodPriority.BACKUP,
                "",
              ),
              OptionButton.create(
                LOCALIZED_TEXT.cardIsSavedForFutureLabel,
                PaymentMethodPriority.NORMAL,
                "",
              ),
            ],
            paymentMethod.priority,
            (request, value) => {
              request.paymentMethodUpdates.priority = value;
            },
          ),
        ).body,
      ],
      [
        this.expMonthInput.val,
        this.expYearInput.val,
        this.priorityOptionInput.val,
      ],
      LOCALIZED_TEXT.updateButtonLabel,
      (request) => this.updatePaymentMethod(request),
      (response, error) => this.postUpdatePaymentMethod(response, error),
      {
        paymentMethodUpdates: {
          card: {},
        },
      },
    )
      .addSecondaryBlockingButton(
        LOCALIZED_TEXT.deleteButtonLabel,
        () => this.deletePaymentMethod(),
        (error) => this.postDeletePaymentMethod(error),
      )
      .addBackButton();

    this.inputFormPage.on("submitted", () => this.emit("updated"));
    this.inputFormPage.on("submitError", () => this.emit("updateError"));
    this.inputFormPage.on("secondaryActionSuccess", () => this.emit("deleted"));
    this.inputFormPage.on("secondaryActionError", () =>
      this.emit("deleteError"),
    );
    this.inputFormPage.on("back", () => this.emit("back"));
  }

  private updatePaymentMethod(
    request: UpdatePaymentMethodRequestBody,
  ): Promise<UpdatePaymentMethodResponse> {
    request.paymentMethodUpdates.paymentMethodId =
      this.paymentMethod.paymentMethodId;
    return updatePaymentMethod(this.webServiceClient, request);
  }

  private postUpdatePaymentMethod(
    response: UpdatePaymentMethodResponse,
    error?: Error,
  ): string {
    if (error) {
      return LOCALIZED_TEXT.updateGenericFailure;
    } else {
      return "";
    }
  }

  private async deletePaymentMethod(): Promise<void> {
    await deletePaymentMethod(this.webServiceClient, {
      paymentMethodId: this.paymentMethod.paymentMethodId,
    });
  }

  private postDeletePaymentMethod(error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.deletePaymentMethodFailure;
    } else {
      return "";
    }
  }

  public get body() {
    return this.inputFormPage.body;
  }

  public remove(): void {
    this.inputFormPage.remove();
  }
}
