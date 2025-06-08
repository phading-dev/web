import EventEmitter = require("events");
import { AppRl } from "@phading/web_interface/app";
import { buildUrl } from "@phading/web_interface/url_builder";
import { parseUrl } from "@phading/web_interface/url_parser";

export interface RlHistoryTracker {
  on(event: "applyRl", listener: (rl: AppRl) => void): this;
}

export class RlHistoryTracker extends EventEmitter {
  public static create(): RlHistoryTracker {
    return new RlHistoryTracker(window);
  }

  public constructor(private window: Window) {
    super();
    this.window.addEventListener("popstate", () => this.parse());
  }

  public parse(): void {
    let rl = parseUrl(this.window);
    this.emit("applyRl", rl);
  }

  public push(rl: AppRl): void {
    this.window.history.pushState(
      undefined,
      "",
      buildUrl(this.window.location.origin, rl),
    );
  }

  public replace(rl: AppRl): void {
    this.window.history.replaceState(
      undefined,
      "",
      buildUrl(this.window.location.origin, rl),
    );
  }
}
