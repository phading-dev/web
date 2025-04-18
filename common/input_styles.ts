import { SCHEME } from "./color_scheme";
import { FONT_M } from "./sizes";

export let NULLIFIED_INPUT_STYLE = `padding: 0; margin: 0; outline: none; border: 0; font-family: inherit; background-color: initial;`;
// Missing border-color and width.
export let COMMON_BASIC_INPUT_STYLE = `${NULLIFIED_INPUT_STYLE} font-size: ${FONT_M}rem; line-height: 140%; color: ${SCHEME.neutral0}; border-bottom: .1rem solid;`;
// Needs width or flex.
export let BASIC_INPUT_STYLE = `${COMMON_BASIC_INPUT_STYLE} border-color: ${SCHEME.neutral1};`;
export let DATE_INPUT_STYLE = `${BASIC_INPUT_STYLE} width: 15rem;`;
