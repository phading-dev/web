import EventEmitter = require("events");
import { TabSwitcher } from "./common/page_navigator";
import { MainApp } from "./main_app/body";
import { ReplacePrimaryPaymentMethodAction } from "./replace_primary_payment_method_action/action";
import { SetConnectedAccountOnboardedAction } from "./set_connected_account_onboarded_action/action";
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
      ReplacePrimaryPaymentMethodAction.create,
      SetConnectedAccountOnboardedAction.create,
      documentBody,
    );
  }

  private pageSwitcher = new TabSwitcher();
  public mainApp: MainApp;
  public replacePrimaryPaymentMethodAction: ReplacePrimaryPaymentMethodAction;
  public setConnectedAccountOnboardedAction: SetConnectedAccountOnboardedAction;
  private rl: AppRl;

  public constructor(
    private createMainApp: typeof MainApp.create,
    private createReplacePrimaryPaymentMethodAction: typeof ReplacePrimaryPaymentMethodAction.create,
    private createSetConnectedAccountOnboardedAction: typeof SetConnectedAccountOnboardedAction.create,
    private documentBody: HTMLElement,
  ) {
    super();
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
      !this.rl.setConnectedAccountOnboarded
    ) {
      this.rl.main = {};
    }

    if (this.rl.main) {
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
      this.rl.setConnectedAccountOnboarded &&
      (!this.setConnectedAccountOnboardedAction ||
        this.setConnectedAccountOnboardedAction.accountId !==
          this.rl.setConnectedAccountOnboarded.accountId)
    ) {
      this.pageSwitcher.goTo(
        () =>
          this.addSetConnectedAccountOnboardedAction(
            this.rl.setConnectedAccountOnboarded.accountId,
          ),
        () => this.removeSetConnectedAccountOnboardedAction(),
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

  private addReplacePrimaryPaymentMethodAction(accountId: string): void {
    this.replacePrimaryPaymentMethodAction =
      this.createReplacePrimaryPaymentMethodAction(accountId).on(
        "complete",
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

  private addSetConnectedAccountOnboardedAction(accountId: string): void {
    this.setConnectedAccountOnboardedAction =
      this.createSetConnectedAccountOnboardedAction(accountId).on(
        "complete",
        (accountId) => {
          this.replaceRl({
            main: {
              chooseAccount: {
                accountId: accountId,
              },
              account: {
                payout: {},
              },
            },
          });
        },
      );
  }

  private removeSetConnectedAccountOnboardedAction(): void {
    this.setConnectedAccountOnboardedAction.removeAllListeners();
    this.setConnectedAccountOnboardedAction = undefined;
  }

  public remove(): void {
    this.pageSwitcher.remove();
    this.removeAllListeners();
  }
}
