import EventEmitter = require("events");
import { AddBodiesFn } from "../../common/add_bodies_fn";
import { TabSwitcher } from "../../common/page_navigator";
import { ChangeEmailPage } from "./change_email_page/body";
import { PasswordResetSentPage } from "./password_reset_sent_page/body";
import { SendEmailVerificationPage } from "./send_email_verification_page/body";
import { SendPasswordResetPage } from "./send_password_reset_page/body";
import { SignInPage } from "./sign_in_page/body";
import { SignUpPage } from "./sign_up_page/body";
import { AccountType } from "@phading/user_service_interface/account_type";

export interface AuthPage {
  on(event: "auth", listener: (signedSession: string) => void): this;
}

export class AuthPage extends EventEmitter {
  public static create(
    appendBodiesFn: AddBodiesFn,
    signUpInitAccountType?: AccountType,
  ): AuthPage {
    return new AuthPage(
      ChangeEmailPage.create,
      PasswordResetSentPage.create,
      SendEmailVerificationPage.create,
      SendPasswordResetPage.create,
      SignInPage.create,
      SignUpPage.create,
      appendBodiesFn,
      signUpInitAccountType,
    );
  }

  public changeEmailPage: ChangeEmailPage;
  public passwordResetSentPage: PasswordResetSentPage;
  public sendEmailVerificationPage: SendEmailVerificationPage;
  public sendPasswordResetPage: SendPasswordResetPage;
  public signInPage: SignInPage;
  public signUpPage: SignUpPage;
  private pageSwitcher = new TabSwitcher();

  public constructor(
    private createChangeEmailPage: typeof ChangeEmailPage.create,
    private createPasswordResetSentPage: typeof PasswordResetSentPage.create,
    private createSendEmailVerificationPage: typeof SendEmailVerificationPage.create,
    private createSendPasswordResetPage: typeof SendPasswordResetPage.create,
    private createSignInPage: typeof SignInPage.create,
    private createSignUpPage: typeof SignUpPage.create,
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

  private addChangeEmailPage(email: string): void {
    this.changeEmailPage = this.createChangeEmailPage(email)
      .on("back", () =>
        this.pageSwitcher.goTo(
          () => this.addSignInPage(),
          () => this.signInPage.remove(),
        ),
      )
      .on("verifyEmail", (email) =>
        this.pageSwitcher.goTo(
          () => this.addSendEmailVerificationPage(email),
          () => this.sendEmailVerificationPage.remove(),
        ),
      );
    this.appendBodiesFn(this.changeEmailPage.body);
  }

  private addPasswordResetSentPage(email: string): void {
    this.passwordResetSentPage = this.createPasswordResetSentPage(email).on(
      "back",
      () =>
        this.pageSwitcher.goTo(
          () => this.addSignInPage(),
          () => this.signInPage.remove(),
        ),
    );
    this.appendBodiesFn(this.passwordResetSentPage.body);
  }

  private addSendEmailVerificationPage(email: string): void {
    this.sendEmailVerificationPage = this.createSendEmailVerificationPage(
      email,
    ).on("changeEmail", (email) =>
      this.pageSwitcher.goTo(
        () => this.addChangeEmailPage(email),
        () => this.changeEmailPage.remove(),
      ),
    );
    this.appendBodiesFn(this.sendEmailVerificationPage.body);
  }

  private addSendPasswordResetPage(): void {
    this.sendPasswordResetPage = this.createSendPasswordResetPage()
      .on("back", () =>
        this.pageSwitcher.goTo(
          () => this.addSignInPage(),
          () => this.signInPage.remove(),
        ),
      )
      .on("showSuccess", (email) =>
        this.pageSwitcher.goTo(
          () => this.addPasswordResetSentPage(email),
          () => this.passwordResetSentPage.remove(),
        ),
      );
    this.appendBodiesFn(this.sendPasswordResetPage.body);
  }

  private addSignInPage(): void {
    this.signInPage = this.createSignInPage()
      .on("signUp", () =>
        this.pageSwitcher.goTo(
          () => this.addSignUpPage(),
          () => this.signUpPage.remove(),
        ),
      )
      .on("verifyEmail", (email) =>
        this.pageSwitcher.goTo(
          () => this.addSendEmailVerificationPage(email),
          () => this.sendEmailVerificationPage.remove(),
        ),
      )
      .on("resetPassword", () =>
        this.pageSwitcher.goTo(
          () => this.addSendPasswordResetPage(),
          () => this.sendPasswordResetPage.remove(),
        ),
      )
      .on("auth", (signedSession) => this.emit("auth", signedSession));
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
      .on("verifyEmail", (email) =>
        this.pageSwitcher.goTo(
          () => this.addSendEmailVerificationPage(email),
          () => this.sendEmailVerificationPage.remove(),
        ),
      );
    this.appendBodiesFn(this.signUpPage.body);
  }

  public remove(): void {
    this.pageSwitcher.remove();
    this.removeAllListeners();
  }
}
