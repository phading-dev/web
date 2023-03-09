import EventEmitter = require("events");
import LRU = require("lru-cache");
import { MenuItem } from "../menu_item/container";
import { createWritePostMenuItem } from "../menu_item/factory";
import { QuickTalesPage } from "./quick_tales_page/container";
import { HOME_PAGE_STATE, HomePageState, Page } from "./state";
import { WriteTalePage } from "./write_tale_page/container";
import { TaleContext } from "@phading/tale_service_interface/tale_context";
import { copyMessage } from "@selfage/message/copier";

export interface HomePage {
  on(event: "newState", listener: (newState: HomePageState) => void): this;
}

export class HomePage extends EventEmitter {
  // Visible for testing
  public talesListPages: LRU<string, QuickTalesPage>;
  public writeTalePages: LRU<string, WriteTalePage>;
  public writeTaleMenuItem: MenuItem;
  private state: HomePageState = {};
  public constructor(
    private appendBodiesFn: (bodies: Array<HTMLElement>) => void,
    private prependMenuBodiesFn: (menuBodies: Array<HTMLElement>) => void,
    private appendMenuBodiesFn: (menuBodies: Array<HTMLElement>) => void,
    private appendControllerBodiesFn: (
      controllerBodies: Array<HTMLElement>
    ) => void,
    private writeTalePageFactoryFn: (taleId: string) => WriteTalePage,
    private talesListPageFactoryFn: (
      context: TaleContext,
      appendBodiesFn: (bodies: Array<HTMLElement>) => void,
      prependMenuBodiesFn: (menuBodies: Array<HTMLElement>) => void,
      appendMenuBodiesFn: (menuBodies: Array<HTMLElement>) => void,
      appendControllerBodiesFn: (controllerBodies: Array<HTMLElement>) => void
    ) => QuickTalesPage
  ) {
    super();
    this.talesListPages = new LRU<string, QuickTalesPage>({
      max: 20,
      disposeAfter: (value) => this.disposeTalesListPage(value),
    });
    this.writeTalePages = new LRU<string, WriteTalePage>({
      max: 20,
      disposeAfter: (value) => this.disposeWriteTalePage(value),
    });

    this.writeTaleMenuItem = createWritePostMenuItem();
    this.appendMenuBodiesFn([this.writeTaleMenuItem.body]);
    this.writeTaleMenuItem.on("action", () => this.goToWriteTalePage());
  }

  public static create(
    appendBodiesFn: (bodies: Array<HTMLElement>) => void,
    prependMenuBodiesFn: (menuBodies: Array<HTMLElement>) => void,
    appendMenuBodiesFn: (menuBodies: Array<HTMLElement>) => void,
    appendControllerBodiesFn: (controllerBodies: Array<HTMLElement>) => void
  ): HomePage {
    return new HomePage(
      appendBodiesFn,
      prependMenuBodiesFn,
      appendMenuBodiesFn,
      appendControllerBodiesFn,
      WriteTalePage.create,
      QuickTalesPage.create
    );
  }

  private disposeTalesListPage(page: QuickTalesPage): void {
    page.remove();
  }

  private disposeWriteTalePage(page: WriteTalePage): void {
    page.remove();
  }

  private goToWriteTalePage(): void {
    let newState = this.copyToNewState();
    newState.page = Page.Write;
    this.showFromInternal(newState);
  }

  private goBackFromWriteTalePage(): void {
    let newState = this.copyToNewState();
    newState.page = Page.List;
    this.showFromInternal(newState);
  }

  private goBackFromTalesListPage(): void {
    let newState = this.copyToNewState();
    newState.list.pop();
    this.showFromInternal(newState);
  }

  private goToPinedTalesListPage(context: TaleContext): void {
    let newState = this.copyToNewState();
    newState.list.push(context);
    this.showFromInternal(newState);
  }

  private goToReplyTalePage(taleId: string): void {
    let newState = this.copyToNewState();
    newState.page = Page.Reply;
    newState.reply = taleId;
    this.showFromInternal(newState);
  }

