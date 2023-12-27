import path = require("path");
import { UsageReportPage } from "./body";
import {
  GET_PLAYTIME_METER_REPORT,
  GET_PLAYTIME_METER_REPORT_REQUEST_BODY,
  GetPlaytimeMeterReportResponse,
} from "@phading/product_meter_service_interface/consumer/web/interface";
import { AppType } from "@phading/product_service_interface/app_type";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "../../../../../common/normalize_body";

TEST_RUNNER.run({
  name: "UsageReportPageTest",
  cases: [
    new (class implements TestCase {
      public name = "CurrentReport";
      private cut: UsageReportPage;
      public async execute() {
        // Prepare
        await setViewport(800, 600);
        this.cut = new UsageReportPage(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any) {
              assertThat(
                request.descriptor,
                eq(GET_PLAYTIME_METER_REPORT),
                "load request"
              );
              assertThat(
                request.body,
                eqMessage({}, GET_PLAYTIME_METER_REPORT_REQUEST_BODY),
                "load request body"
              );
              return {
                playtimeMeterReport: {
                  playtimeMetersPerApp: [
                    {
                      appType: AppType.SHOW,
                      playtime: 100,
                    },
                    {
                      appType: AppType.MUSIC,
                      playtime: 900,
                    },
                  ],
                  totalPlaytime: 1000,
                  startTimestamp: new Date(2023, 9, 11).getTime() / 1000,
                },
              } as GetPlaytimeMeterReportResponse;
            }
          })()
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_report_page_current.png"),
          path.join(__dirname, "/golden/usage_report_page_current.png"),
          path.join(__dirname, "/usage_report_page_current_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "HistoricalReport";
      private cut: UsageReportPage;
      public async execute() {
        // Prepare
        await setViewport(800, 600);
        this.cut = new UsageReportPage(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any) {
              assertThat(
                request.descriptor,
                eq(GET_PLAYTIME_METER_REPORT),
                "load request"
              );
              assertThat(
                request.body,
                eqMessage(
                  {
                    reportId: "report id 1",
                  },
                  GET_PLAYTIME_METER_REPORT_REQUEST_BODY
                ),
                "load request body"
              );
              return {
                playtimeMeterReport: {
                  playtimeMetersPerApp: [
                    {
                      appType: AppType.SHOW,
                      playtime: 500,
                    },
                    {
                      appType: AppType.MUSIC,
                      playtime: 500,
                    },
                  ],
                  totalPlaytime: 1000,
                  startTimestamp: new Date(2023, 9, 11).getTime() / 1000,
                  endTimestamp: new Date(2023, 10, 12).getTime() / 1000,
                },
              } as GetPlaytimeMeterReportResponse;
            }
          })(),
          "report id 1"
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_report_page_history.png"),
          path.join(__dirname, "/golden/usage_report_page_history.png"),
          path.join(__dirname, "/usage_report_page_history_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ChooseReport";
      private cut: UsageReportPage;
      public async execute() {
        // Prepare
        this.cut = new UsageReportPage(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any) {
              return {
                playtimeMeterReport: {
                  playtimeMetersPerApp: [
                    {
                      appType: AppType.SHOW,
                      playtime: 500,
                    },
                    {
                      appType: AppType.MUSIC,
                      playtime: 500,
                    },
                  ],
                  totalPlaytime: 1000,
                  startTimestamp: new Date(2023, 9, 11).getTime() / 1000,
                },
              } as GetPlaytimeMeterReportResponse;
            }
          })()
        );
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        let chooseReport: boolean;
        this.cut.on("chooseReport", () => (chooseReport = true));

        // Execute
        this.cut.seeOtherButton.click();

        // Verify
        assertThat(chooseReport, eq(true), "choose report");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
