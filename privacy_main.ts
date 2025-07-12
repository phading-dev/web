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

export function eBody(): HTMLElement {
  document.title = `Secount - Privacy Policy`;
  return eDocumentPage(
    eHeader1(`Secount - Privacy Policy`),
    eParagraph(eBoldText(`Effective Date:`), eNormalText(` July 8, 2025`)),
    eParagraph(
      eNormalText(
        `This Privacy Policy describes how Ykuyo, Inc. ("we," "us," or "our") collects, uses, and shares information in connection with your use of our video streaming platform, Secount (the "Platform"), and any related services (collectively, the "Services").`,
      ),
    ),
    eParagraph(
      eNormalText(
        `Your privacy is important to us. By accessing or using our Services, you agree to the terms of this Privacy Policy.`,
      ),
    ),
    eHeader2(`1. Information We Collect`),
    eParagraph(
      eNormalText(
        `We collect information to provide and improve our Services. The types of information we collect depend on how you use our Platform.`,
      ),
    ),
    eHeader2(`a) Information You Provide Directly:`),
    eUl(
      eLi(
        eBoldText(`Account Information:`),
        eNormalText(
          ` When you register for a Secount account, we collect your full name, email address, and a password. You may also choose to provide custom settings, and introductions about yourself.`,
        ),
      ),
      eLi(
        eBoldText(`Publisher Content:`),
        eNormalText(
          ` When you upload content as a Publisher, we collect the video files, title, introductions, cover image, premiere time, video metadata, and hourly rate you set.`,
        ),
      ),
      eLi(
        eBoldText(`Communications:`),
        eNormalText(
          ` When you contact us for support or other inquiries, we may collect the information you provide in your communications.`,
        ),
      ),
      eLi(
        eBoldText(`User Interactions:`),
        eNormalText(
          ` We collect information you provide when you interact with the Platform, such as comments and ratings on videos.`,
        ),
      ),
    ),
    eHeader2(`b) Information Collected Automatically:`),
    eUl(
      eLi(
        eBoldText(`Usage Data:`),
        eNormalText(
          ` We automatically log your viewing history (videos watched and duration) to accurately calculate payments and payouts. We may also log your search queries and other interactions to understand usage patterns.`,
        ),
      ),
      eLi(
        eBoldText(`Device and Log Information:`),
        eNormalText(
          ` Like most online services, we automatically collect information sent by your browser or device, which may include your IP address, device type, browser type, operating system, and the date and time of your requests.`,
        ),
      ),
      eLi(
        eBoldText(`Cookies and Tracking Technologies:`),
        eNormalText(
          ` We use cookies and similar technologies to collect information about your interactions with our Platform. They are used to keep you logged in and maintain the security of your account, while helping us provide a better user experience, analyze usage patterns, and deliver personalized content.`,
        ),
      ),
    ),
    eHeader2(`c) Information Collected by Third Parties:`),
    eUl(
      eLi(
        eBoldText(`Payment and Payout Information:`),
        eNormalText(` We use `),
        eBoldText(`Stripe, Inc. ("Stripe")`),
        eNormalText(
          ` as our exclusive third-party payment processor for all financial transactions. When you enter payment information (as a Viewer) or payout information (as a Publisher), you are directed to Stripe's secure interface. Stripe collects and processes your financial data, which may include your credit card details, billing address, phone number, and bank account information. Ykuyo, Inc. does not collect, receive, or store your full sensitive financial details. We only receive a transaction confirmation or token from Stripe. We strongly encourage you to review `,
        ),
        eLink(`Stripe's Privacy Policy`, `https://stripe.com/privacy`),
        eNormalText(`.`),
      ),
    ),
    eHeader2(`2. How We Use Your Information`),
    eParagraph(
      eNormalText(
        `We use the information we collect for the following purposes:`,
      ),
    ),
    eUl(
      eLi(
        eBoldText(`To Operate the Platform:`),
        eNormalText(
          ` To authenticate users, provide access to videos, process payments and payouts, and perform all other core functions of the Services.`,
        ),
      ),
      eLi(
        eBoldText(`To Communicate with You:`),
        eNormalText(
          ` To send essential, non-promotional (transactional) emails regarding your account, such as payment and payout notifications and account suspension notices.`,
        ),
      ),
      eLi(
        eBoldText(`For Safety and Security:`),
        eNormalText(
          ` To protect our users, we use information to detect and prevent fraud, abuse, and security incidents, and to enforce our Terms of Service.`,
        ),
      ),
      eLi(
        eBoldText(`For Future Service Improvements:`),
        eNormalText(` In the future, we plan to use your information to:`),
        eUl(
          eLi(
            eNormalText(
              `Personalize your experience by providing tailored content recommendations.`,
            ),
          ),
          eLi(
            eNormalText(
              `Send you marketing communications about new features and offers. You will have a clear option to opt-out of these marketing emails.`,
            ),
          ),
        ),
      ),
    ),
    eHeader2(`3. Sharing and Disclosure of Information`),
    eParagraph(
      eNormalText(
        `We are not in the business of selling your data. We do not sell, rent, or share your personal information with third parties for their marketing purposes. We only disclose your information in the following limited circumstances:`,
      ),
    ),
    eUl(
      eLi(
        eBoldText(`Publicly on the Platform:`),
        eNormalText(
          ` The following information is visible to anyone visiting the Platform:`,
        ),
        eUl(
          eLi(eNormalText(`Your name, profile picture, and introductions.`)),
          eLi(eNormalText(`Any comments and ratings you post.`)),
          eLi(
            eNormalText(
              `Your published videos' titles, introductions, cover images, premiere times, video metadata, and hourly rates.`,
            ),
          ),
        ),
      ),
      eLi(
        eBoldText(`With Service Providers:`),
        eNormalText(
          ` We use third-party vendors to perform services on our behalf. Our primary service providers are `,
        ),
        eBoldText(`Google Cloud`),
        eNormalText(` and `),
        eBoldText(`Cloudflare`),
        eNormalText(
          `, which hosts our databases, application infrastructure, and files storage. Both Google Cloud and Cloudflare are contractually obligated to protect your data and are not permitted to use it for any other purpose.`,
        ),
      ),
      eLi(
        eBoldText(`For Legal Reasons:`),
        eNormalText(
          ` We may disclose your information if we believe in good faith that it is necessary to: (a) comply with a law, regulation, legal process, or governmental request; (b) enforce our Terms of Service; or (c) protect the rights, property, or safety of Ykuyo, Inc., our users, or the public.`,
        ),
      ),
    ),
    eHeader2(`4. Data Security and Retention`),
    eUl(
      eLi(
        eBoldText(`Security:`),
        eNormalText(
          ` We implement technical and administrative security measures to protect your information. This includes hashing user passwords and using other industry-standard security practices. However, no system is 100% secure, and we cannot guarantee the absolute security of your information.`,
        ),
      ),
      eLi(
        eBoldText(`Retention:`),
        eNormalText(
          ` If you choose to delete your account, we will permanently delete all associated personal information from our systems within 60 days. For financial auditing and legal reasons, we are required to retain a record of published videos' titles and hourly rates to correspond with our financial records.`,
        ),
      ),
    ),
    eHeader2(`5. Children's Privacy`),
    eParagraph(
      eNormalText(
        `The Platform is not intended for or directed at children under the age of 13. In some jurisdictions, this age may be higher. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information without your consent, please contact us at the address below, and we will take steps to delete such information from our systems.`,
      ),
    ),
    eHeader2(`6. International Data Transfers`),
    eParagraph(
      eNormalText(
        `Our Services are operated from the United States and are available globally. By using the Platform, you consent to your information being transferred to, stored, and processed in the United States, where data protection laws may differ from those in your country of residence.`,
      ),
    ),
    eHeader2(`7. Your Data Rights and Choices`),
    eParagraph(
      eNormalText(
        `You have the right to access and update your personal information. You can manage your account information directly through your profile settings on the Platform. If you wish to permanently delete your account and its associated personal data, you must contact us directly by sending a request to the email address: ${ENV_VARS.supportEmail}.`,
      ),
    ),
    eHeader2(`8. Disputes Involving Personal Information in Content`),
    eParagraph(
      eNormalText(
        `Secount is a platform for user-generated content. We do not screen uploaded videos for personal information. If a Publisher uploads a video that contains your personal information without your consent, any dispute must be resolved directly between you and the Publisher. Ykuyo, Inc. does not mediate these disputes.`,
      ),
    ),
    eHeader2(`9. Changes to This Privacy Policy`),
    eParagraph(
      eNormalText(
        `We may update this Privacy Policy from time to time. If we make material changes, we will notify you by email or through a notice on the Platform before the change becomes effective. Your continued use of the Services after the effective date will be subject to the new Privacy Policy.`,
      ),
    ),
    eHeader2(`10. Contact Us`),
    eParagraph(
      eNormalText(
        `If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:`,
      ),
    ),
    eParagraph(eNormalText(`Ykuyo, Inc.`)),
    eParagraph(eNormalText(`1111B S Governors Ave STE 3363`)),
    eParagraph(eNormalText(`Dover, DE 19904`)),
    eParagraph(eNormalText(`Email: ${ENV_VARS.legalEmail}`)),
  );
}

async function main(): Promise<void> {
  normalizeBody();
  document.body.append(eBody());
}

main();
