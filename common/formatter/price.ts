import { ENV_VARS } from "../../env_vars";
import { LOCALIZED_TEXT } from "../locales/localized_text";
import { ProductID } from "@phading/price";
import { resolvePrice } from "@phading/price_config";
import { getDollarAmount } from "@phading/price_config/amount_conversion";

export function formatMoney(centAmount: number, currency: string): string {
  let formatter = new Intl.NumberFormat([navigator.language], {
    style: "currency",
    currency,
  });
  return formatter.format(getDollarAmount(centAmount, currency));
}

export function formatShowPriceShortened(
  showGrade: number,
  date: string,
): string {
  let price = resolvePrice(ProductID.SHOW, ENV_VARS.defaultCurrency, date);
  if (price.unit !== "seconds") {
    throw new Error(
      `Price for product ${ProductID.SHOW} is not in seconds, but in ${price.unit}`,
    );
  }
  return `${LOCALIZED_TEXT.pricingRateShortened[0]}${formatMoney((showGrade * price.amount * 3600) / price.divideBy, price.currency)}${LOCALIZED_TEXT.pricingRateShortened[1]}`;
}

export function formatShowPrice(showGrade: number, date: string): string {
  let price = resolvePrice(ProductID.SHOW, ENV_VARS.defaultCurrency, date);
  if (price.unit !== "seconds") {
    throw new Error(
      `Price for product ${ProductID.SHOW} is not in seconds, but in ${price.unit}`,
    );
  }
  return `${LOCALIZED_TEXT.pricingRate[0]}${formatMoney((showGrade * price.amount * 3600) / price.divideBy, price.currency)}${LOCALIZED_TEXT.pricingRate[1]}`;
}
