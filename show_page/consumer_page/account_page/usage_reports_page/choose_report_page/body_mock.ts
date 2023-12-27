import { ChooseReportPage } from "./body";
import { ListHistoryPlaytimeMeterReportsResponse } from "@phading/product_meter_service_interface/consumer/web/interface";
import { WebServiceClient } from "@selfage/web_service_client";

export class ChooseReportPageMock extends ChooseReportPage {
  public constructor() {
    super(
      new (class extends WebServiceClient {
        public constructor() {
          super(undefined, undefined);
        }
        public async send(request: any): Promise<any> {
          return {
            playtimeMeterReportRanges: [
              {
                reportId: "report id 1",
                endTimestamp: new Date(2023, 8, 11).getTime() / 1000,
              },
            ],
          } as ListHistoryPlaytimeMeterReportsResponse;
        }
      })()
    );
  }
}
