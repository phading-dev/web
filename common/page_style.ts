import { SCHEME } from "./color_scheme";

export let PAGE_STYLE = `display: flex; flex-flow: column nowrap; width: 100vw; min-height: 100vh; background-color: ${SCHEME.neutral3};`;
export let COMMON_CARD_STYLE = `margin: auto; box-sizing: border-box; width: 100%; padding: 3rem; border-radius: 1rem; background-color: ${SCHEME.neutral4};`;
export let MEDIUM_CARD_STYLE = `${COMMON_CARD_STYLE} max-width: 60rem;`;
export let LARGE_CARD_STYLE = `${COMMON_CARD_STYLE} max-width: 160rem;`;
