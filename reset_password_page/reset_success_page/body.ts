import EventEmitter = require("events");
import { Button, FilledButton } from "../../common/button";
import { SCHEME } from "../../common/color_scheme";
import { createCheckmarkInACircleIcon } from "../../common/icons";
import { LOCALIZED_TEXT } from "../../common/locales/localized_text";
import { eFormTitle, ePageWithCenterForm } from "../../common/page_elements";
import {
  FONT_M,
  GAP_1X,
  GAP_2X,
  ICON_XXL,
  LINE_HEIGHT_M,
  PAGE_MAX_WIDTH_M,
} from "../../common/sizes";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export interface ResetSuccessPage {
  on(event: "home", listener: () => void): this;
}

export class ResetSuccessPage extends EventEmitter {
  public static create(): ResetSuccessPage {
    return new ResetSuccessPage();
  }

  public body: HTMLDivElement;
  public homeButton = new Ref<Button>();

  public constructor() {
    super();
    this.body = ePageWithCenterForm(
      new Ref<HTMLFormElement>(),
      "",
      `max-width: ${PAGE_MAX_WIDTH_M}rem; display: flex; flex-flow: column nowrap; align-items: center;`,
      E.div(
        {
          class: "reset-success-icon",
          style: `height: ${ICON_XXL}rem;`,
        },
        createCheckmarkInACircleIcon(SCHEME.success1),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
      }),
      eFormTitle(LOCALIZED_TEXT.resetPasswordSuccessTitle),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
      }),
      E.div(
        {
          class: "reset-success-message",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
        },
        E.text(LOCALIZED_TEXT.resetPasswordSuccessBody),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
      }),
      assign(
        this.homeButton,
        new FilledButton(`width: 100%;`).append(
          E.text(LOCALIZED_TEXT.goToHomeButtonLabel),
        ),
      ).body,
    );
    this.homeButton.val.addAction(() => {
      this.emit("home");
    });
  }

  public remove(): void {
    this.body.remove();
    this.removeAllListeners();
  }
}
