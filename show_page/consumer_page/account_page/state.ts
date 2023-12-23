import { EnumDescriptor, MessageDescriptor } from '@selfage/message/descriptor';
import { ProfilePageState, PROFILE_PAGE_STATE } from './profile_page/state';
import { SecurityPageState, SECURITY_PAGE_STATE } from './security_page/state';
import { UsageReportsPageState, USAGE_REPORTS_PAGE_STATE } from './usage_reports_page/state';

export enum Page {
  PROFILE = 1,
  SECURITY = 2,
  PAYMENT_METHODS = 3,
  USAGE_REPORTS = 4,
}

export let PAGE: EnumDescriptor<Page> = {
  name: 'Page',
  values: [
    {
      name: 'PROFILE',
      value: 1,
    },
    {
      name: 'SECURITY',
      value: 2,
    },
    {
      name: 'PAYMENT_METHODS',
      value: 3,
    },
    {
      name: 'USAGE_REPORTS',
      value: 4,
    },
  ]
}

export interface AccountPageState {
  page?: Page,
  profilePageState?: ProfilePageState,
  securityPageState?: SecurityPageState,
  usageReportsPageState?: UsageReportsPageState,
}

export let ACCOUNT_PAGE_STATE: MessageDescriptor<AccountPageState> = {
  name: 'AccountPageState',
  fields: [
    {
      name: 'page',
      enumType: PAGE,
    },
    {
      name: 'profilePageState',
      messageType: PROFILE_PAGE_STATE,
    },
    {
      name: 'securityPageState',
      messageType: SECURITY_PAGE_STATE,
    },
    {
      name: 'usageReportsPageState',
      messageType: USAGE_REPORTS_PAGE_STATE,
    },
  ]
};
