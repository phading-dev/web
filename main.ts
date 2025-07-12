import { App } from "./app";
import { normalizeBody } from "./common/normalize_body";
import { RlHistoryTracker } from "./rl_history_tracker";

async function main(): Promise<void> {
  normalizeBody();
  let app = App.create(document.body);
  let historyTracker = RlHistoryTracker.create();
  historyTracker.on("applyRl", (rl) => app.applyRl(rl));
  app.on("replaceRl", (rl) => historyTracker.replace(rl));
  app.on("pushRl", (rl) => historyTracker.push(rl));
  historyTracker.parse();
}

main();
