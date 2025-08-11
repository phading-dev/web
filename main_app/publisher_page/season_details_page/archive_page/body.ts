import EventEmitter = require("events");
import { SCHEME } from "../../../../common/color_scheme";
import { InputFormPage } from "../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../common/input_form_page/input_field";
import { TextInputWithErrorMsg } from "../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import { eCenteredTitle } from "../../../../common/page_elements";
import { FONT_M, GAP_1X, LINE_HEIGHT_M } from "../../../../common/sizes";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { newArchiveSeasonRequest } from "@phading/product_service_interface/show/web/publisher/client";
import { ArchiveSeasonResponse } from "@phading/product_service_interface/show/web/publisher/interface";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface ArchivePage {
  on(event: "back", listener: () => void): this;
  on(event: "archived", listener: () => void): this;
}

export class ArchivePage extends EventEmitter {
  public static create(seasonId: string): ArchivePage {
    return new ArchivePage(SERVICE_CLIENT, seasonId);
  }

  public inputFormPage: InputFormPage<ArchiveSeasonResponse>;
  public seasonIdInput = new Ref<TextInputWithErrorMsg>();

  public constructor(
    private serviceClient: WebServiceClient,
    public seasonId: string,
  ) {
    super();
    this.inputFormPage = new InputFormPage<ArchiveSeasonResponse>({
      customPageStyle: `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
    })
      .addLines(
        eCenteredTitle(LOCALIZED_TEXT.seasonArchiveTitle),
        E.div(
          {
            style: `display: flex; flex-flow: column nowrap; gap: ${GAP_1X}rem;`,
          },
          E.div(
            {
              class: "archive-page-details",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.seasonArchiveDescription),
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
        ),
      )
      .addButtonsContainerAndPrimaryButton(
        LOCALIZED_TEXT.seasonArchiveButtonLabel,
        () => this.archive(),
        (error) => this.postArchive(error),
      )
      .addBackButton()
      .on("back", () => this.emit("back"))
      .on("primaryDone", () => this.emit("archived"))
      .addInputs(this.seasonIdInput.val);
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
      return LOCALIZED_TEXT.seasonArchiveGenericError;
    } else {
      this.emit("back");
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
