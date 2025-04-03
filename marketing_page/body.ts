import backgoundImage = require("./background.png");
import EventEmitter = require("events");
import { FILLED_BUTTON_STYLE } from "../common/button_styles";
import { SCHEME } from "../common/color_scheme";
import { toMonthISOString } from "../common/date_helper";
import { LOCALIZED_TEXT } from "../common/locales/localized_text";
import { PageNavigator } from "../common/page_navigator";
import { PAGE_BACKGROUND_STYLE } from "../common/page_style";
import { FONT_L, FONT_M, FONT_WEIGHT_600 } from "../common/sizes";
import { ENV_VARS } from "../env_vars";
import { ProductID } from "@phading/price";
import { resolvePrice } from "@phading/price_config";
import { AccountType } from "@phading/user_service_interface/account_type";
import {
  MarketingPage as MarketingPageUrl,
  Tab,
} from "@phading/web_interface/marketing/page";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface MarketingPage {
  on(event: "signUp", listener: (accountType: AccountType) => void): this;
  on(event: "goToServiceFee", listener: () => void): this;
}

export class MarketingPage extends EventEmitter {
  public static create(): MarketingPage {
    return new MarketingPage(() => new Date());
  }

  private static TAB_BUTTON_NORMAL_STYLE = `flex-basis: 12rem; padding: 1rem 2rem; text-align: center; cursor: pointer; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`;
  private static TAB_CONTENT_STYLE = `flex-flow: column nowrap; padding: 3rem; max-width: 80rem;`;
  private static TAB_CONTENT_TITLE_STYLE = `align-self: center; font-size: ${FONT_L}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600}; margin-bottom: 2rem;`;
  private static TAB_CONTENT_MAIN_MESSAGE_STYLE = `font-size: ${FONT_L}rem; color: ${SCHEME.neutral0}; margin-bottom: 2rem;`;
  private static TAB_CONTENT_EXPLANATION_TITLE_STYLE = `align-self: center; margin-top: 4rem; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`;
  private static TAB_CONTENT_EXPLANATION_POINT_STYLE = `margin-top: 1rem; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`;

  public body: HTMLDivElement;
  public consumerTabButton = new Ref<HTMLDivElement>();
  public publisherTabButton = new Ref<HTMLDivElement>();
  public consumerSignInButton = new Ref<HTMLDivElement>();
  public publisherSignInButton = new Ref<HTMLDivElement>();
  public serviceFeesLink = new Ref<HTMLAnchorElement>();
  private consumerTabContent = new Ref<HTMLDivElement>();
  private publisherTabContent = new Ref<HTMLDivElement>();
  private tabNavigator: PageNavigator<Tab>;
  private url: MarketingPageUrl;

