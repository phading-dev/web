import { SCHEME } from "./color_scheme";

export let PAGE_BACKGROUND_STYLE = `width: 100vw; min-height: 100vh; display: flex; flex-flow: row wrap; justify-content: center; align-items: center; background-color: ${SCHEME.neutral3};`;
export let PAGE_COMMON_CARD_STYLE = `box-sizing: border-box; width: 100%; padding: 3rem; border-radius: 1rem; background-color: ${SCHEME.neutral4};`;
export let PAGE_MEDIUM_CARD_STYLE = `${PAGE_COMMON_CARD_STYLE} max-width: 60rem;`;
