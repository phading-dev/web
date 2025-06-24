import EventEmitter = require("events");
import { InputFormPage } from "../../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../../common/input_form_page/input_field";
import { TextInputWithErrorMsg } from "../../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../../common/navigation_bar";
import { SERVICE_CLIENT } from "../../../../../common/web_service_client";
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
  on(event: "updated", listener: () => void): this;
}

export class UpdateInfoPage extends EventEmitter {
  public static create(
    seasonId: string,
    episodeId: string,
    episode: EpisodeDetails,
  ): UpdateInfoPage {
    return new UpdateInfoPage(SERVICE_CLIENT, seasonId, episodeId, episode);
  }

  public inputFormPage: InputFormPage<UpdateEpisodeNameResponse>;
  public episodeNameInput = new Ref<TextInputWithErrorMsg>();
  private request: UpdateEpisodeNameRequestBody = {};

  public constructor(
    private serviceClient: WebServiceClient,
    public seasonId: string,
    public episodeId: string,
    public episode: EpisodeDetails,
  ) {
    super();
    this.request.seasonId = seasonId;
    this.request.episodeId = episodeId;

    this.inputFormPage = new InputFormPage(
      `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
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
    )
      .addBackButton()
      .on("back", () => this.emit("back"))
      .addPrimaryAction(
        () => this.update(),
        (response, error) => this.postUpdate(error),
      )
      .on("handlePrimarySuccess", () => this.emit("back"))
      .on("primaryDone", () => this.emit("updated"));
    this.episodeNameInput.val.validate();
  }

  private validateNameAndTake(value: string): ValidationResult {
    value = value.trim();
    if (!value) {
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
      return LOCALIZED_TEXT.updateGenericError;
    } else {
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
