import { EnumDescriptor } from '@selfage/message/descriptor';

export enum AppType {
  Chat = 1,
  Show = 2,
}

export let APP_TYPE: EnumDescriptor<AppType> = {
  name: 'AppType',
  values: [
    {
      name: 'Chat',
      value: 1,
    },
    {
      name: 'Show',
      value: 2,
    },
  ]
}
