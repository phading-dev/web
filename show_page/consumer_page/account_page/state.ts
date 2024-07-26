import { EnumDescriptor, MessageDescriptor } from '@selfage/message/descriptor';
import { UsageReportPageState, USAGE_REPORT_PAGE_STATE } from './usage_report_page/state';

export enum Page {
  PROFILE = 1,
  PAYMENT_METHODS = 2,
  USAGE_REPORT = 3,
}

export let PAGE: EnumDescriptor<Page> = {
  name: 'Page',
  values: [
    {
      name: 'PROFILE',
      value: 1,
    },
    {
      name: 'PAYMENT_METHODS',
      value: 2,
    },
    {
      name: 'USAGE_REPORT',
      value: 3,
    },
  ]
}

export interface AccountPageState {
  page?: Page,
  usageReport?: UsageReportPageState,
}

export let ACCOUNT_PAGE_STATE: MessageDescriptor<AccountPageState> = {
  name: 'AccountPageState',
  fields: [
    {
      name: 'page',
      enumType: PAGE,
    },
    {
      name: 'usageReport',
      messageType: USAGE_REPORT_PAGE_STATE,
    },
  ]
};
