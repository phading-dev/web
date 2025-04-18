import { SCHEME } from "./color_scheme";

// Leave room for navigation bar.
export let PAGE_PADDING_BOTTOM = 7;
// A page container needs to pre-define its width and height. E.g. a page container might set width: 100vw and height: 100vh;
export let PAGE_BACKGROUND_STYLE = `width: 100%; min-height: 100%; box-sizing: border-box; display: flex; flex-flow: column nowrap; justify-content: center; align-items: center; background-color: ${SCHEME.neutral3}; padding-bottom: ${PAGE_PADDING_BOTTOM}rem;`;
export let PAGE_COMMON_CARD_STYLE = `box-sizing: border-box; width: 100%; padding: 3rem; border-radius: 1rem; background-color: ${SCHEME.neutral4}; position: relative;`;
export let PAGE_MEDIUM_CARD_STYLE = `${PAGE_COMMON_CARD_STYLE} max-width: 60rem;`;
export let PAGE_LARGE_CARD_STYLE = `${PAGE_COMMON_CARD_STYLE} max-width: 80rem;`;
export let PAGE_EX_LARGE_CARD_STYLE = `${PAGE_COMMON_CARD_STYLE} max-width: 120rem;`;
