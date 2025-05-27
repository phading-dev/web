import { SCHEME } from "./color_scheme";

export let PAGE_MAX_WIDTH_M = 60;
export let PAGE_MAX_WIDTH_L = 80;
export let PAGE_MAX_WIDTH_XL = 120;

// The container of a page needs to pre-define its width and height. E.g. a page container might set width: 100vw and height: 100vh;
export let PAGE_CENTER_CARD_BACKGROUND_STYLE = `width: 100%; min-height: 100%; box-sizing: border-box; display: flex; flex-flow: column nowrap; justify-content: center; align-items: center;`;
export let PAGE_COMMON_CENTER_CARD_STYLE = `flex: 0 0 auto; box-sizing: border-box; width: 100%; padding: 3rem; border-radius: 1rem;  background-color: ${SCHEME.neutral4};position: relative;`;
export let PAGE_MEDIUM_CENTER_CARD_STYLE = `${PAGE_COMMON_CENTER_CARD_STYLE} max-width: ${PAGE_MAX_WIDTH_M}rem;`;
export let PAGE_LARGE_CENTER_CARD_STYLE = `${PAGE_COMMON_CENTER_CARD_STYLE} max-width: ${PAGE_MAX_WIDTH_L}rem;`;
export let PAGE_EX_LARGE_CENTER_CARD_STYLE = `${PAGE_COMMON_CENTER_CARD_STYLE} max-width: ${PAGE_MAX_WIDTH_XL}rem;`;

// Top down layout card.
export let PAGE_TOP_DOWN_CARD_BACKGROUND_STYLE = `width: 100%; height: 100%; box-sizing: border-box; display: flex; flex-flow: column nowrap; align-items: center;`
// max-width, padding, flex...
export let PAGE_COMMON_TOP_DOWN_CARD_STYLE = `flex: 0 0 auto; box-sizing: border-box; width: 100%; min-height: 100%; background-color: ${SCHEME.neutral4}; position: relative;`;
export let PAGE_LARGE_TOP_DOWN_CARD_STYLE = `${PAGE_COMMON_TOP_DOWN_CARD_STYLE} max-width: ${PAGE_MAX_WIDTH_L}rem;`;
export let PAGE_EX_LARGE_TOP_DOWN_CARD_STYLE = `${PAGE_COMMON_TOP_DOWN_CARD_STYLE} max-width: ${PAGE_MAX_WIDTH_XL}rem;`;
