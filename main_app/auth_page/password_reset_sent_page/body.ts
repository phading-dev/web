import EventEmitter = require("events");
import { IconButton, createBackButton } from "../../../common/button";
import { SCHEME } from "../../../common/color_scheme";
import { createCheckmarkInACircleIcon } from "../../../common/icons";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { eCenteredTitle, ePageWithCenterForm } from "../../../common/page_elements";
import {
  FONT_M,
  GAP_1X,
  GAP_2X,
  ICON_XXL,
  LINE_HEIGHT_M,
  PAGE_MAX_WIDTH_M,
} from "../../../common/sizes";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export interface PasswordResetSentPage {
  on(event: "back", listener: () => void): this;
}

export class PasswordResetSentPage extends EventEmitter {
  public static create(email: string): PasswordResetSentPage {
    return new PasswordResetSentPage(email);
  }

  public body: HTMLDivElement;
  public backButton = new Ref<IconButton>();

  public constructor(email: string) {
    super();
    this.body = ePageWithCenterForm(
      new Ref<HTMLFormElement>(),
      "",
      `max-width: ${PAGE_MAX_WIDTH_M}rem; display: flex; flex-flow: column nowrap; align-items: center;`,
      assign(this.backButton, createBackButton()).body,
      E.div(
        {
          class: "password-reset-sent-icon",
          style: `height: ${ICON_XXL}rem;`,
        },
        createCheckmarkInACircleIcon(SCHEME.great1),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
      }),
      eCenteredTitle(LOCALIZED_TEXT.passwordResetSentSuccessTitle),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
      }),
      E.div(
        {
          class: "password-reset-sent-text",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
        },
        E.text(LOCALIZED_TEXT.passwordResetSentSuccessBody),
      ),
      E.div(
        {
          class: "password-reset-sent-email",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.primary0};`,
        },
        E.text(email),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
      }),
      E.div(
        {
          class: "password-reset-sent-reminder",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
        },
        E.text(LOCALIZED_TEXT.passwordResetEmailReminder),
      ),
    );
    this.backButton.val.addAction(() => this.emit("back"));
  }

  public remove(): void {
    this.body.remove();
    this.removeAllListeners();
  }
}
