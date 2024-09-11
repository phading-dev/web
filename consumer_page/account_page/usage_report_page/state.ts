import { EnumDescriptor, PrimitiveType, MessageDescriptor } from '@selfage/message/descriptor';

export enum Granularity {
  DAY = 1,
  MONTH = 2,
}

export let GRANULARITY: EnumDescriptor<Granularity> = {
  name: 'Granularity',
  values: [{
    name: 'DAY',
    value: 1,
  }, {
    name: 'MONTH',
    value: 2,
  }]
}

export interface DateRange {
  /* ISO date string */
  startDate?: string,
  /* ISO date string */
  endDate?: string,
}

export let DATE_RANGE: MessageDescriptor<DateRange> = {
  name: 'DateRange',
  fields: [{
    name: 'startDate',
    index: 1,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'endDate',
    index: 2,
    primitiveType: PrimitiveType.STRING,
  }],
};

export interface MonthRange {
  /* ISO date string */
  startMonth?: string,
  /* ISO date string */
  endMonth?: string,
}

export let MONTH_RANGE: MessageDescriptor<MonthRange> = {
  name: 'MonthRange',
  fields: [{
    name: 'startMonth',
    index: 1,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'endMonth',
    index: 2,
    primitiveType: PrimitiveType.STRING,
  }],
};

export interface UsageReportPageState {
  granularity?: Granularity,
  dateRange?: DateRange,
  monthRange?: MonthRange,
}

export let USAGE_REPORT_PAGE_STATE: MessageDescriptor<UsageReportPageState> = {
  name: 'UsageReportPageState',
  fields: [{
    name: 'granularity',
    index: 1,
    enumType: GRANULARITY,
  }, {
    name: 'dateRange',
    index: 2,
    messageType: DATE_RANGE,
  }, {
    name: 'monthRange',
    index: 3,
    messageType: MONTH_RANGE,
  }],
};
