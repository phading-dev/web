import { formatShowPrice } from "../../../../common/formatter/price";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";

export function eNewRateInputLabel(nowDate: Date): string {
  return `${LOCALIZED_TEXT.updateSeasonNewRateLabel[0]}${formatShowPrice(1, nowDate)}${LOCALIZED_TEXT.updateSeasonNewRateLabel[1]}${formatShowPrice(500, nowDate)}${LOCALIZED_TEXT.updateSeasonNewRateLabel[2]}`;
}
