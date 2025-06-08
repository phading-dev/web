import { AddBodiesFn } from "../../common/add_bodies_fn";
import { ChooseAccountPage } from "./body";
import { ListAccountsPageMock } from "./list_accounts_page/body_mock";
import { SwitchAccountPageMock } from "./switch_account_page/body_mock";

export class ChooseAccountPageMock extends ChooseAccountPage {
  public constructor(appendBodies: AddBodiesFn, accountId?: string) {
    super(
      undefined,
      (error) => new ListAccountsPageMock(error),
      (accountId) => new SwitchAccountPageMock(accountId),
      appendBodies,
      accountId,
    );
  }
}
