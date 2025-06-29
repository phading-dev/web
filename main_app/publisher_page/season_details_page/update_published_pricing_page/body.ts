import EventEmitter = require("events");
import { SCHEME } from "../../../../common/color_scheme";
import { formatNegativeTimezoneOffset } from "../../../../common/formatter/date";
import {
  formatShowCreditPrice,
  formatShowPrice,
} from "../../../../common/formatter/price";
import { InputFormPage } from "../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../common/input_form_page/input_field";
import { TextInputWithErrorMsg } from "../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import { eFormTitle } from "../../../../common/page_elements";
import { FONT_M } from "../../../../common/sizes";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { ENV_VARS } from "../../../../env_vars";
import { eNewRateInputLabel } from "../common/elements";
import {
  MAX_GRADE,
  MIN_GRADE_EFFECTIVE_GAP_DAY,
} from "@phading/constants/show";
import {
  newDeleteNextSeasonGradeRequest,
  newUpdateNextSeasonGradeRequest,
} from "@phading/product_service_interface/show/web/publisher/client";
import { NextGrade } from "@phading/product_service_interface/show/web/publisher/details";
import {
  DeleteNextSeasonGradeResponse,
  UpdateNextSeasonGradeRequestBody,
  UpdateNextSeasonGradeResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { TzDate } from "@selfage/tz_date";
import { WebServiceClient } from "@selfage/web_service_client";

export interface UpdatePublishedPricingPage {
  on(event: "back", listener: () => void): this;
  on(event: "updated", listener: () => void): this;
  on(event: "deleted", listener: () => void): this;
}

export class UpdatePublishedPricingPage extends EventEmitter {
  public static create(
    seasonId: string,
    grade: number,
    nextGrade?: NextGrade,
  ): UpdatePublishedPricingPage {
    return new UpdatePublishedPricingPage(
      SERVICE_CLIENT,
      () => new Date(),
      seasonId,
      grade,
      nextGrade,
    );
  }

  public inputFormPage: InputFormPage<
    UpdateNextSeasonGradeResponse,
    DeleteNextSeasonGradeResponse
  >;
  public nextGradeInput = new Ref<TextInputWithErrorMsg>();
  public pricingPreview = new Ref<Text>();
  public netPricingPreview = new Ref<Text>();
  public effectiveDateInput = new Ref<TextInputWithErrorMsg>();
  private minDateStr: string;
  private request: UpdateNextSeasonGradeRequestBody = {};

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
    public seasonId: string,
    public grade: number,
    public nextGrade?: NextGrade,
  ) {
    super();
    this.request.seasonId = seasonId;

    this.minDateStr = TzDate.fromNewDate(
      this.getNowDate(),
      ENV_VARS.timezoneNegativeOffset,
    )
      .addDays(MIN_GRADE_EFFECTIVE_GAP_DAY)
      .toLocalDateISOString();
    this.inputFormPage = new InputFormPage<
      UpdateNextSeasonGradeResponse,
      DeleteNextSeasonGradeResponse
    >(
      `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
      [
        eFormTitle(LOCALIZED_TEXT.updateSeasonPricingTitle),
        E.div(
          {
            class: "update-published-pricing-preview-line",
            style: `display: flex; flex-flow: row wrap; column-gap: 2rem; row-gap: 1rem;`,
          },
          E.div(
            {
              class: "update-published-pricing-current-rate",
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              `${LOCALIZED_TEXT.seasonCurrentRateLabel}${formatShowPrice(grade, this.getNowDate())}`,
            ),
          ),
          E.div(
            {
              class: "update-published-pricing-current-net-rate",
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              `${LOCALIZED_TEXT.seasonNetRateLabel}${formatShowCreditPrice(grade, this.getNowDate())}`,
            ),
          ),
        ),
        assign(
          this.nextGradeInput,
          new TextInputWithErrorMsg(
            eNewRateInputLabel(this.getNowDate()),
            "",
            {
              type: "number",
              min: "1",
              max: `${MAX_GRADE}`,
              value: `${nextGrade?.grade ?? ""}`,
            },
            (value) => this.validateGradeAndPreviewAndTake(value),
          ),
        ).body,
        E.div(
          {
            class: "update-published-pricing-preview-line",
            style: `display: flex; flex-flow: row wrap; column-gap: 2rem; row-gap: 1rem;`,
          },
          E.div(
            {
              class: "update-published-pricing-new-rate",
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.seasonNewRateLabel),
            E.textRef(
              this.pricingPreview,
              formatShowPrice(nextGrade?.grade ?? 0, this.getNowDate()),
            ),
          ),
          E.div(
            {
              class: "update-published-pricing-new-net-rate",
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.seasonNewNetRateLabel),
            E.textRef(
              this.netPricingPreview,
              formatShowCreditPrice(nextGrade?.grade ?? 0, this.getNowDate()),
            ),
          ),
        ),
        assign(
          this.effectiveDateInput,
          new TextInputWithErrorMsg(
            `${LOCALIZED_TEXT.updateSeasonNewRateEffectiveDateLabel[0]}${formatNegativeTimezoneOffset(ENV_VARS.timezoneNegativeOffset)}${LOCALIZED_TEXT.updateSeasonNewRateEffectiveDateLabel[1]}`,
            "",
            {
              type: "date",
              min: this.minDateStr,
              value: nextGrade?.effectiveDate ?? this.minDateStr,
            },
            (value) => this.validateEffectiveDateAndTake(value),
          ),
        ).body,
      ],
      [this.nextGradeInput.val, this.effectiveDateInput.val],
      LOCALIZED_TEXT.updateButtonLabel,
    )
      .addBackButton()
      .on("back", () => this.emit("back"));
    this.inputFormPage
      .addPrimaryAction(
        () => this.update(),
        (response, error) => this.postUpdate(error),
      )
      .on("handlePrimarySuccess", () => this.emit("back"))
      .on("primaryDone", () => this.emit("updated"));
    if (nextGrade) {
      this.inputFormPage
        .addSecondaryButton(
          LOCALIZED_TEXT.updateSeasonDeleteNewRateButtonLabel,
          () => this.delete(),
          (response, error) => this.postDelete(error),
        )
        .on("handleSecondarySuccess", () => this.emit("back"))
        .on("secondaryDone", () => this.emit("deleted"));
    }
    this.nextGradeInput.val.validate();
    this.effectiveDateInput.val.validate();
  }

  private validateGradeAndPreviewAndTake(value: string): ValidationResult {
    if (!value) {
      return {
        valid: false,
      };
    }

    let grade = parseInt(value);
    this.nextGradeInput.val.value = `${grade}`;
    if (grade < 1) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.updateSeasonNewRateInvalidError,
      };
    } else if (grade > MAX_GRADE) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.updateSeasonNewRateTooLargeError,
      };
    } else if (grade === this.grade) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.updateSeasonNewRateIsTheSameError,
      };
    } else {
      this.pricingPreview.val.textContent = formatShowPrice(
        grade,
        this.getNowDate(),
      );
      this.netPricingPreview.val.textContent = formatShowCreditPrice(
        grade,
        this.getNowDate(),
      );
      this.request.grade = grade;
      return {
        valid: true,
      };
    }
  }

  private validateEffectiveDateAndTake(value: string): ValidationResult {
    if (isNaN(new Date(value).getTime())) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.updateSeasonNewRateEffectiveDateInvalidError,
      };
    } else if (value < this.minDateStr) {
      return {
        valid: false,
        errorMsg: `${LOCALIZED_TEXT.updateSeasonNewRateEffectiveDateTooSoonError[0]}${MIN_GRADE_EFFECTIVE_GAP_DAY}${LOCALIZED_TEXT.updateSeasonNewRateEffectiveDateTooSoonError[1]}`,
      };
    } else {
      this.request.effectiveDate = value;
      return {
        valid: true,
      };
    }
  }

  private update(): Promise<UpdateNextSeasonGradeResponse> {
    return this.serviceClient.send(
      newUpdateNextSeasonGradeRequest(this.request),
    );
  }

  private postUpdate(error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.updateGenericError;
    } else {
      return "";
    }
  }

  private delete(): Promise<DeleteNextSeasonGradeResponse> {
    return this.serviceClient.send(
      newDeleteNextSeasonGradeRequest({
        seasonId: this.request.seasonId,
      }),
    );
  }

  private postDelete(error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.deleteGenericError;
    } else {
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
