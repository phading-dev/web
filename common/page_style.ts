import { SCHEME } from "./color_scheme";

// The container of a page needs to pre-define its width and height. E.g. a page container might set width: 100vw and height: 100vh;

export let PAGE_CENTER_CARD_BACKGROUND_STYLE = `width: 100%; min-height: 100%; box-sizing: border-box; display: flex; flex-flow: column nowrap; justify-content: center; align-items: center;`;
export let PAGE_COMMON_CENTER_CARD_STYLE = `flex: 0 0 auto; box-sizing: border-box; width: 100%; background-color: ${SCHEME.neutral4}; position: relative;`;
export let PAGE_MEDIUM_CENTER_CARD_STYLE = `${PAGE_COMMON_CENTER_CARD_STYLE} padding: 3rem; border-radius: 1rem; max-width: 60rem;`;
export let PAGE_EX_LARGE_CENTER_CARD_STYLE = `${PAGE_COMMON_CENTER_CARD_STYLE} padding: 3rem; border-radius: 1rem; max-width: 120rem;`;

// Top down layout card.
export let PAGE_TOP_DOWN_CARD_BACKGROUND_STYLE = `width: 100%; height: 100%; box-sizing: border-box; display: flex; flex-flow: column nowrap; align-items: center;`
// max-width, padding, flex...
export let PAGE_COMMON_TOP_DOWN_CARD_STYLE = `flex: 0 0 auto; box-sizing: border-box; width: 100%; min-height: 100%; background-color: ${SCHEME.neutral4}; position: relative;`;
export let PAGE_MEDIUM_TOP_DOWN_CARD_STYLE = `${PAGE_COMMON_TOP_DOWN_CARD_STYLE} max-width: 80rem;`;
export let PAGE_LARGE_TOP_DOWN_CARD_STYLE = `${PAGE_COMMON_TOP_DOWN_CARD_STYLE} max-width: 120rem;`;
