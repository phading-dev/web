import EventEmitter = require("events");
import { AddBodiesFn } from "../../../common/add_bodies_fn";
import { SCHEME } from "../../../common/color_scheme";
import { IconButton, TooltipPosition } from "../../../common/icon_button";
import {
  createAccountIcon,
  createHistogramIcon,
  createHomeIcon,
  createPaymentIcon,
} from "../../../common/icons";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { PageNavigator } from "../../../common/page_navigator";
import { ICON_M } from "../../../common/sizes";
import { PaymentMethodsPage } from "./payment_methods_page/body";
import { ProfilePage } from "./profile_page/body";
import { AccountPageState, Page } from "./state";
import { UsageReportPage } from "./usage_report_page/body";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export interface AccountPage {
  on(event: "home", listener: () => void): this;
  on(event: "signOut", listener: () => void): this;
  on(event: "switchAccount", listener: () => void): this;
  on(event: "newState", listener: (newState: AccountPageState) => void): this;
}

export class AccountPage extends EventEmitter {
  public static create(): AccountPage {
    return new AccountPage(
      PaymentMethodsPage.create,
      ProfilePage.create,
      UsageReportPage.create,
    );
  }

  public body: HTMLDivElement;
  private pageContainer = new Ref<HTMLDivElement>();
  public homePageButton = new Ref<IconButton>();
  public profilePageButton = new Ref<IconButton>();
  public paymentMethodsPageButton = new Ref<IconButton>();
  public usageReportPageButton = new Ref<IconButton>();
  public paymentMethodsPage: PaymentMethodsPage;
  public profilePage: ProfilePage;
  public usageReportPage: UsageReportPage;
  private pageNavigator: PageNavigator<Page>;
  private state: AccountPageState;

  public constructor(
    private createPaymentMethodsPage: (
      appendBodies: AddBodiesFn,
    ) => PaymentMethodsPage,
    private createProfilePage: (appendBodies: AddBodiesFn) => ProfilePage,
    private createUsageReportPage: () => UsageReportPage,
  ) {
    super();

    this.body = E.div(
      {
        class: "account-page",
        style: `width: 100%; height: 100%; display: flex; flex-flow: column nowrap; align-items: center; background-color: ${SCHEME.neutral3};`,
      },
      E.divRef(this.pageContainer, {
        class: "account-page-container",
        style: `flex: 1 1 0; min-height: 0; width: 100%; overflow-y: auto;`,
      }),
      E.div(
        {
          class: "account-page-navigation-buttons",
          style: `flex: 0 0 auto; display: flex; flex-flow: row nowrap; align-items: center; gap: 1rem; padding: 0 1rem; border-radius: 1rem 1rem 0 0; background-color: ${SCHEME.neutral4};`,
        },
        assign(
          this.homePageButton,
          IconButton.create(
            ICON_M,
            0.7,
            "",
            createHomeIcon(SCHEME.neutral1),
            TooltipPosition.TOP,
            LOCALIZED_TEXT.homeLabel,
          ),
        ).body,
        assign(
          this.profilePageButton,
          IconButton.create(
            ICON_M,
            0.7,
            "",
            createAccountIcon(SCHEME.neutral1),
            TooltipPosition.TOP,
            LOCALIZED_TEXT.accountLabel,
          ),
        ).body,
        assign(
          this.paymentMethodsPageButton,
          IconButton.create(
            ICON_M,
            0.7,
            "",
            createPaymentIcon(SCHEME.neutral1),
            TooltipPosition.TOP,
            LOCALIZED_TEXT.paymentMethodsLabel,
          ),
        ).body,
        assign(
          this.usageReportPageButton,
          IconButton.create(
            ICON_M,
            0.7,
            "",
            createHistogramIcon(SCHEME.neutral1),
            TooltipPosition.TOP,
            LOCALIZED_TEXT.usageReportLabel,
          ),
        ).body,
      ),
    );

    this.pageNavigator = new PageNavigator<Page>(
      (page) => this.addPage(page),
      (page) => this.removePage(page),
      (page) => this.updatePage(page),
    );
    this.profilePageButton.val.on("action", () =>
      this.updateStatePageAndEmit(Page.PROFILE),
    );
    this.paymentMethodsPageButton.val.on("action", () =>
      this.updateStatePageAndEmit(Page.PAYMENT_METHODS),
    );
    this.usageReportPageButton.val.on("action", () =>
      this.updateStatePageAndEmit(Page.USAGE_REPORT),
    );
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.PROFILE:
        this.profilePage = this.createProfilePage((...bodies) =>
          this.pageContainer.val.append(...bodies),
        )
          .on("switchAccount", () => this.emit("switchAccount"))
          .on("signOut", () => this.emit("signOut"));
        break;
      case Page.PAYMENT_METHODS:
        this.paymentMethodsPage = this.createPaymentMethodsPage((...bodies) =>
          this.pageContainer.val.append(...bodies),
        );
        break;
      case Page.USAGE_REPORT:
        this.usageReportPage = this.createUsageReportPage().on(
          "newState",
          (newState) => {
            this.state.usageReport = newState;
            this.emit("newState", this.state);
          },
        );
        this.usageReportPage.updateState(this.state.usageReport);
        this.pageContainer.val.append(this.usageReportPage.body);
        break;
    }
  }

  private updatePage(page: Page): void {
    switch (page) {
      case Page.USAGE_REPORT:
        this.usageReportPage.updateState(this.state.usageReport);
        break;
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.PROFILE:
        this.profilePage.remove();
        break;
      case Page.PAYMENT_METHODS:
        this.paymentMethodsPage.remove();
        break;
      case Page.USAGE_REPORT:
        this.usageReportPage.remove();
        break;
    }
  }

  private updateStatePageAndEmit(page: Page): void {
    this.updateState({
      page,
    });
    this.emit("newState", this.state);
  }

  public updateState(newState?: AccountPageState): void {
    if (!newState) {
      newState = {};
    }
    if (!newState.page) {
      newState.page = Page.PROFILE;
    }
    if (newState.page !== Page.USAGE_REPORT) {
      newState.usageReport = undefined;
    }
    this.state = newState;
    this.pageNavigator.goTo(this.state.page);
  }

  public remove(): void {
    this.body.remove();
  }
}
