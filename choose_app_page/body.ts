import EventEmitter = require("events");
import { AppType } from "../app_type";
import { createChatAppIcon, createShowAppIcon } from "../common/icons";
import { LOCALIZED_TEXT } from "../common/locales/localized_text";
import { MenuItem } from "../common/menu_item/body";
import { createBackMenuItem } from "../common/menu_item/factory";
import { PAGE_STYLE } from "../common/page_style";
import { AppCard } from "./app_card";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export interface ChooseAppPage {
  on(event: "back", listener: () => void): this;
  on(event: "chosen", listener: (chosenApp: AppType) => void): this;
}

export class ChooseAppPage extends EventEmitter {
  public body: HTMLDivElement;
  public menuBody: HTMLDivElement;
  // Visible for testing
  public chatAppCard: AppCard;
  public showAppCard: AppCard;
  public backMenuItem: MenuItem;

  public constructor() {
    super();
    let chatAppCardRef = new Ref<AppCard>();
    let showAppCardRef = new Ref<AppCard>();
    this.body = E.div(
      {
        class: "choose-app",
        style: PAGE_STYLE,
      },
      E.div(
        {
          class: "choose-app-container",
          style: `margin: auto; display: flex; flex-flow: row wrap; gap: 6rem; max-width: 100rem;`,
        },
        assign(
          chatAppCardRef,
          AppCard.create(
            AppType.Chat,
            createChatAppIcon(),
            LOCALIZED_TEXT.chatAppName
          )
        ).body,
        assign(
          showAppCardRef,
          AppCard.create(
            AppType.Show,
            createShowAppIcon(),
            LOCALIZED_TEXT.ShowAppName
          )
        ).body
      )
    );
    this.chatAppCard = chatAppCardRef.val;
    this.showAppCard = showAppCardRef.val;

    this.backMenuItem = createBackMenuItem();
    this.menuBody = this.backMenuItem.body;

    this.chatAppCard.on("action", (appType) => this.emit("chosen", appType));
    this.showAppCard.on("action", (appType) => this.emit("chosen", appType));
    this.backMenuItem.on("action", () => this.emit("back"));
  }

  public static create(): ChooseAppPage {
    return new ChooseAppPage();
  }

  public remove(): void {
    this.body.remove();
    this.backMenuItem.remove();
  }
}
