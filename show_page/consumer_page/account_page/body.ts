import EventEmitter = require("events");
import { AddBodiesFn } from "../../../common/add_bodies_fn";
import { MenuItem } from "../../../common/menu_item/body";
import {
  createAccountMenuItem,
  createHomeMenuItem,
  createPaymentMethodsMenuIcon,
  createSecuritySettingsMenuItem,
  createUsageReportsMenuItem,
} from "../../../common/menu_item/factory";
import { PageNavigator } from "../../../common/page_navigator";
import { PaymentMethodsPage } from "./payment_methods_page/body";
import { ProfilePage } from "./profile_page/body";
import { SecurityPage } from "./security_page/body";
import { AccountPageState, Page } from "./state";
import { UsageReportsPage } from "./usage_reports_page/body";

export interface AccountPage {
  on(event: "newState", listener: (newState: AccountPageState) => void): this;
  on(event: "home", listener: () => void): this;
}

export class AccountPage extends EventEmitter {
  public static create(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn,
    appendMenuBodies: AddBodiesFn
  ): AccountPage {
    return new AccountPage(
      ProfilePage.create,
      SecurityPage.create,
      PaymentMethodsPage.create,
      UsageReportsPage.create,
      appendBodies,
      prependMenuBodies,
      appendMenuBodies
    );
  }

  private profilePage_: ProfilePage;
  private securityPage_: SecurityPage;
  private paymentMethodsPage_: PaymentMethodsPage;
  private usageReportsPage_: UsageReportsPage;
  private homeMenuItem_: MenuItem;
  private accountMenuItem_: MenuItem;
  private securitySettingsMenuItem_: MenuItem;
  private paymentMethodsMenuItem_: MenuItem;
  private usageReportsMenuItem_: MenuItem;
  private pageNavigator: PageNavigator<Page>;
  private state: AccountPageState;

  public constructor(
    private createProfilePage: (
      appendBodies: AddBodiesFn,
      prependMenuBodies: AddBodiesFn
    ) => ProfilePage,
    private createSecurityPage: (
      appendBodies: AddBodiesFn,
      prependMenuBodies: AddBodiesFn
    ) => SecurityPage,
    private createPaymentMethodsPage: (
      appendBodies: AddBodiesFn,
      prependMenuBodies: AddBodiesFn
    ) => PaymentMethodsPage,
    private createUsageReportsPage: (
      appendBodies: AddBodiesFn,
      prependMenuBodies: AddBodiesFn
    ) => UsageReportsPage,
    private appendBodies: AddBodiesFn,
    private prependMenuBodies: AddBodiesFn,
    private appendMenuBodies: AddBodiesFn
  ) {
    super();
    this.pageNavigator = new PageNavigator(
      (page) => this.addPage(page),
      (page) => this.removePage(page),
      (page) => this.updatePage(page)
    );

    this.homeMenuItem_ = createHomeMenuItem();
    this.accountMenuItem_ = createAccountMenuItem();
    this.securitySettingsMenuItem_ = createSecuritySettingsMenuItem();
    this.paymentMethodsMenuItem_ = createPaymentMethodsMenuIcon();
    this.usageReportsMenuItem_ = createUsageReportsMenuItem();
    this.appendMenuBodies(
      this.homeMenuItem_.body,
      this.accountMenuItem_.body,
      this.securitySettingsMenuItem_.body,
      this.paymentMethodsMenuItem_.body,
      this.usageReportsMenuItem_.body
    );

    this.homeMenuItem_.on("action", () => this.emit("home"));
    this.accountMenuItem_.on("action", () =>
      this.updateState({
        page: Page.PROFILE,
      })
    );
    this.securitySettingsMenuItem_.on("action", () =>
      this.updateState({
        page: Page.SECURITY,
      })
    );
    this.paymentMethodsMenuItem_.on("action", () =>
      this.updateState({
        page: Page.PAYMENT_METHODS,
      })
    );
    this.usageReportsMenuItem_.on("action", () =>
      this.updateState({
        page: Page.USAGE_REPORTS,
      })
    );
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.PROFILE:
        this.profilePage_ = this.createProfilePage(
          this.appendBodies,
          this.prependMenuBodies
        );
        break;
      case Page.SECURITY:
        this.securityPage_ = this.createSecurityPage(
          this.appendBodies,
          this.prependMenuBodies
        );
        break;
      case Page.PAYMENT_METHODS:
        this.paymentMethodsPage_ = this.createPaymentMethodsPage(
          this.appendBodies,
          this.prependMenuBodies
        );
        break;
      case Page.USAGE_REPORTS:
        this.usageReportsPage_ = this.createUsageReportsPage(
          this.appendBodies,
          this.prependMenuBodies
        )
          .on("newState", (newState) => {
            this.state.usageReportsPageState = newState;
            this.emit("newState", this.state);
          })
          .updateState(this.state.usageReportsPageState);
        break;
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.PROFILE:
        this.profilePage_.remove();
        break;
      case Page.SECURITY:
        this.securityPage_.remove();
        break;
      case Page.PAYMENT_METHODS:
        this.paymentMethodsPage_.remove();
        break;
      case Page.USAGE_REPORTS:
        this.usageReportsPage_.remove();
        break;
    }
  }

  private updatePage(page: Page): void {
    switch (page) {
      case Page.USAGE_REPORTS:
        this.usageReportsPage_.updateState(this.state.usageReportsPageState);
        break;
    }
  }

  public updateState(newState?: AccountPageState): this {
    if (!newState) {
      newState = {};
    }
    if (!newState.page) {
      newState.page = Page.PROFILE;
    }
    this.state = newState;
    this.pageNavigator.goTo(this.state.page);
    return this;
  }

  public remove(): void {
    this.pageNavigator.remove();
    this.homeMenuItem_.remove();
    this.accountMenuItem_.remove();
    this.securitySettingsMenuItem_.remove();
    this.paymentMethodsMenuItem_.remove();
    this.usageReportsMenuItem_.remove();
  }

  // Visible for testing
  public get profilePage() {
    return this.profilePage_;
  }
  public get securityPage() {
    return this.securityPage_;
  }
  public get paymentMethodsPage() {
    return this.paymentMethodsPage_;
  }
  public get usageReportsPage() {
    return this.usageReportsPage_;
  }
  public get homeMenuItem() {
    return this.homeMenuItem_;
  }
  public get accountMenuItem() {
    return this.accountMenuItem_;
  }
  public get securitySettingsMenuItem() {
    return this.securitySettingsMenuItem_;
  }
  public get paymentMethodsMenuItem() {
    return this.paymentMethodsMenuItem_;
  }
  public get usageReportsMenuItem() {
    return this.usageReportsMenuItem_;
  }
}
