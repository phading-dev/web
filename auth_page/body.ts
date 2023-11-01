import EventEmitter = require("events");
import { AddBodiesFn } from "../common/add_bodies_fn";
import { PageNavigator } from "../common/page_navigator";
import { SignInPage } from "./sign_in_page";
import { SignUpPage } from "./sign_up_page";

enum Page {
  SIGN_IN,
  SIGN_UP,
}

export interface AuthPage {
  on(event: "signedIn", listener: () => void): this;
}

export class AuthPage extends EventEmitter {
  public static create(appendBodiesFn: AddBodiesFn): AuthPage {
    return new AuthPage(SignInPage.create, SignUpPage.create, appendBodiesFn);
  }

  private signInPage_: SignInPage;
  private signUpPage_: SignUpPage;
  private pageNavigator: PageNavigator<Page>;

  public constructor(
    private createSignInPage: () => SignInPage,
    private createSignUpPage: () => SignUpPage,
    private appendBodiesFn: AddBodiesFn
  ) {
    super();
    this.pageNavigator = new PageNavigator(
      (page) => this.addPage(page),
      (page) => this.removePage(page)
    );
    this.pageNavigator.goTo(Page.SIGN_IN);
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.SIGN_IN: {
        this.signInPage_ = this.createSignInPage();
        this.appendBodiesFn(this.signInPage_.body);
        this.signInPage_.on("signUp", () =>
          this.pageNavigator.goTo(Page.SIGN_UP)
        );
        this.signInPage_.on("signedIn", () => this.emit("signedIn"));
        break;
      }
      case Page.SIGN_UP: {
        this.signUpPage_ = this.createSignUpPage();
        this.appendBodiesFn(this.signUpPage_.body);
        this.signUpPage_.on("signIn", () =>
          this.pageNavigator.goTo(Page.SIGN_IN)
        );
        this.signUpPage_.on("signedUp", () => this.emit("signedIn"));
        break;
      }
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.SIGN_IN:
        this.signInPage_.remove();
        break;
      case Page.SIGN_UP:
        this.signUpPage_.remove();
        break;
    }
  }

  public remove(): void {
    this.pageNavigator.remove();
  }

  // Visible for testing
  public get signInPage() {
    return this.signInPage_;
  }

  public get signUpPage() {
    return this.signUpPage_;
  }
}
