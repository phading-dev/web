import EventEmitter = require("events");
import { FILLED_BUTTON_STYLE } from "../../common/button_styles";
import { SCHEME } from "../../common/color_scheme";
import { createExclamationMarkInACycle } from "../../common/icons";
import { LOCALIZED_TEXT } from "../../common/locales/localized_text";
import {
  PAGE_MAX_WIDTH_M,
  eFormTitle,
  ePageWithCenterForm,
} from "../../common/page_elements";
import { FONT_M, ICON_XXL } from "../../common/sizes";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface ResetTokenExpiredPage {
  on(event: "home", listener: () => void): this;
}

export class ResetTokenExpiredPage extends EventEmitter {
  public static create(): ResetTokenExpiredPage {
    return new ResetTokenExpiredPage();
  }

  public body: HTMLDivElement;
  public homeButton = new Ref<HTMLDivElement>();

  public constructor() {
    super();
    this.body = ePageWithCenterForm(
      new Ref<HTMLFormElement>(),
      "",
      `max-width: ${PAGE_MAX_WIDTH_M}rem; display: flex; flex-flow: column nowrap; align-items: center;`,
      E.div(
        {
          class: "reset-token-expired-icon",
          style: `height: ${ICON_XXL}rem;`,
        },
        createExclamationMarkInACycle(SCHEME.error0),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      eFormTitle(LOCALIZED_TEXT.resetPasswordTokenExpiredTitle),
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      E.div(
        {
          class: "reset-token-expired-message",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
        },
        E.text(LOCALIZED_TEXT.resetPasswordTokenExpiredBody),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 3rem;`,
      }),
      E.divRef(
        this.homeButton,
        {
          class: "reset-token-expired-action",
          style: `${FILLED_BUTTON_STYLE}`,
        },
        E.text(LOCALIZED_TEXT.continueButtonLabel),
      ),
    );
    this.homeButton.val.addEventListener("click", () => {
      this.emit("home");
    });
  }

  public remove(): void {
    this.body.remove();
    this.removeAllListeners();
  }
}
