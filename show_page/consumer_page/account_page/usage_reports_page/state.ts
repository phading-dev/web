import { EnumDescriptor, MessageDescriptor, PrimitiveType } from '@selfage/message/descriptor';

export enum Page {
  CHOOSE = 1,
  REPORT = 2,
}

export let PAGE: EnumDescriptor<Page> = {
  name: 'Page',
  values: [
    {
      name: 'CHOOSE',
      value: 1,
    },
    {
      name: 'REPORT',
      value: 2,
    },
  ]
}

export interface UsageReportsPageState {
  page?: Page,
  reportId?: string,
}

export let USAGE_REPORTS_PAGE_STATE: MessageDescriptor<UsageReportsPageState> = {
  name: 'UsageReportsPageState',
  fields: [
    {
      name: 'page',
      enumType: PAGE,
    },
    {
      name: 'reportId',
      primitiveType: PrimitiveType.STRING,
    },
  ]
};
