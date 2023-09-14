import EventEmitter = require("events");
import { FilledBlockingButton } from "../../../common/blocking_button";
import { SCHEME } from "../../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { MEDIUM_CARD_STYLE, PAGE_STYLE } from "../../../common/page_style";
import { VerticalTextInputWithErrorMsg } from "../../../common/text_input";
import { NATURAL_NAME_LENGTH_LIMIT } from "../../../common/user_limits";
import { USER_SERVICE_CLIENT } from "../../../common/user_service_client";
import { createUser } from "@phading/user_service_interface/client_requests";
import { UserType } from "@phading/user_service_interface/user_type";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

enum InputField {
  NaturalName,
}

export interface ConsumerCreationPage {
  on(event: "created", listener: (signedSession: string) => void): this;
}

export class ConsumerCreationPage extends EventEmitter {
  public body: HTMLDivElement;
  // Visible for testing
  public nameInput: VerticalTextInputWithErrorMsg<InputField>;
  public createButton: FilledBlockingButton;
  private createError: HTMLDivElement;
  private validInputs = new Set<InputField>();

  public constructor(private userServiceClient: WebServiceClient) {
    super();
    let nameInputRef = new Ref<VerticalTextInputWithErrorMsg<InputField>>();
    let createButtonRef = new Ref<FilledBlockingButton>();
    let createErrorRef = new Ref<HTMLDivElement>();
    this.body = E.div(
      {
        class: "consumer-creation",
        style: PAGE_STYLE,
      },
      E.div(
        {
          class: "consumer-creation-card",
          style: `${MEDIUM_CARD_STYLE} display: flex; flex-flow: column nowrap; gap: 1.5rem;`,
        },
        E.div(
          {
            class: "consumer-creation-title",
            style: `align-self: center; font-size: 1.6rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.createConsumerTitle)
        ),
        assign(
          nameInputRef,
          VerticalTextInputWithErrorMsg.create(
            LOCALIZED_TEXT.naturalNameLabel,
            ``,
            {
              type: "text",
              autocomplete: "name",
            },
            this.validInputs,
            InputField.NaturalName
          )
        ).body,
        assign(
          createButtonRef,
          FilledBlockingButton.create(
            `align-self: flex-end;`,
            E.text(LOCALIZED_TEXT.createConsumerButtonLabel)
          )
        ).body,
        E.divRef(
          createErrorRef,
          {
            class: "consumer-creation-error",
            style: `visibility: hidden; align-self: flex-end; font-size: 1.4rem; color: ${SCHEME.error0};`,
          },
          E.text("1")
        )
      )
    );
    this.nameInput = nameInputRef.val;
    this.createButton = createButtonRef.val;
    this.createError = createErrorRef.val;

    this.refreshSubmitButton();
    this.nameInput.on("input", () => this.checkNaturalNameInput());
    this.nameInput.on("enter", () => this.createButton.click());
    this.createButton.on("action", () => this.createConsumer());
    this.createButton.on("postAction", (error) =>
      this.postCreateConsumer(error)
    );
  }

  public static create(): ConsumerCreationPage {
    return new ConsumerCreationPage(USER_SERVICE_CLIENT);
  }

  private checkNaturalNameInput(): void {
    if (this.nameInput.value.length > NATURAL_NAME_LENGTH_LIMIT) {
      this.nameInput.setAsInvalid(LOCALIZED_TEXT.naturalNameTooLongError);
    } else if (this.nameInput.value.length === 0) {
      this.nameInput.setAsInvalid();
    } else {
      this.nameInput.setAsValid();
    }
    this.refreshSubmitButton();
  }

  private async createConsumer(): Promise<void> {
    this.createError.style.visibility = "hidden";
    let response = await createUser(this.userServiceClient, {
      naturalName: this.nameInput.value,
      userType: UserType.CONSUMER,
    });
    this.emit("created", response.signedSession);
  }

  private refreshSubmitButton(): void {
    if (this.validInputs.has(InputField.NaturalName)) {
      this.createButton.enable();
    } else {
      this.createButton.disable();
    }
  }

  private postCreateConsumer(error?: Error): void {
    if (error) {
      console.error(error);
      this.createError.style.visibility = "visible";
      this.createError.textContent = LOCALIZED_TEXT.createConsumerError;
      this.emit("error");
    }
  }

  public remove(): void {
    this.body.remove();
  }
}