  private copyToNewState(): HomePageState {
    return copyMessage(this.state, HOME_PAGE_STATE);
  }

  private showFromInternal(newState: HomePageState): void {
    this.show(newState);
    this.emit("newState", this.state);
  }

  public show(newState?: HomePageState): this {
    this.writeTaleMenuItem.show();

    if (!newState) {
      newState = {};
    }
    if (!newState.page) {
      newState.page = Page.List;
    }
    switch (newState.page) {
      case Page.List:
        if (!newState.list || newState.list.length === 0) {
          newState.list = [{}];
        } else if (newState.list[0].taleId || newState.list[0].userId) {
          newState.list[0] = {};
        }
        break;
      case Page.Reply:
        if (!newState.reply) {
          newState.page = Page.Write;
        }
        break;
    }

    if (newState.page !== this.state.page) {
      this.hidePage();
      switch (newState.page) {
        case Page.List:
          this.showTalesListPage(newState.list[newState.list.length - 1]);
          break;
        case Page.Write:
          this.showWriteTalePage();
          break;
        case Page.Reply:
          this.showWriteTalePage(newState.reply);
          break;
      }
    } else {
      switch (newState.page) {
        case Page.List:
          let newContextKey = HomePage.taleContextToKey(
            newState.list[newState.list.length - 1]
          );
          let oldContextKey = HomePage.taleContextToKey(
            this.state.list[this.state.list.length - 1]
          );
          if (newContextKey !== oldContextKey) {
            this.talesListPages.get(oldContextKey).hide();
          }
          this.showTalesListPage(newState.list[newState.list.length - 1]);
          break;
        case Page.Write:
          this.showWriteTalePage();
        case Page.Reply:
          if (newState.reply !== this.state.reply) {
            this.writeTalePages.get(this.state.reply).hide();
          }
          this.showWriteTalePage(newState.reply);
          break;
      }
    }
    this.state = newState;
    return this;
  }

  private hidePage(): void {
    switch (this.state.page) {
      case Page.List:
        this.talesListPages
          .get(
            HomePage.taleContextToKey(
              this.state.list[this.state.list.length - 1]
            )
          )
          .hide();
        break;
      case Page.Write:
        this.writeTalePages.get("").hide();
        break;
      case Page.Reply:
        this.writeTalePages.get(this.state.reply).hide();
        break;
    }
  }

  private showWriteTalePage(taleId: string = ""): void {
    if (this.writeTalePages.has(taleId)) {
      this.writeTalePages.get(taleId).show();
      return;
    }

    let writeTalePage = this.writeTalePageFactoryFn(taleId).show();
    this.writeTalePages.set(taleId, writeTalePage);
    this.appendBodiesFn([writeTalePage.body]);
    this.prependMenuBodiesFn([writeTalePage.prependMenuBody]);
    writeTalePage.on("back", () => this.goBackFromWriteTalePage());
  }

  private showTalesListPage(context: TaleContext): void {
    let contextKey = HomePage.taleContextToKey(context);
    if (this.talesListPages.has(contextKey)) {
      this.talesListPages.get(contextKey).show();
      return;
    }

    let talesListPage = this.talesListPageFactoryFn(
      context,
      this.appendBodiesFn,
      this.prependMenuBodiesFn,
      this.appendMenuBodiesFn,
      this.appendControllerBodiesFn
    ).show();
    this.talesListPages.set(contextKey, talesListPage);
    talesListPage.on("back", () => this.goBackFromTalesListPage());
    talesListPage.on("pin", (context) => this.goToPinedTalesListPage(context));
    talesListPage.on("reply", (taleId) => this.goToReplyTalePage(taleId));
  }

  public hide(): this {
    this.hidePage();
    this.writeTaleMenuItem.hide();
    return this;
  }

  private static taleContextToKey(taleContext: TaleContext): string {
    if (taleContext.taleId) {
      return `t:${taleContext.taleId}`;
    } else if (taleContext.userId) {
      return `u:${taleContext.userId}`;
    } else {
      return ``;
    }
  }
}
