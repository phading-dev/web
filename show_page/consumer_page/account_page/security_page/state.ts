import { EnumDescriptor, MessageDescriptor } from '@selfage/message/descriptor';

export enum Page {
  Info = 1,
  UpdatePassword = 2,
  UpdateRecoveryEmail = 3,
  UpdateUsername = 4,
}

export let PAGE: EnumDescriptor<Page> = {
  name: 'Page',
  values: [
    {
      name: 'Info',
      value: 1,
    },
    {
      name: 'UpdatePassword',
      value: 2,
    },
    {
      name: 'UpdateRecoveryEmail',
      value: 3,
    },
    {
      name: 'UpdateUsername',
      value: 4,
    },
  ]
}

export interface SecurityPageState {
  page?: Page,
}

export let SECURITY_PAGE_STATE: MessageDescriptor<SecurityPageState> = {
  name: 'SecurityPageState',
  fields: [
    {
      name: 'page',
      enumType: PAGE,
    },
  ]
};
