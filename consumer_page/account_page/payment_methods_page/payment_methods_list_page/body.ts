import EventEmitter = require("events");
import { BlockingButton } from "../../../../common/blocking_button";
import { SCHEME } from "../../../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import {
  PAGE_BACKGROUND_STYLE,
  PAGE_MEDIUM_CARD_STYLE,
} from "../../../../common/page_style";
import { FONT_S } from "../../../../common/sizes";
import { COMMERCE_SERVICE_CLIENT } from "../../../../common/web_service_client";
import { AddPaymentMethodButton } from "./add_payment_method_button";
import { CardPaymentItem } from "./card_payment_item/body";
import {
  createStripeSessionToAddPaymentMethod,
  listPaymentMethods,
} from "@phading/commerce_service_interface/consumer/frontend/client";
import { CreateStripeSessionToAddPaymentMethodResponse } from "@phading/commerce_service_interface/consumer/frontend/interface";
import { PaymentMethodMasked } from "@phading/commerce_service_interface/consumer/frontend/payment_method_masked";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface PaymentMethodsListPage {
  on(event: "loaded", listener: () => void): this;
  on(
    event: "update",
    listener: (paymentMethod: PaymentMethodMasked) => void,
  ): this;
  on(event: "redirectError", listener: () => void): this;
  on(event: "redirected", listener: () => void): this;
}

export class PaymentMethodsListPage extends EventEmitter {
  public static create(): PaymentMethodsListPage {
    return new PaymentMethodsListPage(
      window,
      CardPaymentItem.create,
      COMMERCE_SERVICE_CLIENT,
    );
  }

  public body: HTMLDivElement;
  public items = new Array<CardPaymentItem>();
  public addPaymentMethodButton = new Ref<BlockingButton>();
  private addErrorMsg = new Ref<HTMLDivElement>();
  private response: CreateStripeSessionToAddPaymentMethodResponse;

  public constructor(
    private window: Window,
    private createCardPaymentItem: (
      paymentMethod: PaymentMethodMasked,
    ) => CardPaymentItem,
    private webSerivceClient: WebServiceClient,
  ) {
    super();
    this.body = E.div({
      class: "payment-methods-list",
      style: PAGE_BACKGROUND_STYLE,
    });

    this.load();
  }

  private async load(): Promise<void> {
    let response = await listPaymentMethods(this.webSerivceClient, {});

    this.body.append(
      E.div(
        {
          class: "payment-methods-list-card",
          style: `${PAGE_MEDIUM_CARD_STYLE} display: flex; flex-flow: column nowrap; gap: 1.5rem;`,
        },
        ...this.createPaymentMethodItems(response.paymentMethods),
        assign(
          this.addPaymentMethodButton,
          AddPaymentMethodButton.create().enable().show(),
        ).body,
        E.divRef(
          this.addErrorMsg,
          {
            class: "payment-methods-list-add-error",
            style: `font-size: ${FONT_S}rem; color: ${SCHEME.error0}; visibility: hidden;`,
          },
          E.text("1"),
        ),
      ),
    );

    this.addPaymentMethodButton.val.on("action", () =>
      this.startRedirectingToAddPaymentMethod(),
    );
    this.addPaymentMethodButton.val.on("postAction", (error?: Error) =>
      this.tryRedirectToStripeToAddPaymentMethod(error),
    );
    this.emit("loaded");
  }

  private createPaymentMethodItems(
    paymentMethods: Array<PaymentMethodMasked>,
  ): Array<HTMLDivElement> {
    let itemBodies = new Array<HTMLDivElement>();
    for (let paymentMethod of paymentMethods) {
      // For now we only have the card-type payment method.
      let item = this.createCardPaymentItem(paymentMethod).on(
        "update",
        (paymentMethod) => this.emit("update", paymentMethod),
      );
      this.items.push(item);
      itemBodies.push(item.body);
    }
    return itemBodies;
  }

  private async startRedirectingToAddPaymentMethod(): Promise<void> {
    this.addErrorMsg.val.style.visibility = "hidden";
    this.response = await createStripeSessionToAddPaymentMethod(
      this.webSerivceClient,
      {
        backUrl: this.window.location.href,
      },
    );
  }

  private async tryRedirectToStripeToAddPaymentMethod(
    error?: Error,
  ): Promise<void> {
    if (error) {
      this.addErrorMsg.val.textContent =
        LOCALIZED_TEXT.startToAddPaymentMethodsFailed;
      this.addErrorMsg.val.style.visibility = "visible";
      this.emit("redirectError");
    } else {
      this.window.location.href = this.response.redirectUrl;
      this.emit("redirected");
    }
  }

  public remove(): void {
    this.body.remove();
  }
}