  public constructor(private getDateNow: () => Date) {
    super();
    let debitPrice = resolvePrice(
      ProductID.SHOW,
      ENV_VARS.defaultCurrency,
      toMonthISOString(this.getDateNow()),
    );
    let creditPrice = resolvePrice(
      ProductID.SHOW_CREDIT,
      ENV_VARS.defaultCurrency,
      toMonthISOString(this.getDateNow()),
    );
    let cutPercentage = Math.round(
      ((debitPrice.amount - creditPrice.amount) / debitPrice.amount) * 100,
    );
    this.body = E.div(
      {
        class: "marketing-page",
        style: `${PAGE_BACKGROUND_STYLE} background-image: url(${backgoundImage}); background-size: cover; background-position: center;`,
      },
      E.div(
        {
          name: "marketing-page-tabs",
          style: `width: 100%; display: flex; flex-flow: row nowrap; justify-content: center; padding-bottom: 2rem;`,
        },
        E.divRef(
          this.consumerTabButton,
          {
            name: "marketing-page-consumer-tab-button",
            style: `${MarketingPage.TAB_BUTTON_NORMAL_STYLE} border-top-left-radius: .5rem; border-bottom-left-radius: .5rem;`,
          },
          E.text(LOCALIZED_TEXT.marketingConsumerTabButtonLabel),
        ),
        E.divRef(
          this.publisherTabButton,
          {
            name: "marketing-page-publisher-tab-button",
            style: `${MarketingPage.TAB_BUTTON_NORMAL_STYLE} border-top-right-radius: .5rem; border-bottom-right-radius: .5rem;`,
          },
          E.text(LOCALIZED_TEXT.marketingPublisherTabButtonLabel),
        ),
      ),
      E.divRef(
        this.consumerTabContent,
        {
          name: "marketing-page-consumer-tab-content",
          style: MarketingPage.TAB_CONTENT_STYLE,
        },
        E.div(
          {
            name: "marketing-page-consumer-tab-title",
            style: MarketingPage.TAB_CONTENT_TITLE_STYLE,
          },
          E.text(LOCALIZED_TEXT.marketingConsumerTabTitle),
        ),
        E.div(
          {
            name: "marketing-page-consumer-tab-main-message",
            style: MarketingPage.TAB_CONTENT_MAIN_MESSAGE_STYLE,
          },
          E.text(LOCALIZED_TEXT.marketingConsumerTabMainMessage),
        ),
        E.divRef(
          this.consumerSignInButton,
          {
            name: "marketing-page-consumer-cta-button",
            style: `${FILLED_BUTTON_STYLE} align-self: center;`,
          },
          E.text(LOCALIZED_TEXT.marketingConsumerCtaButtonLabel),
        ),
        E.div(
          {
            name: "marketing-page-consumer-explanation-title",
            style: MarketingPage.TAB_CONTENT_EXPLANATION_TITLE_STYLE,
          },
          E.text(LOCALIZED_TEXT.marketingExplanationTitle),
        ),
        E.div(
          {
            name: "marketing-page-consumer-explanation-point-one",
            style: MarketingPage.TAB_CONTENT_EXPLANATION_POINT_STYLE,
          },
          E.text(LOCALIZED_TEXT.marketingConsumerTabExplanationPoint1),
        ),
        E.div(
          {
            name: "marketing-page-consumer-explanation-point-two",
            style: MarketingPage.TAB_CONTENT_EXPLANATION_POINT_STYLE,
          },
          E.text(LOCALIZED_TEXT.marketingConsumerTabExplanationPoint2),
        ),
        E.div(
          {
            name: "marketing-page-consumer-explanation-point-three",
            style: MarketingPage.TAB_CONTENT_EXPLANATION_POINT_STYLE,
          },
          E.text(LOCALIZED_TEXT.marketingConsumerTabExplanationPoint3),
        ),
        E.div(
          {
            name: "marketing-page-consumer-explanation-point-four",
            style: MarketingPage.TAB_CONTENT_EXPLANATION_POINT_STYLE,
          },
          E.text(LOCALIZED_TEXT.marketingConsumerTabExplanationPoint4),
        ),
      ),
      E.divRef(
        this.publisherTabContent,
        {
          name: "marketing-page-publisher-tab-content",
          style: MarketingPage.TAB_CONTENT_STYLE,
        },
        E.div(
          {
            name: "marketing-page-publisher-tab-title",
            style: MarketingPage.TAB_CONTENT_TITLE_STYLE,
          },
          E.text(LOCALIZED_TEXT.marketingPublisherTabTitle),
        ),
        E.div(
          {
            name: "marketing-page-publisher-tab-main-message",
            style: MarketingPage.TAB_CONTENT_MAIN_MESSAGE_STYLE,
          },
          E.text(LOCALIZED_TEXT.marketingPublisherTabMainMessage),
        ),
        E.divRef(
          this.publisherSignInButton,
          {
            name: "marketing-page-publisher-cta-button",
            style: `${FILLED_BUTTON_STYLE} align-self: center;`,
          },
          E.text(LOCALIZED_TEXT.marketingPublisherCtaButtonLabel),
        ),
        E.div(
          {
            name: "marketing-page-publisher-explanation-title",
            style: MarketingPage.TAB_CONTENT_EXPLANATION_TITLE_STYLE,
          },
          E.text(LOCALIZED_TEXT.marketingExplanationTitle),
        ),
        E.div(
          {
            name: "marketing-page-publisher-explanation-point-one",
            style: MarketingPage.TAB_CONTENT_EXPLANATION_POINT_STYLE,
          },
          E.text(LOCALIZED_TEXT.marketingPublisherTabExplanationPoint1),
        ),
        E.div(
          {
            name: "marketing-page-publisher-explanation-point-two",
            style: MarketingPage.TAB_CONTENT_EXPLANATION_POINT_STYLE,
          },
          E.text(LOCALIZED_TEXT.marketingPublisherTabExplanationPoint2),
        ),
        E.div(
          {
            name: "marketing-page-publisher-explanation-point-three",
            style: MarketingPage.TAB_CONTENT_EXPLANATION_POINT_STYLE,
          },
          E.text(LOCALIZED_TEXT.marketingPublisherTabExplanationPoint3),
        ),
        E.div(
          {
            name: "marketing-page-publisher-explanation-point-four",
            style: MarketingPage.TAB_CONTENT_EXPLANATION_POINT_STYLE,
          },
          E.text(
            `${LOCALIZED_TEXT.marketingPublisherTabExplanationPoint4[0]}${cutPercentage}%${LOCALIZED_TEXT.marketingPublisherTabExplanationPoint4[1]}`,
          ),
          E.aRef(
            this.serviceFeesLink,
            {
              name: "marketing-page-publisher-explanation-point-four-link",
              style: `color: ${SCHEME.primary1}; text-decoration: underline; cursor: pointer;`,
            },
            E.text(LOCALIZED_TEXT.marketingPublisherTabExplanationPoint4[2]),
          ),
          E.text(LOCALIZED_TEXT.marketingPublisherTabExplanationPoint4[3]),
        ),
      ),
    );
    this.hideTab(Tab.CONSUMER);
    this.hideTab(Tab.PUBLISHER);

    this.tabNavigator = new PageNavigator<Tab>(
      (tab) => this.showTab(tab),
      (tab) => this.hideTab(tab),
    );
    // No need to bubble up state.
    this.consumerTabButton.val.addEventListener("click", () =>
      this.applyUrl({
        tab: Tab.CONSUMER,
      }),
    );
    this.publisherTabButton.val.addEventListener("click", () =>
      this.applyUrl({
        tab: Tab.PUBLISHER,
      }),
    );
    this.consumerSignInButton.val.addEventListener("click", () =>
      this.emit("signUp", AccountType.CONSUMER),
    );
    this.publisherSignInButton.val.addEventListener("click", () =>
      this.emit("signUp", AccountType.PUBLISHER),
    );
    this.serviceFeesLink.val.addEventListener("click", (event) => {
      event.preventDefault();
      this.emit("goToServiceFee");
    });
  }

