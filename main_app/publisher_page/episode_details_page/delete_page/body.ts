import EventEmitter = require("events");
import { InputFormPage } from "../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../common/input_form_page/input_field";
import { TextInputWithErrorMsg } from "../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import { eCenteredTitle } from "../../../../common/page_elements";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { newDeleteEpisodeRequest } from "@phading/product_service_interface/show/web/publisher/client";
import {
  DeleteEpisodeResponse,
  PublishEpisodeRequestBody,
  PublishEpisodeResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface DeletePage {
  on(event: "back", listener: () => void): this;
  on(event: "delete", listener: () => void): this;
  on(event: "deleted", listener: () => void): this;
}

export class DeletePage extends EventEmitter {
  public static create(seasonId: string, episodeId: string): DeletePage {
    return new DeletePage(SERVICE_CLIENT, seasonId, episodeId);
  }

  public inputFormPage: InputFormPage<
    PublishEpisodeResponse,
    DeleteEpisodeResponse
  >;
  public episodeIdInput = new Ref<TextInputWithErrorMsg>();
  private request: PublishEpisodeRequestBody = {};

  public constructor(
    private serviceClient: WebServiceClient,
    public seasonId: string,
    public episodeId: string,
  ) {
    super();
    this.request.seasonId = seasonId;
    this.request.episodeId = episodeId;

    this.inputFormPage = new InputFormPage<
      PublishEpisodeResponse,
      DeleteEpisodeResponse
    >({
      customPageStyle: `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
    })
      .addLines(
        eCenteredTitle(LOCALIZED_TEXT.deleteEpisodeTitle),
        assign(
          this.episodeIdInput,
          new TextInputWithErrorMsg(
            `${LOCALIZED_TEXT.deleteEpisodeInstructions[0]}${episodeId}${LOCALIZED_TEXT.deleteEpisodeInstructions[1]}`,
            "",
            {
              type: "text",
            },
            (value) => this.validateId(value),
          ),
        ).body,
      )
      .addButtonsContainerAndPrimaryButton(
        LOCALIZED_TEXT.deleteEpisodeButtonLabel,
        () => this.delete(),
        (error) => this.postDelete(error),
      )
      .addBackButton()
      .addInputs(this.episodeIdInput.val)
      .on("back", () => this.emit("back"))
      .on("primaryDone", () => this.emit("deleted"));
  }

  private validateId(value: string): ValidationResult {
    if (value !== this.episodeId) {
      return {
        valid: false,
      };
    } else {
      return {
        valid: true,
      };
    }
  }

  private async delete(): Promise<DeleteEpisodeResponse> {
    return this.serviceClient.send(
      newDeleteEpisodeRequest({
        seasonId: this.seasonId,
        episodeId: this.episodeId,
      }),
    );
  }

  private postDelete(error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.deleteEpisodeGenericError;
    } else {
      this.emit("delete");
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
