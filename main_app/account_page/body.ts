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
  on(event: "replaceUrl", listener: (newUrl: AccountPageUrl) => void): this;
  on(event: "newUrl", listener: (newUrl: AccountPageUrl) => void): this;
  on(event: "goToHome", listener: () => void): this;
  on(event: "switchAccount", listener: () => void): this;
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
  private url: AccountPageUrl;
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
    if (newUrl.profile && !this.url?.profile) {
      this.pageSwitcher.goTo(
        () => this.addProfilePage(),
        () => this.profilePage.remove(),
      );
    } else if (newUrl.payment && !this.url?.payment) {
      this.pageSwitcher.goTo(
        () => this.addPaymentPage(),
        () => this.paymentPage.remove(),
      );
    } else if (newUrl.payout && !this.url?.payout) {
      this.pageSwitcher.goTo(
        () => this.addPayoutPage(),
        () => this.payoutPage.remove(),
      );
    } else if (newUrl.statements && !this.url?.statements) {
      this.pageSwitcher.goTo(
        () => this.addStatementsPage(canEarn),
        () => this.statementsPage.remove(),
      );
    }

    if (canEarn) {
      this.payoutButton.val.style.display = "flex";
    } else {
      this.payoutButton.val.style.display = "none";
    }

    this.canEarn = canEarn;
    this.url = newUrl;
    return this;
  }

  private addPaymentPage(): void {
    this.paymentPage = this.createPaymentPage();
    document.body.append(this.paymentPage.body);
  }

  private addPayoutPage(): void {
    this.payoutPage = this.createPayoutPage();
    document.body.append(this.payoutPage.body);
  }

  private addProfilePage(): void {
    this.profilePage = this.createProfilePage(this.appendBodies)
      .on("switchAccount", () => this.emit("switchAccount"))
      .on("signOut", () => this.emit("signOut"));
  }

  private addStatementsPage(canEarn: boolean): void {
    this.statementsPage = this.createStatementsPage(canEarn);
    document.body.append(this.statementsPage.body);
  }

  public remove(): void {
    this.navigationBar.val.remove();
    this.pageSwitcher.remove();
  }
}
