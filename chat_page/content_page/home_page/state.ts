import { EnumDescriptor, MessageDescriptor, PrimitiveType } from '@selfage/message/descriptor';
import { TaleContext, TALE_CONTEXT } from '@phading/tale_service_interface/tale_context';

export enum Page {
  List = 1,
  Write = 2,
}

export let PAGE: EnumDescriptor<Page> = {
  name: 'Page',
  values: [
    {
      name: 'List',
      value: 1,
    },
    {
      name: 'Write',
      value: 2,
    },
  ]
}

export interface HomePageState {
  page?: Page,
  list?: Array<TaleContext>,
  reply?: string,
}

export let HOME_PAGE_STATE: MessageDescriptor<HomePageState> = {
  name: 'HomePageState',
  fields: [
    {
      name: 'page',
      enumType: PAGE,
    },
    {
      name: 'list',
      messageType: TALE_CONTEXT,
      isArray: true,
    },
    {
      name: 'reply',
      primitiveType: PrimitiveType.STRING,
    },
  ]
};
