import { SCHEME } from "../../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { FONT_M, FONT_S } from "../../../common/sizes";
import { getCardBrandName } from ".//card_brand_name";
import { createCardBrandIcon } from "./card_brand_icons";
import { PaymentMethodMasked } from "@phading/commerce_service_interface/web/payment/payment_method_masked";
import { E } from "@selfage/element/factory";

let CARD_BORDER_RADIUS = ".3rem";

// A card-like UI component for card-type payment method.
export class CardPaymentItem {
  public body: HTMLDivElement;

  public constructor(now: number, paymentMethod: PaymentMethodMasked) {
    let cardMasked = paymentMethod.card;
    // The time zone that a card expires in is not clearly documented and
    // highly depends on the processing network. Therefore the calculation here
    // uses UTC time zone as a rough estimate.
    let rightAfterExpiredMonth = Date.UTC(
      cardMasked.expYear,
      cardMasked.expMonth - 1 + 1, // expMonth -1 is the monthIndex of the exp month.
    );
    let isCardExpired = now > rightAfterExpiredMonth;

    let expMonth = new Intl.DateTimeFormat(navigator.language, {
      year: "2-digit",
      month: "2-digit",
    }).format(Date.UTC(cardMasked.expYear, cardMasked.expMonth - 1));
    this.body = E.div(
      {
        class: "card-payment-card",
        style: `display: flex; flex-flow: row nowrap; width: 100%; box-sizing: border-box; padding: 2rem; border: .1rem solid ${SCHEME.neutral1}; border-radius: ${CARD_BORDER_RADIUS};`,
      },
      E.div(
        {
          class: "card-payment-card-brand-icon",
          style: `width: 7rem;`,
        },
        createCardBrandIcon(cardMasked.brand),
      ),
      E.div({
        style: `width: 1.5rem;`,
      }),
      E.div(
        {
          class: "card-payment-card-details",
          style: `flex: 1 1 0; min-width: 0; display: flex; flex-flow: column nowrap; gap: .5rem;`,
        },
        E.div(
          {
            class: "card-payment-card-digits",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(
            `${getCardBrandName(cardMasked.brand)} •••• ${
              cardMasked.lastFourDigits
            }`,
          ),
        ),
        E.div(
          {
            class: "card-payment-card-expiration",
            style: `font-size: ${FONT_S}rem; color: ${
              isCardExpired ? SCHEME.error0 : SCHEME.neutral0
            };`,
          },
          E.text(
            isCardExpired
              ? LOCALIZED_TEXT.cardExpired
              : `${LOCALIZED_TEXT.cardExpires[0]}${expMonth}${LOCALIZED_TEXT.cardExpires[1]}`,
          ),
        ),
      ),
    );
  }
}

export class AddCardPaymentItem {
  public body: HTMLDivElement;

  public constructor() {
    this.body = E.div(
      {
        class: "card-payment-card",
        style: `display: flex; flex-flow: row nowrap; width: 100%; box-sizing: border-box; padding: 2rem; border: .1rem solid ${SCHEME.neutral1}; border-radius: ${CARD_BORDER_RADIUS};`,
      },
      E.div(
        {
          class: "card-payment-card-brand-icon",
          style: `width: 7rem;`,
        },
        createCardBrandIcon(),
      ),
      E.div({
        style: `width: 1.5rem;`,
      }),
      E.div(
        {
          class: "card-payment-card-details",
          style: `flex: 1 1 0; min-width: 0; display: flex; flex-flow: column nowrap; gap: .5rem;`,
        },
        E.div({
          class: "card-payment-card-digits",
          style: `height: 1rem; width: 10rem; background-color: ${SCHEME.neutral1}; margin: .5rem 0;`,
        }),
        E.div({
          class: "card-payment-card-expiration",
          style: `height: 1rem; width: 7rem; background-color: ${SCHEME.neutral1}; margin: .5rem 0;`,
        }),
      ),
    );
  }
}
