import { AddBodiesFn } from "../../common/add_bodies_fn";
import { ChooseAccountPage } from "./body";
import { CreateAccountPageMock } from "./create_account_page/body_mock";
import { ListAccountsPageMock } from "./list_accounts_page/body_mock";

export class ChooseAccountPageMock extends ChooseAccountPage {
  public constructor(appendBodies: AddBodiesFn, preSelectedAccountId?: string) {
    super(
      () => new CreateAccountPageMock(),
      (preSelectedAccountId) => new ListAccountsPageMock(preSelectedAccountId),
      appendBodies,
      preSelectedAccountId,
    );
  }
}
