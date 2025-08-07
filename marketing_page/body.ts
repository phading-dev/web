import EventEmitter = require("events");
import {
  Button,
  CLICKABLE_TEXT_STYLE,
  FilledButton,
  OutlineButton,
  TextButton,
} from "../common/button";
import { SCHEME } from "../common/color_scheme";
import {
  createBrandIcon,
  createCoinsHandIcon,
  createPlayIcon,
  createPriceTagIcon,
} from "../common/icons";
import { LOCALIZED_TEXT } from "../common/locales/localized_text";
import { getRootFontSize } from "../common/root_font_size";
import {
  BORDER_RADIUS_S,
  BORDER_WIDTH_1,
  FONT_L,
  FONT_M,
  FONT_WEIGHT_600,
  FONT_XL,
  FONT_XXL,
  FONT_XXXL,
  GAP_0_5X,
  GAP_0_75X,
  GAP_1X,
  GAP_1_25X,
  GAP_1_5X,
  GAP_2X,
  ICON_XXL,
  LINE_HEIGHT_FOR_BUTTON_M,
  LINE_HEIGHT_L,
  LINE_HEIGHT_M,
  LINE_HEIGHT_XL,
  LINE_HEIGHT_XXL,
  LINE_HEIGHT_XXXL,
} from "../common/sizes";
import { ENV_VARS } from "../env_vars";
import { getDollarAmount } from "@phading/price_config/amount_conversion";
import { AccountType } from "@phading/user_service_interface/account_type";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export interface MarketingPage {
  on(event: "home", listener: (accountType: AccountType) => void): this;
}

export class MarketingPage extends EventEmitter {
  public static create(): MarketingPage {
    return new MarketingPage();
  }

  private static MAX_WIDTH = 60; // rem
  private static LAYOUT_BREAKPOINT = 40; // rem

  public body: HTMLDivElement;
  public faqButton = new Ref<Button>();
  public signInButton = new Ref<Button>();
  public heroViewerButton = new Ref<Button>();
  public heroPublisherButton = new Ref<Button>();
  public publisherStartButton = new Ref<Button>();
  public viewerStartButton = new Ref<Button>();
  public joinButton = new Ref<Button>();
  private heroSectionCards = new Ref<HTMLDivElement>();
  private howSectionCards = new Ref<HTMLDivElement>();
  private publisherSectionCentered = new Ref<HTMLDivElement>();
  private viewerSectionCentered = new Ref<HTMLDivElement>();
  private faqSectionCentered = new Ref<HTMLDivElement>();
  private resizeObserver: ResizeObserver;

