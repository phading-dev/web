import { SCHEME } from "../../common/color_scheme";
import {
  createAccountIcon,
  createArrowIcon,
  createHistogramIcon,
  createHomeIcon,
  createPaymentIcon,
  createPlusIcon,
  createReplyIcon,
  createSecurityIcon,
  createShuffleIcon,
  createUploadIcon,
} from "../../common/icons";
import { LOCALIZED_TEXT } from "../../common/locales/localized_text";
import { MenuItem } from "./body";

export function createHomeMenuItem(): MenuItem {
  return MenuItem.create(
    createHomeIcon(SCHEME.neutral1),
    `1rem`,
    LOCALIZED_TEXT.homeLabel
  );
}

export function createShuffleMenuItem(): MenuItem {
  return MenuItem.create(
    createShuffleIcon(SCHEME.neutral1),
    `1rem`,
    LOCALIZED_TEXT.shuffleTalesLabel
  );
}

export function createWritePostMenuItem(): MenuItem {
  return MenuItem.create(
    createPlusIcon(SCHEME.primary1),
    `1rem`,
    LOCALIZED_TEXT.writeTaleLabel
  );
}

export function createReplyPostMenuItem(): MenuItem {
  return MenuItem.create(
    createReplyIcon(SCHEME.primary1),
    `1rem`,
    LOCALIZED_TEXT.replyTaleLabel
  );
}

export function createAccountMenuItem(): MenuItem {
  return MenuItem.create(
    createAccountIcon(SCHEME.neutral1),
    `1rem`,
    LOCALIZED_TEXT.accountLabel
  );
}

export function createBackMenuItem(): MenuItem {
  return MenuItem.create(
    createArrowIcon(SCHEME.neutral1),
    `1rem`,
    LOCALIZED_TEXT.backLabel
  );
}

export function createUploadMenuItem(): MenuItem {
  return MenuItem.create(
    createUploadIcon(SCHEME.neutral1),
    `1rem`,
    LOCALIZED_TEXT.uploadLabel
  );
}

export function createSecuritySettingsMenuItem(): MenuItem {
  return MenuItem.create(
    createSecurityIcon(SCHEME.neutral1),
    `1rem`,
    LOCALIZED_TEXT.securitySettingsLabel
  );
}

export function createPaymentMethodsMenuIcon(): MenuItem {
  return MenuItem.create(
    createPaymentIcon(SCHEME.neutral1),
    `1rem`,
    LOCALIZED_TEXT.paymentMethodsLabel
  );
}

export function createUsageReportsMenuItem(): MenuItem {
  return MenuItem.create(
    createHistogramIcon(SCHEME.neutral1),
    `1rem`,
    LOCALIZED_TEXT.usageReportsLabel
  );
}
