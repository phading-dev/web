import EventEmitter = require("events");
import { SCHEME } from "../../../../../../common/color_scheme";
import { createArrowIcon } from "../../../../../../common/icons";
import { LOCALIZED_TEXT } from "../../../../../../common/locales/localized_text";
import { createCardBrandIcon } from "../../common/card_brand_icons";
import { getCardBrandName } from "../../common/card_brand_name";
import { CARD_BORDER_RADIUS } from "../common/styles";
import { PaymentMethodMasked } from "@phading/billing_service_interface/web/payment_method_masked";
import { PaymentMethodPriority } from "@phading/billing_service_interface/web/payment_method_priority";
import { E } from "@selfage/element/factory";

export interface CardPaymentItem {
  on(
    event: "update",
    listener: (paymentMethod: PaymentMethodMasked) => void
  ): this;
}

// A card-like UI component for card-type payment method.
export class CardPaymentItem extends EventEmitter {
  public static create(paymentMethod: PaymentMethodMasked): CardPaymentItem {
    return new CardPaymentItem(() => Date.now(), paymentMethod);
  }

  private body_: HTMLDivElement;

  public constructor(
    private getNow: () => number,
    paymentMethod: PaymentMethodMasked
  ) {
    super();
    let cardMasked = paymentMethod.card;
    // The time zone that a card expires in is not clearly documented and
    // highly depends on the processing network. Therefore the calculation here
    // uses UTC time zone as a rough estimate.
    let rightAfterExpiredMonth = Date.UTC(
      cardMasked.expYear,
      cardMasked.expMonth - 1 + 1
    );
    let isCardExpired = this.getNow() > rightAfterExpiredMonth;

    let localizedExpDate = new Intl.DateTimeFormat(navigator.language, {
      year: "2-digit",
      month: "2-digit",
    }).format(Date.UTC(cardMasked.expYear, cardMasked.expMonth - 1));

    this.body_ = E.div(
      {
        class: "card-payment-card",
        style: `display: flex; flex-flow: row nowrap; width: 100%; box-sizing: border-box; padding: 2rem; border: .1rem solid ${SCHEME.neutral1}; border-radius: ${CARD_BORDER_RADIUS};`,
      },
      E.div(
        {
          class: "card-payment-card-brand-icon",
          style: `width: 7rem;`,
        },
        createCardBrandIcon(cardMasked.brand)
      ),
      E.div({
        style: `width: 1.5rem;`,
      }),
      E.div(
        {
          class: "card-payment-card-details",
          style: `flex: 1 0 auto; display: flex; flex-flow: column nowrap; gap: 1rem;`,
        },
        E.div(
          {
            class: "card-payment-card-info-line",
            style: `display: flex; flex-flow: row nowrap; gap: 1rem;`,
          },
          E.div(
            {
              class: "card-payment-card-digits",
              style: `font-size: 1.4rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              `${getCardBrandName(cardMasked.brand)} •••• ${
                cardMasked.lastFourDigits
              }`
            )
          ),
          E.div(
            {
              class: "card-payment-card-priority",
              style: `font-size: 1.4rem; color: ${SCHEME.neutral0}; font-weight: bold;`,
            },
            E.text(this.getPrioirtyString(paymentMethod.priority))
          )
        ),
        E.div(
          {
            class: "card-payment-card-expiration",
            style: `font-size: 1.2rem; color: ${
              isCardExpired ? SCHEME.error0 : SCHEME.neutral0
            };`,
          },
          E.text(
            isCardExpired
              ? LOCALIZED_TEXT.cardExpired
              : `${LOCALIZED_TEXT.cardExpiresPartOne}${localizedExpDate}${LOCALIZED_TEXT.cardExpiresPartTwo}`
          )
        )
      ),
      E.div(
        {
          class: "card-payment-card-expansion-icon",
          style: `align-self: center; height: 1.6rem; transform: rotate(180deg);`,
        },
        createArrowIcon(SCHEME.neutral1)
      )
    );

    this.body_.addEventListener("click", () =>
      this.emit("update", paymentMethod)
    );
  }

  private getPrioirtyString(
    paymentMethodPriority: PaymentMethodPriority
  ): string {
    switch (paymentMethodPriority) {
      case PaymentMethodPriority.PRIMARY:
        return LOCALIZED_TEXT.paymentMethodPrimary;
      case PaymentMethodPriority.BACKUP:
        return LOCALIZED_TEXT.paymentMethodBackup;
      default:
        return "";
    }
  }

  public get body() {
    return this.body_;
  }

  public remove(): void {
    this.body_.remove();
  }
}
