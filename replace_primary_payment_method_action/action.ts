import EventEmitter = require("events");
import { SERVICE_CLIENT } from "../common/web_service_client";
import { newReplacePrimaryPaymentMethodRequest } from "@phading/commerce_service_interface/web/payment/client";
import { WebServiceClient } from "@selfage/web_service_client";

export interface ReplacePrimaryPaymentMethodAction {
  on(event: "complete", listener: (accountId: string) => void): this;
}

export class ReplacePrimaryPaymentMethodAction extends EventEmitter {
  public static create(accountId: string): ReplacePrimaryPaymentMethodAction {
    return new ReplacePrimaryPaymentMethodAction(
      window,
      SERVICE_CLIENT,
      accountId,
    );
  }

  public constructor(
    private window: Window,
    private serviceClient: WebServiceClient,
    public accountId: string,
  ) {
    super();
    this.execute();
  }

  private async execute(): Promise<void> {
    await this.executeInternal();
    this.emit("complete", this.accountId);
  }

  private async executeInternal(): Promise<void> {
    let checkoutSessionId = new URLSearchParams(
      this.window.location.search,
    ).get("session_id");
    if (!checkoutSessionId) {
      console.error("No checkout session ID found in the URL.");
      return;
    }

    try {
      await this.serviceClient.send(
        newReplacePrimaryPaymentMethodRequest({
          checkoutSessionId,
        }),
      );
    } catch (e) {
      console.error(e);
    }
  }
}
