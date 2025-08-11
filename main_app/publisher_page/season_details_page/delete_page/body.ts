import EventEmitter = require("events");
import { InputFormPage } from "../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../common/input_form_page/input_field";
import { TextInputWithErrorMsg } from "../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import { eCenteredTitle } from "../../../../common/page_elements";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { newDeleteSeasonRequest } from "@phading/product_service_interface/show/web/publisher/client";
import { DeleteSeasonResponse } from "@phading/product_service_interface/show/web/publisher/interface";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface DeletePage {
  on(event: "back", listener: () => void): this;
  on(event: "delete", listener: () => void): this;
  on(event: "deleted", listener: () => void): this;
}

export class DeletePage extends EventEmitter {
  public static create(seasonId: string): DeletePage {
    return new DeletePage(SERVICE_CLIENT, seasonId);
  }

  public inputFormPage: InputFormPage<DeleteSeasonResponse>;
  public seasonIdInput = new Ref<TextInputWithErrorMsg>();

  public constructor(
    private serviceClient: WebServiceClient,
    public seasonId: string,
  ) {
    super();
    this.inputFormPage = new InputFormPage<DeleteSeasonResponse>({
      customPageStyle: `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
    })
      .addLines(
        eCenteredTitle(LOCALIZED_TEXT.seasonDeleteTitle),
        assign(
          this.seasonIdInput,
          new TextInputWithErrorMsg(
            `${LOCALIZED_TEXT.seasonDeleteInstruction[0]}${this.seasonId}${LOCALIZED_TEXT.seasonDeleteInstruction[1]}`,
            "",
            {
              type: "text",
            },
            (value) => this.validateId(value),
          ),
        ).body,
      )
      .addButtonsContainerAndPrimaryButton(
        LOCALIZED_TEXT.seasonDeleteButtonLabel,
        () => this.delete(),
        (error) => this.postDelete(error),
      )
      .addBackButton()
      .addInputs(this.seasonIdInput.val)
      .on("back", () => this.emit("back"))
      .on("primaryDone", () => this.emit("deleted"));
  }

  private validateId(value: string): ValidationResult {
    if (value !== this.seasonId) {
      return {
        valid: false,
      };
    } else {
      return {
        valid: true,
      };
    }
  }

  private delete(): Promise<DeleteSeasonResponse> {
    return this.serviceClient.send(
      newDeleteSeasonRequest({
        seasonId: this.seasonId,
      }),
    );
  }

  private postDelete(error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.seasonDeleteGenericError;
    } else {
      this.emit("delete");
      return "";
    }
  }

  public get body(): HTMLElement {
    return this.inputFormPage.body;
  }

  public remove(): void {
    this.inputFormPage.remove();
    this.removeAllListeners();
  }
}
