let moment = require("moment-timezone");

/**
 * Date and epoch functions
 *
 * The standard way to store epoch in the database is seconds from 1999, in UTC.  The following routines all assume
 * that standard.
 *
 */

export interface Timezone {
    code: string,
    name: string,
    momentName: string
}

export let timezones: { [id: number]: Timezone } = {};

timezones[0] = { code: 'UTC', momentName: 'UTC', name: 'Coordinated Universal Time (UTC)' };
timezones[1] = { code: 'MIT', momentName: 'Pacific/Midway', name: 'Midway Islands Time (MIT)' };
timezones[2] = { code: 'HST', momentName: 'US/Hawaii', name: 'Hawaii Time (HST)' };
timezones[3] = { code: 'AST', momentName: 'US/Alaska', name: 'Alaska Time (AST)' };
timezones[4] = { code: 'PST', momentName: 'US/Pacific', name: 'Pacific Time (PST)' };
timezones[5] = { code: 'PNT', momentName: 'America/Phoenix', name: 'Phoenix Time (PNT)' };
timezones[6] = { code: 'MST', momentName: 'US/Mountain', name: 'Mountain Time (MST)' };
timezones[7] = { code: 'CST', momentName: 'US/Central', name: 'Central Time (CST)' };
timezones[8] = { code: 'EST', momentName: 'US/Eastern', name: 'Eastern Time (EST)' };
timezones[9] = { code: 'IET', momentName: 'US/East-Indiana', name: 'Indiana Eastern Time (IET)' };
timezones[10] = { code: 'PRT', momentName: 'America/Puerto_Rico', name: 'Puerto Rico/US Virgin Islands Time (PRT)' };
timezones[11] = { code: 'CNT', momentName: 'Canada/Newfoundland', name: 'Canada Newfoundland Time (CNT)' };
timezones[12] = { code: 'AGT', momentName: 'America/Argentina/Buenos_Aires', name: 'Argentina Time (AGT)' };
timezones[13] = { code: 'BET', momentName: 'Brazil/East', name: 'Brazil Eastern Time (BET)' };
timezones[14] = { code: 'CAT', momentName: 'Africa/Lusaka', name: 'Central African Time (CAT)' };
timezones[15] = { code: 'GMT', momentName: 'Greenwich', name: 'Greenwich Mean Time (GMT)' };
timezones[16] = { code: 'ECT', momentName: 'Europe/Berlin', name: 'European Central Time (ECT)' };
timezones[17] = { code: 'EET', momentName: 'Europe/Bucharest', name: 'Eastern European Time (EET)' };
timezones[18] = { code: 'ART', momentName: 'Egypt', name: 'Egypt Time (ART)' };
timezones[19] = { code: 'EAT', momentName: 'Africa/Khartoum', name: 'Eastern African Time (EAT)' };
timezones[20] = { code: 'BWT', momentName: 'Brazil/West', name: 'Brazil Western Time (BWT)' };
timezones[21] = { code: 'MSK', momentName: 'Europe/Moscow', name: 'Moscow Time (MSK)' };
timezones[22] = { code: 'PKT', momentName: 'Asia/Karachi', name: 'Pakistan Time (PKT)' };
timezones[23] = { code: 'IT', momentName: 'Asia/Calcutta', name: 'India Time (IT)' };
timezones[24] = { code: 'BST', momentName: 'Asia/Dhaka', name: 'Bangladesh Time (BST)' };
timezones[25] = { code: 'VST', momentName: 'Asia/Ho_Chi_Minh', name: 'Vietnam Time (VST)' };
timezones[26] = { code: 'CTT', momentName: 'Asia/Taipei', name: 'China Taiwan Time (CTT)' };
timezones[27] = { code: 'JST', momentName: 'Asia/Tokyo', name: 'Japan Time (JST)' };
timezones[28] = { code: 'ACT', momentName: 'Australia/Adelaide', name: 'Australia Central Time (ACT)' };
timezones[29] = { code: 'AET', momentName: 'Australia/Sydney', name: 'Australia Eastern Time (AET)' };
timezones[30] = { code: 'AWT', momentName: 'Australia/Perth', name: 'Australia Western Time (AET)' };
timezones[31] = { code: 'NST', momentName: 'Pacific/Auckland', name: 'New Zealand Time (NST)' };
timezones[32] = { code: 'PXT', momentName: 'America/Hermosillo', name: 'Mexico/Pacific Time (PXT)' };
timezones[33] = { code: 'IST', momentName: 'Israel', name: 'Israel Time (IST)' };
timezones[34] = { code: 'CXT', momentName: 'America/Mexico_City', name: 'Mexico/Central Time (CXT)' };
timezones[35] = { code: 'PLT', momentName: 'Asia/Karachi', name: 'Pakistan Time (PLT)' };
timezones[36] = { code: 'SST', momentName: 'Pacific/Guadalcanal', name: 'Solomon Standard Time (SST)' };
timezones[37] = { code: 'MXT', momentName: 'US/Mountain', name: 'Mexico/Mountain Standard Time (MXT)' };

