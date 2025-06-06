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
import { AccountPage as AccountPageUrl } from "@phading/web_interface/main/account/page";
import { Ref } from "@selfage/ref";

export interface AccountPage {
  on(event: "replaceUrl", listener: (url: AccountPageUrl) => void): this;
  on(event: "newUrl", listener: (url: AccountPageUrl) => void): this;
  on(event: "goToHome", listener: () => void): this;
  on(event: "chooseAccount", listener: () => void): this;
  on(event: "signOut", listener: () => void): this;
}

export class AccountPage extends EventEmitter {
  public static create(appendBodies: AddBodiesFn): AccountPage {
    return new AccountPage(
      PaymentPage.create,
      PayoutPage.create,
      ProfilePage.create,
      StatementsPage.create,
      appendBodies,
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
  private canEarn: boolean;

  public constructor(
    private createPaymentPage: typeof PaymentPage.create,
    private createPayoutPage: typeof PayoutPage.create,
    private createProfilePage: typeof ProfilePage.create,
    private createStatementsPage: typeof StatementsPage.create,
    private appendBodies: AddBodiesFn,
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
        eNavigationItemRef(
          this.payoutButton,
          createCoinsHandIcon(SCHEME.neutral1),
          LOCALIZED_TEXT.payoutLabel,
        ),
        eNavigationItemRef(
          this.statementsButton,
          createDocumentIcon(SCHEME.neutral1),
          LOCALIZED_TEXT.statementsLabel,
        ),
      ),
    );
    this.homeButton.val.addEventListener("click", () => this.emit("goToHome"));
    this.profileButton.val.addEventListener("click", () => {
      this.newUrl({ profile: {} });
    });
    this.paymentButton.val.addEventListener("click", () => {
      this.newUrl({ payment: {} });
    });
    this.payoutButton.val.addEventListener("click", () => {
      this.newUrl({ payout: {} });
    });
    this.statementsButton.val.addEventListener("click", () => {
      this.newUrl({ statements: {} });
    });
  }

  private newUrl(newUrl: AccountPageUrl): void {
    this.emit("newUrl", newUrl);
    this.applyUrl(this.canEarn, newUrl);
  }

  public applyUrl(canEarn: boolean, newUrl?: AccountPageUrl): this {
    if (!newUrl) {
      newUrl = {};
    }
    if (!canEarn) {
      newUrl.payout = undefined;
      this.emit("replaceUrl", newUrl);
    }
    if (
      !newUrl.payment &&
      !newUrl.payout &&
      !newUrl.profile &&
      !newUrl.statements
    ) {
      newUrl.profile = {};
    }
    if (newUrl.profile && !this.profilePage) {
      this.pageSwitcher.goTo(
        () => this.addProfilePage(),
        () => this.removeProfilePage(),
      );
    } else if (newUrl.payment && !this.paymentPage) {
      this.pageSwitcher.goTo(
        () => this.addPaymentPage(),
        () => this.removePaymentPage(),
      );
    } else if (newUrl.payout && !this.payoutPage) {
      this.pageSwitcher.goTo(
        () => this.addPayoutPage(),
        () => this.removePayoutPage(),
      );
    } else if (newUrl.statements && !this.statementsPage) {
      this.pageSwitcher.goTo(
        () => this.addStatementsPage(canEarn),
        () => this.removeStatementsPage(),
      );
    }

    if (canEarn) {
      this.payoutButton.val.style.display = "flex";
    } else {
      this.payoutButton.val.style.display = "none";
    }

    this.canEarn = canEarn;
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
  }
}
