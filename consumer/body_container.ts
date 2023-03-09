import EventEmitter = require("events");
import { LOCAL_SESSION_STORAGE } from "./common/local_session_storage";
import { WEB_SERVICE_CLIENT } from "./common/web_service_client";
import { ContentPage } from "./content_page/container";
import { ContentPageState } from "./content_page/state";
import { SignInPage } from "./sign_in_page";
import { SignUpPage } from "./sign_up_page";
import { LazyInstance } from "@selfage/once/lazy_instance";
import { WebServiceClient } from "@selfage/web_service_client";
import { LocalSessionStorage } from "@selfage/web_service_client/local_session_storage";

export enum Page {
  SIGN_IN = 1,
  SIGN_UP = 2,
  CONTENT = 3,
}

export interface BodyContainer {
  on(event: "newState", listener: (newState: ContentPageState) => void): this;
}

export class BodyContainer extends EventEmitter {
  private lazySignInPage: LazyInstance<SignInPage>;
  private lazySignUpPage: LazyInstance<SignUpPage>;
  private lazyContentPage: LazyInstance<ContentPage>;
  private lastShownPage: Page;
  private state: ContentPageState;

  public constructor(
    private body: HTMLElement,
    private signInPageFactoryFn: () => SignInPage,
    private signUpPageFactoryFn: () => SignUpPage,
    private contentPageFactoryFn: (
      appendBodiesFn: (bodies: Array<HTMLElement>) => void
    ) => ContentPage,
    private localSessionStorage: LocalSessionStorage,
    private webServiceClient: WebServiceClient
  ) {
    super();
    this.lazySignInPage = new LazyInstance(() => {
      let page = this.signInPageFactoryFn();
      this.body.append(page.body);
      page.on("signUp", () => this.showSignUp());
      page.on("signedIn", () => this.showContent());
      return page;
    });
    this.lazySignUpPage = new LazyInstance(() => {
      let page = this.signUpPageFactoryFn();
      this.body.append(page.body);
      page.on("signIn", () => this.showSignIn());
      page.on("signedUp", () => this.showContent());
      return page;
    });
    this.lazyContentPage = new LazyInstance(() => {
      let page = this.contentPageFactoryFn((bodies) => {
        this.body.append(...bodies);
      });
      page.on("signOut", () => this.showSignIn());
      page.on("newState", (state) => this.emit("newState", state));
      return page;
    });
  }

  public static create(
    body: HTMLElement
  ): BodyContainer {
    return new BodyContainer(
      body,
      SignInPage.create,
      SignUpPage.create,
      ContentPage.create,
      LOCAL_SESSION_STORAGE,
      WEB_SERVICE_CLIENT
    );
  }

  public show(): void {
    if (this.localSessionStorage.read()) {
      this.showContent();
    } else {
      this.showSignIn();
    }
    this.webServiceClient.on("unauthenticated", () => {
      this.showSignIn();
    });
  }

  private showSignUp() {
    this.hidePage();
    this.lazySignUpPage.get().show();
    this.lastShownPage = Page.SIGN_UP;
  }

  private showSignIn() {
    this.hidePage();
    this.lazySignInPage.get().show();
    this.lastShownPage = Page.SIGN_IN;
  }

  private showContent() {
    this.hidePage();
    this.lazyContentPage.get().show(this.state);
    this.lastShownPage = Page.CONTENT;
  }

  private hidePage(): void {
    switch (this.lastShownPage) {
      case Page.SIGN_IN:
        this.lazySignInPage.get().hide();
        break;
      case Page.SIGN_UP:
        this.lazySignUpPage.get().hide();
        break;
      case Page.CONTENT:
        this.lazyContentPage.get().hide();
        break;
    }
  }

  public updateState(newState: ContentPageState): void {
    this.state = newState;
    if (this.lastShownPage === Page.CONTENT) {
      this.lazyContentPage.get().show(this.state);
    }
  }
}
