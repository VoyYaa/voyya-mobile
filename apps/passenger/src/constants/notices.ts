export const TRIP_ENDED_NOTICE = 'trip_ended';
export const TRIP_NOT_FOUND_NOTICE = 'trip_not_found';

export type HomeNotice = typeof TRIP_ENDED_NOTICE | typeof TRIP_NOT_FOUND_NOTICE;
