import EventEmitter = require("events");
import { AddBodiesFn } from "../common/add_bodies_fn";
import { PageNavigator } from "../common/page_navigator";
import { SignInPage } from "./sign_in_page";
import { SignUpPage } from "./sign_up_page";
import { ProductType } from "@phading/user_service_interface/product_type";
import { UserType } from "@phading/user_service_interface/user_type";

enum Page {
  SIGN_IN,
  SIGN_UP,
}

export interface AuthPage {
  on(
    event: "signedIn",
    listener: (userType: UserType, productType: ProductType) => void
  ): this;
}

export class AuthPage extends EventEmitter {
  // Visible for testing
  public signInPage: SignInPage;
  public signUpPage: SignUpPage;
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

  public static create(appendBodiesFn: AddBodiesFn): AuthPage {
    return new AuthPage(SignInPage.create, SignUpPage.create, appendBodiesFn);
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.SIGN_IN: {
        this.signInPage = this.createSignInPage();
        this.appendBodiesFn(this.signInPage.body);
        this.signInPage.on("signUp", () =>
          this.pageNavigator.goTo(Page.SIGN_UP)
        );
        this.signInPage.on("signedIn", (userType, productType) =>
          this.emit("signedIn", userType, productType)
        );
        break;
      }
      case Page.SIGN_UP: {
        this.signUpPage = this.createSignUpPage();
        this.appendBodiesFn(this.signUpPage.body);
        this.signUpPage.on("signIn", () =>
          this.pageNavigator.goTo(Page.SIGN_IN)
        );
        this.signUpPage.on("signedUp", (userType, productType) =>
          this.emit("signedIn", userType, productType)
        );
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
