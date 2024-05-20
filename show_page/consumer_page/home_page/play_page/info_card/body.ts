import EventEmitter = require("events");
import { SCHEME } from "../../../../../common/color_scheme";
import { AVATAR_S, FONT_M, FONT_S, LINE_HEIGHT_M } from "../../../../../common/sizes";
import { Show } from "@phading/product_service_interface/consumer/show_app/show";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface InfoCard {
  on(event: "focusUser", listener: (accountId: string) => void): this;
}

export class InfoCard extends EventEmitter {
  public body: HTMLDivElement;
  public publisher = new Ref<HTMLDivElement>();

  public constructor(show: Show) {
    super();
    let dateFormatter = new Intl.DateTimeFormat(navigator.language, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    this.body = E.div(
      {
        class: "info-card",
        style: `width: 100%; height: 100%; overflow-y: auto; padding: 1rem 2rem; box-sizing: border-box; display: flex; flex-flow: column nowrap; gap: 1rem; background-color: ${SCHEME.neutral4};`,
      },
      E.div(
        {
          class: "info-card-title",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: 600;`,
        },
        E.text(show.name),
      ),
      E.div(
        {
          class: "inf-card-description",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(show.description),
      ),
      E.div(
        {
          class: "info-card-published-time",
          style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(dateFormatter.format(new Date(show.publishedTime * 1000))),
      ),
      E.divRef(
        this.publisher,
        {
          class: "info-card-publisher",
          style: `pointer: cursor;`
        },
        E.image({
          class: "info-card-publisher-avatar",
          style: `float: left; width: ${AVATAR_S}rem; height: ${AVATAR_S}rem; border-radius: ${AVATAR_S}rem; margin: 0 .5rem .5rem 0;`,
          src: show.publisher.avatarSmallPath,
        }),
        E.div(
          {
            class: "info-card-publisher-name",
            style: `display: inline; font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(show.publisher.naturalName),
        ),
      ),
    );

    this.publisher.val.addEventListener("click", () =>
      this.emit("focusUser", show.publisher.accountId),
    );
  }

  public remove(): void {
    this.body.remove();
  }
}
