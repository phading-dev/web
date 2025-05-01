import { NumberRange } from "../../../../common/number_range";
import {
  ChatOverlayStyle,
  StackingMethod,
} from "@phading/user_service_interface/web/self/video_player_settings";

export let VOLUME_RANGE = new NumberRange(0, 10, 10);
export let PLAYBACK_SPEED_DEFAULT = 1;
export let PLAYBACK_SPEED_VALUES = [
  0.25, 0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 8,
];
export let CHAT_OVERLAY_STYLE_DEFAULT = ChatOverlayStyle.SIDE;
export let OPACITY_RANGE = new NumberRange(0, 100, 80);
export let FONT_SIZE_RANGE = new NumberRange(10, 50, 20);
export let SPEED_RANGE = new NumberRange(50, 400, 200);
export let DENSITY_RANGE = new NumberRange(0, 100, 100);
export let ENABLE_CHAT_SCROLLING_DEFAULT = true;
export let STACKING_METHOD_DEFAULT = StackingMethod.RANDOM;
