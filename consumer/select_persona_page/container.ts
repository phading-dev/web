import EventEmitter = require("events");
import { PageNavigator } from "../common/page_navigator";
import { CreatePersonaPage } from "./create_persona_page/container";
import { ListPersonaPage } from "./list_persona_page/container";

export enum Page {
  LIST = 1,
  CREATE = 2,
}

export interface SelectPersonaPage {
  on(event: "selected", listener: () => void): this;
}

export class SelectPersonaPage extends EventEmitter {
  // Visible for testing
  public listPersonaPage: ListPersonaPage;
  public createPersonaPage: CreatePersonaPage;
  private pageNavigator: PageNavigator<Page>;

  public constructor(
    private createListPersonaPageFn: () => ListPersonaPage,
    private createCreatePersonaPageFn: () => CreatePersonaPage,
    private appendBodiesFn: (...bodies: Array<HTMLElement>) => void,
    private prependMenuBodiesFn: (...bodies: Array<HTMLElement>) => void
  ) {
    super();
    this.pageNavigator = new PageNavigator(
      (page) => this.addPage(page),
      (page) => this.removePage(page)
    );
    this.pageNavigator.goTo(Page.LIST);
  }

  public static create(
    appendBodiesFn: (...bodies: Array<HTMLElement>) => void,
    prependMenuBodiesFn: (...bodies: Array<HTMLElement>) => void
  ): SelectPersonaPage {
    return new SelectPersonaPage(
      ListPersonaPage.create,
      CreatePersonaPage.create,
      appendBodiesFn,
      prependMenuBodiesFn
    );
  }

  private async addPage(page: Page): Promise<void> {
    switch (page) {
      case Page.LIST: {
        this.listPersonaPage = this.createListPersonaPageFn();
        this.appendBodiesFn(this.listPersonaPage.body);
        this.listPersonaPage.on("selected", () => this.emit("selected"));
        this.listPersonaPage.on("create", () =>
          this.pageNavigator.goTo(Page.CREATE)
        );
        break;
      }
      case Page.CREATE: {
        this.createPersonaPage = this.createCreatePersonaPageFn();
        this.appendBodiesFn(this.createPersonaPage.body);
        this.prependMenuBodiesFn(this.createPersonaPage.menuBody);
        this.createPersonaPage.on("created", () => this.emit("selected"));
        this.createPersonaPage.on("back", () =>
          this.pageNavigator.goTo(Page.LIST)
        );
        break;
      }
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.LIST:
        this.listPersonaPage.remove();
        break;
      case Page.CREATE:
        this.createPersonaPage.remove();
        break;
    }
  }

  public remove(): void {
    this.pageNavigator.remove();
  }
}
