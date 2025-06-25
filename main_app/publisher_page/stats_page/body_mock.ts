import { StatsPage } from "./body";
import { ListMeterReadingsPerDayResponse } from "@phading/meter_service_interface/show/web/publisher/interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class StatsPageMock extends StatsPage {
  public constructor(getNowDate: () => Date) {
    super(
      new (class extends WebServiceClientMock {
        public async send(): Promise<any> {
          let response: ListMeterReadingsPerDayResponse = {
            readings: [
              {
                date: "2023-10-01",
                watchTimeSecGraded: 360000000,
                storageMbm: 420000,
                uploadedKb: 23000,
              },
              {
                date: "2023-10-10",
                watchTimeSecGraded: 300000000,
                storageMbm: 300000,
                uploadedKb: 15000,
              },
            ],
          };
          return response;
        }
      })(),
      getNowDate,
    );
  }
}
