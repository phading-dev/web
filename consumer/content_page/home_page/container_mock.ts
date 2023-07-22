import LRU = require("lru-cache");
import { HomePage } from "./container";
import { QuickTalesPageMock } from "./quick_tales_page/container_mock";
import { QuickTalesListPage } from "./quick_tales_page/quick_tales_list_page/container";
import { QuickTalesListPageMockData } from "./quick_tales_page/quick_tales_list_page/container_mock";
import { WriteTalePage } from "./write_tale_page/container";
import { WriteTalePageMock } from "./write_tale_page/container_mock";
import { QuickTaleCard as QuickTaleCardData } from "@phading/tale_service_interface/tale_card";

export class HomePageMock extends HomePage {
  public constructor(
    quickTalesListPageCache: LRU<string, QuickTalesListPage>,
    writeTalePageCache: LRU<string, WriteTalePage>,
    appendBodiesFn: (...bodies: Array<HTMLElement>) => void,
    prependMenuBodiesFn: (...bodies: Array<HTMLElement>) => void,
    appendMenuBodiesFn: (...bodies: Array<HTMLElement>) => void,
    appendControllerBodiesFn: (...bodies: Array<HTMLElement>) => void,
    quickTalesListPageMockData: QuickTalesListPageMockData,
    writeTalePageCardData?: QuickTaleCardData
  ) {
    super(
      writeTalePageCache,
      (
        appendBodiesFn,
        prependMenuBodiesFn,
        appendMenuBodiesFn,
        appendControllerBodiesFn,
        context
      ) =>
        new QuickTalesPageMock(
          quickTalesListPageCache,
          appendBodiesFn,
          prependMenuBodiesFn,
          appendMenuBodiesFn,
          appendControllerBodiesFn,
          context,
          quickTalesListPageMockData
        ),
      (taleId) => new WriteTalePageMock(taleId, writeTalePageCardData),
      appendBodiesFn,
      prependMenuBodiesFn,
      appendMenuBodiesFn,
      appendControllerBodiesFn
    );
  }
}
