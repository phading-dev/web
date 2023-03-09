import EventEmitter = require("events");
import { SCHEME } from "../../common/color_scheme";
import { AccountBasicTab } from "./account_basic_tab";
import { ChangeAvatarTab } from "./change_avatar_tab";
import { ACCOUNT_PAGE_STATE, AccountPageState, Page } from "./state";
import { E } from "@selfage/element/factory";
import { copyMessage } from "@selfage/message/copier";
import { LazyInstance } from "@selfage/once/lazy_instance";
import { Ref } from "@selfage/ref";

export interface AccountPage {
  on(event: "newState", listener: (newState: AccountPageState) => void): this;
}

export class AccountPage extends EventEmitter {
  public body: HTMLDivElement;
  private card: HTMLDivElement;
  private lazyAccountBasicTab: LazyInstance<AccountBasicTab>;
  private lazyChangeAvatarTab: LazyInstance<ChangeAvatarTab>;
  private state: AccountPageState = {};

  public constructor(
    private prependMenuBodiesFn: (menuBodies: Array<HTMLElement>) => void,
    private accountBasicTabFactoryFn: () => AccountBasicTab,
    private changeAvatarTabFactoryFn: () => ChangeAvatarTab
  ) {
    super();
    let cardRef = new Ref<HTMLDivElement>();
    this.body = E.div(
      {
        class: "account",
        style: `flex-flow: row nowrap; justify-content: center; width: 100vw;`,
      },
      E.divRef(cardRef, {
        class: "account-card",
        style: `background-color: ${SCHEME.neutral4}; width: 100%; max-width: 100rem;`,
      })
    );
    this.card = cardRef.val;

    this.lazyAccountBasicTab = new LazyInstance(() => {
      let tab = this.accountBasicTabFactoryFn();
      this.card.append(tab.body);
      tab.on("changeAvatar", () => this.goToChangeAvatar());
      return tab;
    });
    this.lazyChangeAvatarTab = new LazyInstance(() => {
      let tab = this.changeAvatarTabFactoryFn();
      this.card.append(tab.body);
      tab.on("back", () => this.goToAccountBasic());
      this.prependMenuBodiesFn([tab.prependMenuBody]);
      return tab;
    });
  }

  public static create(
    prependMenuBodiesFn: (menuBodies: Array<HTMLElement>) => void
  ): AccountPage {
    return new AccountPage(
      prependMenuBodiesFn,
      AccountBasicTab.create,
      ChangeAvatarTab.create
    );
  }

  private goToChangeAvatar(): void {
    let newState = this.copyState();
    newState.page = Page.ChangeAvatar;
    this.showFromInternal(newState);
  }

  private goToAccountBasic(): void {
    let newState = this.copyState();
    newState.page = Page.Basic;
    this.showFromInternal(newState);
  }

  private copyState(): AccountPageState {
    return copyMessage(this.state, ACCOUNT_PAGE_STATE);
  }

  private showFromInternal(newState: AccountPageState): void {
    this.show(newState);
    this.emit("newState", this.state);
  }

  public show(newState?: AccountPageState): this {
    this.body.style.display = "flex";

    if (!newState) {
      newState = {};
    }
    if (!newState.page) {
      newState.page = Page.Basic;
    }
    if (newState.page !== this.state.page) {
      this.hidePage();
    }
    switch (newState.page) {
      case Page.Basic:
        this.lazyAccountBasicTab.get().show();
        break;
      case Page.ChangeAvatar:
        this.lazyChangeAvatarTab.get().show();
        break;
    }
    this.state = newState;
    return this;
  }

  private async hidePage(): Promise<void> {
    switch (this.state.page) {
      case Page.Basic:
        this.lazyAccountBasicTab.get().hide();
        break;
      case Page.ChangeAvatar:
        this.lazyChangeAvatarTab.get().hide();
        break;
    }
  }

  public hide(): this {
    this.body.style.display = "none";
    this.hidePage();
    return this;
  }
}
