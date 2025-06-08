import EventEmitter = require("events");
import { AddBodiesFn } from "../../common/add_bodies_fn";
import { SCHEME } from "../../common/color_scheme";
import {
  createAccountIcon,
  createCoinsHandIcon,
  createDocumentIcon,
  createHomeIcon,
  createPaymentIcon,
} from "../../common/icons";
import { LOCALIZED_TEXT } from "../../common/locales/localized_text";
import {
  eBottomNavigationBarRef,
  eNavigationItemRef,
} from "../../common/navigation_bar";
import { TabSwitcher } from "../../common/page_navigator";
import { PaymentPage } from "./payment_page/body";
import { PayoutPage } from "./payout_page/body";
import { ProfilePage } from "./profile_page/body";
import { StatementsPage } from "./statements_page/body";
import { AccountPageRl } from "@phading/web_interface/main/account/page";
import { Ref } from "@selfage/ref";

export interface AccountPage {
  on(event: "replaceRl", listener: (rl: AccountPageRl) => void): this;
  on(event: "pushRl", listener: (rl: AccountPageRl) => void): this;
  on(event: "goToHome", listener: () => void): this;
  on(event: "chooseAccount", listener: () => void): this;
  on(event: "signOut", listener: () => void): this;
}

export class AccountPage extends EventEmitter {
  public static create(
    appendBodies: AddBodiesFn,
    canEarn: boolean,
  ): AccountPage {
    return new AccountPage(
      PaymentPage.create,
      PayoutPage.create,
      ProfilePage.create,
      StatementsPage.create,
      appendBodies,
      canEarn,
    );
  }

  private navigationBar = new Ref<HTMLDivElement>();
  public homeButton = new Ref<HTMLDivElement>();
  public profileButton = new Ref<HTMLDivElement>();
  public paymentButton = new Ref<HTMLDivElement>();
  public payoutButton = new Ref<HTMLDivElement>();
  public statementsButton = new Ref<HTMLDivElement>();

  private pageSwitcher = new TabSwitcher();
  public paymentPage: PaymentPage;
  public payoutPage: PayoutPage;
  public profilePage: ProfilePage;
  public statementsPage: StatementsPage;

  public constructor(
    private createPaymentPage: typeof PaymentPage.create,
    private createPayoutPage: typeof PayoutPage.create,
    private createProfilePage: typeof ProfilePage.create,
    private createStatementsPage: typeof StatementsPage.create,
    private appendBodies: AddBodiesFn,
    public canEarn: boolean,
  ) {
    super();
    appendBodies(
      eBottomNavigationBarRef(
        this.navigationBar,
        eNavigationItemRef(
          this.homeButton,
          createHomeIcon(SCHEME.neutral1),
          LOCALIZED_TEXT.homeLabel,
        ),
        eNavigationItemRef(
          this.profileButton,
          createAccountIcon(SCHEME.neutral1),
          LOCALIZED_TEXT.accountLabel,
        ),
        eNavigationItemRef(
          this.paymentButton,
          createPaymentIcon(SCHEME.neutral1),
          LOCALIZED_TEXT.paymentLabel,
        ),
        ...(canEarn
          ? [
              eNavigationItemRef(
                this.payoutButton,
                createCoinsHandIcon(SCHEME.neutral1),
                LOCALIZED_TEXT.payoutLabel,
              ),
            ]
          : []),
        eNavigationItemRef(
          this.statementsButton,
          createDocumentIcon(SCHEME.neutral1),
          LOCALIZED_TEXT.statementsLabel,
        ),
      ),
    );
    this.homeButton.val.addEventListener("click", () => this.emit("goToHome"));
    this.profileButton.val.addEventListener("click", () => {
      this.pushRl({ profile: {} });
    });
    this.paymentButton.val.addEventListener("click", () => {
      this.pushRl({ payment: {} });
    });
    this.payoutButton.val?.addEventListener("click", () => {
      this.pushRl({ payout: {} });
    });
    this.statementsButton.val.addEventListener("click", () => {
      this.pushRl({ statements: {} });
    });
  }

  private pushRl(rl: AccountPageRl): void {
    this.emit("pushRl", rl);
    this.applyRl(rl);
  }

  public applyRl(rl?: AccountPageRl): this {
    if (!rl) {
      rl = {};
    }
    if (!this.canEarn && rl.payout) {
      rl.payout = undefined;
      this.emit("replaceRl", rl);
    }
    if (!rl.payment && !rl.payout && !rl.profile && !rl.statements) {
      rl.profile = {};
    }
    if (rl.profile && !this.profilePage) {
      this.pageSwitcher.goTo(
        () => this.addProfilePage(),
        () => this.removeProfilePage(),
      );
    } else if (rl.payment && !this.paymentPage) {
      this.pageSwitcher.goTo(
        () => this.addPaymentPage(),
        () => this.removePaymentPage(),
      );
    } else if (rl.payout && !this.payoutPage) {
      this.pageSwitcher.goTo(
        () => this.addPayoutPage(),
        () => this.removePayoutPage(),
      );
    } else if (rl.statements && !this.statementsPage) {
      this.pageSwitcher.goTo(
        () => this.addStatementsPage(this.canEarn),
        () => this.removeStatementsPage(),
      );
    }
    return this;
  }

  private addPaymentPage(): void {
    this.paymentPage = this.createPaymentPage();
    document.body.append(this.paymentPage.body);
  }

  private removePaymentPage(): void {
    this.paymentPage.remove();
    this.paymentPage = undefined;
  }

  private addPayoutPage(): void {
    this.payoutPage = this.createPayoutPage();
    document.body.append(this.payoutPage.body);
  }

  private removePayoutPage(): void {
    this.payoutPage.remove();
    this.payoutPage = undefined;
  }

  private addProfilePage(): void {
    this.profilePage = this.createProfilePage(this.appendBodies)
      .on("chooseAccount", () => this.emit("chooseAccount"))
      .on("signOut", () => this.emit("signOut"));
  }

  private removeProfilePage(): void {
    this.profilePage.remove();
    this.profilePage = undefined;
  }

  private addStatementsPage(canEarn: boolean): void {
    this.statementsPage = this.createStatementsPage(canEarn);
    document.body.append(this.statementsPage.body);
  }

  private removeStatementsPage(): void {
    this.statementsPage.remove();
    this.statementsPage = undefined;
  }

  public remove(): void {
    this.navigationBar.val.remove();
    this.pageSwitcher.remove();
    this.removeAllListeners();
  }
}
