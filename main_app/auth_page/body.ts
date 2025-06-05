import EventEmitter = require("events");
import { AddBodiesFn } from "../../common/add_bodies_fn";
import { TabSwitcher } from "../../common/page_navigator";
import { SignInPage } from "./sign_in_page";
import { SignUpPage } from "./sign_up_page";
import { AccountType } from "@phading/user_service_interface/account_type";

export interface AuthPage {
  on(event: "signedIn", listener: () => void): this;
}

export class AuthPage extends EventEmitter {
  public static create(
    appendBodiesFn: AddBodiesFn,
    signUpInitAccountType?: AccountType,
  ): AuthPage {
    return new AuthPage(
      SignInPage.create,
      SignUpPage.create,
      appendBodiesFn,
      signUpInitAccountType,
    );
  }

  public signInPage: SignInPage;
  public signUpPage: SignUpPage;
  private pageSwitcher = new TabSwitcher();

  public constructor(
    private createSignInPage: () => SignInPage,
    private createSignUpPage: (initAccountType?: AccountType) => SignUpPage,
    private appendBodiesFn: AddBodiesFn,
    signUpInitAccountType?: AccountType,
  ) {
    super();
    if (!signUpInitAccountType) {
      this.pageSwitcher.goTo(
        () => this.addSignInPage(),
        () => this.signInPage.remove(),
      );
    } else {
      this.pageSwitcher.goTo(
        () => this.addSignUpPage(signUpInitAccountType),
        () => this.signUpPage.remove(),
      );
    }
  }

  private addSignInPage(): void {
    this.signInPage = this.createSignInPage()
      .on("signUp", () =>
        this.pageSwitcher.goTo(
          () => this.addSignUpPage(),
          () => this.signUpPage.remove(),
        ),
      )
      .on("signedIn", () => this.emit("signedIn"));
    this.appendBodiesFn(this.signInPage.body);
  }

  private addSignUpPage(signUpInitAccountType?: AccountType): void {
    this.signUpPage = this.createSignUpPage(signUpInitAccountType)
      .on("signIn", () =>
        this.pageSwitcher.goTo(
          () => this.addSignInPage(),
          () => this.signInPage.remove(),
        ),
      )
      .on("signedUp", () => this.emit("signedIn"));
    this.appendBodiesFn(this.signUpPage.body);
  }

  public remove(): void {
    this.pageSwitcher.remove();
  }
}
