import EventEmitter = require("events");
import { SCHEME } from "../../../common/color_scheme";
import { createLockIcon } from "../../../common/icons";
import { InputFormPage } from "../../../common/input_form_page/body";
import { ValidationResult } from "../../../common/input_form_page/input_field";
import { TextInputWithErrorMsg } from "../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { eCenteredTitle } from "../../../common/page_elements";
import { GAP_1X, ICON_XXL } from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { newSendPasswordResetEmailRequest } from "@phading/user_service_interface/web/self/client";
import {
  SendPasswordResetEmailRequestBody,
  SendPasswordResetEmailResponse,
} from "@phading/user_service_interface/web/self/interface";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface SendPasswordResetPage {
  on(event: "showSuccess", listener: (email: string) => void): this;
  on(event: "back", listener: () => void): this;
  on(event: "sent", listener: () => void): this;
}

export class SendPasswordResetPage extends EventEmitter {
  public static create(): SendPasswordResetPage {
    return new SendPasswordResetPage(SERVICE_CLIENT);
  }

  public inputFormPage: InputFormPage<SendPasswordResetEmailResponse>;
  public emailInput = new Ref<TextInputWithErrorMsg>();
  private request: SendPasswordResetEmailRequestBody = {};

  public constructor(private serviceClient: WebServiceClient) {
    super();
    this.inputFormPage = new InputFormPage<SendPasswordResetEmailResponse>()
      .addLines(
        E.div(
          {
            style: `width: 100%; display: flex; flex-flow: column nowrap; gap: ${GAP_1X}rem;`,
          },
          E.div(
            {
              class: "send-password-reset-page-icon",
              style: `align-self: center; height: ${ICON_XXL}rem;`,
            },
            createLockIcon(SCHEME.primary1),
          ),
          eCenteredTitle(LOCALIZED_TEXT.sendPasswordResetTitle),
        ),
        assign(
          this.emailInput,
          new TextInputWithErrorMsg(
            LOCALIZED_TEXT.sendPasswordResetEmailLabel,
            "",
            {
              type: "email",
              autocomplete: "username email",
            },
            (value) => this.validateOrTakeEmailInput(value),
          ),
        ).body,
      )
      .addButtonsContainerAndPrimaryButton(
        LOCALIZED_TEXT.sendButtonLabel,
        () => this.send(),
        (error, response) => this.postSend(error, response),
      )
      .addBackButton()
      .addInputs(this.emailInput.val)
      .on("primaryDone", () => this.emit("sent"))
      .on("back", () => this.emit("back"));
  }

  private validateOrTakeEmailInput(value: string): ValidationResult {
    value = value.trim();
    if (value) {
      this.request.userEmail = value;
      return {
        valid: true,
      };
    } else {
      return {
        valid: false,
      };
    }
  }

  private send(): Promise<SendPasswordResetEmailResponse> {
    return this.serviceClient.send(
      newSendPasswordResetEmailRequest(this.request),
    );
  }

  private postSend(
    error?: Error,
    response?: SendPasswordResetEmailResponse,
  ): string {
    if (error) {
      return LOCALIZED_TEXT.sendGenericError;
    } else if (response.rateLimited) {
      return LOCALIZED_TEXT.sendPasswordResetEmailRateLimitError;
    } else {
      this.emit("showSuccess", this.request.userEmail);
      return "";
    }
  }

  public get body() {
    return this.inputFormPage.body;
  }

  public remove(): void {
    this.inputFormPage.remove();
    this.removeAllListeners();
  }
}
