import { ENV_VARS } from "../../env_vars";
import { ProductID } from "@phading/price";
import { resolvePrice } from "@phading/price_config";
import { CURRENCY_TO_CENTS } from "@phading/price_config/amount_conversion";
import { LOCALIZED_TEXT } from "../locales/localized_text";

let CURRENCY_FORMATTER = new Intl.NumberFormat([navigator.language], {
  style: "currency",
  currency: ENV_VARS.defaultCurrency,
});

let DOLLAR_TO_CENTS = CURRENCY_TO_CENTS.get(ENV_VARS.defaultCurrency);

let SHOW_PRICE = resolvePrice(
  ProductID.SHOW,
  ENV_VARS.defaultCurrency,
  "2020-01-01", // This price is supposed to be constant.
);

export function formatShowPriceShortened(showGrade: number): string {
  return `${LOCALIZED_TEXT.pricingRateShortened[0]}${CURRENCY_FORMATTER.format(
    (showGrade * SHOW_PRICE.amount * 3600 / SHOW_PRICE.divideBy) / DOLLAR_TO_CENTS,
  )}${LOCALIZED_TEXT.pricingRateShortened[1]}`;
}

export function formatShowPrice(showGrade: number): string {
  return `${LOCALIZED_TEXT.pricingRate[0]}${CURRENCY_FORMATTER.format(
    (showGrade * SHOW_PRICE.amount * 3600 / SHOW_PRICE.divideBy) / DOLLAR_TO_CENTS,
  )}${LOCALIZED_TEXT.pricingRate[1]}`;
}

function assertAssumption() {
  if (SHOW_PRICE === undefined) {
    throw new Error(
      `Price for product ${ProductID.SHOW} not found in currency ${ENV_VARS.defaultCurrency}`,
    );
  }
  if (SHOW_PRICE.unit !== "seconds") {
    throw new Error(
      `Price for product ${ProductID.SHOW} is not in seconds, but in ${SHOW_PRICE.unit}`,
    );
  }
  if (DOLLAR_TO_CENTS === undefined) {
    throw new Error(
      `Dollar to cents conversion for currency ${ENV_VARS.defaultCurrency} not found`,
    );
  }
}

assertAssumption();
