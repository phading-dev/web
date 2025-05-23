import EventEmitter = require("events");
import { InputFormPage } from "../../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../../common/input_form_page/input_with_error_msg";
import { TextInputWithErrorMsg } from "../../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import { MAX_EPISODE_NAME_LENGTH } from "@phading/constants/show";
import { newUpdateEpisodeNameRequest } from "@phading/product_service_interface/show/web/publisher/client";
import { EpisodeDetails } from "@phading/product_service_interface/show/web/publisher/details";
import {
  UpdateEpisodeNameRequestBody,
  UpdateEpisodeNameResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface UpdateInfoPage {
  on(event: "back", listener: () => void): this;
}

export class UpdateInfoPage extends EventEmitter {
  public inputFormPage: InputFormPage<UpdateEpisodeNameResponse>;
  public episodeNameInput = new Ref<TextInputWithErrorMsg>();
  private request: UpdateEpisodeNameRequestBody = {};

  public constructor(
    private serviceClient: WebServiceClient,
    seasonId: string,
    episodeId: string,
    episode: EpisodeDetails,
  ) {
    super();
    this.request.seasonId = seasonId;
    this.request.episodeId = episodeId;

    this.inputFormPage = new InputFormPage<UpdateEpisodeNameResponse>(
      LOCALIZED_TEXT.updateEpisodeInfoTitle,
      [
        assign(
          this.episodeNameInput,
          new TextInputWithErrorMsg(
            LOCALIZED_TEXT.updateEpisodeNameLabel,
            "",
            {
              type: "text",
              value: episode.episodeName ?? "",
            },
            (value: string) => this.validateNameAndTake(value),
          ),
        ).body,
      ],
      [this.episodeNameInput.val],
      LOCALIZED_TEXT.updateButtonLabel,
    ).addBackButton();
    this.inputFormPage.on("back", () => this.emit("back"));

    this.inputFormPage.addPrimaryAction(
      () => this.update(),
      (response, error) => this.postUpdate(error),
    );
    this.inputFormPage.on("handlePrimarySuccess", () => this.emit("back"));
  }

  private validateNameAndTake(value: string): ValidationResult {
    if (value.length === 0) {
      return {
        valid: false,
      };
    } else if (value.length > MAX_EPISODE_NAME_LENGTH) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.updateEpisodeNameTooLongError,
      };
    } else {
      this.request.name = value;
      return {
        valid: true,
      };
    }
  }

  private update(): Promise<UpdateEpisodeNameResponse> {
    return this.serviceClient.send(newUpdateEpisodeNameRequest(this.request));
  }

  private postUpdate(error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.updateGenericFailure;
    } else {
      return "";
    }
  }

  public get body(): HTMLElement {
    return this.inputFormPage.body;
  }

  public remove(): void {
    this.inputFormPage.remove();
  }
}
