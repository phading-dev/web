import EventEmitter = require("events");
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
  // Visible for testing
  public signInPage: SignInPage;
  public signUpPage: SignUpPage;
  private pageNavigator: PageNavigator<Page>;

  public constructor(
    private signInPageFactoryFn: () => SignInPage,
    private signUpPageFactoryFn: () => SignUpPage,
    private appendBodiesFn: (...bodies: Array<HTMLElement>) => void
  ) {
    super();
    this.pageNavigator = new PageNavigator(
      (page) => this.addPage(page),
      (page) => this.removePage(page)
    );
    this.pageNavigator.goTo(Page.SIGN_IN);
  }

  public static create(
    appendBodiesFn: (...bodies: Array<HTMLElement>) => void
  ): AuthPage {
    return new AuthPage(SignInPage.create, SignUpPage.create, appendBodiesFn);
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.SIGN_IN: {
        this.signInPage = this.signInPageFactoryFn();
        this.appendBodiesFn(this.signInPage.body);
        this.signInPage.on("signUp", () =>
          this.pageNavigator.goTo(Page.SIGN_UP)
        );
        this.signInPage.on("signedIn", () => this.emit("signedIn"));
        break;
      }
      case Page.SIGN_UP: {
        this.signUpPage = this.signUpPageFactoryFn();
        this.appendBodiesFn(this.signUpPage.body);
        this.signUpPage.on("signIn", () =>
          this.pageNavigator.goTo(Page.SIGN_IN)
        );
        this.signUpPage.on("signedUp", () => this.emit("signedIn"));
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
