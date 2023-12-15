import { CardBrand } from "@phading/billing_service_interface/payment_method_masked";

export function getCardBrandName(cardBrand: CardBrand): string {
  switch (cardBrand) {
    case CardBrand.AMEX:
      return "Amex";
    case CardBrand.DINERS:
      return "Diners";
    case CardBrand.DISCOVER:
      return "Discover";
    case CardBrand.JCB:
      return "JCB";
    case CardBrand.MASTERCARD:
      return "MasterCard";
    case CardBrand.UNIONPAY:
      return "UnionPay";
    case CardBrand.VISA:
      return "Visa";
    default:
      return "Card";
  }
}
