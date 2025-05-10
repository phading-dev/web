import { NumberRange } from "../../../../common/number_range";
import {
  CommentOverlayStyle,
  StackingMethod,
} from "@phading/user_service_interface/web/self/video_player_settings";

export let VOLUME_RANGE = new NumberRange(0, 10, 10);
export let VOLUME_SCALE = 0.1;
export let PLAYBACK_SPEED_DEFAULT = 1;
export let PLAYBACK_SPEED_VALUES = [
  0.25, 0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 8,
];
export let COMMENT_OVERLAY_STYLE_DEFAULT = CommentOverlayStyle.SIDE;
export let OPACITY_RANGE = new NumberRange(0, 100, 80);
export let OPACITY_SCALE = 0.01;
export let FONT_SIZE_RANGE = new NumberRange(10, 100, 20);
export let FONT_SIZE_SCALE = 0.1;
export let SPEED_RANGE = new NumberRange(50, 500, 200);
export let DENSITY_RANGE = new NumberRange(0, 100, 100);
export let DENSITY_SCALE = 0.01;
export let STACKING_METHOD_DEFAULT = StackingMethod.RANDOM;