export enum DateIntervals {
    second,
    minute,
    hour,
    day,
    week,
    month,
    quarter,
    year
}

/**
 * Return an id from a timezone code, moment timezone name or id.  Return -1 if not found.  This routine attempts
 * to map a timezone from various formats from different systems.
 * @param timezone
 * @returns {number}
 */
export function getTimezoneId(timezone: any): number {

    if (typeof timezone == 'string') {     // like PST or GMT

        timezone = timezone.toUpperCase();

        for (let key in timezones) {

            if (timezones.hasOwnProperty(key)) {
                let tz = timezones[key];

                if (tz.code.toUpperCase() == timezone.toUpperCase())
                    return +key;

                if (tz.momentName && tz.momentName.toUpperCase() == timezone.toUpperCase())
                    return +key;

                //  some systems use moment names, but with a dash instead of a /
                if (tz.momentName && tz.momentName.replace('/', '-').toUpperCase() == timezone.toUpperCase())
                    return +key;
            }
        }

        //  since nothing was found, try to guess common time zone
        if (timezone.indexOf('EASTERN TIME') > -1)
            return 8;
        if (timezone.indexOf('CENTRAL TIME') > -1)
            return 7;
        if (timezone.indexOf('MOUNTAIN TIME') > -1)
            return 6;
        if (timezone.indexOf('PACIFIC TIME') > -1)
            return 4;

        return -1;      // not found
    }
    else {
        return timezone;
    }
}

/**
 * Get a timezone object from a code
 * @param timezone
 * @returns {Timezone}
 */
export function getTimezone(timezone: any) {
    let id = getTimezoneId(timezone);

    if (id)
        return timezones[id];

    return timezones[0];
}

/**
 * The current timezone offset in seconds that adjusts for DST.
 * @param timezoneId
 * @returns {number}
 */
export function utcOffset(timezoneId: number): number {

    let timezone = timezones[this.getTimezoneId(timezoneId)];

    if (!timezone)
        return 0;

    //  moment timezone uses opposite direction for offset
    return -moment.tz.zone(timezone.momentName).offset(new Date().getTime()) * 60;
}

/**
 * The current date and time adjusted by the UTC offset passed in.
 * @param utcOffset     The UTC offset.  This is generally from the timezone of the user.
 * @returns {Date}
 */
export function currentDatetime(utcOffset: number = 0) {
    let date = new Date();
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds() + utcOffset));
}

/**
 * Convert a date and time with a UTC offset to UTC.
 * @param strDate
 * @param utcOffset
 * @returns {Date}
 */
export function toUTC(strDate: string, utcOffset: number = 0) {
    let date = new Date(Date.parse(strDate));

    //  for dev purposes, adjust the result by the timezone offset
    let localOffset = date.getTimezoneOffset() * 60;

    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds() + utcOffset + localOffset));
}

/**
 * The current date (no time) adjusted by the UTC offset passed in.
 * @param utcOffset     The UTC offset.  This is generally from the timezone of the user.
 * @returns {Date}
 */
export function currentDate(utcOffset: number = 0): Date {
    let date = new Date();

    if (utcOffset == 0) {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    }

    let adjustedDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds() + utcOffset));

    return new Date(Date.UTC(adjustedDate.getUTCFullYear(), adjustedDate.getUTCMonth(), adjustedDate.getUTCDate()));
}

