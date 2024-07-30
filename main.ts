import { HistoryTracker } from "./history_tracker";
import { RootPage } from "./root_page";
import { ROOT_PAGE_STATE } from "./root_page_state";
import "./common/normalize_body";
import "./environment";

async function main(): Promise<void> {
  let viewPortMeta = document.createElement("meta");
  viewPortMeta.name = "viewport";
  viewPortMeta.content = "width=device-width, initial-scale=1";
  document.head.appendChild(viewPortMeta);

  let rootPage = RootPage.create(document.body);
  let queryParamKey = "s";
  let historyTracker = HistoryTracker.create(ROOT_PAGE_STATE, queryParamKey);
  historyTracker.on("update", (newState) => rootPage.updateState(newState));
  rootPage.on("newState", (newState) => historyTracker.push(newState));
  historyTracker.parse();
}

main();
