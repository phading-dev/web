import EventEmitter = require("events");
import { AddBodiesFn } from "../../common/add_bodies_fn";
import { SCHEME } from "../../common/color_scheme";
import { FONT_M } from "../../common/sizes";
import { AccountPage as AccountPageUrl } from "@phading/web_interface/main/account/page";
import { E } from "@selfage/element/factory";

export interface AccountPage {
  on(event: "newUrl", listener: (newUrl: AccountPageUrl) => void): this;
  on(event: "switchAccount", listener: () => void): this;
  on(event: "goToHome", listener: () => void): this;
  on(event: "signOut", listener: () => void): this;
}

export class AccountPage extends EventEmitter {
  public static create(appendBodies: AddBodiesFn): AccountPage {
    return new AccountPage(appendBodies);
  }

  public body: HTMLElement;

  public constructor(appendBodies: AddBodiesFn) {
    super();
    this.body = E.div(
      {
        class: "account-page",
        style: `font-size: ${FONT_M}rem; color: ${SCHEME.primary0};`,
      },
      E.text("Account page"),
    );
    appendBodies(this.body);
  }

  public applyUrl(newUrl?: AccountPageUrl): this {
    return this;
  }

  public remove(): void {
    this.body.remove();
  }
}
