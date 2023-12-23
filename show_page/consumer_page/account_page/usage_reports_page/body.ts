import EventEmitter = require("events");
import { AddBodiesFn } from "../../../../common/add_bodies_fn";
import { PageNavigator } from "../../../../common/page_navigator";
import { ChooseReportPage } from "./choose_report_page/body";
import { Page, USAGE_REPORTS_PAGE_STATE, UsageReportsPageState } from "./state";
import { UsageReportPage } from "./usage_report_page/body";
import { copyMessage } from "@selfage/message/copier";

export interface UsageReportsPage {
  on(
    event: "newState",
    listener: (newState: UsageReportsPageState) => void
  ): this;
  on(event: "loaded", listener: () => void): this;
}

export class UsageReportsPage extends EventEmitter {
  public static create(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn
  ): UsageReportsPage {
    return new UsageReportsPage(
      ChooseReportPage.create,
      UsageReportPage.create,
      appendBodies,
      prependMenuBodies
    );
  }

  // Visible for testing
  public usageReportPage: UsageReportPage;
  public chooseReportPage: ChooseReportPage;
  private pageNavigator: PageNavigator<Page>;
  private state: UsageReportsPageState;

  public constructor(
    private createChooseReportPage: () => ChooseReportPage,
    private createUsageReportPage: (reportId?: string) => UsageReportPage,
    private appendBodies: AddBodiesFn,
    private prependMenuBodies: AddBodiesFn
  ) {
    super();
    this.pageNavigator = new PageNavigator<Page>(
      (page) => this.addPage(page),
      (page) => this.removePage(page)
    );
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.CHOOSE:
        this.chooseReportPage = this.createChooseReportPage()
          .on("loaded", () => this.emit("loaded"))
          .on("back", () => {
            let newState = copyMessage(this.state, USAGE_REPORTS_PAGE_STATE);
            newState.page = Page.REPORT;
            this.updateStateAndBubble(newState);
          })
          .on("chosen", (reportId) =>
            this.updateStateAndBubble({
              page: Page.REPORT,
              reportId: reportId,
            })
          );
        this.appendBodies(this.chooseReportPage.body);
        this.prependMenuBodies(this.chooseReportPage.backMenuBody);
        break;
      case Page.REPORT:
        this.usageReportPage = this.createUsageReportPage(this.state.reportId)
          .on("loaded", () => this.emit("loaded"))
          .on("chooseReport", () => {
            let newState = copyMessage(this.state, USAGE_REPORTS_PAGE_STATE);
            newState.page = Page.CHOOSE;
            this.updateStateAndBubble(newState);
          });
        this.appendBodies(this.usageReportPage.body);
        break;
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.CHOOSE:
        this.chooseReportPage.remove();
        break;
      case Page.REPORT:
        this.usageReportPage.remove();
        break;
    }
  }

  private updateStateAndBubble(newState: UsageReportsPageState): void {
    this.updateState(newState);
    this.emit("newState", this.state);
  }

  public updateState(newState?: UsageReportsPageState): this {
    if (!newState) {
      newState = {};
    }
    if (!newState.page) {
      newState.page = Page.REPORT;
    }
    this.state = newState;
    this.pageNavigator.goTo(this.state.page);
    return this;
  }

  public remove(): void {
    this.pageNavigator.remove();
  }
}
