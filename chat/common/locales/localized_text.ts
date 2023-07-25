import DefaultText from "./default/text";
import { findClosestLocalizedText } from "@selfage/closest_locale_finder";

export let LOCALIZED_TEXT = findClosestLocalizedText(
  [navigator.language],
  new Map(
    [new DefaultText()].map((text) => {
      return [text.locale, text];
    })
  ),
  new DefaultText()
);
