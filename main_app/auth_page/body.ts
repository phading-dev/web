import EventEmitter = require("events");
import { AddBodiesFn } from "../../common/add_bodies_fn";
import { PageNavigator } from "../../common/page_navigator";
import { SignInPage } from "./sign_in_page";
import { SignUpPage } from "./sign_up_page";
import { AccountType } from "@phading/user_service_interface/account_type";

enum Page {
  SIGN_IN,
  SIGN_UP,
}

interface NavigationArgs {
  signUpInitAccountType?: AccountType;
}

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
  private pageNavigator: PageNavigator<Page, NavigationArgs>;

  public constructor(
    private createSignInPage: () => SignInPage,
    private createSignUpPage: (initAccountType?: AccountType) => SignUpPage,
    private appendBodiesFn: AddBodiesFn,
    signUpInitAccountType?: AccountType,
  ) {
    super();
    this.pageNavigator = new PageNavigator(
      (page, args) => this.addPage(page, args),
      (page) => this.removePage(page),
    );
    if (!signUpInitAccountType) {
      this.pageNavigator.goTo(Page.SIGN_IN);
    } else {
      this.pageNavigator.goTo(Page.SIGN_UP, {
        signUpInitAccountType,
      });
    }
  }

  private addPage(page: Page, args?: NavigationArgs): void {
    switch (page) {
      case Page.SIGN_IN: {
        this.signInPage = this.createSignInPage()
          .on("signUp", () => this.pageNavigator.goTo(Page.SIGN_UP))
          .on("signedIn", () => this.emit("signedIn"));
        this.appendBodiesFn(this.signInPage.body);
        break;
      }
      case Page.SIGN_UP: {
        this.signUpPage = this.createSignUpPage(args?.signUpInitAccountType)
          .on("signIn", () => this.pageNavigator.goTo(Page.SIGN_IN))
          .on("signedUp", () => this.emit("signedIn"));
        this.appendBodiesFn(this.signUpPage.body);
        break;
      }
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.SIGN_IN:
        this.signInPage.remove();
        break;
      case Page.SIGN_UP:
        this.signUpPage.remove();
        break;
    }
  }

  public remove(): void {
    this.pageNavigator.remove();
  }
}
