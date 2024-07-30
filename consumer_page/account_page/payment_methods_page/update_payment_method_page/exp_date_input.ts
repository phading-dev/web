import EventEmitter = require("events");
import { SCHEME } from "../../../../common/color_scheme";
import { InputField } from "../../../../common/input_form_page/input_field";
import { BASIC_INPUT_STYLE } from "../../../../common/input_form_page/text_input";
import { UpdatePaymentMethodRequestBody } from "@phading/commerce_service_interface/consumer/frontend/interface";
import { E } from "@selfage/element/factory";

export class ExpMonthInput
  extends EventEmitter
  implements InputField<UpdatePaymentMethodRequestBody>
{
  private body_: HTMLInputElement;
  private valid: boolean;

  public constructor(private expMonth: number) {
    super();
    this.body_ = E.input({
      class: "update-payment-method-card-expiration-month-input",
      style: `${BASIC_INPUT_STYLE} width: 3rem; text-align: center; border-color: ${SCHEME.neutral1};`,
      placeholder: "MM",
      value: expMonth.toString().padStart(2, "0"),
    });

    this.normalizeExpMonth();
    this.body_.addEventListener("input", () => this.normalizeExpMonth());
  }

  private normalizeExpMonth(): void {
    let expMonth = Number.parseInt(this.body_.value);
    if (isNaN(expMonth) || expMonth <= 0 || expMonth > 12) {
      this.body_.value = "";
      this.expMonth = undefined;
      this.valid = false;
    } else {
      this.expMonth = expMonth;
      this.valid = true;
    }
    this.emit("validated");
  }

  public fillInRequest(request: UpdatePaymentMethodRequestBody): void {
    request.paymentMethodUpdates.card.expMonth = this.expMonth;
  }

  public get body() {
    return this.body_;
  }

  public get isValid() {
    return this.valid;
  }

  // Visible for testing
  public set value(value: string) {
    this.body_.value = value;
  }
  public dispatchInputEvent(): void {
    this.body_.dispatchEvent(new InputEvent("input"));
  }
}

export class ExpYearInput
  extends EventEmitter
  implements InputField<UpdatePaymentMethodRequestBody>
{
  private body_: HTMLInputElement;
  private valid: boolean;

  public constructor(private expYear: number) {
    super();
    this.body_ = E.input({
      class: "update-payment-method-card-expiration-year-input",
      style: `${BASIC_INPUT_STYLE} width: 6rem; text-align: center; border-color: ${SCHEME.neutral1};`,
      placeholder: "YYYY",
      value: expYear.toString().padStart(4, "0"),
    });

    this.normalizeExpYear();
    this.body_.addEventListener("input", () => this.normalizeExpYear());
  }

  private normalizeExpYear(): void {
    let expYear = Number.parseInt(this.body_.value);
    if (isNaN(expYear) || expYear <= 0 || expYear >= 10000) {
      this.body_.value = "";
      this.expYear = undefined;
      this.valid = false;
    } else {
      this.expYear = expYear;
      this.valid = true;
    }
    this.emit("validated");
  }

  public fillInRequest(request: UpdatePaymentMethodRequestBody): void {
    request.paymentMethodUpdates.card.expYear = this.expYear;
  }

  public get body() {
    return this.body_;
  }

  public get isValid() {
    return this.valid;
  }

  // Visible for testing
  public set value(value: string) {
    this.body_.value = value;
  }
  public dispatchInputEvent(): void {
    this.body_.dispatchEvent(new InputEvent("input"));
  }
}
