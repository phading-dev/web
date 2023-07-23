import LRU = require("lru-cache");
import { AddBodiesFn } from "../common/add_bodies_fn";
import { AccountPageMock } from "./account_page/container_mock";
import { ContentPage } from "./container";
import { HomePageMock } from "./home_page/container_mock";
import { QuickTalesListPage } from "./home_page/quick_tales_page/quick_tales_list_page/container";
import { WriteTalePage } from "./home_page/write_tale_page/container";

export class ContentPageMock extends ContentPage {
  public constructor(
    quickTalesListPageCache: LRU<string, QuickTalesListPage>,
    writeTalePageCache: LRU<string, WriteTalePage>,
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn,
    appendMenuBodies: AddBodiesFn,
    appendControllerBodies: AddBodiesFn
  ) {
    super(
      (
        appendBodies,
        prependMenuBodies,
        appendMenuBodies,
        appendControllerBodies
      ) =>
        new HomePageMock(
          quickTalesListPageCache,
          writeTalePageCache,
          appendBodies,
          prependMenuBodies,
          appendMenuBodies,
          appendControllerBodies
        ),
      (appendBodies, prependMenuBodies, appendMenuBodies) =>
        new AccountPageMock(appendBodies, prependMenuBodies, appendMenuBodies),
      appendBodies,
      prependMenuBodies,
      appendMenuBodies,
      appendControllerBodies
    );
  }
}
