import { SCHEME } from "./color_scheme";
import {
  BORDER_WIDTH_1,
  FONT_M,
  GAP_0_5X,
  GAP_0_75X,
  LINE_HEIGHT_FOR_BUTTON_M,
} from "./sizes";

export let INPUT_BORDER_RADIUS = GAP_0_5X;
export let INPUT_SIDE_PADDING = GAP_0_75X;
export let NULLIFIED_INPUT_STYLE = `padding: 0; margin: 0; outline: none; border: 0; font-family: inherit; background-color: initial; min-width: 0;`;
// Needs border-color and width.
export let COMMON_BASIC_INPUT_WITHOUT_PADDING_STYLE = `${NULLIFIED_INPUT_STYLE} font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_FOR_BUTTON_M}rem; color: ${SCHEME.neutral0}; color-scheme: ${SCHEME.name}; box-sizing: border-box;`;
export let COMMON_BASIC_INPUT_WITHOUT_BORDER_STYLE = `${COMMON_BASIC_INPUT_WITHOUT_PADDING_STYLE} padding: 0 ${INPUT_SIDE_PADDING}rem;`;
export let COMMON_BASIC_INPUT_STYLE = `${COMMON_BASIC_INPUT_WITHOUT_BORDER_STYLE} border: ${BORDER_WIDTH_1}rem solid; border-radius: ${INPUT_BORDER_RADIUS}rem;`;
