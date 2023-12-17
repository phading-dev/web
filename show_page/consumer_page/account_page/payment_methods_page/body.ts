import { AddBodiesFn } from "../../../../common/add_bodies_fn";
import { PageNavigator } from "../../../../common/page_navigator";
import { PaymentMethodsListPage } from "./payment_methods_list_page/body";
import { UpdatePaymentMethodPage } from "./update_payment_method_page/body";
import { PaymentMethodMasked } from "@phading/billing_service_interface/payment_method_masked";

enum Page {
  LIST = 1,
  UPDATE = 2,
}

export class PaymentMethodsPage {
  public static create(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn
  ): PaymentMethodsPage {
    return new PaymentMethodsPage(
      PaymentMethodsListPage.create,
      UpdatePaymentMethodPage.create,
      appendBodies,
      prependMenuBodies
    );
  }

  private paymentMethodsListPage_: PaymentMethodsListPage;
  private updatePaymentMethodPage_: UpdatePaymentMethodPage;
  private pageNavigator: PageNavigator<Page>;
  private paymentMethodToBeUpdated: PaymentMethodMasked;

  public constructor(
    private createPaymentMethodsListPage: () => PaymentMethodsListPage,
    private createUpdatePaymentMethodPage: (
      paymentMethod: PaymentMethodMasked
    ) => UpdatePaymentMethodPage,
    private appendBodies: AddBodiesFn,
    private prependMenuBodies: AddBodiesFn
  ) {
    this.pageNavigator = new PageNavigator(
      (page) => this.addPage(page),
      (page) => this.removePage(page)
    );
    this.pageNavigator.goTo(Page.LIST);
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.LIST:
        this.paymentMethodsListPage_ = this.createPaymentMethodsListPage().on(
          "update",
          (paymentMethod) => {
            this.paymentMethodToBeUpdated = paymentMethod;
            this.pageNavigator.goTo(Page.UPDATE);
          }
        );
        this.appendBodies(this.paymentMethodsListPage_.body);
        break;
      case Page.UPDATE:
        this.updatePaymentMethodPage_ = this.createUpdatePaymentMethodPage(
          this.paymentMethodToBeUpdated
        )
          .on("back", () => {
            this.pageNavigator.goTo(Page.LIST);
          })
          .on("updated", () => this.pageNavigator.goTo(Page.LIST))
          .on("deleted", () => this.pageNavigator.goTo(Page.LIST));
        this.appendBodies(this.updatePaymentMethodPage_.body);
        this.prependMenuBodies(this.updatePaymentMethodPage_.menuBody);
        break;
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.LIST:
        this.paymentMethodsListPage_.remove();
        break;
      case Page.UPDATE:
        this.updatePaymentMethodPage_.remove();
        break;
    }
  }

  public remove(): void {
    this.pageNavigator.remove();
  }

  // Visible for testing
  public get paymentMethodsListPage() {
    return this.paymentMethodsListPage_;
  }
  public get updatePaymentMethodPage() {
    return this.updatePaymentMethodPage_;
  }
}
