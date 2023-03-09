import { EnumDescriptor, MessageDescriptor } from '@selfage/message/descriptor';

export enum Page {
  Basic = 1,
  ChangeAvatar = 2,
}

export let PAGE: EnumDescriptor<Page> = {
  name: 'Page',
  values: [
    {
      name: 'Basic',
      value: 1,
    },
    {
      name: 'ChangeAvatar',
      value: 2,
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
