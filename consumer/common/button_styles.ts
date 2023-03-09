import { SCHEME } from "./color_scheme";

export let BUTTON_BORDER_RADIUS = `.5rem`;
export let NULLIFIED_BUTTON_STYLE = `padding: 0; margin: 0; outline: none; border: 0; background-color: initial;`;
// Missing color, background-color, border-color, and cursor styles.
export let COMMON_BUTTON_STYLE = `${NULLIFIED_BUTTON_STYLE} flex: 0 0 auto; font-size: 1.4rem; line-height: 100%; padding: .8rem 1.2rem; border: .1rem solid transparent; border-radius: ${BUTTON_BORDER_RADIUS}; cursor: pointer;`;
export let FILLED_BUTTON_STYLE = `${COMMON_BUTTON_STYLE} color: ${SCHEME.primaryContrast0};`;
export let OUTLINE_BUTTON_STYLE = COMMON_BUTTON_STYLE;
export let TEXT_BUTTON_STYLE = COMMON_BUTTON_STYLE;
