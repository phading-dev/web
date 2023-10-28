import { EnumDescriptor, MessageDescriptor } from '@selfage/message/descriptor';

export enum Page {
  BasicInfo = 1,
  UpdateAvatar = 2,
  UpdateNaturalName = 3,
  UpdateContactEmail = 4,
  UpdateDescription = 5,
}

export let PAGE: EnumDescriptor<Page> = {
  name: 'Page',
  values: [
    {
      name: 'BasicInfo',
      value: 1,
    },
    {
      name: 'UpdateAvatar',
      value: 2,
    },
    {
      name: 'UpdateNaturalName',
      value: 3,
    },
    {
      name: 'UpdateContactEmail',
      value: 4,
    },
    {
      name: 'UpdateDescription',
      value: 5,
    },
  ]
}

export interface ProfilePageState {
  page?: Page,
}

export let PROFILE_PAGE_STATE: MessageDescriptor<ProfilePageState> = {
  name: 'ProfilePageState',
  fields: [
    {
      name: 'page',
      enumType: PAGE,
    },
  ]
};
