import EventEmitter = require("events");
import { SCHEME } from "../../../../common/color_scheme";
import { InputFormPage } from "../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../common/input_form_page/input_field";
import { TextInputWithErrorMsg } from "../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import { eFormTitle } from "../../../../common/page_elements";
import { FONT_M } from "../../../../common/sizes";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { ENV_VARS } from "../../../../env_vars";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import { newArchiveSeasonRequest } from "@phading/product_service_interface/show/web/publisher/client";
import { SeasonDetails } from "@phading/product_service_interface/show/web/publisher/details";
import { ArchiveSeasonResponse } from "@phading/product_service_interface/show/web/publisher/interface";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface ArchivePage {
  on(event: "back", listener: () => void): this;
  on(event: "archived", listener: () => void): this;
}

export class ArchivePage extends EventEmitter {
  public static create(seasonId: string, season: SeasonDetails): ArchivePage {
    return new ArchivePage(SERVICE_CLIENT, seasonId, season);
  }

  public inputFormPage: InputFormPage<ArchiveSeasonResponse>;
  public seasonIdInput = new Ref<TextInputWithErrorMsg>();

  public constructor(
    private serviceClient: WebServiceClient,
    public seasonId: string,
    public season: SeasonDetails,
  ) {
    super();
    if (
      season.state !== SeasonState.PUBLISHED &&
      season.state !== SeasonState.TAKEN_DOWN
    ) {
      throw new Error(
        `Cannot archive season with state ${SeasonState[season.state]}, expected PUBLISHED or TAKEN_DOWN.`,
      );
    }
    this.inputFormPage = new InputFormPage<ArchiveSeasonResponse>(
      `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
      [
        eFormTitle(
          season.state === SeasonState.PUBLISHED
            ? LOCALIZED_TEXT.seasonPublishedStateTitle
            : LOCALIZED_TEXT.seasonTakenDownStateTitle,
        ),
        E.div(
          {
            class: "published-state-page-description-1",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(
            season.state === SeasonState.PUBLISHED
              ? LOCALIZED_TEXT.seasonStatePublishedFooter
              : `${LOCALIZED_TEXT.seasonStateTakenDownFooter}${season.takenDownReason}`,
          ),
        ),
        E.div(
          {
            class: "published-state-page-description-2",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(
            season.state === SeasonState.PUBLISHED
              ? LOCALIZED_TEXT.seasonPublishedStateDescription
              : `${LOCALIZED_TEXT.seasonTakenDownStateDescription[0]}${ENV_VARS.supportEmail}${LOCALIZED_TEXT.seasonTakenDownStateDescription[1]}`,
          ),
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
      LOCALIZED_TEXT.archiveButtonLabel,
    )
      .addBackButton()
      .on("back", () => this.emit("back"))
      .addPrimaryAction(
        () => this.archive(),
        (response, error) => this.postArchive(error),
      )
      .on("handlePrimarySuccess", () => this.emit("back"))
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
    this.removeAllListeners();
  }
}