/**
 * The current month, like 2017-01-01 (this returns the beginning of the month).
 * @param utcOffset
 * @returns {Date}
 */
export function currentMonth(utcOffset: number = 0): Date {
    return addMonths(month(currentDate(utcOffset)));
}

/**
 * The month code in YYYY-MM format.
 * @param date
 * @param utcOffset
 * @returns {string}
 */
export function monthCode(date?: Date, utcOffset?: number): string {
    if (!date)
        date = currentDate(utcOffset);

    return date.getUTCFullYear() + '-' + ('0' + date.getUTCMonth() + 1).slice(-2);
}

/**
 * Format a date into yyyy-mm-dd hh:mm:ss.  If the date has no epoch component, return in the format yyyy-mm-dd
 * @param date
 * @param includeTime   Whether to tack on the time string to the result.
 * @returns {string}
 */
export function dateToString(date: Date, includeTime: boolean = true): string {
    let day = date.getUTCDate();
    let month = date.getUTCMonth() + 1;
    let hour = date.getUTCHours();
    let minute = date.getUTCMinutes();
    let second = date.getUTCSeconds();

    let ret = date.getUTCFullYear() + '-' + (month <= 9 ? '0' + month.toString() : month.toString()) + '-' + (day <= 9 ? '0' + day.toString() : day.toString());

    if (includeTime && (hour != 0 || minute != 0 || second != 0))
        ret += ' ' + (hour <= 9 ? '0' + hour.toString() : hour.toString()) + ":" + (minute <= 9 ? '0' + minute.toString() : minute.toString()) + ':' + (second <= 9 ? '0' + second.toString() : second.toString());

    return ret;
}

/**
 * Add a number of minutes to a date.  The base date defaults to the epoch start.  The result is to the minute.
 * @param minutes
 * @param date
 * @returns {Date}
 */
export function addMinutes(minutes: number, date?: Date) {

    if (!date) date = start();

    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), minutes * 60));
}

/**
 * Add a number of hours to a date.  The base date defaults to the epoch start.  The result is to the hour.
 * @param hours
 * @param date
 * @returns {Date}
 */
export function addHours(hours: number, date?: Date) {

    if (!date) date = start();

    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), 0, hours * 3600));
}

/**
 * Add a number of days to a date.  The base date defaults to the epoch start.
 * @param days
 * @param date
 * @returns {Date}
 */
export function addDays(days: number, date?: Date) {

    if (!date) date = start();

    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

/**
 * Add a number of months to a date.  The base date defaults to the epoch start.
 * @param months
 * @param date
 * @returns {Date}
 */
export function addMonths(months: number, date?: Date) {

    if (!date) date = start();

    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()));
}

/**
 * Add a number of years to a date.  The base date defaults to the epoch start.
 * @param years
 * @param date
 * @returns {Date}
 */
