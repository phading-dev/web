import EventEmitter = require("events");
import { InputFormPage } from "../../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../../common/input_form_page/input_with_error_msg";
import { TextInputWithErrorMsg } from "../../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import { SERVICE_CLIENT } from "../../../../../common/web_service_client";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../common/elements";
import { newPublishEpisodeRequest } from "@phading/product_service_interface/show/web/publisher/client";
import {
  PublishEpisodeRequestBody,
  PublishEpisodeResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface PublishPage {
  on(event: "back", listener: () => void): this;
  on(event: "published", listener: () => void): this;
}

export class PublishPage extends EventEmitter {
  public static create(seasonId: string, episodeId: string): PublishPage {
    return new PublishPage(
      SERVICE_CLIENT,
      () => Date.now(),
      seasonId,
      episodeId,
    );
  }

  public inputFormPage: InputFormPage<PublishEpisodeResponse>;
  public premiereTimeInput = new Ref<TextInputWithErrorMsg>();
  private request: PublishEpisodeRequestBody = {};

  public constructor(
    private serviceClient: WebServiceClient,
    private getNow: () => number,
    public seasonId: string,
    public episodeId: string,
  ) {
    super();
    this.request.seasonId = seasonId;
    this.request.episodeId = episodeId;
    this.inputFormPage = new InputFormPage<PublishEpisodeResponse>(
      LOCALIZED_TEXT.publishEpisodeTitle,
      [
        assign(
          this.premiereTimeInput,
          new TextInputWithErrorMsg(
            `${LOCALIZED_TEXT.publishEpisodePremieresAtLabel[0]}${Intl.DateTimeFormat().resolvedOptions().timeZone}${LOCALIZED_TEXT.publishEpisodePremieresAtLabel[1]}`,
            "",
            {
              type: "datetime-local",
              step: "60",
            },
            (value) => this.validatePremiereTimeAndTake(value),
          ),
        ).body,
      ],
      [this.premiereTimeInput.val],
      LOCALIZED_TEXT.publishButtonLabel,
      `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
    )
      .addBackButton()
      .on("back", () => this.emit("back"))
      .addPrimaryAction(
        () => this.publish(),
        (response, error) => this.postPublish(error),
      )
      .on("handlePrimarySuccess", () => this.emit("back"))
      .on("primaryDone", () => this.emit("published"));
    this.premiereTimeInput.val.validate();
  }

  private validatePremiereTimeAndTake(value: string): ValidationResult {
    if (!value) {
      this.request.premiereTimeMs = undefined;
      return {
        valid: true,
      };
    } else if (new Date(value).getTime() < this.getNow()) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.premiereTimeInThePastError,
      };
    } else {
      this.request.premiereTimeMs = new Date(value).getTime(); // Under local timezone
      return {
        valid: true,
      };
    }
  }

  private async publish(): Promise<PublishEpisodeResponse> {
    return this.serviceClient.send(newPublishEpisodeRequest(this.request));
  }

  private postPublish(error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.publishEpisodeGenericError;
    } else {
      return "";
    }
  }

  public get body() {
    return this.inputFormPage.body;
  }

  public remove(): void {
    this.inputFormPage.remove();
  }
}
