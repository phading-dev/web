import EventEmitter = require("events");
import { CLICKABLE_TEXT_STYLE } from "../../../common/button";
import { SCHEME } from "../../../common/color_scheme";
import { createEmailIcon } from "../../../common/icons";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { eFormTitle, ePageWithCenterForm } from "../../../common/page_elements";
import {
  FONT_M,
  FONT_S,
  GAP_1X,
  GAP_2X,
  GAP_0_25X,
  GAP_0_5X,
  ICON_XXL,
  LINE_HEIGHT_M,
  LINE_HEIGHT_S,
  PAGE_MAX_WIDTH_M,
} from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { TOKEN_RATE_LIMIT_INTERVAL_MS } from "@phading/constants/account";
import { newSendEmailVerificationEmailRequest } from "@phading/user_service_interface/web/self/client";
import { SendEmailVerificationEmailResponse } from "@phading/user_service_interface/web/self/interface";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface SendEmailVerificationPage {
  on(event: "changeEmail", listener: (email: string) => void): this;
}

export class SendEmailVerificationPage extends EventEmitter {
  public static create(email: string): SendEmailVerificationPage {
    return new SendEmailVerificationPage(SERVICE_CLIENT, window, email);
  }

  public body: HTMLDivElement;
  private card = new Ref<HTMLFormElement>();
  public resendButton = new Ref<HTMLDivElement>();
  public changeEmailButton = new Ref<HTMLDivElement>();
  private resendCountDown = new Ref<HTMLDivElement>();
  private actionError = new Ref<HTMLDivElement>();
  private count: number;

  public constructor(
    private serviceClient: WebServiceClient,
    private window: Window,
    public email: string,
  ) {
    super();
    this.body = ePageWithCenterForm(
      this.card,
      "",
      `max-width: ${PAGE_MAX_WIDTH_M}rem; display: flex; flex-flow: column nowrap; align-items: center;`,
      E.div(
        {
          class: "send-email-verification-page-icon",
          style: `height: ${ICON_XXL}rem;`,
        },
        createEmailIcon(SCHEME.primary1),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
      }),
      eFormTitle(LOCALIZED_TEXT.emailVerificationTitle),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
      }),
      E.div(
        {
          class: "email-verification-subtitle",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
        },
        E.text(LOCALIZED_TEXT.emailVerificationSubtitle),
      ),
      E.div(
        {
          class: "email-verification-user-email",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.primary0};`,
        },
        E.text(email),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_0_5X}rem;`,
      }),
      E.div(
        {
          class: "email-verification-subtitle-2",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
        },
        E.text(LOCALIZED_TEXT.emailVerificationSubtitle2),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
      }),
      E.div(
        {
          class: "email-verification-not-received",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
        },
        E.text(LOCALIZED_TEXT.emailVerificationNotReceived),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_0_5X}rem;`,
      }),
      E.div(
        {
          class: "email-verification-actions",
          style: `display: flex; flex-flow: column nowrap; align-items: center; gap: ${GAP_0_25X}rem;`,
        },
        E.divRef(this.actionError, {
          class: "email-verification-action-error",
          style: `display: none; font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.error0};`,
        }),
        E.divRef(this.resendCountDown, {
          class: "email-verification-resend-countdown",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
        }),
        E.divRef(
          this.resendButton,
          {
            style: `${CLICKABLE_TEXT_STYLE} font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem;`,
          },
          E.text(LOCALIZED_TEXT.resendEmailButtonLabel),
        ),
        E.divRef(
          this.changeEmailButton,
          {
            style: `${CLICKABLE_TEXT_STYLE} font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem;`,
          },
          E.text(LOCALIZED_TEXT.changeEmailLabel),
        ),
      ),
    );
    this.changeEmailButton.val.addEventListener("click", () =>
      this.emit("changeEmail", this.email),
    );
    this.resendButton.val.addEventListener("click", () => this.send());
    this.resendButton.val.click();
  }

  private async send(): Promise<void> {
    this.actionError.val.style.display = "none";
    this.resendButton.val.style.display = "none";
    this.resendCountDown.val.style.display = "block";
    this.resendCountDown.val.textContent = LOCALIZED_TEXT.resendingEmail;
    let response: SendEmailVerificationEmailResponse;
    try {
      response = await this.serviceClient.send(
        newSendEmailVerificationEmailRequest({
          userEmail: this.email,
        }),
      );
    } catch (error) {
      this.actionError.val.style.display = "block";
      this.actionError.val.textContent = LOCALIZED_TEXT.resendEmailGenericError;
      this.resendButton.val.style.display = "block";
      this.resendCountDown.val.style.display = "none";
      return;
    }
    if (response.rateLimited) {
      this.actionError.val.style.display = "block";
      this.actionError.val.textContent = `${LOCALIZED_TEXT.resendEmailVerificationEmailRateLimitError[0]}${TOKEN_RATE_LIMIT_INTERVAL_MS / 1000}${LOCALIZED_TEXT.resendEmailVerificationEmailRateLimitError[1]}`;
    }
    this.count = TOKEN_RATE_LIMIT_INTERVAL_MS / 1000;
    this.countDown();
  }

  private countDown(): void {
    this.resendCountDown.val.textContent = `${LOCALIZED_TEXT.resendCountDown[0]}${this.count}${LOCALIZED_TEXT.resendCountDown[1]}`;
    this.count--;
    if (this.count < 0) {
      this.resendButton.val.style.display = "block";
      this.resendCountDown.val.style.display = "none";
    } else {
      this.window.setTimeout(() => this.countDown(), 1000);
    }
  }

  public remove(): void {
    this.body.remove();
    this.removeAllListeners();
  }
}