export function addYears(years: number, date?: Date) {

    if (!date) date = start();

    return new Date(Date.UTC(date.getUTCFullYear() + years, date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Add a number of seconds to a date.  The base date defaults to the epoch start.
 * @param date
 * @returns {Date}
 */
export function startOfDate(date?: Date) {
    if (!date) date = start();
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
}

/**
 * Add a number of seconds to a date.  The base date defaults to the epoch start.
 * @param seconds
 * @param date
 * @returns {Date}
 */
export function addSeconds(seconds: number, date?: Date) {

    if (!date) date = start();

    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds() + seconds));
}

/**
 * Return the difference in intervals between two dates.  If the second date is not passed in, the start date defaults to 1999-01-01.
 * @param interval
 * @param date1
 * @param date2
 * @returns {number}
 */
export function diff(interval: DateIntervals, date1: Date, date2?: Date): number {

    if (!date2) {
        date2 = date1;
        date1 = start();
    }

    // convert to utc seconds from 1999-01-01
    switch (interval) {

        case DateIntervals.second:
            return second(date2) - second(date1);

        case DateIntervals.minute:
            return minute(date2) - minute(date1);

        case DateIntervals.hour:
            return hour(date2) - hour(date1);

        case DateIntervals.day:
            return day(date2) - day(date1);

        case DateIntervals.week:
            return week(date2) - week(date1);

        case DateIntervals.month:
            return month(date2) - month(date1);

        case DateIntervals.quarter:
            return quarter(date2) - quarter(date1);

        case DateIntervals.year:
            return date2.getUTCFullYear() - date1.getUTCFullYear();
    }
}

/**
 *
 * Get date elements in timeframes since 1999, in UTC.  The following routines all assume
 * that standard.
 *
 */

/**
 * ALL epoch intervals (except year) are from 1999-01-01
 * @returns {Date}
 */
export function start(): Date {
    return new Date(Date.UTC(1999, 0, 1));
}

/**
 * Return milliseconds from 1999-01-01.
 * @param date
 * @returns {number}
 */
export function millisecond(date?: Date) {

    if (!date)
        date = new Date();

    let msFromEpoch: number = date.getTime();
    return msFromEpoch - 915148800000;   // convert to utc milliseconds from 1999-01-01
}

/**
 * Return seconds from 1999-01-01.
 * @param date
 * @returns {number}
 */
export function second(date?: Date) {

    if (!date)
        date = new Date();

    let secondsFromEpoch: number = date.getTime() / 1000;
    return Math.round(secondsFromEpoch) - 915148800;   // convert to utc seconds from 1999-01-01
}

/**
 * Return minutes from 1999-01-01.
 * @param date
 * @returns {number}
 */
export function minute(date?: Date) {

    if (!date)
        date = new Date();

    //  strip off secs off dates
    let date1 = start();
    let date2 = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes()));

    let seconds1: number = Math.round(date1.getTime() / 1000) - 915148800;
    let seconds2: number = Math.round(date2.getTime() / 1000) - 915148800;
    return Math.round((seconds2 - seconds1) / 60);
}

/**
 * Return hours from 1999-01-01.
 * @param date
 * @returns {number}
 */
export function hour(date?: Date) {

    if (!date)
        date = new Date();

    //  strip off minutes/secs off dates
    let date1 = start();
    let date2 = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours()));

    let seconds1: number = Math.round(date1.getTime() / 1000) - 915148800;
    let seconds2: number = Math.round(date2.getTime() / 1000) - 915148800;
    return Math.round((seconds2 - seconds1) / 3600);
}

/**
 * Return days from 1999-01-01.
 * @param date
 * @returns {number}
 */
export function day(date?: Date) {

    if (!date)
        date = new Date();

    //  strip off hours/minutes/secs off dates
    let date1 = start();
    let date2 = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

    let seconds1: number = Math.round(date1.getTime() / 1000) - 915148800;
    let seconds2: number = Math.round(date2.getTime() / 1000) - 915148800;
    return Math.floor((seconds2 - seconds1) / 3600 / 24);
}

/**
 * Return weeks from 1999-01-01.
 * @param date
 * @returns {number}
 */
export function week(date?: Date) {

    if (!date)
        date = new Date();

    let date1 = start();
    let seconds1: number = Math.round(date1.getTime() / 1000) - 915148800 - (24 * 3600 * 5);
    let seconds2: number = Math.round(date.getTime() / 1000) - 915148800;
    return Math.floor((seconds2 - seconds1) / 3600 / 24 / 7);
}

/**
 * Return months from 1999-01-01.
 * @param date
 * @returns {number}
 */
export function month(date?: Date) {

    if (!date)
        date = new Date();

    let date1 = start();
    return (date.getUTCFullYear() - date1.getUTCFullYear()) * 12 + (date.getUTCMonth() - date1.getUTCMonth());
}

/**
 * Return quarters from 1999-01-01.
 * @param date
 * @returns {number}
 */
export function quarter(date?: Date) {

    if (!date)
        date = new Date();

    let date1 = start();
    let q1 = Math.floor(date1.getMonth() / 4);
    let q2 = Math.floor(date.getMonth() / 4);
    return (date.getUTCFullYear() - date1.getUTCFullYear()) * 4 + (q2 - q1);
}
