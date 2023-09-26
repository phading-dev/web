import path = require("path");
import { ChooseReportPage } from "./body";
import {
  LIST_HISTORY_PLAYTIME_METER_REPORTS,
  LIST_HISTORY_PLAYTIME_METER_REPORTS_REQUEST_BODY,
  ListHistoryPlaytimeMeterReportsResponse,
} from "@phading/consumer_product_interaction_service_interface/interface";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "../../../../../common/normalize_body";

let menuContainer: HTMLDivElement;

TEST_RUNNER.run({
  name: "ChooseReportPageTest",
  environment: {
    setUp: () => {
      menuContainer = E.div({ style: `position: fixed; left: 0; top: 0;` });
      document.body.append(menuContainer);
    },
    tearDown: () => {
      menuContainer.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "OnlyCurrentReport";
      private cut: ChooseReportPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        this.cut = new ChooseReportPage(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any): Promise<any> {
              assertThat(
                request.descriptor,
                eq(LIST_HISTORY_PLAYTIME_METER_REPORTS),
                "service"
              );
              assertThat(
                request.body,
                eqMessage({}, LIST_HISTORY_PLAYTIME_METER_REPORTS_REQUEST_BODY),
                "request body"
              );
              return {
                playtimeMeterReportRanges: [],
              } as ListHistoryPlaytimeMeterReportsResponse;
            }
          })()
        );

        // Execute
        document.body.append(this.cut.body);
        menuContainer.append(this.cut.backMenuBody);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/choose_report_page_only_current.png"),
          path.join(__dirname, "/golden/choose_report_page_only_current.png"),
          path.join(__dirname, "/choose_report_page_only_current_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ManyOptionsThatWrapAround";
      private cut: ChooseReportPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        this.cut = new ChooseReportPage(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any): Promise<any> {
              return {
                playtimeMeterReportRanges: [
                  {
                    reportId: "report id 1",
                    endTimestamp: new Date(2023, 10, 11).getTime() / 1000,
                  },
                  {
                    reportId: "report id 2",
                    endTimestamp: new Date(2023, 9, 11).getTime() / 1000,
                  },
                  {
                    reportId: "report id 3",
                    endTimestamp: new Date(2023, 8, 11).getTime() / 1000,
                  },
                  {
                    reportId: "report id 4",
                    endTimestamp: new Date(2023, 7, 11).getTime() / 1000,
                  },
                  {
                    reportId: "report id 5",
                    endTimestamp: new Date(2023, 6, 11).getTime() / 1000,
                  },
                  {
                    reportId: "report id 6",
                    endTimestamp: new Date(2023, 5, 11).getTime() / 1000,
                  },
                ],
              } as ListHistoryPlaytimeMeterReportsResponse;
            }
          })()
        );

        // Execute
        document.body.append(this.cut.body);
        menuContainer.append(this.cut.backMenuBody);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/choose_report_page_wrap_options.png"),
          path.join(__dirname, "/golden/choose_report_page_wrap_options.png"),
          path.join(__dirname, "/choose_report_page_wrap_options_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ChooseReports";
      private cut: ChooseReportPage;
      public async execute() {
        // Prepare
        this.cut = new ChooseReportPage(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any): Promise<any> {
              return {
                playtimeMeterReportRanges: [
                  {
                    reportId: "report id 1",
                    endTimestamp: new Date(2023, 10, 11).getTime() / 1000,
                  },
                  {
                    reportId: "report id 2",
                    endTimestamp: new Date(2023, 9, 11).getTime() / 1000,
                  },
                  {
                    reportId: "report id 3",
                    endTimestamp: new Date(2023, 8, 11).getTime() / 1000,
                  },
                  {
                    reportId: "report id 4",
                    endTimestamp: new Date(2023, 7, 11).getTime() / 1000,
                  },
                  {
                    reportId: "report id 5",
                    endTimestamp: new Date(2023, 6, 11).getTime() / 1000,
                  },
                ],
              } as ListHistoryPlaytimeMeterReportsResponse;
            }
          })()
        );
        let chosenId: string;
        this.cut.on("chosen", (reportId) => (chosenId = reportId));
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Execute
        this.cut.currentRangeButton.click();

        // Verify
        assertThat(chosenId, eq(undefined), "choose current range");

        // Execute
        this.cut.historyRangeButtons[0].click();

        // Verify
        assertThat(chosenId, eq("report id 1"), "choose first range");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "GoBack";
      private cut: ChooseReportPage;
      public async execute() {
        // Prepare
        this.cut = new ChooseReportPage(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any): Promise<any> {
              return {
                playtimeMeterReportRanges: [],
              } as ListHistoryPlaytimeMeterReportsResponse;
            }
          })()
        );
        let goBack: boolean;
        this.cut.on("back", () => (goBack = true));
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Execute
        this.cut.backMenuItem.click();

        // Verify
        assertThat(goBack, eq(true), "go back");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
