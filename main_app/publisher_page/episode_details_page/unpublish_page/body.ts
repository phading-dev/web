import EventEmitter = require("events");
import { InputFormPage } from "../../../../common/input_form_page/body";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import { eCenteredTitle } from "../../../../common/page_elements";
import { FONT_M, LINE_HEIGHT_M } from "../../../../common/sizes";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { newUnpublishEpisodeRequest } from "@phading/product_service_interface/show/web/publisher/client";
import {
  UnpublishEpisodeRequestBody,
  UnpublishEpisodeResponse,
  UpdateEpisodePremiereTimeResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { E } from "@selfage/element/factory";
import { WebServiceClient } from "@selfage/web_service_client";
import { SCHEME } from "../../../../common/color_scheme";

export interface UnpublishPage {
  on(event: "back", listener: () => void): this;
  on(event: "unpublished", listener: () => void): this;
}

export class UnpublishPage extends EventEmitter {
  public static create(seasonId: string, episodeId: string): UnpublishPage {
    return new UnpublishPage(SERVICE_CLIENT, seasonId, episodeId);
  }

  public inputFormPage: InputFormPage<
    UpdateEpisodePremiereTimeResponse,
    UnpublishEpisodeResponse
  >;
  private request: UnpublishEpisodeRequestBody = {};

  public constructor(
    private serviceClient: WebServiceClient,
    public seasonId: string,
    public episodeId: string,
  ) {
    super();
    this.request.seasonId = seasonId;
    this.request.episodeId = episodeId;

    this.inputFormPage = new InputFormPage<
      UpdateEpisodePremiereTimeResponse,
      UnpublishEpisodeResponse
    >({
      customPageStyle: `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
    })
      .addLines(
        eCenteredTitle(LOCALIZED_TEXT.unpublishEpisodeTitle),
        E.div(
          {
            class: "unpublish-episode-instructions",
            style: `align-self: center; text-align: center; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.unpublishEpisodeInstructions),
        ),
      )
      .addButtonsContainerAndPrimaryButton(
        LOCALIZED_TEXT.unpublishEpisodeButtonLabel,
        () => this.unpublish(),
        (error) => this.postUnpublish(error),
      )
      .addBackButton()
      .on("back", () => this.emit("back"))
      .on("primaryDone", () => this.emit("unpublished"));
  }

  private async unpublish(): Promise<UnpublishEpisodeResponse> {
    return this.serviceClient.send(newUnpublishEpisodeRequest(this.request));
  }

  private postUnpublish(error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.unpublishEpisodeGenericError;
    } else {
      this.emit("back");
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
