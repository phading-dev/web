import EventEmitter = require("events");
import { AT_USER } from "../../../common/at_user";
import { SCHEME } from "../../../common/color_scheme";
import { AVATAR_M, FONT_M, FONT_S, LINE_HEIGHT_M } from "../../../common/sizes";
import { AccountSummary } from "@phading/user_service_interface/web/self/account";
import { E } from "@selfage/element/factory";

export class PublisherItem extends EventEmitter {
  public body: HTMLDivElement;

  public constructor(account: AccountSummary) {
    super();
    this.body = E.div(
      {
        class: "publisher-item",
        style: `width: 100%; box-sizing: border-box; border: .1rem solid ${SCHEME.neutral1}; border-box; padding: 2rem; cursor: pointer; display: flex; flex-flow: column nowrap; align-items: center; gap: 1rem;`,
      },
      E.image({
        class: "account-item-avatar",
        style: `width: ${AVATAR_M}rem; height: ${AVATAR_M}rem; border-radius: 100%; margin-bottom: 1rem;`,
        src: account.avatarSmallUrl,
      }),
      E.div(
        {
          class: "account-item-natural-name",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; height: ${LINE_HEIGHT_M * 3}rem; overflow: hidden; color: ${SCHEME.neutral0}; text-align: center;`,
        },
        E.text(account.naturalName),
      ),
      E.div(
        {
          class: "account-item-id",
          style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral1};`,
        },
        E.text(`${AT_USER}${account.accountId}`),
      ),
    );
  }
}
