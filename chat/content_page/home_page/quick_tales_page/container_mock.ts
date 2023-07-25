import LRU = require("lru-cache");
import { QuickTalesPage } from "./container";
import { ImagesViewerPage } from "./image_viewer_page/container";
import { QuickTalesListPage } from "./quick_tales_list_page/container";
import {
  QuickTalesListPageMock,
  QuickTalesListPageMockData,
} from "./quick_tales_list_page/container_mock";
import { TaleContext } from "@phading/tale_service_interface/tale_context";

export class QuickTalesPageMock extends QuickTalesPage {
  public constructor(
    quickTalesListPageCache: LRU<string, QuickTalesListPage>,
    appendBodiesFn: (...bodies: Array<HTMLElement>) => void,
    prependMenuBodiesFn: (...bodies: Array<HTMLElement>) => void,
    appendMenuBodiesFn: (...bodies: Array<HTMLElement>) => void,
    appendControllerBodiesFn: (...bodies: Array<HTMLElement>) => void,
    context: TaleContext,
    quickTalesPageMockData: QuickTalesListPageMockData
  ) {
    super(
      quickTalesListPageCache,
      (context) => new QuickTalesListPageMock(context, quickTalesPageMockData),
      (
        appendBodiesFn,
        prependMenuBodiesFn,
        appendControllerBodiesFn,
        imagePaths,
        initialIndex
      ) =>
        new ImagesViewerPage(
          appendBodiesFn,
          prependMenuBodiesFn,
          appendControllerBodiesFn,
          imagePaths,
          initialIndex
        ),
      appendBodiesFn,
      prependMenuBodiesFn,
      appendMenuBodiesFn,
      appendControllerBodiesFn,
      context
    );
  }
}
