import {
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
  document.title = `Secount - Copyright & DMCA Policy`;
  return eDocumentPage(
    eHeader1(`Copyright & DMCA Policy`),
    eParagraph(
      eNormalText(
        `Ykuyo, Inc. ("Secount," "we," "us") respects the intellectual property rights of others and expects its users to do the same. In accordance with the Digital Millennium Copyright Act of 1998, the text of which may be found on the U.S. Copyright Office website at `,
      ),
      eLink(
        `http://www.copyright.gov/legislation/dmca.pdf`,
        `http://www.copyright.gov/legislation/dmca.pdf`,
      ),
      eNormalText(
        `, we will respond expeditiously to claims of copyright infringement committed using the Secount service that are reported to our Designated Copyright Agent identified below.`,
      ),
    ),
    eHeader2(`1. Notification of Infringement (DMCA Takedown Notice)`),
    eParagraph(
      eNormalText(
        `If you are a copyright owner or are authorized to act on behalf of one, please report alleged copyright infringements taking place on or through the Platform by completing the following DMCA Notice of Alleged Infringement and delivering it to our Designated Copyright Agent.`,
      ),
    ),
    eParagraph(
      eNormalText(
        `To be effective, the notice must be in writing and include the following information:`,
      ),
    ),
    eUl(
      eLi(
        eNormalText(
          `A physical or electronic signature of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.`,
        ),
      ),
      eLi(
        eNormalText(
          `Identification of the copyrighted work claimed to have been infringed.`,
        ),
      ),
      eLi(
        eNormalText(
          `Identification of the material that is claimed to be infringing or to be the subject of infringing activity and that is to be removed or access to which is to be disabled, and information reasonably sufficient to permit us to locate the material (e.g., the URL of the video).`,
        ),
      ),
      eLi(
        eNormalText(
          `Information reasonably sufficient to permit us to contact you, such as an address, telephone number, and, if available, an email address.`,
        ),
      ),
      eLi(
        eNormalText(
          `A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.`,
        ),
      ),
      eLi(
        eNormalText(
          `A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.`,
        ),
      ),
    ),
    eParagraph(
      eNormalText(
        `Deliver this notice, with all items completed, to our Designated Copyright Agent.`,
      ),
    ),
    eHeader2(`2. Counter-Notification Procedures`),
    eParagraph(
      eNormalText(
        `If you believe that your content that was removed (or to which access was disabled) is not infringing, or that you have the authorization from the copyright owner, the copyright owner's agent, or pursuant to the law, to upload and use the content, you may send a written counter-notice containing the following information to our Designated Copyright Agent:`,
      ),
    ),
    eUl(
      eLi(eNormalText(`Your physical or electronic signature.`)),
      eLi(
        eNormalText(
          `Identification of the content that has been removed or to which access has been disabled and the location at which the content appeared before it was removed or disabled.`,
        ),
      ),
      eLi(
        eNormalText(
          `A statement under penalty of perjury that you have a good faith belief that the content was removed or disabled as a result of mistake or a misidentification of the content.`,
        ),
      ),
      eLi(
        eNormalText(
          `Your name, address, telephone number, and email address, and a statement that you consent to the jurisdiction of the federal court in Wilmington, Delaware, and a statement that you will accept service of process from the person who provided notification of the alleged infringement.`,
        ),
      ),
    ),
    eParagraph(
      eNormalText(
        `If a counter-notice is received by the Designated Copyright Agent, Secount will send a copy of the counter-notice to the original complaining party informing them that we may replace the removed content or cease disabling it in 10 business days. Unless the copyright owner files an action seeking a court order against the content provider, member or user, the removed content may be replaced, or access to it restored, in 10 to 14 business days or more after receipt of the counter-notice, at our sole discretion.`,
      ),
    ),
    eHeader2(`3. Repeat Infringer Policy`),
    eParagraph(
      eNormalText(
        `In accordance with the DMCA and other applicable law, Secount has adopted a policy of terminating, in appropriate circumstances, users who are deemed to be repeat infringers. Secount may also at its sole discretion limit access to the Platform and/or terminate the accounts of any users who infringe any intellectual property rights of others, whether or not there is any repeat infringement.`,
      ),
    ),
    eHeader2(`4. Designated Copyright Agent`),
    eParagraph(
      eNormalText(`Our Designated Copyright Agent can be contacted at:`),
    ),
    eParagraph(eNormalText(`Copyright Agent, Ykuyo, Inc.`)),
    eParagraph(eNormalText(`1111B S Governors Ave STE 3363`)),
    eParagraph(eNormalText(`Dover, DE 19904`)),
    eParagraph(eNormalText(`Email: ${ENV_VARS.copyrightEmail}`)),
  );
}

async function main(): Promise<void> {
  normalizeBody();
  document.body.append(eBody());
}

main();
