import EventEmitter = require("events");
import { Button, FilledButton } from "../common/button";
import { SCHEME } from "../common/color_scheme";
import {
  createCheckmarkInACircleIcon,
  createExclamationMarkInACycle,
} from "../common/icons";
import { LOCAL_SESSION_STORAGE } from "../common/local_session_storage";
import { LOCALIZED_TEXT } from "../common/locales/localized_text";
import { eFormTitle, ePageWithCenterForm } from "../common/page_elements";
import {
  FONT_M,
  GAP_1X,
  GAP_2X,
  ICON_XXL,
  LINE_HEIGHT_M,
  PAGE_MAX_WIDTH_M,
} from "../common/sizes";
import { SERVICE_CLIENT } from "../common/web_service_client";
import { newVerifyEmailAndSignInRequest } from "@phading/user_service_interface/web/self/client";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { LocalSessionStorage } from "@selfage/web_service_client/local_session_storage";

export interface VerifyEmailPage {
  on(event: "home", listener: () => void): this;
  on(event: "verified", listener: () => void): this;
}

export class VerifyEmailPage extends EventEmitter {
  public static create(tokenId: string): VerifyEmailPage {
    return new VerifyEmailPage(LOCAL_SESSION_STORAGE, SERVICE_CLIENT, tokenId);
  }

  public body: HTMLDivElement;
  private card = new Ref<HTMLFormElement>();
  public homeButton = new Ref<Button>();
  private removed = false;

  public constructor(
    private localSessionStorage: LocalSessionStorage,
    private serviceClient: WebServiceClient,
    public tokenId: string,
  ) {
    super();
    this.body = ePageWithCenterForm(
      this.card,
      "",
      `max-width: ${PAGE_MAX_WIDTH_M}rem; display: flex; flex-flow: column nowrap; align-items: center;`,
    );
    this.verify();
  }

  private async verify(): Promise<void> {
    let response = await this.serviceClient.send(
      newVerifyEmailAndSignInRequest({
        verificationToken: this.tokenId,
      }),
    );
    if (this.removed) {
      return;
    }
    if (response.tokenExpired) {
      this.showTokenExpiredError();
    } else {
      this.localSessionStorage.save(response.signedSession);
      this.showSuccess();
    }
    this.emit("verified");
  }

  private showTokenExpiredError(): void {
    this.card.val.append(
      E.div(
        {
          class: "verify-email-icon",
          style: `height: ${ICON_XXL}rem;`,
        },
        createExclamationMarkInACycle(SCHEME.error0),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
      }),
      eFormTitle(LOCALIZED_TEXT.emailVerificationTokenExpiredTitle),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
      }),
      E.div(
        {
          class: "verify-email-text",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
        },
        E.text(LOCALIZED_TEXT.emailVerificationTokenExpiredBody),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
      }),
      assign(
        this.homeButton,
        new FilledButton(`width: 100%;`).append(
          E.text(LOCALIZED_TEXT.goToHomeButtonLabel),
        ),
      ).body,
    );
    this.homeButton.val.addAction(() => {
      this.emit("home");
    });
  }

  private showSuccess(): void {
    this.card.val.append(
      E.div(
        {
          class: "verify-email-icon",
          style: `height: ${ICON_XXL}rem;`,
        },
        createCheckmarkInACircleIcon(SCHEME.success1),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
      }),
      eFormTitle(LOCALIZED_TEXT.emailVerifiedTitle),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
      }),
      E.div(
        {
          class: "verify-email-text",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
        },
        E.text(LOCALIZED_TEXT.emailVerifiedBody),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
      }),
      assign(
        this.homeButton,
        new FilledButton(`width: 100%;`).append(
          E.text(LOCALIZED_TEXT.goToHomeButtonLabel),
        ),
      ).body,
    );
    this.homeButton.val.addAction(() => {
      this.emit("home");
    });
  }

  public remove(): void {
    this.removed = true;
    this.body.remove();
    this.removeAllListeners();
  }
}
