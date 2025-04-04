import { UpdatePasswordPage } from "./body";

export class UpdatePasswordPageMock extends UpdatePasswordPage {
  public constructor(username: string) {
    super(undefined, username);
  }
}
