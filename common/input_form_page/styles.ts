import { SCHEME } from "../color_scheme";

export let NULLIFIED_INPUT_STYLE = `padding: 0; margin: 0; outline: none; border: 0; font-family: initial; background-color: initial;`;
// Missing border-color.
export let BASIC_INPUT_STYLE = `${NULLIFIED_INPUT_STYLE} font-size: 1.4rem; line-height: 2rem; color: ${SCHEME.neutral0}; border-bottom: .1rem solid;`;
