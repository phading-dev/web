import EventEmitter = require("events");
import { OutlineBlockingButton } from "../../../common/blocking_button";
import { CLICKABLE_TEXT_STYLE } from "../../../common/button_styles";
import { SCHEME } from "../../../common/color_scheme";
import { createEmailIcon } from "../../../common/icons";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import {
  PAGE_MAX_WIDTH_M,
  eFormTitle,
  ePageWithCenterForm,
} from "../../../common/page_elements";
import { FONT_M, FONT_S, ICON_XXL } from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { TOKEN_RATE_LIMIT_INTERVAL_MS } from "@phading/constants/account";
import { newSendEmailVerificationEmailRequest } from "@phading/user_service_interface/web/self/client";
import { SendEmailVerificationEmailResponse } from "@phading/user_service_interface/web/self/interface";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
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
  public resendButton = new Ref<
    OutlineBlockingButton<SendEmailVerificationEmailResponse>
  >();
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
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      eFormTitle(LOCALIZED_TEXT.emailVerificationTitle),
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      E.div(
        {
          class: "email-verification-subtitle",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
        },
        E.text(LOCALIZED_TEXT.emailVerificationSubtitle),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 1rem;`,
      }),
      E.div(
        {
          class: "email-verification-user-email",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.primary0};`,
        },
        E.text(email),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 1rem;`,
      }),
      E.div(
        {
          class: "email-verification-subtitle-2",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
        },
        E.text(LOCALIZED_TEXT.emailVerificationSubtitle2),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 5rem;`,
      }),
      E.div(
        {
          class: "email-verification-not-received",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
        },
        E.text(LOCALIZED_TEXT.emailVerificationNotReceived),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      E.div(
        {
          class: "email-verification-actions",
          style: `display: flex; flex-flow: row nowrap; align-items: center; gap: 1.5rem;`,
        },
        assign(
          this.resendButton,
          new OutlineBlockingButton<SendEmailVerificationEmailResponse>(
            "",
          ).append(E.text(LOCALIZED_TEXT.resendButtonLabel)),
        ).body,
        E.divRef(this.resendCountDown, {
          class: "email-verification-resend-countdown",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        }),
        E.div(
          {
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.alternativeAction),
        ),
        E.divRef(
          this.changeEmailButton,
          {
            style: `${CLICKABLE_TEXT_STYLE} font-size: ${FONT_M}rem;`,
          },
          E.text(LOCALIZED_TEXT.changeEmailLabel),
        ),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 1rem;`,
      }),
      E.divRef(
        this.actionError,
        {
          class: "input-form-action-error",
          style: `visibility: hidden; font-size: ${FONT_S}rem; color: ${SCHEME.error0};`,
        },
        E.text("1"),
      ),
    );
    this.changeEmailButton.val.addEventListener("click", () =>
      this.emit("changeEmail", this.email),
    );
    this.resendButton.val.addAction(
      () => this.send(),
      (response, error) => this.postSend(response, error),
    );
    this.resendButton.val.click();
  }

  private send(): Promise<SendEmailVerificationEmailResponse> {
    this.actionError.val.style.visibility = "hidden";
    return this.serviceClient.send(
      newSendEmailVerificationEmailRequest({
        userEmail: this.email,
      }),
    );
  }

  private postSend(
    response: SendEmailVerificationEmailResponse,
    error?: Error,
  ): void {
    if (error) {
      this.actionError.val.style.visibility = "visible";
      this.actionError.val.textContent = LOCALIZED_TEXT.resendGenericError;
    } else if (response.rateLimited) {
      this.actionError.val.style.visibility = "visible";
      this.actionError.val.textContent = `${LOCALIZED_TEXT.resendEmailVerificationEmailRateLimitError[0]}${TOKEN_RATE_LIMIT_INTERVAL_MS / 1000}${LOCALIZED_TEXT.resendEmailVerificationEmailRateLimitError[1]}`;
      this.startCountDown();
    } else {
      this.startCountDown();
    }
  }

  private startCountDown(): void {
    this.resendButton.val.hide();
    this.resendCountDown.val.style.display = "block";
    this.count = TOKEN_RATE_LIMIT_INTERVAL_MS / 1000;
    this.countDown();
  }

  private countDown(): void {
    this.resendCountDown.val.textContent = `${LOCALIZED_TEXT.resendCountDown[0]}${this.count}${LOCALIZED_TEXT.resendCountDown[1]}`;
    this.count--;
    if (this.count < 0) {
      this.resendCountDown.val.style.display = "none";
      this.resendButton.val.show();
    } else {
      this.window.setTimeout(() => this.countDown(), 1000);
    }
  }

  public remove(): void {
    this.body.remove();
    this.removeAllListeners();
  }
}
