import EventEmitter = require("events");
import { InputFormPage } from "../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../common/input_form_page/input_field";
import { TextInputWithErrorMsg } from "../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import { eFormTitle } from "../../../../common/page_elements";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { MAX_EPISODE_NAME_LENGTH } from "@phading/constants/show";
import { newCreateEpisodeRequest } from "@phading/product_service_interface/show/web/publisher/client";
import {
  CreateEpisodeRequestBody,
  CreateEpisodeResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface CreateEpisodePage {
  on(event: "back", listener: () => void): this;
  on(
    event: "viewEpisode",
    listener: (seasonId: string, episodeId: string) => void,
  ): this;
  on(event: "created", listener: () => void): this;
}

export class CreateEpisodePage extends EventEmitter {
  public static create(seasonId: string): CreateEpisodePage {
    return new CreateEpisodePage(SERVICE_CLIENT, seasonId);
  }

  public inputFormPage: InputFormPage<CreateEpisodeResponse>;
  public nameInput = new Ref<TextInputWithErrorMsg>();
  private request: CreateEpisodeRequestBody = {};

  public constructor(
    private serviceClient: WebServiceClient,
    public seasonId: string,
  ) {
    super();
    this.request.seasonId = seasonId;
    this.inputFormPage = new InputFormPage<CreateEpisodeResponse>(
      `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
      [
        eFormTitle(LOCALIZED_TEXT.createEpisodeTitle),
        assign(
          this.nameInput,
          new TextInputWithErrorMsg(
            LOCALIZED_TEXT.createEpisodeNameLabel,
            "",
            {
              type: "text",
            },
            (value) => this.validateNameAndTake(value),
          ),
        ).body,
      ],
      [this.nameInput.val],
      LOCALIZED_TEXT.createButtonLabel,
    )
      .addBackButton()
      .on("back", () => this.emit("back"))
      .addPrimaryAction(
        () => this.create(),
        (response, error) => this.postCreate(error),
      )
      .on("handlePrimarySuccess", (response) =>
        this.emit("viewEpisode", response.episodeId),
      )
      .on("primaryDone", () => this.emit("created"));
    this.nameInput.val.validate();
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
        errorMsg: LOCALIZED_TEXT.createEpisodeNameTooLongError,
      };
    } else {
      this.request.episodeName = value;
      return {
        valid: true,
      };
    }
  }

  private create(): Promise<CreateEpisodeResponse> {
    return this.serviceClient.send(newCreateEpisodeRequest(this.request));
  }

  private postCreate(error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.createGenericError;
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
