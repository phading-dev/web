import { WriteTalePage } from "./container";
import { QuickLayoutEditorMock } from "./quick_layout_editor/container_mock";
import {
  GET_QUICK_TALE,
  GetQuickTaleResponse,
} from "@phading/tale_service_interface/interface";
import { QuickTaleCard as QuickTaleCardData } from "@phading/tale_service_interface/tale_card";
import { WebServiceClient } from "@selfage/web_service_client";

export class WriteTalePageMock extends WriteTalePage {
  public constructor(pinnedTaleId: string, taleCardData?: QuickTaleCardData) {
    super(
      pinnedTaleId,
      new QuickLayoutEditorMock(),
      new (class extends WebServiceClient {
        public constructor() {
          super(undefined, undefined);
        }
        public send(request: any): any {
          if (request.descriptor === GET_QUICK_TALE) {
            return { card: taleCardData } as GetQuickTaleResponse;
          }
        }
      })()
    );
  }
}
