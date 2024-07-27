import { EnumDescriptor, MessageDescriptor, PrimitiveType } from '@selfage/message/descriptor';
import { AccountPageState, ACCOUNT_PAGE_STATE } from './account_page/state';
import { RecommendationPageState, RECOMMENDATION_PAGE_STATE } from './recommendation_page/state';

export enum Page {
  ACCOUNT = 1,
  PLAY = 2,
  RECOMMENDATION = 3,
}

export let PAGE: EnumDescriptor<Page> = {
  name: 'Page',
  values: [
    {
      name: 'ACCOUNT',
      value: 1,
    },
    {
      name: 'PLAY',
      value: 2,
    },
    {
      name: 'RECOMMENDATION',
      value: 3,
    },
  ]
}

export interface ConsumerPageState {
  page?: Page,
  account?: AccountPageState,
  episodeId?: string,
  recommendation?: RecommendationPageState,
}

export let CONSUMER_PAGE_STATE: MessageDescriptor<ConsumerPageState> = {
  name: 'ConsumerPageState',
  fields: [
    {
      name: 'page',
      enumType: PAGE,
    },
    {
      name: 'account',
      messageType: ACCOUNT_PAGE_STATE,
    },
    {
      name: 'episodeId',
      primitiveType: PrimitiveType.STRING,
    },
    {
      name: 'recommendation',
      messageType: RECOMMENDATION_PAGE_STATE,
    },
  ]
};
