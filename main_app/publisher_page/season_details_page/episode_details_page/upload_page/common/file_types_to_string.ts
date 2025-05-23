import { LOCALIZED_TEXT } from "../../../../../../common/locales/localized_text";

export function fileTypesToString(types: Array<string>): string {
  if (types.length > 1) {
    let lastType = types.pop();
    return (
      types.map((type) => `.${type}`).join(LOCALIZED_TEXT.fileTypeJoinComma) +
      LOCALIZED_TEXT.fileTypesJoinOr +
      `.${lastType}`
    );
  } else {
    return `.${types[0]}`;
  }
}
