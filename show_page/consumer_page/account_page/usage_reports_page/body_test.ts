import path = require("path");
import { UsageReportsPage } from "./body";
import { ChooseReportPageMock } from "./choose_report_page/body_mock";
import { Page, USAGE_REPORTS_PAGE_STATE, UsageReportsPageState } from "./state";
import { UsageReportPageMock } from "./usage_report_page/body_mock";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import "../../../../common/normalize_body";

let menuContainer: HTMLDivElement;

TEST_RUNNER.run({
  name: "UsageReportsPage",
  environment: {
    setUp: () => {
      menuContainer = E.div({ style: `position: absolute; left: 0; top: 0;` });
      document.body.append(menuContainer);
    },
    tearDown: () => {
      menuContainer.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Default_NavigateToChooseReport_ChooseHistoryReport";
      private cut: UsageReportsPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let reportIdCaptured: string;
        this.cut = new UsageReportsPage(
          () => new ChooseReportPageMock(),
          (reportId) => {
            reportIdCaptured = reportId;
            return new UsageReportPageMock(reportId);
          },
          (...bodies) => document.body.append(...bodies),
          (...bodies) => menuContainer.append(...bodies)
        );

        // Execute
        this.cut.updateState();
        await new Promise<void>((resolve) => this.cut.on("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_reports_page_default.png"),
          path.join(__dirname, "/golden/usage_reports_page_default.png"),
          path.join(__dirname, "/usage_reports_page_default_diff.png")
        );

        // Prepare
        let newStateCaptured: UsageReportsPageState;
        this.cut.on("newState", (newState) => (newStateCaptured = newState));

        // Execute
        this.cut.usageReportPage.emit("chooseReport");
        await new Promise<void>((resolve) => this.cut.on("loaded", resolve));

        // Verify
        assertThat(
          newStateCaptured,
          eqMessage({ page: Page.CHOOSE }, USAGE_REPORTS_PAGE_STATE),
          "new state to choose report"
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_reports_page_choose_report.png"),
          path.join(__dirname, "/golden/usage_reports_page_choose_report.png"),
          path.join(__dirname, "/usage_reports_page_choose_report_diff.png")
        );

        // Execute
        this.cut.chooseReportPage.emit("chosen", "report id 1");
        await new Promise<void>((resolve) => this.cut.on("loaded", resolve));

        // Verify
        assertThat(
          newStateCaptured,
          eqMessage(
            { page: Page.REPORT, reportId: "report id 1" },
            USAGE_REPORTS_PAGE_STATE
          ),
          "new state to show report"
        );
        assertThat(reportIdCaptured, eq("report id 1"), "show report id 1");
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_reports_page_show_report.png"),
          path.join(__dirname, "/golden/usage_reports_page_default.png"),
          path.join(__dirname, "/usage_reports_page_show_report_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ReportWithId_ChooseReport_Back";
      private cut: UsageReportsPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let reportIdCaptured: string;
        this.cut = new UsageReportsPage(
          () => new ChooseReportPageMock(),
          (reportId) => {
            reportIdCaptured = reportId;
            return new UsageReportPageMock(reportId);
          },
          (...bodies) => document.body.append(...bodies),
          (...bodies) => menuContainer.append(...bodies)
        );
        this.cut.updateState({
          page: Page.REPORT,
          reportId: "report id 1",
        });
        await new Promise<void>((resolve) => this.cut.on("loaded", resolve));
        let newStateCaptured: UsageReportsPageState;
        this.cut.on("newState", (newState) => (newStateCaptured = newState));

        // Execute
        this.cut.usageReportPage.emit("chooseReport");
        await new Promise<void>((resolve) => this.cut.on("loaded", resolve));

        // Verify
        assertThat(
          newStateCaptured,
          eqMessage(
            { page: Page.CHOOSE, reportId: "report id 1" },
            USAGE_REPORTS_PAGE_STATE
          ),
          "new state to choose report"
        );

        // Execute
        this.cut.chooseReportPage.emit("back");
        await new Promise<void>((resolve) => this.cut.on("loaded", resolve));

        // Verify
        assertThat(
          newStateCaptured,
          eqMessage(
            { page: Page.REPORT, reportId: "report id 1" },
            USAGE_REPORTS_PAGE_STATE
          ),
          "new state to show report"
        );
        assertThat(reportIdCaptured, eq("report id 1"), "show report id 1");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "UpdateStateWithReportPage_UpdateWithChooseReportPage_UpdateWithReportPageAndReportId";
      private cut: UsageReportsPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let reportIdCaptured: string;
        this.cut = new UsageReportsPage(
          () => new ChooseReportPageMock(),
          (reportId) => {
            reportIdCaptured = reportId;
            return new UsageReportPageMock(reportId);
          },
          (...bodies) => document.body.append(...bodies),
          (...bodies) => menuContainer.append(...bodies)
        );

        // Execute
        this.cut.updateState({
          page: Page.REPORT,
        });
        await new Promise<void>((resolve) => this.cut.on("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_reports_page_state_as_report.png"),
          path.join(
            __dirname,
            "/golden/usage_reports_page_state_as_report.png"
          ),
          path.join(__dirname, "/usage_reports_page_state_as_report_diff.png")
        );

        // Execute
        this.cut.updateState({
          page: Page.CHOOSE,
        });
        await new Promise<void>((resolve) => this.cut.on("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_reports_page_state_as_choose.png"),
          path.join(
            __dirname,
            "/golden/usage_reports_page_state_as_choose.png"
          ),
          path.join(__dirname, "/usage_reports_page_state_as_choose_diff.png")
        );

        // Execute
        this.cut.updateState({
          page: Page.REPORT,
          reportId: "report id 1",
        });
        await new Promise<void>((resolve) => this.cut.on("loaded", resolve));

        // Verify
        assertThat(reportIdCaptured, eq("report id 1"), "show report id 1");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
