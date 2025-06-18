import EventEmitter = require("events");
import { SCHEME } from "../../../../common/color_scheme";
import { formatShowPrice } from "../../../../common/formatter/price";
import { InputFormPage } from "../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../common/input_form_page/input_field";
import { TextInputWithErrorMsg } from "../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import { FONT_M } from "../../../../common/sizes";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { eNewRateInputLabel } from "../common/elements";
import { MAX_GRADE } from "@phading/constants/show";
import { newUpdateSeasonGradeRequest } from "@phading/product_service_interface/show/web/publisher/client";
import {
  UpdateSeasonGradeRequestBody,
  UpdateSeasonGradeResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface UpdateDraftPricingPage {
  on(event: "back", listener: () => void): this;
  on(event: "updated", listener: () => void): this;
}

export class UpdateDraftPricingPage extends EventEmitter {
  public static create(
    seasonId: string,
    grade: number,
  ): UpdateDraftPricingPage {
    return new UpdateDraftPricingPage(
      SERVICE_CLIENT,
      () => new Date(),
      seasonId,
      grade,
    );
  }

  public inputFormPage: InputFormPage<UpdateSeasonGradeResponse>;
  public gradeInput = new Ref<TextInputWithErrorMsg>();
  public pricingPreview = new Ref<Text>();
  private request: UpdateSeasonGradeRequestBody = {};

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
    public seasonId: string,
    public grade: number,
  ) {
    super();
    this.request.seasonId = seasonId;

    this.inputFormPage = new InputFormPage(
      LOCALIZED_TEXT.updateSeasonPricingTitle,
      [
        assign(
          this.gradeInput,
          new TextInputWithErrorMsg(
            eNewRateInputLabel(this.getNowDate()),
            "",
            {
              type: "number",
              min: "1",
              max: `${MAX_GRADE}`,
              value: `${grade}`,
            },
            (value) => this.validateGradeAndPreviewAndTake(value),
          ),
        ).body,
        E.div(
          {
            class: "update-draft-pricing-preview",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.seasonNewRateLabel),
          E.textRef(
            this.pricingPreview,
            formatShowPrice(grade, this.getNowDate()),
          ),
        ),
      ],
      [this.gradeInput.val],
      LOCALIZED_TEXT.updateButtonLabel,
      `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
    )
      .addBackButton()
      .on("back", () => this.emit("back"))
      .addPrimaryAction(
        () => this.update(),
        (response, error) => this.postUpdate(error),
      )
      .on("handlePrimarySuccess", () => this.emit("back"))
      .on("primaryDone", () => this.emit("updated"));
    this.gradeInput.val.validate();
  }

  private validateGradeAndPreviewAndTake(value: string): ValidationResult {
    if (!value) {
      return {
        valid: false,
      };
    }

    let grade = parseInt(value);
    this.gradeInput.val.value = `${grade}`;
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
    } else {
      this.pricingPreview.val.textContent = formatShowPrice(
        grade,
        this.getNowDate(),
      );
      this.request.grade = grade;
      return {
        valid: true,
      };
    }
  }

  private update(): Promise<UpdateSeasonGradeResponse> {
    return this.serviceClient.send(newUpdateSeasonGradeRequest(this.request));
  }

  private postUpdate(error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.updateGenericError;
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
