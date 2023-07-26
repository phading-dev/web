import LRU = require("lru-cache");
import { AddBodiesFn } from "../../common/add_bodies_fn";
import { HomePage } from "./container";
import { QuickTalesPageMock } from "./quick_tales_page/container_mock";
import { QuickTalesListPage } from "./quick_tales_page/quick_tales_list_page/container";
import { WriteTalePage } from "./write_tale_page/container";
import { WriteTalePageMock } from "./write_tale_page/container_mock";

export class HomePageMock extends HomePage {
  public constructor(
    quickTalesListPageCache: LRU<string, QuickTalesListPage>,
    writeTalePageCache: LRU<string, WriteTalePage>,
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn,
    appendMenuBodies: AddBodiesFn,
    appendControllerBodies: AddBodiesFn
  ) {
    super(
      writeTalePageCache,
      (
        appendBodies,
        prependMenuBodies,
        appendMenuBodies,
        appendControllerBodies,
        context
      ) =>
        new QuickTalesPageMock(
          quickTalesListPageCache,
          appendBodies,
          prependMenuBodies,
          appendMenuBodies,
          appendControllerBodies,
          context,
          {
            startingTaleId: 1,
          }
        ),
      (taleId) => new WriteTalePageMock(taleId),
      appendBodies,
      prependMenuBodies,
      appendMenuBodies,
      appendControllerBodies
    );
  }
}
