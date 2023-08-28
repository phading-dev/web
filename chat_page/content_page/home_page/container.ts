import EventEmitter = require("events");
import LRU = require("lru-cache");
import { AddBodiesFn } from "../../common/add_bodies_fn";
import { MenuItem } from "../../common/menu_item/container";
import { createWritePostMenuItem } from "../../common/menu_item/factory";
import {
  QuickTalesPage,
  buildTaleContextKey,
} from "./quick_tales_page/container";
import { HOME_PAGE_STATE, HomePageState, Page } from "./state";
import { WriteTalePage } from "./write_tale_page/container";
import { TaleContext } from "@phading/tale_service_interface/tale_context";
import { copyMessage } from "@selfage/message/copier";

// Key is tale id.
export let WRITE_TALE_PAGE_CACHE = new LRU<string, WriteTalePage>({
  max: 10,
});

export interface HomePage {
  on(event: "newState", listener: (newState: HomePageState) => void): this;
}

export class HomePage extends EventEmitter {
  // Visible for testing
  public writeTaleMenuItem: MenuItem;
  public talesListPage: QuickTalesPage;
  public writeTalePage: WriteTalePage;
  private state: HomePageState = {};

  public constructor(
    private writeTalePageCache: LRU<string, WriteTalePage>,
    private createTalesListPage: (
      appendBodiesFn: AddBodiesFn,
      prependMenuBodiesFn: AddBodiesFn,
      appendMenuBodiesFn: AddBodiesFn,
      appendControllerBodiesFn: AddBodiesFn,
      context: TaleContext
    ) => QuickTalesPage,
    private createWriteTalePage: (taleId: string) => WriteTalePage,
    private appendBodies: AddBodiesFn,
    private prependMenuBodies: AddBodiesFn,
    private appendMenuBodies: AddBodiesFn,
    private appendControllerBodies: AddBodiesFn
  ) {
    super();
    this.writeTaleMenuItem = createWritePostMenuItem();
    this.appendMenuBodies(this.writeTaleMenuItem.body);
    this.writeTaleMenuItem.on("action", () => this.goToWriteTalePage());
  }

  public static create(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn,
    appendMenuBodies: (...bodies: Array<HTMLElement>) => void,
    appendControllerBodies: (...bodies: Array<HTMLElement>) => void
  ): HomePage {
    return new HomePage(
      WRITE_TALE_PAGE_CACHE,
      QuickTalesPage.create,
      WriteTalePage.create,
      appendBodies,
      prependMenuBodies,
      appendMenuBodies,
      appendControllerBodies
    );
  }

  private goToWriteTalePage(): void {
    let newState = this.copyToNewState();
    newState.page = Page.Write;
    newState.reply = "";
    this.updateStateAndBubbleUp(newState);
  }

  private copyToNewState(): HomePageState {
    return copyMessage(this.state, HOME_PAGE_STATE);
  }

  private updateStateAndBubbleUp(newState: HomePageState): void {
    this.updateState(newState);
    this.emit("newState", this.state);
  }

  public updateState(newState?: HomePageState): this {
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
    }

    switch (newState.page) {
      case Page.List:
        if (this.state.page !== Page.List) {
          this.removePage();
          this.state = newState;
          this.addPage();
        } else {
          let newKey = buildTaleContextKey(
            newState.list[newState.list.length - 1]
          );
          let oldKey = buildTaleContextKey(
            this.state.list[this.state.list.length - 1]
          );
          if (newKey !== oldKey) {
            this.removePage();
            this.state = newState;
            this.addPage();
          }
        }
        break;
      case Page.Write:
        if (
          this.state.page !== Page.Write ||
          newState.reply !== this.state.reply
        ) {
          this.removePage();
          this.state = newState;
          this.addPage();
        }
        break;
    }
    return this;
  }

  private removePage(): void {
    switch (this.state.page) {
      case Page.List:
        this.talesListPage.remove();
        break;
      case Page.Write:
        this.writeTalePage.remove();
        this.writeTalePage.removeAllListeners();
        break;
    }
  }

  private addPage(): void {
    switch (this.state.page) {
      case Page.List:
        this.talesListPage = this.createTalesListPage(
          this.appendBodies,
          this.prependMenuBodies,
          this.appendMenuBodies,
          this.appendControllerBodies,
          this.state.list[this.state.list.length - 1]
        );
        this.talesListPage.on("back", () => this.goToPreviousTalesListPage());
        this.talesListPage.on("pin", (context) =>
          this.goToPinedTalesListPage(context)
        );
        this.talesListPage.on("reply", (taleId) =>
          this.goToReplyTalePage(taleId)
        );
        break;
      case Page.Write:
        if (this.writeTalePageCache.has(this.state.reply)) {
          this.writeTalePage = this.writeTalePageCache.get(this.state.reply);
        } else {
          this.writeTalePage = this.createWriteTalePage(this.state.reply);
          this.writeTalePageCache.set(this.state.reply, this.writeTalePage);
        }
        this.appendBodies(this.writeTalePage.body);
        this.prependMenuBodies(this.writeTalePage.backMenuBody);
        this.writeTalePage.on("back", () => this.goToCurrentTalesListPage());
        break;
    }
  }

  private goToPreviousTalesListPage(): void {
    let newState = this.copyToNewState();
    newState.list.pop();
    this.updateStateAndBubbleUp(newState);
  }

  private goToPinedTalesListPage(context: TaleContext): void {
    let newState = this.copyToNewState();
    newState.list.push(context);
    this.updateStateAndBubbleUp(newState);
  }

  private goToReplyTalePage(taleId: string): void {
    let newState = this.copyToNewState();
    newState.page = Page.Write;
    newState.reply = taleId;
    this.updateStateAndBubbleUp(newState);
  }

  private goToCurrentTalesListPage(): void {
    let newState = this.copyToNewState();
    newState.page = Page.List;
    newState.reply = undefined;
    this.updateStateAndBubbleUp(newState);
  }

  public remove(): void {
    this.removePage();
    this.writeTaleMenuItem.remove();
  }
}
