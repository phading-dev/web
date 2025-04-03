let GREY_95 = "rgb(242,242,242)";
let GREY_85 = "rgb(217,217,217)";
let GREY_30 = "rgb(77,77,77)";
let GREY_20 = "rgb(51,51,51)";
let GREY_10 = "rgb(26,26,26)";
let GREY_10_TRANSLUCENT = "rgb(26,26,26,.75)";
let BLUE_60 = "rgb(51,187,255)";
let BLUE_50 = "rgb(0,170,255)";
let BLUE_20 = "rgb(0,68,102)";
let RED_50 = "rgb(255,0,0)";
let ORANGE_60 = "rgb(255,167,51)";

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

export let SCHEME: DarkScheme = new DarkScheme();
