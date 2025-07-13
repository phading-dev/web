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
import { ENV_VARS } from "./env_vars";

function eBody(): HTMLElement {
  document.title = `Secount - Terms of Service`;
  return eDocumentPage(
    eHeader1("Secount - Terms of Service"),
    eParagraph(eBoldText("Effective Date:"), eNormalText(` July 8, 2025`)),
    eParagraph(
      eNormalText(
        `Welcome to Secount! These Terms of Service ("Terms") govern your access to and use of the Secount video streaming platform, website, and services (collectively, the "Platform") provided by Ykuyo, Inc. ("Ykuyo," "we," "us," or "our").`,
      ),
    ),
    eParagraph(
      eNormalText(
        `By creating an account, accessing, or using our Platform, you agree to be bound by these Terms, our `,
      ),
      eLink(`Privacy Policy`, "/privacy"),
      eNormalText(` and our `),
      eLink(`Copyright Policy`, "/copyright"),
      eNormalText(
        `. If you do not agree to these Terms, you may not use the Platform.`,
      ),
    ),
    eHeader2(`1. Description of Service`),
    eParagraph(
      eNormalText(
        `Secount is a video streaming platform that allows users ("Publishers") to upload video content and set an hourly rate for viewing. Other users ("Viewers") can stream this content and are charged based on the duration of their viewership.`,
      ),
    ),
    eHeader2(`2. User Accounts`),
    eUl(
      eLi(
        eBoldText(`Registration:`),
        eNormalText(
          ` You must create an account to use most features of the Platform. You agree to provide accurate, current, and complete information during the registration process. Your account may allow you to create and manage multiple profiles. Where applicable, these Terms apply to each profile.`,
        ),
      ),
      eLi(
        eBoldText(`Account Security:`),
        eNormalText(
          ` You are responsible for safeguarding your password and for all activities that occur under your account and its associated profiles. You must notify us immediately at ${ENV_VARS.supportEmail} of any unauthorized use of your account.`,
        ),
      ),
      eLi(
        eBoldText(`Eligibility:`),
        eNormalText(
          ` You must be at least 18 years of age, or at least 13 years of age and have the consent of your parent or legal guardian to use the Platform. By using the Platform, you represent and warrant that you meet this requirement.`,
        ),
      ),
    ),
    eHeader2(`3. Fees, Billing, and Payments`),
    eUl(
      eLi(
        eBoldText(`Viewing Fees:`),
        eNormalText(
          ` You agree to pay for the content you watch. Fees are calculated based on the Publisher's set hourly rate, prorated to the exact number of seconds you have watched.`,
        ),
      ),
      eLi(
        eBoldText(`Circumvention of Metering:`),
        eNormalText(
          ` Any attempt to circumvent the collection of viewing data, including but not limited to intercepting network traffic, is strictly prohibited and may result in immediate and permanent termination of your account and potential legal action.`,
        ),
      ),
      eLi(
        eBoldText(`Monthly Billing:`),
        eNormalText(
          ` All fees for a calendar month will be aggregated and charged to your payment method on file at the beginning of the following month. We use a third-party payment processor, Stripe, to handle all payments.`,
        ),
      ),
      eLi(
        eBoldText(`Payment Method:`),
        eNormalText(
          ` You authorize Ykuyo, Inc. and our third-party payment processor(s) to charge your designated payment method for all fees incurred.`,
        ),
      ),
      eLi(
        eBoldText(`Minimum Charges:`),
        eNormalText(
          ` Our payment processor may have a minimum transaction amount. If your total monthly charge is below this minimum, we may, at our discretion, carry the balance over to the next billing cycle.`,
        ),
      ),
      eLi(
        eBoldText(`No Refunds:`),
        eNormalText(` All payments are final and non-refundable.`),
      ),
      eLi(
        eBoldText(`Failed Payments:`),
        eNormalText(
          ` If your payment fails, your account will be placed in a grace period and you will be notified. If the outstanding balance is not settled within ten (10) days of the failed invoice, we reserve the right to suspend the Profile(s) that incurred the charges. We may also, at our sole discretion, suspend your entire account.`,
        ),
      ),
      eLi(
        eBoldText(`Promotional Credits:`),
        eNormalText(
          ` We may, in our sole discretion, offer promotional credits. A one-time credit may be offered when a valid payment method is added to a profile for the first time. To be eligible, the payment method must not have been previously associated with any other Secount account or profile.`,
        ),
        eUl(
          eLi(
            eBoldText(`One-Time Offer:`),
            eNormalText(` This credit may be claimed only once per profile.`),
          ),
          eLi(
            eBoldText(`No Cash Value:`),
            eNormalText(
              ` Promotional credits have no cash value, are non-transferable, and can only be used to offset Viewing Fees on the Platform.`,
            ),
          ),
          eLi(
            eBoldText(`Discretionary Offer:`),
            eNormalText(
              `  The availability and amount of any promotional credit are subject to change at any time without notice. We reserve the right to modify, suspend, or terminate this promotional offer at our sole discretion. Any unused credits will be forfeited upon account suspension or termination.`,
            ),
          ),
        ),
      ),
    ),
    eHeader2(`4. Publishers`),
    eParagraph(
      eNormalText(
        `Users who upload content ("Publishers") are also subject to our `,
      ),
      eLink(`Publisher Agreement`, "/publisher"),
      eNormalText(
        `. If you upload content to Secount, you must read and agree to the `,
      ),
      eLink(`Publisher Agreement`, "/publisher"),
      eNormalText(`, which is incorporated by reference into these Terms.`),
    ),
    eHeader2(`5. Content on Secount`),
    eUl(
      eLi(
        eBoldText(`Prohibited Content:`),
        eNormalText(` You may not upload, post, or transmit any content that:`),
        eUl(
          eLi(
            eNormalText(
              `Infringes on any third party's copyright, trademark, patent, or other intellectual property rights.`,
            ),
          ),
          eLi(
            eNormalText(
              `Is pornographic, obscene, or sexually explicit in any manner.`,
            ),
          ),
          eLi(
            eNormalText(`Is defamatory, libelous, fraudulent, or harassing.`),
          ),
          eLi(
            eNormalText(
              `Promotes illegal activities, hate speech, or discrimination.`,
            ),
          ),
        ),
      ),
      eLi(
        eBoldText(`Right to Modify Prohibited Content:`),
        eNormalText(
          ` We reserve the right to modify this list of prohibited content at any time. We will make reasonable efforts to notify users of significant changes.`,
        ),
      ),
      eLi(
        eBoldText(`Enforcement and Penalties:`),
        eNormalText(
          ` While we do not pre-screen content, we reserve the right to take action against violations of our policies. Secount provides reporting mechanisms for users to flag violating content, including the process outlined in our `,
        ),
        eLink(`Copyright policy`, "/copyright"),
        eNormalText(
          `. At our sole discretion, violations may result in actions including, but not limited to:`,
        ),
        eUl(
          eLi(eNormalText(`Removal of the offending content.`)),
          eLi(
            eNormalText(
              `Imposition of financial penalties or forfeiture of earnings associated with the violating content.`,
            ),
          ),
          eLi(
            eNormalText(
              `Temporary suspension of your account, a specific Profile, or specific privileges (like uploading).`,
            ),
          ),
          eLi(eNormalText(`Permanent termination of your account.`)),
        ),
      ),
    ),
    eHeader2(`6. Term, Suspension, and Termination`),
    eParagraph(
      eNormalText(
        `These Terms begin on the date you create your account and continue until your account is terminated by either you or us as described below.`,
      ),
    ),
    eParagraph(
      eNormalText(
        `You may terminate your agreement to these Terms at any time by requesting the deletion of your account. To do so, you must send a deletion request to ${ENV_VARS.supportEmail} from the email address associated with your account. Please note that terminating your account is an irreversible action that will result in the permanent deletion of all associated Profiles and their Content.`,
      ),
    ),
    eParagraph(
      eNormalText(
        `We may suspend or terminate your account or any Profile associated with your account at our sole discretion if:`,
      ),
    ),
    eUl(
      eLi(
        eNormalText(
          `You breach any provision of these Terms or the Publisher Agreement.`,
        ),
      ),
      eLi(
        eNormalText(
          `Your account or a Profile is associated with spam, scam, fraudulent, or illegal activities.`,
        ),
      ),
      eLi(
        eNormalText(
          `Your use of the Platform poses a security or operational risk to the Platform or to other users.`,
        ),
      ),
      eLi(eNormalText(`We are required to do so by law.`)),
    ),
    eParagraph(
      eNormalText(
        `Upon the termination of your account for any reason, your right to access and use the Platform will immediately cease. All provisions of these Terms that by their nature should survive termination shall survive, including, without limitation, accrued payment obligations, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.`,
      ),
    ),
    eHeader2(`7. Intellectual Property`),
    eUl(
      eLi(
        eBoldText(`Secount's IP:`),
        eNormalText(
          ` The Platform, including its "look and feel," trademarks, logos, and software, are the exclusive property of Ykuyo, Inc.`,
        ),
      ),
      eLi(
        eBoldText(`Publisher's IP:`),
        eNormalText(
          ` Publishers retain all ownership rights to the content they upload. By uploading content, Publishers grant us a license to distribute and display their content, as further detailed in the `,
        ),
        eLink(`Publisher Agreement`, "/publisher"),
        eNormalText(`.`),
      ),
    ),
    eHeader2(`8. Disclaimers and Limitation of Liability`),
    eParagraph(
      eNormalText(
        `THE PLATFORM IS PROVIDED "AS IS" WITHOUT ANY WARRANTIES, EXPRESS OR IMPLIED. YKUYO, INC. DISCLAIMS ALL WARRANTIES, INCLUDING THE WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.`,
      ),
    ),
    eParagraph(
      eNormalText(
        `IN NO EVENT SHALL YKUYO, INC. BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES. OUR TOTAL LIABILITY TO YOU FOR ANY AND ALL CLAIMS ARISING FROM YOUR USE OF THE PLATFORM IS LIMITED TO THE GREATER OF (A) THE TOTAL AMOUNT PAID BY YOU TO US IN THE SIX (6) MONTHS PRIOR TO THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS ($100).`,
      ),
    ),
    eHeader2(`9. Indemnification`),
    eParagraph(
      eNormalText(
        `You agree to indemnify and hold harmless Ykuyo, Inc. and its officers, directors, employees, and agents from and against any claims, disputes, demands, liabilities, damages, losses, and costs and expenses, including, without limitation, reasonable legal and accounting fees, arising out of or in any way connected with (i) your access to or use of the Platform, (ii) your User Content, or (iii) your violation of these Terms.`,
      ),
    ),
    eHeader2(`10. Third-Party Services`),
    eParagraph(
      eNormalText(
        `The Platform integrates with third-party services like Stripe for payment processing. Your use of these services is subject to their respective terms and conditions. Ykuyo, Inc. is not responsible for the performance or security of any third-party services.`,
      ),
    ),
    eHeader2(`11. Third-Party Links`),
    eParagraph(
      eNormalText(
        `The Service may contain links to third-party websites and online services that are not owned or controlled by us. Ykuyo, Inc. has no control over, and assumes no responsibility for, such websites and online services. Be aware when you leave the Service; we suggest you read the terms and privacy policy of each third-party website and online service that you visit.`,
      ),
    ),
    eHeader2(`12. Governing Law and Dispute Resolution`),
    eUl(
      eLi(
        eBoldText(`Governing Law:`),
        eNormalText(
          ` These Terms and any action related thereto will be governed by the laws of the State of Delaware, without regard to its conflict of laws provisions.`,
        ),
      ),
      eLi(
        eBoldText(`Agreement to Arbitrate:`),
        eNormalText(
          ` You and Ykuyo, Inc. agree that any dispute, claim, or controversy arising out of or relating to these Terms or the breach, termination, enforcement, interpretation, or validity thereof or the use of the Platform (collectively, "Disputes") will be settled by binding, individual arbitration and not in a class, representative, or consolidated action or proceeding.`,
        ),
      ),
      eLi(
        eBoldText(`Class Action Waiver:`),
        eNormalText(
          ` YOU AND YKUYO, INC. AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.`,
        ),
      ),
      eLi(
        eBoldText(`Arbitration Rules:`),
        eNormalText(
          ` The arbitration will be administered by the American Arbitration Association ("AAA") under its Consumer Arbitration Rules. The arbitration will be conducted in Wilmington, Delaware, unless you and Ykuyo, Inc. agree otherwise.`,
        ),
      ),
      eLi(
        eBoldText(`Opt-Out:`),
        eNormalText(
          ` You can choose to reject this Arbitration Agreement by sending us a written opt-out notice to ${ENV_VARS.legalEmail} within 30 days of first accepting these Terms.`,
        ),
      ),
    ),
    eHeader2(`13. About this Agreement`),
    eUl(
      eLi(
        eBoldText(`Entire Agreement:`),
        eNormalText(
          ` These Terms (and the Publisher Agreement and Privacy Policy, where applicable) constitute the entire and exclusive understanding and agreement between Ykuyo, Inc. and you regarding the Platform.`,
        ),
      ),
      eLi(
        eBoldText(`Changes to Terms:`),
        eNormalText(
          ` We reserve the right to modify these Terms at any time. We will provide notice of any material changes by posting the new Terms on the Platform or by sending you an email. Your continued use of the Platform after such changes constitutes your acceptance of the new Terms.`,
        ),
      ),
      eLi(
        eBoldText(`Severability:`),
        eNormalText(
          ` If it turns out that a particular term of this Agreement is not enforceable for any reason, this will not affect any other terms.`,
        ),
      ),
      eLi(
        eBoldText(`No Waiver:`),
        eNormalText(
          ` If you fail to comply with this Agreement and we do not take immediate action, this does not mean that we are giving up any rights that we may have (such as the right to take action in the future).`,
        ),
      ),
    ),
    eHeader2(`14. Contact Us`),
    eParagraph(
      eNormalText(
        `If you have any questions about these Terms, please contact us at:`,
      ),
    ),
    eParagraph(eNormalText(`Ykuyo, Inc.`)),
    eParagraph(eNormalText(`1111B S Governors Ave STE 3363`)),
    eParagraph(eNormalText(`Dover, DE 19904`)),
    eParagraph(eNormalText(`Email: ${ENV_VARS.legalEmail}`)),
  );
}

async function main() {
  normalizeBody();
  document.body.append(eBody());
}

main();
