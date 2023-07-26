import LRU = require("lru-cache");
import { AddBodiesFn } from "../../../common/add_bodies_fn";
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
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn,
    appendMenuBodies: AddBodiesFn,
    appendControllerBodies: AddBodiesFn,
    context: TaleContext,
    quickTalesPageMockData: QuickTalesListPageMockData
  ) {
    super(
      quickTalesListPageCache,
      (context) => new QuickTalesListPageMock(context, quickTalesPageMockData),
      (
        appendBodies,
        prependMenuBodies,
        appendControllerBodies,
        imagePaths,
        initialIndex
      ) =>
        new ImagesViewerPage(
          appendBodies,
          prependMenuBodies,
          appendControllerBodies,
          imagePaths,
          initialIndex
        ),
      appendBodies,
      prependMenuBodies,
      appendMenuBodies,
      appendControllerBodies,
      context
    );
  }
}
