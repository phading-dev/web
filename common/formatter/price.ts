import { ENV_VARS } from "../../env_vars";
import { LOCALIZED_TEXT } from "../locales/localized_text";
import { ProductID } from "@phading/price";
import { resolvePrice } from "@phading/price_config";
import { getDollarAmount } from "@phading/price_config/amount_conversion";
import { calculateMoney } from "@phading/price_config/calculator";
import { TzDate } from "@selfage/tz_date";

// Here "dollar" means the normal currency unit, while "cent" is the sub-unit. Some currencies don't have sub-units, so we use "cent" as a generic term for the sub-unit.

export function formatMoney(amount: number, currency: string): string {
  let formatter = new Intl.NumberFormat([navigator.language], {
    style: "currency",
    currency,
    maximumFractionDigits: 3,
  });
  return formatter.format(getDollarAmount(amount, currency));
}

// As cent when the dollar amount is less than 1 dollar, otherwise as dollar.
export function formatAsCent(amount: number, currency: string): string {
  if (currency !== "USD") {
    throw new Error(
      `formatAsCent only supports USD for now, but got ${currency}.`,
    );
  }
  let dollarAmount = getDollarAmount(amount, currency);
  if (dollarAmount >= 1) {
    let formatter = new Intl.NumberFormat([navigator.language], {
      style: "currency",
      currency,
      maximumFractionDigits: 3,
    });
    return formatter.format(dollarAmount);
  } else {
    let formatter = new Intl.NumberFormat([navigator.language], {
      maximumFractionDigits: 2,
    });
    return `${formatter.format(amount)}¢`;
  }
}

export function formatShowPriceShortened(
  showGrade: number,
  date: Date,
): string {
  let month = TzDate.fromDate(
    date,
    ENV_VARS.timezoneNegativeOffset,
  ).toLocalMonthISOString();
  let price = resolvePrice(ProductID.SHOW, ENV_VARS.defaultCurrency, month);
  let quantityHourInSeconds = 3600;
  let amount =
    (showGrade * price.amount * quantityHourInSeconds) / price.divideBy;
  return `${LOCALIZED_TEXT.pricingHourRateShortened[0]}${formatAsCent(amount, price.currency)}${LOCALIZED_TEXT.pricingHourRateShortened[1]}`;
}

export function formatShowPrice(showGrade: number, date: Date): string {
  let month = TzDate.fromDate(
    date,
    ENV_VARS.timezoneNegativeOffset,
  ).toLocalMonthISOString();
  let price = resolvePrice(ProductID.SHOW, ENV_VARS.defaultCurrency, month);
  let quantityHourInSeconds = 3600;
  let amount =
    (showGrade * price.amount * quantityHourInSeconds) / price.divideBy;
  return `${LOCALIZED_TEXT.pricingHourRate[0]}${formatAsCent(amount, price.currency)}${LOCALIZED_TEXT.pricingHourRate[1]}`;
}

export function calculateShowMoneyAndFormat(
  showGrade: number,
  seconds: number,
  date: Date,
): string {
  let month = TzDate.fromDate(
    date,
    ENV_VARS.timezoneNegativeOffset,
  ).toLocalMonthISOString();
  let { amount, price } = calculateMoney(
    ProductID.SHOW,
    ENV_VARS.defaultCurrency,
    month,
    showGrade * seconds,
  );
  return formatMoney(amount, price.currency);
}

export function formatStoragePrice(date: Date): string {
  let month = TzDate.fromDate(
    date,
    ENV_VARS.timezoneNegativeOffset,
  ).toLocalMonthISOString();
  let price = resolvePrice(ProductID.STORAGE, ENV_VARS.defaultCurrency, month);
  let quantityGiBMonthInMiBHour = 1024 * 30 * 24;
  return `${LOCALIZED_TEXT.pricingGiBMonthRate[0]}${formatMoney((price.amount * quantityGiBMonthInMiBHour) / price.divideBy, price.currency)}${LOCALIZED_TEXT.pricingGiBMonthRate[1]}`;
}

export function formatStorageEstimatedPrice(mibs: number, date: Date): string {
  let month = TzDate.fromDate(
    date,
    ENV_VARS.timezoneNegativeOffset,
  ).toLocalMonthISOString();
  let price = resolvePrice(ProductID.STORAGE, ENV_VARS.defaultCurrency, month);
  let quantityMonthInMiBHour = mibs * 30 * 24;
  return `${LOCALIZED_TEXT.pricingMonthRate[0]}${formatMoney((price.amount * quantityMonthInMiBHour) / price.divideBy, price.currency)}${LOCALIZED_TEXT.pricingMonthRate[1]}`;
}

export function formatUploadPrice(date: Date): string {
  let month = TzDate.fromDate(
    date,
    ENV_VARS.timezoneNegativeOffset,
  ).toLocalMonthISOString();
  let price = resolvePrice(ProductID.UPLOAD, ENV_VARS.defaultCurrency, month);
  let quantityGiBInMiB = 1024;
  return `${LOCALIZED_TEXT.pricingGiBRate[0]}${formatMoney((price.amount * quantityGiBInMiB) / price.divideBy, price.currency)}${LOCALIZED_TEXT.pricingGiBRate[1]}`;
}
