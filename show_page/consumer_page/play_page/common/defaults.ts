import { NumberRange } from "../../../../common/number_range";
import { StackingMethod } from "@phading/product_service_interface/consumer/frontend/show/player_settings";

export let VOLUME_RANGE = new NumberRange(1, 0, 1);
export let VOLUME_MUTED_DEFAULT = false;
export let PLAYBACK_SPEED_DEFAULT = 1;
export let SPEED_RANGE = new NumberRange(500, 100, 200);
export let OPACITY_RANGE = new NumberRange(100, 0, 80);
export let FONT_SIZE_RANGE = new NumberRange(40, 10, 25);
export let DENSITY_RANGE = new NumberRange(100, 0, 100);
export let TOP_MARGIN_RANGE = new NumberRange(100, 0, 1);
export let BOTTOM_MARGIN_RANGE = new NumberRange(100, 0, 10);
export let FONT_FAMILY_DEFAULT = "Arial";
export let ENABLE_CHAT_SCROLLING_DEFAULT = true;
export let STACKING_METHOD_DEFAULT = StackingMethod.RANDOM;
