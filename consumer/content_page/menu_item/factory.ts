import { SCHEME } from "../../common/color_scheme";
import {
  createAccountIcon,
  createArrowIcon,
  createHomeIcon,
  createPlusIcon,
  createReplyIcon,
  createShuffleIcon,
} from "../../common/icons";
import { LOCALIZED_TEXT } from "../../common/locales/localized_text";
import { MenuItem } from "./container";

export function createHomeMenuItem(): MenuItem {
  return MenuItem.create(
    createHomeIcon(SCHEME.neutral1),
    `1rem`,
    LOCALIZED_TEXT.homeLabel,
  );
}

export function createShuffleMenuItem(): MenuItem {
  return MenuItem.create(
    createShuffleIcon(SCHEME.neutral1),
    `1rem`,
    LOCALIZED_TEXT.shuffleTalesLabel,
  );
}

export function createWritePostMenuItem(): MenuItem {
  return MenuItem.create(
    createPlusIcon(SCHEME.primary1),
    `1rem`,
    LOCALIZED_TEXT.writeTaleLabel,
  );
}

export function createReplyPostMenuItem(): MenuItem {
  return MenuItem.create(
    createReplyIcon(SCHEME.primary1),
    `1rem`,
    LOCALIZED_TEXT.replyTaleLabel,
  );
}

export function createAccountMenuItem(): MenuItem {
  return MenuItem.create(
    createAccountIcon(SCHEME.neutral1),
    `1rem`,
    LOCALIZED_TEXT.accountLabel,
  );
}

export function createBackMenuItem(): MenuItem {
  return MenuItem.create(
    createArrowIcon(SCHEME.neutral1),
    `1rem`,
    LOCALIZED_TEXT.backLabel,
  );
}
