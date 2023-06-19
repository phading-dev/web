import EventEmitter = require("events");
import LRU = require("lru-cache");
import { PageNavigator } from "../../../common/page_navigator";
import { ImagesViewerPage } from "./image_viewer_page/container";
import { QuickTalesListPage } from "./quick_tales_list_page/container";
import { TaleContext } from "@phading/tale_service_interface/tale_context";

export function buildCacheKey(taleContext: TaleContext): string {
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
  disposeAfter: (value) => value.remove(),
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
    private quickTalesListPageFactoryFn: (
      context: TaleContext
    ) => QuickTalesListPage,
    private imageViewerPageFactoryFn: (
      appendBodiesFn: (...bodies: Array<HTMLElement>) => void,
      prependMenuBodiesFn: (...bodies: Array<HTMLElement>) => void,
      appendControllerBodiesFn: (...bodies: Array<HTMLElement>) => void,
      imagePaths: Array<string>,
      initialIndex: number
    ) => ImagesViewerPage,
    private appendBodiesFn: (...bodies: Array<HTMLElement>) => void,
    private prependMenuBodiesFn: (...bodies: Array<HTMLElement>) => void,
    private appendMenuBodiesFn: (...bodies: Array<HTMLElement>) => void,
    private appendControllerBodiesFn: (...bodies: Array<HTMLElement>) => void,
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
    appendBodiesFn: (...bodies: Array<HTMLElement>) => void,
    prependMenuBodiesFn: (...bodies: Array<HTMLElement>) => void,
    appendMenuBodiesFn: (...bodies: Array<HTMLElement>) => void,
    appendControllerBodiesFn: (...bodies: Array<HTMLElement>) => void,
    context: TaleContext
  ): QuickTalesPage {
    return new QuickTalesPage(
      QuickTalesListPage.create,
      ImagesViewerPage.create,
      appendBodiesFn,
      prependMenuBodiesFn,
      appendMenuBodiesFn,
      appendControllerBodiesFn,
      context
    );
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.LIST: {
        let key = buildCacheKey(this.context);
        if (QUICK_TALES_LIST_PAGE_CACHE.has(key)) {
          this.listPage = QUICK_TALES_LIST_PAGE_CACHE.get(key);
        } else {
          this.listPage = this.quickTalesListPageFactoryFn(this.context)
            .on("back", () => this.emit("back"))
            .on("pin", (context) => this.emit("pin", context))
            .on("reply", (taleId) => this.emit("reply", taleId))
            .on("viewImages", (imagePaths, initialIndex) => {
              this.imagePaths = imagePaths;
              this.initialIndex = initialIndex;
              this.pageNavigator.goTo(Page.IMAGE_VIEWIER);
            });
          QUICK_TALES_LIST_PAGE_CACHE.set(key, this.listPage);
        }
        this.appendBodiesFn(this.listPage.body);
        this.prependMenuBodiesFn(this.listPage.backMenuBody);
        this.appendMenuBodiesFn(this.listPage.menuBody);
        break;
      }
      case Page.IMAGE_VIEWIER: {
        this.imageViewerPage = this.imageViewerPageFactoryFn(
          this.appendBodiesFn,
          this.prependMenuBodiesFn,
          this.appendControllerBodiesFn,
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
