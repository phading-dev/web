let GREY_95 = "rgb(242,242,242)";
let GREY_90 = "rgb(230,230,230)";
let GREY_90_TRANSLUCENT = "rgb(230,230,230,.75)";
let GREY_85 = "rgb(217,217,217)";
let GREY_80 = "rgb(204,204,204)";
let GREY_70 = "rgb(179,179,179)";
let GREY_30 = "rgb(77,77,77)";
let GREY_20 = "rgb(51,51,51)";
let GREY_15 = "rgb(38,38,38)";
let GREY_10 = "rgb(26,26,26)";
let GREY_10_TRANSLUCENT = "rgb(26,26,26,.75)";
let GREY_5 = "rgb(13,13,13)";
let BLUE_80 = "rgb(153,221,255)";
let BLUE_60 = "rgb(51,187,255)";
let BLUE_50 = "rgb(0,170,255)";
let BLUE_40 = "rgb(0,136,204)";
let BLUE_20 = "rgb(0,68,102)";
let RED_50 = "rgb(255,0,0)";
let ORANGE_60 = "rgb(255,153,51)";
let ORANGE_40 = "rgb(204,102,0)";
let GREEN_60 = "rgb(51,255,51)";
let GREEN_40 = "rgb(0,204,0)";

export class DarkScheme {
  get logoOrange() {
    return ORANGE_60;
  }
  get logoBlue() {
    return BLUE_60;
  }
  // Main.
  get neutral0() {
    return GREY_95;
  }
  // Borders. Shadow. Filled.
  get neutral1() {
    return GREY_85;
  }
  // Disabled. Contrasted.
  get neutral2() {
    return GREY_30;
  }
  // Overall Background color. Highlighted item.
  get neutral3() {
    return GREY_20;
  }
  // Main card background color.
  get neutral4() {
    return GREY_10;
  }
  get neutral4Translucent() {
    return GREY_10_TRANSLUCENT;
  }
  // Texts.
  get primary0() {
    return BLUE_60;
  }
  // Borders. Filled.
  get primary1() {
    return BLUE_50;
  }
  // Disabled background.
  get primary2() {
    return BLUE_20;
  }
  get primaryContrast0() {
    return GREY_95;
  }
  get link() {
    return BLUE_60;
  }
  get error0() {
    return RED_50;
  }
  get warning0() {
    return ORANGE_60;
  }
  get success0() {
    return GREEN_60;
  }
  get heart() {
    return RED_50;
  }
  get anger() {
    return RED_50;
  }
  get progress() {
    return RED_50;
  }
}

export class LightScheme {
  get logoOrange() {
    return ORANGE_60;
  }
  get logoBlue() {
    return BLUE_60;
  }
  // Main.
  get neutral0() {
    return GREY_5;
  }
  // Borders. Shadow. Filled.
  get neutral1() {
    return GREY_15;
  }
  // Disabled. Contrasted.
  get neutral2() {
    return GREY_70;
  }
  // Overall Background color. Highlighted item.
  get neutral3() {
    return GREY_80;
  }
  // Main card background color.
  get neutral4() {
    return GREY_90;
  }
  get neutral4Translucent() {
    return GREY_90_TRANSLUCENT;
  }
  // Texts.
  get primary0() {
    return BLUE_40;
  }
  // Borders. Filled.
  get primary1() {
    return BLUE_50;
  }
  // Disabled background.
  get primary2() {
    return BLUE_80;
  }
  get primaryContrast0() {
    return GREY_95;
  }
  get link() {
    return BLUE_40;
  }
  get error0() {
    return RED_50;
  }
  get warning0() {
    return ORANGE_40;
  }
  get success0() {
    return GREEN_40;
  }
  get heart() {
    return RED_50;
  }
  get anger() {
    return RED_50;
  }
  get progress() {
    return RED_50;
  }
}

export let SCHEME: DarkScheme | LightScheme = new DarkScheme();

export function setScheme(scheme: DarkScheme | LightScheme) {
  SCHEME = scheme;
}
