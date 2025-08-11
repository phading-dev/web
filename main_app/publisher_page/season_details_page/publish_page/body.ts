import EventEmitter = require("events");
import { SCHEME } from "../../../../common/color_scheme";
import {
  formatShowCreditPrice,
  formatShowPrice,
} from "../../../../common/formatter/price";
import { InputFormPage } from "../../../../common/input_form_page/body";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import { eCenteredTitle } from "../../../../common/page_elements";
import {
  FONT_M,
  FONT_S,
  FONT_WEIGHT_600,
  GAP_1X,
  LINE_HEIGHT_M,
  LINE_HEIGHT_S,
} from "../../../../common/sizes";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { MIN_GRADE_EFFECTIVE_GAP_DAY } from "@phading/constants/show";
import { newPublishSeasonRequest } from "@phading/product_service_interface/show/web/publisher/client";
import { SeasonDetails } from "@phading/product_service_interface/show/web/publisher/details";
import { PublishSeasonResponse } from "@phading/product_service_interface/show/web/publisher/interface";
import { E } from "@selfage/element/factory";
import { WebServiceClient } from "@selfage/web_service_client";

export interface PublishPage {
  on(event: "back", listener: () => void): this;
  on(event: "published", listener: () => void): this;
}

export class PublishPage extends EventEmitter {
  public static create(seasonId: string, season: SeasonDetails): PublishPage {
    return new PublishPage(SERVICE_CLIENT, () => new Date(), seasonId, season);
  }

  public inputFormPage: InputFormPage<PublishSeasonResponse>;

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
    public seasonId: string,
    public season: SeasonDetails,
  ) {
    super();
    let nowDate = this.getNowDate();
    this.inputFormPage = new InputFormPage<PublishSeasonResponse>({
      customPageStyle: `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
    })
      .addLines(
        eCenteredTitle(LOCALIZED_TEXT.seasonPublishTitle),
        E.div(
          {
            class: "publish-page-details",
            style: `display: flex; flex-flow: column nowrap; gap: ${GAP_1X}rem;`,
          },
          E.div(
            {
              class: "publish-page-pricing",
            },
            E.div(
              {
                class: "publish-page-pricing-current-rate",
                style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(LOCALIZED_TEXT.seasonCurrentRateLabel),
              E.div(
                {
                  style: `display: inline; font-weight: ${FONT_WEIGHT_600};`,
                },
                E.text(formatShowPrice(season.grade, nowDate)),
              ),
            ),
            E.div(
              {
                class: "publish-page-pricing-current-net-rate",
                style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
              },
              E.text(LOCALIZED_TEXT.seasonNetRateLabel),
              E.div(
                {
                  style: `display: inline; font-weight: ${FONT_WEIGHT_600};`,
                },
                E.text(formatShowCreditPrice(season.grade, nowDate)),
              ),
            ),
          ),
          E.div(
            {
              class: "publish-page-warnings",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.seasonPublishDescription[0]),
            E.div(
              {
                style: `display: inline; font-weight: ${FONT_WEIGHT_600};`,
              },
              E.text(
                `${MIN_GRADE_EFFECTIVE_GAP_DAY}${LOCALIZED_TEXT.seasonPublishDescription[1]}`,
              ),
            ),
            E.text(LOCALIZED_TEXT.seasonPublishDescription[2]),
            E.div(
              {
                style: `display: inline; font-weight: ${FONT_WEIGHT_600};`,
              },
              E.text(LOCALIZED_TEXT.seasonPublishDescription[3]),
            ),
            E.text(LOCALIZED_TEXT.seasonPublishDescription[4]),
          ),
        ),
        E.div(
          {
            class: "publish-page-confirmation",
            style: `align-self: center; text-align: center; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.seasonPublishConfirmation),
        ),
      )
      .addButtonsContainerAndPrimaryButton(
        LOCALIZED_TEXT.seasonPublishButtonLabel,
        () => this.publish(),
        (error) => this.postPublish(error),
      )
      .addBackButton()
      .on("back", () => this.emit("back"))
      .on("primaryDone", () => this.emit("published"));
  }

  private publish(): Promise<PublishSeasonResponse> {
    return this.serviceClient.send(
      newPublishSeasonRequest({
        seasonId: this.seasonId,
      }),
    );
  }

  private postPublish(error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.seasonPublishGenericError;
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