  public applyUrl(newUrl?: MarketingPageUrl): this {
    if (!newUrl) {
      newUrl = {};
    }
    if (!newUrl.tab) {
      newUrl.tab = Tab.CONSUMER;
    }
    this.url = newUrl;
    this.tabNavigator.goTo(this.url.tab);
    return this;
  }

  private showTab(tab: Tab): void {
    switch (tab) {
      case Tab.CONSUMER:
        this.consumerTabButton.val.style.fontWeight = `${FONT_WEIGHT_600}`;
        this.consumerTabButton.val.style.backgroundColor = `${SCHEME.neutral4}`;
        this.consumerTabContent.val.style.display = "flex";
        break;
      case Tab.PUBLISHER:
        this.publisherTabButton.val.style.fontWeight = `${FONT_WEIGHT_600}`;
        this.publisherTabButton.val.style.backgroundColor = `${SCHEME.neutral4}`;
        this.publisherTabContent.val.style.display = "flex";
        break;
    }
  }

  private hideTab(tab: Tab): void {
    switch (tab) {
      case Tab.CONSUMER:
        this.consumerTabButton.val.style.fontWeight = "normal";
        this.consumerTabButton.val.style.backgroundColor = `${SCHEME.neutral3}`;
        this.consumerTabContent.val.style.display = "none";
        break;
      case Tab.PUBLISHER:
        this.publisherTabButton.val.style.fontWeight = "normal";
        this.publisherTabButton.val.style.backgroundColor = `${SCHEME.neutral3}`;
        this.publisherTabContent.val.style.display = "none";
        break;
    }
  }

  public remove(): void {
    this.body.remove();
  }
}
