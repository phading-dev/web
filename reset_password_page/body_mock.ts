import { AddBodiesFn } from "../common/add_bodies_fn";
import { LOCAL_SESSION_STORAGE } from "../common/local_session_storage";
import { ResetPasswordPage } from "./body";
import { ResetPage } from "./reset_page/body";

export class ResetPasswordPageMock extends ResetPasswordPage {
  public constructor(appendBodies: AddBodiesFn, tokenId: string) {
    super(
      (tokenId) => new ResetPage(LOCAL_SESSION_STORAGE, undefined, tokenId),
      undefined,
      undefined,
      appendBodies,
      tokenId,
    );
  }
}
