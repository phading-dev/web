import {
  eBoldText,
  eDocumentPage,
  eHeader1,
  eHeader2,
  eLi,
  eLink,
  eNormalText,
  eParagraph,
  eUl,
} from "./common/document_elements";
import { normalizeBody } from "./common/normalize_body";

export function eBody(): HTMLElement {
  document.title = `Secount - Publisher Agreement`;
  return eDocumentPage(
    eHeader1(`Secount - Publisher Agreement`),
    eParagraph(eBoldText(`Effective Date:`), eNormalText(` July 8, 2025`)),
    eParagraph(
      eNormalText(
        `This Publisher Agreement ("Agreement") is a binding legal document between you ("Publisher," "you") and Ykuyo, Inc. ("Ykuyo," "we," "us," or "our"). This Agreement governs your use of the Secount platform ("Platform") to upload, manage, and monetize your video content ("Content").`,
      ),
    ),
    eParagraph(
      eNormalText(
        `By uploading Content to the Platform, you agree to this Agreement and the Secount Terms of Service.`,
      ),
    ),
    eHeader2(`1. Relationship of Parties`),
    eParagraph(
      eNormalText(
        `You are an independent contractor of Ykuyo, Inc. This Agreement does not create an employment, partnership, or joint venture relationship between you and Ykuyo, Inc. You are solely responsible for your own business expenses and tax obligations.`,
      ),
    ),
    eHeader2(`2. Content License Grant`),
    eUl(
      eLi(
        eBoldText(`Ownership: `),
        eNormalText(`You retain full ownership of your Content.`),
      ),
      eLi(
        eBoldText(`License to Ykuyo: `),
        eNormalText(
          `By uploading Content to the Platform, you grant Ykuyo, Inc. a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, distribute, display, perform, and prepare derivative works of your Content in connection with the Platform's services. This license is for the limited purpose of operating, developing, providing, and improving the Platform, as well as for researching, developing, and marketing and promoting the Platform. This includes streaming your Content to Viewers and processing it for different devices and formats.`,
        ),
      ),
      eLi(
        eBoldText(`Termination of License: `),
        eNormalText(
          `This license ends when you or Ykuyo, Inc. remove your Content from the Platform.`,
        ),
      ),
    ),
    eHeader2(`3. Publisher Representations and Warranties`),
    eParagraph(eNormalText(`You represent and warrant that:`)),
    eUl(
      eLi(
        eNormalText(
          `You have the full legal right, power, and authority to enter into this Agreement and grant the licenses herein.`,
        ),
      ),
      eLi(
        eNormalText(
          `You are the sole owner of your Content, or you have obtained all necessary licenses, rights, consents, and permissions to publish the Content and to grant Ykuyo, Inc. the rights to it.`,
        ),
      ),
      eLi(
        eNormalText(
          `Your Content does not and will not infringe upon any third party's intellectual property rights, privacy rights, or any other legal rights.`,
        ),
      ),
      eLi(
        eNormalText(
          `Your Content complies with the Prohibited Content policy outlined in the Secount Terms of Service.`,
        ),
      ),
    ),
    eHeader2(`4. Monetization and Revenue`),
    eUl(
      eLi(
        eBoldText(`Revenue Share: `),
        eNormalText(
          `For each video you monetize on the Platform, you are entitled to a percentage of the Gross Revenue, which shall be referred to as the "Publisher Revenue Share." Gross Revenue is defined as the total fees collected from Viewers for watching your Content, excluding any applicable taxes.`,
        ),
      ),
      eLi(
        eBoldText(`Current Rates: `),
        eNormalText(
          `The specific percentage for the current Publisher Revenue Share is detailed on our `,
        ),
        eLink(`Pricing Page`, `/pricing`),
        eNormalText(
          `. This percentage is subject to change. Ykuyo, Inc. is responsible for paying all third-party transaction costs, such as payment processing fees (e.g., Stripe fees), out of the portion of the Gross Revenue it retains.`,
        ),
      ),
      eLi(
        eBoldText(`Other Fees: `),
        eNormalText(
          `You acknowledge and agree that Ykuyo, Inc. may charge separate fees for certain services, such as video storage, uploading, and processing. These fees, which are separate from the Revenue Share, will be clearly communicated to you at the time of the action and/or listed on our `,
        ),
        eLink(`Pricing Page`, `/pricing`),
        eNormalText(
          `. These fees will be deducted from your payout or charged to your payment method on file.`,
        ),
      ),
      eLi(
        eBoldText(`Price changes: `),
        eNormalText(
          `We may update our Revenue Share rates and service fees from time to time by updating our `,
        ),
        eLink(`Pricing Page`, `/pricing`),
        eNormalText(
          `. We will provide you with at least thirty (30) days' notice of any material changes, which will only apply to earnings or fees accrued after the notice period is over.`,
        ),
      ),
      eLi(
        eBoldText(`Payments Due: `),
        eNormalText(
          `In the event that your accrued Other Fees exceed your Publisher Revenue Share for any given billing period, you will have a negative balance. We will issue an invoice or charge your payment method on file for the amount due. If the payment fails or is otherwise not settled, your account will be suspended if the outstanding balance is not paid within ten (10) days of the failed payment.`,
        ),
      ),
    ),
    eHeader2(`5. Payouts`),
    eUl(
      eLi(
        eBoldText(`Payouts & Stripe Requirement: `),
        eNormalText(
          `Publisher payouts will be processed monthly. To receive a payout, you must have a valid Stripe account connected to your Secount account and be located in a country supported by Stripe for payouts.`,
        ),
      ),
      eLi(
        eBoldText(`Publisher's Responsibility: `),
        eNormalText(
          `It is your sole responsibility to maintain a valid and active payout method, to ensure your contact information is up to date, and to comply with all of Stripe's terms and policies.`,
        ),
      ),
      eLi(
        eBoldText(`Dormant Accounts and Unclaimed Property: `),
        eNormalText(
          `If your account becomes dormant and we are unable to process payouts to you for any reason (e.g., an invalid Stripe account, lack of contact), we will hold your accumulated earnings (after our fees) on your behalf. If your account remains dormant and we cannot establish contact with you for a period of time (the "Dormancy Period"), we will handle the funds in accordance with our legal obligations under applicable state unclaimed property and escheat laws. This may require us to report and remit the funds to the governing state authority. You will be notified via your last known email address before any such action is taken, as required by law. We recommend you claim all earnings within three (3) years of them being credited to your account to avoid this process.`,
        ),
      ),
      eLi(
        eBoldText(`Taxes: `),
        eNormalText(
          `You are solely responsible for calculating and paying any and all taxes owed on the income you receive from the Platform. Ykuyo, Inc. is not responsible for withholding taxes on your behalf. Our payment processor, Stripe, may provide you with tax documentation (such as a 1099 form) as required by law.`,
        ),
      ),
    ),
    eHeader2(`6. Data and Analytics`),
    eParagraph(
      eNormalText(
        `We will provide you with access to viewing data for your Content. This data will show viewing metrics with a granularity of per-video, per-day.`,
      ),
    ),
    eHeader2(`7. Term and Termination`),
    eParagraph(
      eNormalText(
        `This Agreement begins when you first upload Content to the Platform and continues until terminated. You may terminate this Agreement by removing all of your Content from the Platform. We may terminate this Agreement and remove your Content if you breach any of its terms.`,
      ),
    ),
    eParagraph(
      eNormalText(
        `Upon termination, any provisions of this Agreement that, by their nature, should survive termination shall survive, including, but not limited to, ownership provisions, indemnification obligations, warranty disclaimers, indemnity, and limitations of liability.`,
      ),
    ),
  );
}

async function main(): Promise<void> {
  normalizeBody();
  document.body.append(eBody());
}

main();
