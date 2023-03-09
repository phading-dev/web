let TRANSPARENT = "transparent";
let GREY_20 = "rgb(50, 50, 50)";
let GREY_50 = "rgb(128, 128, 128)";
let GREY_50_TRANSLUCENT = "rgb(128, 128, 128, .5)";
let GREY_80 = "rgb(200, 200, 200)";
let GREY_90 = "rgb(230, 230, 230)";
let WHITE = "white";
let BLUE_50 = "rgb(0, 170, 255)";
let BLUE_65 = "rgb(77, 195, 255)";
let BLUE_85 = "rgb(179, 229, 255)";
let RED_50 = "rgb(255, 0,0)";
let LOGO_BLUE = "rgb(0, 174, 239)";
let LOGO_ORANGE = "rgb(255, 180, 80)";

export class LightScheme {
  get logoOrange() {
    return LOGO_ORANGE;
  }
  get logoBlue() {
    return LOGO_BLUE;
  }
  // Texts.
  get neutral0() {
    return GREY_20;
  }
  // SVG icons & borders.
  get neutral1() {
    return GREY_50;
  }
  // Modal background.
  get neutral1Translucent() {
    return GREY_50_TRANSLUCENT;
  }
  // Hinted & disabled texts. Hinted SVG icons & borders.
  get neutral2() {
    return GREY_80;
  }
  // Overall Background color. Disabled SVG icons & borders.
  get neutral3() {
    return GREY_90;
  }
  // Main background color for cards and popups.
  get neutral4() {
    return WHITE;
  }
  get transparent() {
    return TRANSPARENT;
  }
  // Texts.
  get primary0() {
    return BLUE_50;
  }
  // Borders, background and SVG icons.
  get primary1() {
    return BLUE_65;
  }
  // Disabled background.
  get primary2() {
    return BLUE_85;
  }
  get primaryContrast0() {
    return WHITE;
  }
  get error0() {
    return RED_50;
  }
  get heart() {
    return RED_50;
  }
  get thumbUp() {
    return BLUE_50;
  }
  get anger() {
    return RED_50;
  }
}

export let SCHEME: LightScheme = new LightScheme();
