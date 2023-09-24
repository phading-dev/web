import EventEmitter = require("events");
import { getAppName } from "../common/app_name";
import { SCHEME } from "../common/color_scheme";
import { AppType } from "@phading/product_service_interface/app_type";
import { E } from "@selfage/element/factory";

export interface AppCard {
  on(event: "action", listener: (appType: AppType) => void): this;
}

export class AppCard extends EventEmitter {
  public body: HTMLDivElement;

  public constructor(private appType: AppType, icon: SVGSVGElement) {
    super();
    this.body = E.div(
      {
        class: "app-card",
        style: `display: flex; flex-flow: column nowrap; justify-content: flex-start; align-items: center; width: 11rem; height: 15rem; box-sizing: border-box; padding: 2rem; gap: 3rem; cursor: pointer;`,
      },
      E.div(
        {
          class: "app-card-icon",
          style: `width: 4.6rem; height: 4.6rem;`,
        },
        icon
      ),
      E.div(
        {
          class: "app-card-label",
          style: `font-size: 1.4rem; color: ${SCHEME.neutral0};`,
        },
        E.text(getAppName(this.appType))
      )
    );

    this.body.addEventListener("click", () =>
      this.emit("action", this.appType)
    );
  }

  public static create(appType: AppType, icon: SVGSVGElement): AppCard {
    return new AppCard(appType, icon);
  }

  public click(): void {
    this.body.click();
  }
}
