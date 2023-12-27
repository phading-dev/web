import { UsageReportPage } from "./body";
import { GetPlaytimeMeterReportResponse } from "@phading/product_meter_service_interface/consumer/web/interface";
import { AppType } from "@phading/product_service_interface/app_type";
import { WebServiceClient } from "@selfage/web_service_client";

export class UsageReportPageMock extends UsageReportPage {
  public constructor(reportId?: string) {
    super(
      new (class extends WebServiceClient {
        public constructor() {
          super(undefined, undefined);
        }
        public async send(request: any): Promise<any> {
          return {
            playtimeMeterReport: {
              totalPlaytime: 100,
              startTimestamp: new Date(2023, 9, 11).getTime() / 1000,
              playtimeMetersPerApp: [
                {
                  appType: AppType.MUSIC,
                  playtime: 30,
                },
                {
                  appType: AppType.SHOW,
                  playtime: 70,
                },
              ],
            },
          } as GetPlaytimeMeterReportResponse;
        }
      })(),
      reportId
    );
  }
}
