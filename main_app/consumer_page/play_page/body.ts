import { EventEmitter } from "events";

export class PlayPage extends EventEmitter {
  public static create(): PlayPage {
    return new PlayPage();
  }

  public body: HTMLElement;

  public constructor() {
    super();
  }
}
