import { AddBodiesFn } from "../../../../common/add_bodies_fn";
import { UsageReportsPage } from "./body";
import { ChooseReportPageMock } from "./choose_report_page/body_mock";
import { UsageReportPageMock } from "./usage_report_page/body_mock";

export class UsageReportsPageMock extends UsageReportsPage {
  public constructor(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn
  ) {
    super(
      () => new ChooseReportPageMock(),
      (reportId) => new UsageReportPageMock(reportId),
      appendBodies,
      prependMenuBodies
    );
  }
}
