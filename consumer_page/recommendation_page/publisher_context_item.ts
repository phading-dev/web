import { AT_USER } from "../../common/at_user";
import { SCHEME } from "../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../common/locales/localized_text";
import { FONT_M, FONT_S, FONT_WEIGHT_600 } from "../../common/sizes";
import { PublisherDetail } from "@phading/product_recommendation_service_interface/consumer/frontend/show/publisher_detail";
import { E } from "@selfage/element/factory";

export class PublisherContextItem {
  public static create(publisher: PublisherDetail): PublisherContextItem {
    return new PublisherContextItem(publisher);
  }

  public body: HTMLDivElement;

  public constructor(publisher: PublisherDetail) {
    this.body = E.div(
      {
        class: "publisher-info-item",
        style: `width: 100%; box-sizing: border-box; padding: 1.5rem; display: flow-root;`,
      },
      E.image({
        class: "publisher-info-item-avatar",
        style: `float: left; margin: 0 1rem .5rem 0; width: 12rem; height: 12rem; border: .1rem solid ${SCHEME.neutral1}; border-radius: 100%;`,
        src: publisher.avatarLargePath,
      }),
      E.div(
        {},
        E.div(
          {
            class: "publisher-info-item-natural-name",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
          },
          E.text(publisher.naturalName),
        ),
        E.div({
          style: `height: .5rem;`,
        }),
        E.div(
          {
            class: "publisher-info-item-account-id",
            style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral1};`,
          },
          E.text(`${AT_USER} ${publisher.accountId}`),
        ),
      ),
      E.div({
        style: `height: 1rem;`,
      }),
      E.div(
        {
          class: "publisher-info-item-description",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(publisher.description ?? LOCALIZED_TEXT.noAccountDescription),
      ),
    );
  }

  public remove(): void {
    this.body.remove();
  }
}
