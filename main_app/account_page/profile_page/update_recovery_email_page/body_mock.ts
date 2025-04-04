import { UpdateRecoveryEmailPage } from "./body";

export class UpdateRecoveryEmailPageMock extends UpdateRecoveryEmailPage {
  public constructor(username: string) {
    super(undefined, username);
  }
}
