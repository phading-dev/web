import { ENV_VARS } from "../../env_vars";
import { LOCALIZED_TEXT } from "../locales/localized_text";
import { Price, ProductID } from "@phading/price";
import { resolvePrice } from "@phading/price_config";
import { getDollarAmount } from "@phading/price_config/amount_conversion";
import { TzDate } from "@selfage/tz_date";

// Here "dollar" means the normal currency unit, while "cent" is the sub-unit. Some currencies don't have sub-units, so we use "cent" as a generic term for the sub-unit.

export function formatMoney(amount: number, currency: string): string {
  let formatter = new Intl.NumberFormat([navigator.language], {
    style: "currency",
    currency,
    maximumFractionDigits: 4,
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
      maximumFractionDigits: 4,
    });
    return formatter.format(dollarAmount);
  } else {
    let formatter = new Intl.NumberFormat([navigator.language], {
      maximumFractionDigits: 2,
    });
    return `${formatter.format(amount)}¢`;
  }
}

// No rounding, comparing to calculateMoney in "@phading/price_config/calculator". Rounding will be done in the formatter.
export function calculateEstimatedMoney(
  productId: ProductID,
  quantity: number,
  monthStr: string,
): {
  amount: number;
  price: Price;
} {
  let price = resolvePrice(productId, ENV_VARS.defaultCurrency, monthStr);
  return {
    amount: (price.amount * quantity) / price.divideBy,
    price,
  };
}

export function formatShowPriceShortened(
  showGrade: number,
  date: Date,
): string {
  let month = TzDate.fromDate(
    date,
    ENV_VARS.timezoneNegativeOffset,
  ).toLocalMonthISOString();
  let quantityHourInSeconds = 3600;
  let { amount, price } = calculateEstimatedMoney(
    ProductID.SHOW,
    showGrade * quantityHourInSeconds,
    month,
  );
  return `${LOCALIZED_TEXT.pricingHourRateShortened[0]}${formatAsCent(amount, price.currency)}${LOCALIZED_TEXT.pricingHourRateShortened[1]}`;
}

export function formatShowPrice(showGrade: number, date: Date): string {
  let month = TzDate.fromDate(
    date,
    ENV_VARS.timezoneNegativeOffset,
  ).toLocalMonthISOString();
  let quantityHourInSeconds = 3600;
  let { amount, price } = calculateEstimatedMoney(
    ProductID.SHOW,
    showGrade * quantityHourInSeconds,
    month,
  );
  return `${LOCALIZED_TEXT.pricingHourRate[0]}${formatAsCent(amount, price.currency)}${LOCALIZED_TEXT.pricingHourRate[1]}`;
}

export function calculateEstimatedShowMoneyAndFormat(
  showGrade: number,
  seconds: number,
  date: Date,
): string {
  let month = TzDate.fromDate(
    date,
    ENV_VARS.timezoneNegativeOffset,
  ).toLocalMonthISOString();
  let { amount, price } = calculateEstimatedMoney(
    ProductID.SHOW,
    showGrade * seconds,
    month,
  );
  return formatMoney(amount, price.currency);
}

export function formatStoragePrice(date: Date): string {
  let month = TzDate.fromDate(
    date,
    ENV_VARS.timezoneNegativeOffset,
  ).toLocalMonthISOString();
  let quantityGiBMonthInMiBHour = 1024 * 30 * 24;
  let { amount, price } = calculateEstimatedMoney(
    ProductID.STORAGE,
    quantityGiBMonthInMiBHour,
    month,
  );
  return `${LOCALIZED_TEXT.pricingGiBMonthRate[0]}${formatMoney(amount, price.currency)}${LOCALIZED_TEXT.pricingGiBMonthRate[1]}`;
}

export function formatStorageEstimatedMonthlyPrice(
  bytes: number,
  date: Date,
): string {
  let month = TzDate.fromDate(
    date,
    ENV_VARS.timezoneNegativeOffset,
  ).toLocalMonthISOString();
  let quantityMonthInMiBHour = (bytes / 1024 / 1024) * 30 * 24;
  let { amount, price } = calculateEstimatedMoney(
    ProductID.STORAGE,
    quantityMonthInMiBHour,
    month,
  );
  return `${LOCALIZED_TEXT.pricingMonthRate[0]}${formatMoney(amount, price.currency)}${LOCALIZED_TEXT.pricingMonthRate[1]}`;
}

export function formatUploadPrice(date: Date): string {
  let month = TzDate.fromDate(
    date,
    ENV_VARS.timezoneNegativeOffset,
  ).toLocalMonthISOString();
  let quantityGiBInMiB = 1024;
  let { amount, price } = calculateEstimatedMoney(
    ProductID.UPLOAD,
    quantityGiBInMiB,
    month,
  );
  return `${LOCALIZED_TEXT.pricingGiBRate[0]}${formatMoney(amount, price.currency)}${LOCALIZED_TEXT.pricingGiBRate[1]}`;
}

export function calculateEstimatedUploadMoneyAndFormat(
  bytes: number,
  date: Date,
): string {
  let month = TzDate.fromDate(
    date,
    ENV_VARS.timezoneNegativeOffset,
  ).toLocalMonthISOString();
  let { amount, price } = calculateEstimatedMoney(
    ProductID.UPLOAD,
    bytes / 1024 / 1024,
    month,
  );
  return formatMoney(amount, price.currency);
}
