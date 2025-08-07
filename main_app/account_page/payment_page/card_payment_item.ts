import { SCHEME } from "../../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import {
  BORDER_RADIUS_S,
  BORDER_WIDTH_1,
  FONT_M,
  FONT_S,
  GAP_1X,
  GAP_0_5X,
} from "../../../common/sizes";
import { getCardBrandName } from ".//card_brand_name";
import { createCardBrandIcon } from "./card_brand_icons";
import { PaymentMethodMasked } from "@phading/commerce_service_interface/web/payment/payment_method_masked";
import { E } from "@selfage/element/factory";

let CARD_ICON_WIDTH = 4.5; // rem

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
        style: `display: flex; flex-flow: row nowrap; width: 100%; box-sizing: border-box; padding: ${GAP_1X}rem; border: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral1}; border-radius: ${BORDER_RADIUS_S}rem;`,
      },
      E.div(
        {
          class: "card-payment-card-brand-icon",
          style: `flex: 0 0 auto; width: ${CARD_ICON_WIDTH}rem;`,
        },
        createCardBrandIcon(cardMasked.brand),
      ),
      E.div({
        style: `flex: 0 0 auto; width: ${GAP_1X}rem;`,
      }),
      E.div(
        {
          class: "card-payment-card-details",
          style: `flex: 1 0 0; display: flex; flex-flow: column nowrap; gap: ${GAP_0_5X}rem;`,
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
        style: `display: flex; flex-flow: row nowrap; width: 100%; box-sizing: border-box; padding: ${GAP_1X}rem; border: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral1}; border-radius: ${BORDER_RADIUS_S}rem;`,
      },
      E.div(
        {
          class: "card-payment-card-brand-icon",
          style: `flex: 0 0 auto; width: ${CARD_ICON_WIDTH}rem;`,
        },
        createCardBrandIcon(),
      ),
      E.div({
        style: `flex: 0 0 auto; width: ${GAP_1X}rem;`,
      }),
      E.div(
        {
          class: "card-payment-card-details",
          style: `flex: 1 0 0; display: flex; flex-flow: column nowrap; gap: ${GAP_0_5X}rem;`,
        },
        E.div({
          class: "card-payment-card-digits",
          style: `height: ${FONT_M}rem; width: 7rem; background-color: ${SCHEME.neutral1};`,
        }),
        E.div({
          class: "card-payment-card-expiration",
          style: `height: ${FONT_S}rem; width: 4rem; background-color: ${SCHEME.neutral1};`,
        }),
      ),
    );
  }
}