  public constructor() {
    super();
    let creditFormatter = new Intl.NumberFormat([navigator.language], {
      style: "currency",
      currency: ENV_VARS.defaultCurrency,
      minimumFractionDigits: 0,
    });
    this.body = E.div(
      {
        class: "marketing-page",
      },
      E.div(
        {
          class: "marketing-page-nav",
          style: `margin: 0 auto; padding: ${GAP_1X}rem ${GAP_1_5X}rem; background-color: ${SCHEME.neutral4}; border-bottom: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral2}; display: flex; flex-flow: row nowrap; align-items: center;`,
        },
        E.div(
          {
            class: "marketing-page-nav-logo",
            style: `padding: ${(LINE_HEIGHT_FOR_BUTTON_M - FONT_XXL) / 2}rem 0;`,
          },
          createBrandIcon(FONT_XXL),
        ),
        E.div({
          style: `flex: 1 0 0;`,
        }),
        assign(
          this.faqButton,
          new TextButton(`margin-right: ${GAP_1_5X}rem`).append(
            E.text(LOCALIZED_TEXT.marketingFaqButtonLabel),
          ),
        ).body,
        assign(
          this.signInButton,
          new FilledButton().append(E.text(LOCALIZED_TEXT.signInButtonLabel)),
        ).body,
      ),
      E.div(
        {
          class: "marketing-page-hero-section",
          style: `padding: 5rem 0; display: flex; flex-flow: column nowrap; align-items: center; background-color: ${SCHEME.neutral4};`,
        },
        E.div(
          {
            class: "marketing-page-hero-section-centered",
            style: `width: 100%; max-width: ${MarketingPage.MAX_WIDTH}rem; padding: 0 ${GAP_1_5X}rem; box-sizing: border-box; display: flex; flex-flow: column nowrap; align-items: center;`,
          },
          E.div(
            {
              class: "marketing-page-hero-section-title",
              style: `text-align: center; font-size: ${FONT_XXXL}rem; line-height: ${LINE_HEIGHT_XXXL}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.marketingHeroTitle),
          ),
          E.div({
            style: `flex: 0 0 auto; height: 3rem;`,
          }),
          E.divRef(
            this.heroSectionCards,
            {
              class: "marketing-page-hero-section-cards",
              style: `display: flex; flex-flow: column nowrap; align-items: flex-start; gap: ${GAP_2X}rem;`,
            },
            this.eHeroCard(
              LOCALIZED_TEXT.marketingHeroViewerTitle,
              LOCALIZED_TEXT.marketingHeroViewerDescription,
              assign(
                this.heroViewerButton,
                new FilledButton().append(
                  E.text(
                    `${LOCALIZED_TEXT.marketingHeroViewerActionButtonLabel[0]}${creditFormatter.format(getDollarAmount(ENV_VARS.initCreditAmount, ENV_VARS.defaultCurrency))}${LOCALIZED_TEXT.marketingHeroViewerActionButtonLabel[1]}`,
                  ),
                ),
              ).body,
            ),
            this.eHeroCard(
              LOCALIZED_TEXT.marketingHeroPublisherTitle,
              LOCALIZED_TEXT.marketingHeroPublisherDescription,
              assign(
                this.heroPublisherButton,
                new OutlineButton().append(
                  E.text(
                    LOCALIZED_TEXT.marketingHeroPublisherActionButtonLabel,
                  ),
                ),
              ).body,
            ),
          ),
        ),
      ),
      E.div(
        {
          class: "marketing-page-how-section",
          style: `padding: 5rem 0; display: flex; flex-flow: column nowrap; align-items: center; background-color: ${SCHEME.neutral3}; display: flex; flex-flow: column nowrap; align-items: center;`,
        },
        E.div(
          {
            class: "marketing-page-how-section-centered",
            style: `width: 100%; max-width: ${MarketingPage.MAX_WIDTH}rem; padding: 0 ${GAP_1_5X}rem; box-sizing: border-box; display: flex; flex-flow: column nowrap; align-items: center;`,
          },
          E.div(
            {
              class: "marketing-page-how-section-title",
              style: `text-align: center; font-size: ${FONT_XXL}rem; line-height: ${LINE_HEIGHT_XXL}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.marketingHowSectionTitle),
          ),
          E.div({
            style: `flex: 0 0 auto; height: ${GAP_0_75X}rem;`,
          }),
          E.div(
            {
              class: "marketing-page-how-section-subtitle",
              style: `text-align: center; font-size: ${FONT_L}rem; line-height: ${LINE_HEIGHT_L}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.marketingHowSectionSubtitle),
          ),
          E.div({
            style: `flex: 0 0 auto; height: 3rem;`,
          }),
          E.divRef(
            this.howSectionCards,
            {
              class: "marketing-page-how-section-cards",
              style: `display: flex; flex-flow: column nowrap; align-items: flex-start; gap: 3rem;`,
            },
            this.eHowCard(
              createPriceTagIcon(SCHEME.primary1),
              LOCALIZED_TEXT.marketingHowSectionFirstCardTitle,
              LOCALIZED_TEXT.marketingHowSectionFirstCardDescription,
            ),
            this.eHowCard(
              createPlayIcon(SCHEME.primary1),
              LOCALIZED_TEXT.marketingHowSectionSecondCardTitle,
              LOCALIZED_TEXT.marketingHowSectionSecondCardDescription,
            ),
            this.eHowCard(
              createCoinsHandIcon(SCHEME.primary1),
              LOCALIZED_TEXT.marketingHowSectionThirdCardTitle,
              LOCALIZED_TEXT.marketingHowSectionThirdCardDescription,
            ),
          ),
        ),
      ),
      E.div(
        {
          class: "marketing-page-publisher-section",
          style: `padding: 5rem 0; display: flex; flex-flow: column nowrap; align-items: center; background-color: ${SCHEME.neutral4}; display: flex; flex-flow: column nowrap; align-items: center;`,
        },
        E.divRef(
          this.publisherSectionCentered,
          {
            class: "marketing-page-publisher-section-centered",
            style: `width: 100%; max-width: ${MarketingPage.MAX_WIDTH}rem; padding: 0 ${GAP_1_5X}rem; box-sizing: border-box; display: flex; flex-flow: column nowrap; align-items: center; gap: 3rem;`,
          },
          E.div(
            {
              class: "marketing-page-publisher-section-top",
              style: `width: 100%; flex: 1 1 auto; display: flex; flex-flow: column nowrap; align-items: center;`,
            },
            E.div(
              {
                class: "marketing-page-publisher-section-top-title",
                style: `text-align: center; font-size: ${FONT_XXL}rem; line-height: ${LINE_HEIGHT_XXL}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
              },
              E.text(LOCALIZED_TEXT.marketingPublisherSectionTitle),
            ),
            E.div({
              style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
            }),
            E.div(
              {
                class: "marketing-page-publisher-section-top-subtitle",
                style: `text-align: center; font-size: ${FONT_L}rem; line-height: ${LINE_HEIGHT_L}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(LOCALIZED_TEXT.marketingPublisherSectionSubtitle),
            ),
            E.div({
              style: `flex: 0 0 auto; height: ${GAP_1_5X}rem;`,
            }),
            assign(
              this.publisherStartButton,
              new FilledButton().append(
                E.text(
                  LOCALIZED_TEXT.marketingPublisherSectionActionButtonLabel,
                ),
              ),
            ).body,
          ),
          E.div(
            {
              class: "marketing-page-publisher-section-bottom",
              style: `width: 100%; flex: 1 1 auto; display: flex; flex-flow: column nowrap; align-items: center; gap: ${GAP_2X}rem;`,
            },
            this.ePublisherCard(
              LOCALIZED_TEXT.marketingPublisherSectionFirstCardTitle,
              E.text(
                LOCALIZED_TEXT.marketingPublisherSectionFirstCardDescription,
              ),
            ),
            this.ePublisherCard(
              LOCALIZED_TEXT.marketingPublisherSectionSecondCardTitle,
              E.text(
                LOCALIZED_TEXT.marketingPublisherSectionSecondCardDescription,
              ),
            ),
            this.ePublisherCard(
              LOCALIZED_TEXT.marketingPublisherSectionThirdCardTitle,
              E.text(
                LOCALIZED_TEXT.marketingPublisherSectionThirdCardDescription[0],
              ),
              E.a(
                {
                  href: "/pricing",
                  target: "_blank",
                  style: `${CLICKABLE_TEXT_STYLE}`,
                },
                E.text(
                  LOCALIZED_TEXT
                    .marketingPublisherSectionThirdCardDescription[1],
                ),
              ),
            ),
          ),
        ),
      ),
      E.div(
        {
          class: "marketing-page-viewer-section",
          style: `padding: 5rem 0; display: flex; flex-flow: column nowrap; align-items: center; background-color: ${SCHEME.neutral3}; display: flex; flex-flow: column nowrap; align-items: center;`,
        },
        E.divRef(
          this.viewerSectionCentered,
          {
            class: "marketing-page-viewer-section-centered",
            style: `width: 100%; max-width: ${MarketingPage.MAX_WIDTH}rem; padding: 0 ${GAP_1_5X}rem; box-sizing: border-box; display: flex; flex-flow: column nowrap; align-items: center; gap: 3rem;`,
          },
          E.div(
            {
              class: "marketing-page-viewer-section-top",
              style: `width: 100%; flex: 1 1 auto; display: flex; flex-flow: column nowrap; align-items: center;`,
            },
            E.div(
              {
                class: "marketing-page-viewer-section-top-title",
                style: `text-align: center; font-size: ${FONT_XXL}rem; line-height: ${LINE_HEIGHT_XXL}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
              },
              E.text(LOCALIZED_TEXT.marketingViewerSectionTitle),
            ),
            E.div({
              style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
            }),
            E.div(
              {
                class: "marketing-page-viewer-section-top-subtitle",
                style: `text-align: center; font-size: ${FONT_L}rem; line-height: ${LINE_HEIGHT_L}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(LOCALIZED_TEXT.marketingViewerSectionSubtitle),
            ),
            E.div({
              style: `flex: 0 0 auto; height: ${GAP_1_5X}rem;`,
            }),
            assign(
              this.viewerStartButton,
              new FilledButton().append(
                E.text(LOCALIZED_TEXT.marketingViewerSectionActionButtonLabel),
              ),
            ).body,
          ),
          E.div(
            {
              class: "marketing-page-viewer-section-bottom",
              style: `width: 100%; flex: 1 1 auto; display: flex; flex-flow: column nowrap; align-items: center; gap: ${GAP_2X}rem;`,
            },
            this.eViewerCard(
              LOCALIZED_TEXT.marketingViewerSectionFirstCardTitle,
              LOCALIZED_TEXT.marketingViewerSectionFirstCardDescription,
            ),
            this.eViewerCard(
              LOCALIZED_TEXT.marketingViewerSectionSecondCardTitle,
              LOCALIZED_TEXT.marketingViewerSectionSecondCardDescription,
            ),
            this.eViewerCard(
              LOCALIZED_TEXT.marketingViewerSectionThirdCardTitle,
              LOCALIZED_TEXT.marketingViewerSectionThirdCardDescription,
            ),
          ),
        ),
      ),
      E.div(
        {
          class: "marketing-page-faq-section",
          style: `padding: 5rem 0; display: flex; flex-flow: column nowrap; align-items: center; background-color: ${SCHEME.neutral4}; display: flex; flex-flow: column nowrap; align-items: center;`,
        },
        E.divRef(
          this.faqSectionCentered,
          {
            class: "marketing-page-faq-section-centered",
            style: `width: 100%; max-width: ${MarketingPage.MAX_WIDTH}rem; padding: 0 ${GAP_1_5X}rem; box-sizing: border-box; display: flex; flex-flow: column nowrap; align-items: center; gap: ${GAP_1X}rem;`,
          },
          E.div(
            {
              class: "marketing-page-faq-section-title",
              style: `margin-bottom: ${GAP_2X}rem; text-align: center; font-size: ${FONT_XXL}rem; line-height: ${LINE_HEIGHT_XXL}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.faqSectionTitle),
          ),
          this.eFaqCard(
            LOCALIZED_TEXT.faqSectionNetflixComparisonQuestion,
            E.text(LOCALIZED_TEXT.faqSectionNetflixComparisonAnswer),
          ),
          this.eFaqCard(
            LOCALIZED_TEXT.faqSectionYouTubeComparisonQuestion,
            E.text(LOCALIZED_TEXT.faqSectionYouTubeComparisonAnswer),
          ),
          this.eFaqCard(
            LOCALIZED_TEXT.faqSectionPayoutQuestion,
            E.text(LOCALIZED_TEXT.faqSectionPayoutAnswer),
          ),
          this.eFaqCard(
            LOCALIZED_TEXT.faqSectionRevenueShareQuestion,
            E.text(LOCALIZED_TEXT.faqSectionRevenueShareAnswer[0]),
            E.a(
              {
                href: "/pricing",
                target: "_blank",
                style: `${CLICKABLE_TEXT_STYLE}`,
              },
              E.text(LOCALIZED_TEXT.faqSectionRevenueShareAnswer[1]),
            ),
            E.text(LOCALIZED_TEXT.faqSectionRevenueShareAnswer[2]),
          ),
          this.eFaqCard(
            LOCALIZED_TEXT.faqSectionTryItQuestion,
            E.text(
              `${LOCALIZED_TEXT.faqSectionTryItAnswer[0]}${creditFormatter.format(getDollarAmount(ENV_VARS.initCreditAmount, ENV_VARS.defaultCurrency))}${LOCALIZED_TEXT.faqSectionTryItAnswer[1]}`,
            ),
          ),
        ),
      ),
      E.div(
        {
          class: "marketing-page-join-section",
          style: `padding: 5rem 0; display: flex; flex-flow: column nowrap; align-items: center; background-color: ${SCHEME.neutral3}; display: flex; flex-flow: column nowrap; align-items: center;`,
        },
        E.div(
          {
            class: "marketing-page-join-section-centered",
            style: `width: 100%; max-width: ${MarketingPage.MAX_WIDTH}rem; padding: 0 ${GAP_1_5X}rem; box-sizing: border-box; display: flex; flex-flow: column nowrap; align-items: center;`,
          },
          E.div(
            {
              class: "marketing-page-join-section-title",
              style: `text-align: center; font-size: ${FONT_XXL}rem; line-height: ${LINE_HEIGHT_XXL}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.joinSectionTitle),
          ),
          E.div({
            style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
          }),
          E.div(
            {
              class: "marketing-page-join-section-description",
              style: `text-align: center; font-size: ${FONT_L}rem; line-height: ${LINE_HEIGHT_L}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.joinSectionDescription),
          ),
          E.div({
            style: `flex: 0 0 auto; height: ${GAP_1_5X}rem;`,
          }),
          assign(
            this.joinButton,
            new FilledButton().append(
              E.text(LOCALIZED_TEXT.joinSectionActionButtonLabel),
            ),
          ).body,
        ),
      ),
      E.div(
        {
          class: "marketing-page-footer",
          style: `margin: 0 auto; padding: ${GAP_1_5X}rem; background-color: ${SCHEME.neutral4}; border-top: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral2}; display: flex; flex-flow: column nowrap; align-items: center; gap: ${GAP_0_5X}rem;`,
        },
        E.div(
          {
            class: "marketing-page-footer-text",
            style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral1};`,
          },
          E.text(
            `© ${ENV_VARS.emailFooterYearAndCompany} All rights reserved.`,
          ),
        ),
        E.div(
          {
            class: "marketing-page-footer-links",
            style: `display: flex; flex-flow: row wrap; justify-content: center; align-items: center; column-gap: ${GAP_1X}rem; row-gap: ${GAP_0_5X}rem;`,
          },
          E.a(
            {
              href: "/terms",
              target: "_blank",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral1}; cursor: pointer;`,
            },
            E.text(LOCALIZED_TEXT.termsOfService),
          ),
          E.a(
            {
              href: "/privacy",
              target: "_blank",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral1}; cursor: pointer;`,
            },
            E.text(LOCALIZED_TEXT.privacyPolicy),
          ),
          E.a(
            {
              href: "/publisher",
              target: "_blank",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral1}; cursor: pointer;`,
            },
            E.text(LOCALIZED_TEXT.publisherAgreement),
          ),
          E.a(
            {
              href: "/pricing",
              target: "_blank",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral1}; cursor: pointer;`,
            },
            E.text(LOCALIZED_TEXT.publisherPricing),
          ),
        ),
      ),
    );
    this.resizeObserver = new ResizeObserver((entries) =>
      this.resize(entries[0]),
    );
    this.resizeObserver.observe(this.body);

    this.faqButton.val.addAction(() =>
      this.faqSectionCentered.val.scrollIntoView({
        behavior: "smooth",
        block: "start",
      }),
    );
    this.signInButton.val.addAction(() => this.emit("home"));
    this.heroViewerButton.val.addAction(() => this.emit("home"));
    this.heroPublisherButton.val.addAction(() => this.emit("home"));
    this.publisherStartButton.val.addAction(() => this.emit("home"));
    this.viewerStartButton.val.addAction(() => this.emit("home"));
    this.joinButton.val.addAction(() => this.emit("home"));
  }

  private eHeroCard(
    title: string,
    body: string,
    button: HTMLElement,
  ): HTMLDivElement {
    return E.div(
      {
        class: "marketing-page-hero-section-card",
        style: `width: 100%; box-sizing: border-box; padding: ${GAP_1X}rem; border-radius: ${BORDER_RADIUS_S}rem; border: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral2}; background-color: ${SCHEME.neutral3}; display: flex; flex-flow: column nowrap; align-items: center;`,
      },
      E.div(
        {
          class: "marketing-page-hero-section-card-title",
          style: `margin-bottom: ${GAP_0_75X}rem; text-align: center; font-size: ${FONT_XL}rem; line-height: ${LINE_HEIGHT_XL}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
        },
        E.text(title),
      ),
      E.div(
        {
          class: "marketing-page-hero-section-card-description",
          style: `margin-bottom: ${GAP_1_5X}rem; text-align: center; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(body),
      ),
      button,
    );
  }

  private eHowCard(
    icon: SVGSVGElement,
    title: string,
    description: string,
  ): HTMLDivElement {
    return E.div(
      {
        class: "marketing-page-how-section-first-card",
        style: `width: 100%; box-sizing: border-box; display: flex; flex-flow: column nowrap; align-items: center;`,
      },
      E.div(
        {
          class: "marketing-page-how-section-first-card-icon",
          style: `height: ${ICON_XXL}rem; width: ${ICON_XXL}rem;`,
        },
        icon,
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
      }),
      E.div(
        {
          class: "marketing-page-how-section-first-card-title",
          style: `text-align: center; font-size: ${FONT_L}rem; line-height: ${LINE_HEIGHT_L}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
        },
        E.text(title),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_0_5X}rem;`,
      }),
      E.div(
        {
          class: "marketing-page-how-section-first-card-description",
          style: `text-align: center; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(description),
      ),
    );
  }

  private ePublisherCard(
    title: string,
    ...bodies: Array<Node>
  ): HTMLDivElement {
    return E.div(
      {
        class: "marketing-page-publisher-section-bottom-card",
        style: `padding: ${GAP_1_5X}rem; border: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral2}; border-radius: ${BORDER_RADIUS_S}rem; background-color: ${SCHEME.neutral3};`,
      },
      E.div(
        {
          class: "marketing-page-publisher-section-bottom-card-title",
          style: `margin-bottom: ${GAP_0_5X}rem; font-size: ${FONT_L}rem; line-height: ${LINE_HEIGHT_L}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
        },
        E.text(title),
      ),
      E.div(
        {
          class: "marketing-page-publisher-section-bottom-card-body",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
        },
        ...bodies,
      ),
    );
  }

  private eViewerCard(title: string, description: string): HTMLDivElement {
    return E.div(
      {
        class: "marketing-page-viewer-section-bottom-card",
        style: `padding: ${GAP_1_5X}rem; border: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral2}; border-radius: ${BORDER_RADIUS_S}rem; background-color: ${SCHEME.neutral4};`,
      },
      E.div(
        {
          class: "marketing-page-viewer-section-bottom-card-title",
          style: `margin-bottom: ${GAP_0_5X}rem; font-size: ${FONT_L}rem; line-height: ${LINE_HEIGHT_L}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
        },
        E.text(title),
      ),
      E.div(
        {
          class: "marketing-page-viewer-section-bottom-card-body",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(description),
      ),
    );
  }

  private eFaqCard(title: string, ...bodies: Array<Node>): HTMLDivElement {
    return E.div(
      {
        class: "marketing-page-faq-card",
        style: `padding: ${GAP_1_25X}rem; border: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral2}; border-radius: ${BORDER_RADIUS_S}rem; background-color: ${SCHEME.neutral3};`,
      },
      E.div(
        {
          class: "marketing-page-faq-card-title",
          style: `margin-bottom: ${GAP_0_5X}rem; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
        },
        E.text(title),
      ),
      E.div(
        {
          class: "marketing-page-faq-card-body",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
        },
        ...bodies,
      ),
    );
  }

  private resize(entry: ResizeObserverEntry): void {
    let newWidth: number;
    if (entry.borderBoxSize) {
      newWidth = entry.borderBoxSize[0].inlineSize;
    } else {
      newWidth = entry.contentRect.width;
    }
    if (newWidth < MarketingPage.LAYOUT_BREAKPOINT * getRootFontSize()) {
      this.faqButton.val.hide();
      this.heroSectionCards.val.style.flexFlow = "column nowrap";
      this.howSectionCards.val.style.flexFlow = "column nowrap";
      this.publisherSectionCentered.val.style.flexFlow = "column nowrap";
      this.viewerSectionCentered.val.style.flexFlow = "column nowrap";
    } else {
      this.faqButton.val.show();
      this.heroSectionCards.val.style.flexFlow = "row nowrap";
      this.howSectionCards.val.style.flexFlow = "row nowrap";
      this.publisherSectionCentered.val.style.flexFlow = "row nowrap";
      this.viewerSectionCentered.val.style.flexFlow = "row nowrap";
    }
  }

  public remove(): void {
    this.resizeObserver.disconnect();
    this.body.remove();
  }
}
