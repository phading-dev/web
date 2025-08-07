import EventEmitter = require("events");
import { TabSwitcher } from "./common/page_navigator";
import { MainApp } from "./main_app/body";
import { MarketingPage } from "./marketing_page/body";
import { ReplacePrimaryPaymentMethodAction } from "./replace_primary_payment_method_action/action";
import { ResetPasswordPage } from "./reset_password_page/body";
import { VerifyEmailPage } from "./verify_email_page/body";
import { AppRl } from "@phading/web_interface/app";

export interface App {
  on(event: "replaceRl", listener: (rl: AppRl) => void): this;
  on(event: "pushRl", listener: (rl: AppRl) => void): this;
  on(event: "rlApplied", listener: () => void): this;
  on(event: "chosen", listener: (accountId: string) => void): this;
}

export class App extends EventEmitter {
  public static create(documentBody: HTMLElement): App {
    return new App(
      MainApp.create,
      MarketingPage.create,
      ReplacePrimaryPaymentMethodAction.create,
      ResetPasswordPage.create,
      VerifyEmailPage.create,
      documentBody,
    );
  }

  private pageSwitcher = new TabSwitcher();
  public mainApp: MainApp;
  public marketingPage: MarketingPage;
  public replacePrimaryPaymentMethodAction: ReplacePrimaryPaymentMethodAction;
  public resetPasswordPage: ResetPasswordPage;
  public verifyEmailPage: VerifyEmailPage;
  private rl: AppRl;

  public constructor(
    private createMainApp: typeof MainApp.create,
    private createMarketingPage: typeof MarketingPage.create,
    private createReplacePrimaryPaymentMethodAction: typeof ReplacePrimaryPaymentMethodAction.create,
    private createResetPasswordPage: typeof ResetPasswordPage.create,
    private createVerifyEmailPage: typeof VerifyEmailPage.create,
    private documentBody: HTMLElement,
  ) {
    super();
  }

  private pushRl(rl: AppRl): void {
    this.emit("pushRl", rl);
    this.applyRl(rl);
  }

  private replaceRl(rl: AppRl): void {
    this.emit("replaceRl", rl);
    this.applyRl(rl);
  }

  public async applyRl(rl?: AppRl): Promise<void> {
    this.rl = rl;
    if (!this.rl) {
      this.rl = {};
    }
    if (
      !this.rl.main &&
      !this.rl.replacePrimaryPaymentMethod &&
      !this.rl.resetPassword &&
      !this.rl.verifyEmail &&
      !this.rl.marketing
    ) {
      this.rl.marketing = {};
    }

    if (this.rl.marketing) {
      if (!this.marketingPage) {
        this.pageSwitcher.goTo(
          () => this.addMarketingPage(),
          () => this.removeMarketingPage(),
        );
      }
    } else if (this.rl.main) {
      if (!this.mainApp) {
        this.pageSwitcher.goTo(
          () => this.addMainApp(),
          () => this.removeMainApp(),
        );
      }
      await this.mainApp.applyRl(this.rl.main);
    } else if (
      this.rl.replacePrimaryPaymentMethod &&
      (!this.replacePrimaryPaymentMethodAction ||
        this.replacePrimaryPaymentMethodAction.accountId !==
          this.rl.replacePrimaryPaymentMethod.accountId)
    ) {
      this.pageSwitcher.goTo(
        () =>
          this.addReplacePrimaryPaymentMethodAction(
            this.rl.replacePrimaryPaymentMethod.accountId,
          ),
        () => this.removeReplacePrimaryPaymentMethodAction(),
      );
    } else if (
      this.rl.verifyEmail &&
      (!this.verifyEmailPage ||
        this.verifyEmailPage.tokenId !== this.rl.verifyEmail.tokenId)
    ) {
      this.pageSwitcher.goTo(
        () => this.addVerifyEmailPage(this.rl.verifyEmail.tokenId),
        () => this.removeVerifyEmailPage(),
      );
    } else if (
      this.rl.resetPassword &&
      (!this.resetPasswordPage ||
        this.resetPasswordPage.tokenId !== this.rl.resetPassword.tokenId)
    ) {
      this.pageSwitcher.goTo(
        () => this.addResetPasswordPage(this.rl.resetPassword.tokenId),
        () => this.removeResetPasswordPage(),
      );
    }
    this.emit("rlApplied");
  }

  private addMainApp(): void {
    this.mainApp = this.createMainApp((...bodies) =>
      this.documentBody.append(...bodies),
    )
      .on("replaceRl", (rl) => {
        this.rl.main = rl;
        this.emit("replaceRl", this.rl);
      })
      .on("pushRl", (rl) => {
        this.rl.main = rl;
        this.emit("pushRl", this.rl);
      })
      .on("chosen", (accountId) => {
        this.emit("chosen", accountId);
      });
  }

  private removeMainApp(): void {
    this.mainApp.remove();
    this.mainApp = undefined;
  }

  private addMarketingPage(): void {
    this.marketingPage = this.createMarketingPage().on("home", () =>
      this.pushRl({ main: {} }),
    );
    this.documentBody.append(this.marketingPage.body);
  }

  private removeMarketingPage(): void {
    this.marketingPage.remove();
    this.marketingPage = undefined;
  }

  private addReplacePrimaryPaymentMethodAction(accountId: string): void {
    this.replacePrimaryPaymentMethodAction =
      this.createReplacePrimaryPaymentMethodAction(accountId).on(
        "payment",
        (accountId) => {
          this.replaceRl({
            main: {
              chooseAccount: {
                accountId: accountId,
              },
              account: {
                payment: {},
              },
            },
          });
        },
      );
  }

  private removeReplacePrimaryPaymentMethodAction(): void {
    this.replacePrimaryPaymentMethodAction.removeAllListeners();
    this.replacePrimaryPaymentMethodAction = undefined;
  }

  private addResetPasswordPage(tokenId: string): void {
    this.resetPasswordPage = this.createResetPasswordPage(
      (...bodies) => this.documentBody.append(...bodies),
      tokenId,
    ).on("home", () => {
      this.replaceRl({
        main: {},
      });
    });
  }

  private removeResetPasswordPage(): void {
    this.resetPasswordPage.remove();
    this.resetPasswordPage = undefined;
  }

  private addVerifyEmailPage(tokenId: string): void {
    this.verifyEmailPage = this.createVerifyEmailPage(tokenId).on(
      "home",
      () => {
        this.replaceRl({
          main: {},
        });
      },
    );
    this.documentBody.append(this.verifyEmailPage.body);
  }

  private removeVerifyEmailPage(): void {
    this.verifyEmailPage.remove();
    this.verifyEmailPage = undefined;
  }

  public remove(): void {
    this.pageSwitcher.remove();
    this.removeAllListeners();
  }
}
