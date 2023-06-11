import { EnumDescriptor, MessageDescriptor } from '@selfage/message/descriptor';

export enum Page {
  AccountInfo = 1,
  UpdateAvatar = 2,
  UpdatePassword = 3,
}

export let PAGE: EnumDescriptor<Page> = {
  name: 'Page',
  values: [
    {
      name: 'AccountInfo',
      value: 1,
    },
    {
      name: 'UpdateAvatar',
      value: 2,
    },
    {
      name: 'UpdatePassword',
      value: 3,
    },
  ]
}

export interface AccountPageState {
  page?: Page,
}

export let ACCOUNT_PAGE_STATE: MessageDescriptor<AccountPageState> = {
  name: 'AccountPageState',
  fields: [
    {
      name: 'page',
      enumType: PAGE,
    },
  ]
};
