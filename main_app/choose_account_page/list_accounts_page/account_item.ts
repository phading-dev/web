import EventEmitter = require("events");
import { SCHEME } from "../../../common/color_scheme";
import { createPlusIcon } from "../../../common/icons";
import { AVATAR_M, FONT_M, ICON_M, LINE_HEIGHT_M } from "../../../common/sizes";
import { AccountSummary } from "@phading/user_service_interface/web/self/account";
import { E } from "@selfage/element/factory";

let ITEM_WIDTH = 17; // rem
let ITEM_HEIGHT = 20; // rem
let ITEM_BORDER_RADIUS = 1; // rem

export interface AccountItem {
  on(event: "choose", listener: (accountId: string) => void): this;
}

export class AccountItem extends EventEmitter {
  public static create(account: AccountSummary): AccountItem {
    return new AccountItem(account);
  }

  public body: HTMLDivElement;

  public constructor(account: AccountSummary) {
    super();
    this.body = E.div(
      {
        class: "account-item",
        style: `width: ${ITEM_WIDTH}rem; height: ${ITEM_HEIGHT}rem; box-sizing: border-box; padding: 2rem 1rem 1rem 1rem; display: flex; flex-flow: column nowrap; justify-content: space-between; align-items: center; border-radius: ${ITEM_BORDER_RADIUS}rem; border: .1rem solid ${SCHEME.neutral1}; cursor: pointer;`,
      },
      E.image({
        class: "account-item-avatar",
        style: `width: ${AVATAR_M}rem; height: ${AVATAR_M}rem; border-radius: 100%;`,
        src: account.avatarSmallUrl,
      }),
      E.div(
        {
          class: "account-item-natural-name",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; height: ${LINE_HEIGHT_M * 3}rem; overflow: hidden; color: ${SCHEME.neutral0}; text-align: center;`,
        },
        E.text(account.naturalName),
      ),
    );

    this.body.addEventListener("click", () =>
      this.emit("choose", account.accountId),
    );
  }

  public click(): void {
    this.body.click();
  }

  public remove(): void {
    this.body.remove();
  }
}

export interface AddAccountItem {
  on(event: "create", listener: (accountId: string) => void): this;
}

export class AddAccountItem extends EventEmitter {
  public static create(): AddAccountItem {
    return new AddAccountItem();
  }

  public body: HTMLDivElement;

  public constructor() {
    super();
    this.body = E.div(
      {
        class: "add-account-item",
        style: `width: ${ITEM_WIDTH}rem; height: ${ITEM_HEIGHT}rem; box-sizing: border-box; display: flex; flex-flow: column nowrap; justify-content: center; align-items: center; border-radius: ${ITEM_BORDER_RADIUS}rem; border: .1rem solid ${SCHEME.neutral1}; cursor: pointer;`,
      },
      E.div(
        {
          class: "add-account-item-icon",
          style: `width: ${ICON_M}rem; height: ${ICON_M}rem;`,
        },
        createPlusIcon(SCHEME.neutral1),
      ),
    );

    this.body.addEventListener("click", () => this.emit("create"));
  }

  public click(): void {
    this.body.click();
  }

  public remove(): void {
    this.body.remove();
  }
}
