import EventEmitter = require("events");
import LRU = require("lru-cache");
import { AddBodiesFn } from "../../../common/add_bodies_fn";
import { PageNavigator } from "../../../common/page_navigator";
import { ImagesViewerPage } from "./image_viewer_page/container";
import { QuickTalesListPage } from "./quick_tales_list_page/container";
import { TaleContext } from "@phading/tale_service_interface/tale_context";

export function buildTaleContextKey(taleContext: TaleContext): string {
  if (taleContext.taleId) {
    return `t:${taleContext.taleId}`;
  } else if (taleContext.userId) {
    return `u:${taleContext.userId}`;
  } else {
    return ``;
  }
}

export let QUICK_TALES_LIST_PAGE_CACHE = new LRU<string, QuickTalesListPage>({
  max: 30,
});

export interface QuickTalesPage {
  on(event: "back", listener: () => void): this;
  on(event: "pin", listener: (context: TaleContext) => void): this;
  on(event: "reply", listener: (taleId: string) => void): this;
}

enum Page {
  LIST,
  IMAGE_VIEWIER,
}

export class QuickTalesPage extends EventEmitter {
  // Visible for testing
  public listPage: QuickTalesListPage;
  public imageViewerPage: ImagesViewerPage;
  private imagePaths: Array<string>;
  private initialIndex: number;
  private pageNavigator: PageNavigator<Page>;

  public constructor(
    private quickTalesListPageCache: LRU<string, QuickTalesListPage>,
    private createQuickTalesListPage: (
      context: TaleContext
    ) => QuickTalesListPage,
    private createImageViewerPage: (
      appendBodies: AddBodiesFn,
      prependMenuBodies: AddBodiesFn,
      appendControllerBodies: AddBodiesFn,
      imagePaths: Array<string>,
      initialIndex: number
    ) => ImagesViewerPage,
    private appendBodies: AddBodiesFn,
    private prependMenuBodies: AddBodiesFn,
    private appendMenuBodies: AddBodiesFn,
    private appendControllerBodies: AddBodiesFn,
    private context: TaleContext
  ) {
    super();
    this.pageNavigator = new PageNavigator(
      (page) => this.addPage(page),
      (page) => this.removePage(page)
    );
    this.pageNavigator.goTo(Page.LIST);
  }

  public static create(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn,
    appendMenuBodies: AddBodiesFn,
    appendControllerBodies: AddBodiesFn,
    context: TaleContext
  ): QuickTalesPage {
    return new QuickTalesPage(
      QUICK_TALES_LIST_PAGE_CACHE,
      QuickTalesListPage.create,
      ImagesViewerPage.create,
      appendBodies,
      prependMenuBodies,
      appendMenuBodies,
      appendControllerBodies,
      context
    );
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.LIST: {
        let key = buildTaleContextKey(this.context);
        if (this.quickTalesListPageCache.has(key)) {
          this.listPage = this.quickTalesListPageCache.get(key);
        } else {
          this.listPage = this.createQuickTalesListPage(this.context);
          this.quickTalesListPageCache.set(key, this.listPage);
        }
        this.listPage
          .on("back", () => this.emit("back"))
          .on("pin", (context) => this.emit("pin", context))
          .on("reply", (taleId) => this.emit("reply", taleId))
          .on("viewImages", (imagePaths, initialIndex) => {
            this.imagePaths = imagePaths;
            this.initialIndex = initialIndex;
            this.pageNavigator.goTo(Page.IMAGE_VIEWIER);
          });
        this.appendBodies(this.listPage.body);
        this.prependMenuBodies(this.listPage.backMenuBody);
        this.appendMenuBodies(this.listPage.menuBody);
        break;
      }
      case Page.IMAGE_VIEWIER: {
        this.imageViewerPage = this.createImageViewerPage(
          this.appendBodies,
          this.prependMenuBodies,
          this.appendControllerBodies,
          this.imagePaths,
          this.initialIndex
        ).on("back", () => this.pageNavigator.goTo(Page.LIST));
        break;
      }
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.LIST: {
        this.listPage.remove();
        this.listPage.removeAllListeners();
        break;
      }
      case Page.IMAGE_VIEWIER: {
        this.imageViewerPage.remove();
        break;
      }
    }
  }

  public remove(): void {
    this.pageNavigator.remove();
  }
}
