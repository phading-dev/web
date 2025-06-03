import EventEmitter = require("events");
import { SCHEME } from "../../../../common/color_scheme";
import { InputFormPage } from "../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../common/input_form_page/input_with_error_msg";
import { TextInputWithErrorMsg } from "../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { FONT_M } from "../../../../common/sizes";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../common/elements";
import { newArchiveSeasonRequest } from "@phading/product_service_interface/show/web/publisher/client";
import { ArchiveSeasonResponse } from "@phading/product_service_interface/show/web/publisher/interface";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface PublishedStatePage {
  on(event: "back", listener: () => void): this;
  on(event: "archived", listener: () => void): this;
}

export class PublishedStatePage extends EventEmitter {
  public static create(seasonId: string): PublishedStatePage {
    return new PublishedStatePage(SERVICE_CLIENT, seasonId);
  }

  public inputFormPage: InputFormPage<ArchiveSeasonResponse>;
  public seasonIdInput = new Ref<TextInputWithErrorMsg>();

  public constructor(
    private serviceClient: WebServiceClient,
    public seasonId: string,
  ) {
    super();
    this.inputFormPage = new InputFormPage<ArchiveSeasonResponse>(
      LOCALIZED_TEXT.seasonPublishedStateTitle,
      [
        E.div(
          {
            class: "published-state-page-description-1",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.seasonStatePublishedFooter),
        ),
        E.div(
          {
            class: "published-state-page-description-2",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.seasonPublishedStateDescription),
        ),
        assign(
          this.seasonIdInput,
          new TextInputWithErrorMsg(
            `${LOCALIZED_TEXT.seasonArchiveInstructions[0]}${this.seasonId}${LOCALIZED_TEXT.seasonArchiveInstructions[1]}`,
            "",
            {
              type: "text",
            },
            (value) => this.validateId(value),
          ),
        ).body,
      ],
      [this.seasonIdInput.val],
      LOCALIZED_TEXT.archiveButtonLabel,
      `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
    )
      .addBackButton()
      .on("back", () => this.emit("back"))
      .addPrimaryAction(
        () => this.archive(),
        (response, error) => this.postArchive(error),
      )
      .on("handlePrimarySuccess", () => this.emit("back"))
      .on("primaryDone", () => this.emit("archived"));
    this.seasonIdInput.val.validate();
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

  private archive(): Promise<ArchiveSeasonResponse> {
    return this.serviceClient.send(
      newArchiveSeasonRequest({
        seasonId: this.seasonId,
      }),
    );
  }

  private postArchive(error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.archiveGenericError;
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
