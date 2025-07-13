import {
  eDocumentPage,
  eHeader1,
  eHeader2,
  eNormalText,
  eParagraph,
  eTable,
  eTableHeaderItem,
  eTableItem,
} from "./common/document_elements";
import {
  calculateEstimatedMoney,
  formatStoragePrice,
  formatUploadPrice,
} from "./common/formatter/price";
import { normalizeBody } from "./common/normalize_body";
import { ENV_VARS } from "./env_vars";
import { ProductID } from "@phading/price";
import { TzDate } from "@selfage/tz_date";

export function eBody(): HTMLElement {
  document.title = `Secount - Publisher Pricing`;
  let date = new Date();
  let monthStr = TzDate.fromDate(
    date,
    ENV_VARS.timezoneNegativeOffset,
  ).toLocalMonthISOString();
  let quantityHourInSeconds = 3600;
  let { amount: showAmount } = calculateEstimatedMoney(
    ProductID.SHOW,
    quantityHourInSeconds,
    monthStr,
  );
  let { amount: showCreditAmount } = calculateEstimatedMoney(
    ProductID.SHOW_CREDIT,
    quantityHourInSeconds,
    monthStr,
  );
  let percentageFormatter = new Intl.NumberFormat([navigator.language], {
    maximumFractionDigits: 2,
  });
  return eDocumentPage(
    eHeader1("Secount - Publisher Pricing"),
    eHeader2(`Revenue Share`),
    eParagraph(
      eNormalText(
        `We provide a simple, transparent revenue share. You set a pre-tax price for your content, and we retain a percentage of the gross revenue to cover transaction processing and platform operations.`,
      ),
    ),
    eTable(
      `1fr 1fr 1fr`,
      eTableHeaderItem("Product code"),
      eTableHeaderItem("Platform fee"),
      eTableHeaderItem("Net payout"),
      eTableItem(ProductID[ProductID.SHOW_CREDIT]),
      eTableItem(
        `${percentageFormatter.format((1 - showCreditAmount / showAmount) * 100)}% of Gross revenue`,
      ),
      eTableItem(
        `${percentageFormatter.format((showCreditAmount / showAmount) * 100)}% of Gross revenue`,
      ),
    ),
    eParagraph(
      eNormalText(
        `Gross revenue is the total amount paid by users for your content, excluding any applicable taxes.`,
      ),
    ),
    eHeader2(`Service Fees`),
    eParagraph(
      eNormalText(
        `In addition to the platform fee, we charge for specific service fees. These fees are deducted from your net payout. If these costs exceed your payout, the balance will be charged to your payment method on file. We will always clearly inform you of any applicable fees before you incur them.`,
      ),
    ),
    eTable(
      `1fr 2fr 1fr`,
      eTableHeaderItem("Product code"),
      eTableHeaderItem("Description"),
      eTableHeaderItem("Unit price"),
      eTableItem(ProductID[ProductID.UPLOAD]),
      eTableItem(
        "A one-time fee for successfully uploading and processing your video. No charge is applied for incomplete or failed uploads.",
      ),
      eTableItem(formatUploadPrice(date)),
      eTableItem(ProductID[ProductID.STORAGE]),
      eTableItem(
        "A monthly fee for storing your processed video files. The storage size after processing is typically slightly larger than the original file.",
      ),
      eTableItem(formatStoragePrice(date)),
      eTableItem(ProductID[ProductID.NETWORK]),
      eTableItem("Network streaming of your videos to users."),
      eTableItem("FREE"),
    ),
    eHeader2(`Price Changes`),
    eParagraph(
      eNormalText(
        `We may update our revenue share rates and service fees from time to time. We will provide you with at least 30 days' notice of any changes before they take effect.`,
      ),
    ),
  );
}

async function main() {
  normalizeBody();
  document.body.append(eBody());
}

main();
