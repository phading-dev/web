import { AddBodiesFn } from "../../common/add_bodies_fn";
import { ChooseAccountPage } from "./body";
import { ListAccountsPageMock } from "./list_accounts_page/body_mock";

export class ChooseAccountPageMock extends ChooseAccountPage {
  public constructor(appendBodies: AddBodiesFn, preSelectedAccountId?: string) {
    super(
      undefined,
      (preSelectedAccountId) => new ListAccountsPageMock(preSelectedAccountId),
      appendBodies,
      preSelectedAccountId,
    );
  }
}
