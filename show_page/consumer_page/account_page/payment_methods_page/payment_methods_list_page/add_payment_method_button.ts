import { BlockingButton } from "../../../../../common/blocking_button";
import { NULLIFIED_BUTTON_STYLE } from "../../../../../common/button_styles";
import { SCHEME } from "../../../../../common/color_scheme";
import { createPlusIcon } from "../../../../../common/icons";
import { CARD_BORDER_RADIUS } from "./common/styles";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export class AddPaymentMethodButton extends BlockingButton {
  public static create(): AddPaymentMethodButton {
    return new AddPaymentMethodButton();
  }

  private icon: SVGSVGElement;

  public constructor() {
    super(
      `${NULLIFIED_BUTTON_STYLE} width: 100%; box-sizing: border-box; display: flex; flex-flow: row nowrap; justify-content: center; border: .1rem solid; border-radius: ${CARD_BORDER_RADIUS};`
    );
    let iconRef = new Ref<SVGSVGElement>();
    this.append(
      E.div(
        {
          class: "payment-methods-list-add-icon",
          style: `margin: 2rem 0; height: 2.6rem;`,
        },
        assign(iconRef, createPlusIcon(SCHEME.neutral1))
      )
    );
    this.icon = iconRef.val;
  }

  protected enableOverride(): void {
    this.container.style.borderColor = SCHEME.neutral1;
    this.icon.style.stroke = SCHEME.neutral1;
  }

  protected disableOverride(): void {
    this.container.style.borderColor = SCHEME.neutral2;
    this.icon.style.stroke = SCHEME.neutral2;
  }
}
