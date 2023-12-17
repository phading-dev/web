import EventEmitter = require("events");
import { BlockingButton } from "../../../../../common/blocking_button";
import { SCHEME } from "../../../../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import {
  MEDIUM_CARD_STYLE,
  PAGE_STYLE,
} from "../../../../../common/page_style";
import { BILLING_SERVICE_CLIENT } from "../../../../../common/web_service_client";
import { AddPaymentMethodButton } from "./add_payment_method_button";
import { CardPaymentCard } from "./card_payment_card/body";
import {
  createStripeSessionToAddPaymentMethod,
  listPaymentMethods,
} from "@phading/billing_service_interface/client_requests";
import { CreateStripeSessionToAddPaymentMethodResponse } from "@phading/billing_service_interface/interface";
import { PaymentMethodMasked } from "@phading/billing_service_interface/payment_method_masked";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface PaymentMethodsListPage {
  on(event: "loaded", listener: () => void): this;
  on(
    event: "update",
    listener: (paymentMethod: PaymentMethodMasked) => void
  ): this;
  on(event: "redirectError", listener: () => void): this;
  on(event: "redirected", listener: () => void): this;
}

export class PaymentMethodsListPage extends EventEmitter {
  public static create(): PaymentMethodsListPage {
    return new PaymentMethodsListPage(
      window,
      CardPaymentCard.create,
      BILLING_SERVICE_CLIENT
    );
  }

  private body_: HTMLDivElement;
  private container: HTMLDivElement;
  private cards = new Array<CardPaymentCard>();
  private addPaymentMethodButton_: BlockingButton;
  private addErrorMsg: HTMLDivElement;
  private response: CreateStripeSessionToAddPaymentMethodResponse;

  public constructor(
    private window: Window,
    private createCardPaymentCard: (
      paymentMethod: PaymentMethodMasked
    ) => CardPaymentCard,
    private billingServiceClient: WebServiceClient
  ) {
    super();
    let containerRef = new Ref<HTMLDivElement>();
    this.body_ = E.div(
      {
        class: "payment-methods-list",
        style: PAGE_STYLE,
      },
      E.divRef(containerRef, {
        class: "payment-methods-list-container",
        style: `${MEDIUM_CARD_STYLE} display: flex; flex-flow: column nowrap; gap: 1.5rem;`,
      })
    );
    this.container = containerRef.val;

    this.load();
  }

  private async load(): Promise<void> {
    let response = await listPaymentMethods(this.billingServiceClient, {});
    let addPaymentMethodButtonRef = new Ref<BlockingButton>();
    let addErrorMsgRef = new Ref<HTMLDivElement>();
    this.container.append(
      E.div(
        {
          class: "payment-methods-list-title",
          style: `font-size: 1.6rem; color: ${SCHEME.neutral0};`,
        },
        E.text(LOCALIZED_TEXT.paymentMethodsListTitle)
      ),
      ...this.createPaymentMethodCards(response.paymentMethods),
      assign(
        addPaymentMethodButtonRef,
        AddPaymentMethodButton.create().enable().show()
      ).body,
      E.divRef(
        addErrorMsgRef,
        {
          class: "payment-methods-list-add-error",
          style: `font-size: 1.2rem; color: ${SCHEME.error0}; visibility: hidden;`,
        },
        E.text("1")
      )
    );
    this.addPaymentMethodButton_ = addPaymentMethodButtonRef.val;
    this.addErrorMsg = addErrorMsgRef.val;

    this.addPaymentMethodButton_.on("action", () =>
      this.startRedirectingToAddPaymentMethod()
    );
    this.addPaymentMethodButton_.on("postAction", (error?: Error) =>
      this.tryRedirectToStripeToAddPaymentMethod(error)
    );
    this.emit("loaded");
  }

  private createPaymentMethodCards(
    paymentMethods: Array<PaymentMethodMasked>
  ): Array<HTMLDivElement> {
    let cardBodies = new Array<HTMLDivElement>();
    for (let paymentMethod of paymentMethods) {
      // For now we only have the card-type payment method.
      let card = this.createCardPaymentCard(paymentMethod).on(
        "update",
        (paymentMethod) => this.emit("update", paymentMethod)
      );
      this.cards.push(card);
      cardBodies.push(card.body);
    }
    return cardBodies;
  }

  private async startRedirectingToAddPaymentMethod(): Promise<void> {
    this.addErrorMsg.style.visibility = "hidden";
    this.response = await createStripeSessionToAddPaymentMethod(
      this.billingServiceClient,
      {
        backUrl: this.window.location.href,
      }
    );
  }

  private async tryRedirectToStripeToAddPaymentMethod(
    error?: Error
  ): Promise<void> {
    if (error) {
      this.addErrorMsg.textContent =
        LOCALIZED_TEXT.startToAddPaymentMethodsFailed;
      this.addErrorMsg.style.visibility = "visible";
      this.emit("redirectError");
    } else {
      this.window.location.href = this.response.redirectUrl;
      this.emit("redirected");
    }
  }

  public get body() {
    return this.body_;
  }

  public remove(): void {
    this.body_.remove();
  }

  // Visible for testing
  public get paymentMethodCards() {
    return this.cards;
  }
  public get addPaymentMethodButton() {
    return this.addPaymentMethodButton_;
  }
}
