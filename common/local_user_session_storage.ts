import {
  USER_SESSION,
  UserSession,
} from "@phading/user_service_interface/user_session";
import { parseMessage } from "@selfage/message/parser";

export class LocalUserSessionStorage {
  private static NAME = "user_session";
  private userSession: UserSession;

  public constructor() {
    let userSessionStr = localStorage.getItem(LocalUserSessionStorage.NAME);
    if (!userSessionStr) {
      return undefined;
    }
    this.userSession = parseMessage(JSON.parse(userSessionStr), USER_SESSION);
  }

  public save(userSession: UserSession): void {
    localStorage.setItem(
      LocalUserSessionStorage.NAME,
      JSON.stringify(userSession)
    );
    this.userSession = userSession;
  }
  public read(): UserSession | undefined {
    return this.userSession;
  }
  public remove(): void {
    localStorage.clear();
    this.userSession = undefined;
  }
}

export let LOCAL_USER_SESSION_STORAGE = new LocalUserSessionStorage();
