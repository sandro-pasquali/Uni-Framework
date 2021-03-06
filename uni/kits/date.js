(function() {

/**
 * Version: 1.0 Alpha-1 
 * Build Date: 13-Nov-2007
 * Copyright (c) 2006-2007, Coolite Inc. (http://www.coolite.com/). All rights reserved.
 * License: Licensed under The MIT License. See license.txt and http://www.datejs.com/license/. 
 * Website: http://www.datejs.com/ or http://www.coolite.com/datejs/
 */
Date.CultureInfo = {
	/* Culture Name */
    name: "en-US",
    englishName: "English (United States)",
    nativeName: "English (United States)",
    
    /* Day Name Strings */
    dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    abbreviatedDayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    shortestDayNames: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
    firstLetterDayNames: ["S", "M", "T", "W", "T", "F", "S"],
    
    /* Month Name Strings */
    monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    abbreviatedMonthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],

	/* AM/PM Designators */
    amDesignator: "AM",
    pmDesignator: "PM",

    firstDayOfWeek: 0,
    twoDigitYearMax: 2029,
    
    /**
     * The dateElementOrder is based on the order of the 
     * format specifiers in the formatPatterns.DatePattern. 
     *
     * Example:
     <pre>
     shortDatePattern    dateElementOrder
     ------------------  ---------------- 
     "M/d/yyyy"          "mdy"
     "dd/MM/yyyy"        "dmy"
     "yyyy-MM-dd"        "ymd"
     </pre>
     * The correct dateElementOrder is required by the parser to
     * determine the expected order of the date elements in the
     * string being parsed.
     * 
     * NOTE: It is VERY important this value be correct for each Culture.
     */
    dateElementOrder: "mdy",
    
    /* Standard date and time format patterns */
    formatPatterns: {
        shortDate: "M/d/yyyy",
        longDate: "dddd, MMMM dd, yyyy",
        shortTime: "h:mm tt",
        longTime: "h:mm:ss tt",
        fullDateTime: "dddd, MMMM dd, yyyy h:mm:ss tt",
        sortableDateTime: "yyyy-MM-ddTHH:mm:ss",
        universalSortableDateTime: "yyyy-MM-dd HH:mm:ssZ",
        rfc1123: "ddd, dd MMM yyyy HH:mm:ss GMT",
        monthDay: "MMMM dd",
        yearMonth: "MMMM, yyyy"
    },

    /**
     * NOTE: If a string format is not parsing correctly, but
     * you would expect it parse, the problem likely lies below. 
     * 
     * The following regex patterns control most of the string matching
     * within the parser.
     * 
     * The Month name and Day name patterns were automatically generated
     * and in general should be (mostly) correct. 
     *
     * Beyond the month and day name patterns are natural language strings.
     * Example: "next", "today", "months"
     *
     * These natural language string may NOT be correct for this culture. 
     * If they are not correct, please translate and edit this file
     * providing the correct regular expression pattern. 
     *
     * If you modify this file, please post your revised CultureInfo file
     * to the Datejs Discussions located at
     *     http://groups.google.com/group/date-js
     *
     * Please mark the subject with [CultureInfo]. Example:
     *    Subject: [CultureInfo] Translated "da-DK" Danish(Denmark)
     * 
     * We will add the modified patterns to the master source files.
     *
     * As well, please review the list of "Future Strings" section below. 
     */	
    regexPatterns: {
        jan: /^jan(uary)?/i,
        feb: /^feb(ruary)?/i,
        mar: /^mar(ch)?/i,
        apr: /^apr(il)?/i,
        may: /^may/i,
        jun: /^jun(e)?/i,
        jul: /^jul(y)?/i,
        aug: /^aug(ust)?/i,
        sep: /^sep(t(ember)?)?/i,
        oct: /^oct(ober)?/i,
        nov: /^nov(ember)?/i,
        dec: /^dec(ember)?/i,

        sun: /^su(n(day)?)?/i,
        mon: /^mo(n(day)?)?/i,
        tue: /^tu(e(s(day)?)?)?/i,
        wed: /^we(d(nesday)?)?/i,
        thu: /^th(u(r(s(day)?)?)?)?/i,
        fri: /^fr(i(day)?)?/i,
        sat: /^sa(t(urday)?)?/i,

        future: /^next/i,
        past: /^last|past|prev(ious)?/i,
        add: /^(\+|after|from)/i,
        subtract: /^(\-|before|ago)/i,
        
        yesterday: /^yesterday/i,
        today: /^t(oday)?/i,
        tomorrow: /^tomorrow/i,
        now: /^n(ow)?/i,
        
        millisecond: /^ms|milli(second)?s?/i,
        second: /^sec(ond)?s?/i,
        minute: /^min(ute)?s?/i,
        hour: /^h(ou)?rs?/i,
        week: /^w(ee)?k/i,
        month: /^m(o(nth)?s?)?/i,
        day: /^d(ays?)?/i,
        year: /^y((ea)?rs?)?/i,
		
        shortMeridian: /^(a|p)/i,
        longMeridian: /^(a\.?m?\.?|p\.?m?\.?)/i,
        timezone: /^((e(s|d)t|c(s|d)t|m(s|d)t|p(s|d)t)|((gmt)?\s*(\+|\-)\s*\d\d\d\d?)|gmt)/i,
        ordinalSuffix: /^\s*(st|nd|rd|th)/i,
        timeContext: /^\s*(\:|a|p)/i
    },

    abbreviatedTimeZoneStandard: { GMT: "-000", EST: "-0400", CST: "-0500", MST: "-0600", PST: "-0700" },
    abbreviatedTimeZoneDST: { GMT: "-000", EDT: "-0500", CDT: "-0600", MDT: "-0700", PDT: "-0800" }
    
};

/********************
 ** Future Strings **
 ********************
 * 
 * The following list of strings are not currently being used, but 
 * may be incorporated later. We would appreciate any help translating
 * the strings below.
 * 
 * If you modify this file, please post your revised CultureInfo file
 * to the Datejs Discussions located at
 *     http://groups.google.com/group/date-js
 *
 * Please mark the subject with [CultureInfo]. Example:
 *    Subject: [CultureInfo] Translated "da-DK" Danish(Denmark)
 *
 * English Name        Translated
 * ------------------  -----------------
 * date                date
 * time                time
 * calendar            calendar
 * show                show
 * hourly              hourly
 * daily               daily
 * weekly              weekly
 * bi-weekly           bi-weekly
 * monthly             monthly
 * bi-monthly          bi-monthly
 * quarter             quarter
 * quarterly           quarterly
 * yearly              yearly
 * annual              annual
 * annually            annually
 * annum               annum
 * again               again
 * between             between
 * after               after
 * from now            from now
 * repeat              repeat
 * times               times
 * per                 per
 */




/**
 * Version: 1.0 Alpha-1 
 * Build Date: 12-Nov-2007
 * Copyright (c) 2006-2007, Coolite Inc. (http://www.coolite.com/). All rights reserved.
 * License: Licensed under The MIT License. See license.txt and http://www.datejs.com/license/. 
 * Website: http://www.datejs.com/ or http://www.coolite.com/datejs/
 */

/**
 * Gets the month number (0-11) if given a Culture Info specific string which is a valid monthName or abbreviatedMonthName.
 * @param {String}   The name of the month (eg. "February, "Feb", "october", "oct").
 * @return {Number}  The day number
 */
Date.getMonthNumberFromName = function (name) {
    var n = Date.CultureInfo.monthNames, m = Date.CultureInfo.abbreviatedMonthNames, s = name.toLowerCase();
    for (var i = 0; i < n.length; i++) {
        if (n[i].toLowerCase() == s || m[i].toLowerCase() == s) { 
            return i; 
        }
    }
    return -1;
};

/**
 * Gets the day number (0-6) if given a CultureInfo specific string which is a valid dayName, abbreviatedDayName or shortestDayName (two char).
 * @param {String}   The name of the day (eg. "Monday, "Mon", "tuesday", "tue", "We", "we").
 * @return {Number}  The day number
 */
Date.getDayNumberFromName = function (name) {
    var n = Date.CultureInfo.dayNames, m = Date.CultureInfo.abbreviatedDayNames, o = Date.CultureInfo.shortestDayNames, s = name.toLowerCase();
    for (var i = 0; i < n.length; i++) { 
        if (n[i].toLowerCase() == s || m[i].toLowerCase() == s) { 
            return i; 
        }
    }
    return -1;  
};

/**
 * Determines if the current date instance is within a LeapYear.
 * @param {Number}   The year (0-9999).
 * @return {Boolean} true if date is within a LeapYear, otherwise false.
 */
Date.isLeapYear = function (year) { 
    return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0)); 
};

/**
 * Gets the number of days in the month, given a year and month value. Automatically corrects for LeapYear.
 * @param {Number}   The year (0-9999).
 * @param {Number}   The month (0-11).
 * @return {Number}  The number of days in the month.
 */
Date.getDaysInMonth = function (year, month) {
    return [31, (Date.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
};

Date.getTimezoneOffset = function (s, dst) {
    return (dst || false) ? Date.CultureInfo.abbreviatedTimeZoneDST[s.toUpperCase()] :
        Date.CultureInfo.abbreviatedTimeZoneStandard[s.toUpperCase()];
};

Date.getTimezoneAbbreviation = function (offset, dst) {
    var n = (dst || false) ? Date.CultureInfo.abbreviatedTimeZoneDST : Date.CultureInfo.abbreviatedTimeZoneStandard, p;
    for (p in n) { 
        if (n[p] === offset) { 
            return p; 
        }
    }
    return null;
};

/**
 * Returns a new Date object that is an exact date and time copy of the original instance.
 * @return {Date}    A new Date instance
 */
Date.prototype.clone = function () {
    return new Date(this.getTime()); 
};

/**
 * Compares this instance to a Date object and return an number indication of their relative values.  
 * @param {Date}     Date object to compare [Required]
 * @return {Number}  1 = this is greaterthan date. -1 = this is lessthan date. 0 = values are equal
 */
Date.prototype.compareTo = function (date) {
    if (isNaN(this)) { 
        throw new Error(this); 
    }
    if (date instanceof Date && !isNaN(date)) {
        return (this > date) ? 1 : (this < date) ? -1 : 0;
    } else { 
        throw new TypeError(date); 
    }
};

/**
 * Compares this instance to another Date object and returns true if they are equal.  
 * @param {Date}     Date object to compare [Required]
 * @return {Boolean} true if dates are equal. false if they are not equal.
 */
Date.prototype.equals = function (date) { 
    return (this.compareTo(date) === 0); 
};

/**
 * Determines is this instance is between a range of two dates or equal to either the start or end dates.
 * @param {Date}     Start of range [Required]
 * @param {Date}     End of range [Required]
 * @return {Boolean} true is this is between or equal to the start and end dates, else false
 */
Date.prototype.between = function (start, end) {
    var t = this.getTime();
    return t >= start.getTime() && t <= end.getTime();
};

/**
 * Adds the specified number of milliseconds to this instance. 
 * @param {Number}   The number of milliseconds to add. The number can be positive or negative [Required]
 * @return {Date}    this
 */
Date.prototype.addMilliseconds = function (value) {
    this.setMilliseconds(this.getMilliseconds() + value);
    return this;
};

/**
 * Adds the specified number of seconds to this instance. 
 * @param {Number}   The number of seconds to add. The number can be positive or negative [Required]
 * @return {Date}    this
 */
Date.prototype.addSeconds = function (value) { 
    return this.addMilliseconds(value * 1000); 
};

/**
 * Adds the specified number of seconds to this instance. 
 * @param {Number}   The number of seconds to add. The number can be positive or negative [Required]
 * @return {Date}    this
 */
Date.prototype.addMinutes = function (value) { 
    return this.addMilliseconds(value * 60000); /* 60*1000 */
};

/**
 * Adds the specified number of hours to this instance. 
 * @param {Number}   The number of hours to add. The number can be positive or negative [Required]
 * @return {Date}    this
 */
Date.prototype.addHours = function (value) { 
    return this.addMilliseconds(value * 3600000); /* 60*60*1000 */
};

/**
 * Adds the specified number of days to this instance. 
 * @param {Number}   The number of days to add. The number can be positive or negative [Required]
 * @return {Date}    this
 */
Date.prototype.addDays = function (value) { 
    return this.addMilliseconds(value * 86400000); /* 60*60*24*1000 */
};

/**
 * Adds the specified number of weeks to this instance. 
 * @param {Number}   The number of weeks to add. The number can be positive or negative [Required]
 * @return {Date}    this
 */
Date.prototype.addWeeks = function (value) { 
    return this.addMilliseconds(value * 604800000); /* 60*60*24*7*1000 */
};

/**
 * Adds the specified number of months to this instance. 
 * @param {Number}   The number of months to add. The number can be positive or negative [Required]
 * @return {Date}    this
 */
Date.prototype.addMonths = function (value) {
    var n = this.getDate();
    this.setDate(1);
    this.setMonth(this.getMonth() + value);
    this.setDate(Math.min(n, this.getDaysInMonth()));
    return this;
};

/**
 * Adds the specified number of years to this instance. 
 * @param {Number}   The number of years to add. The number can be positive or negative [Required]
 * @return {Date}    this
 */
Date.prototype.addYears = function (value) {
    return this.addMonths(value * 12);
};

/**
 * Adds (or subtracts) to the value of the year, month, day, hour, minute, second, millisecond of the date instance using given configuration object. Positive and Negative values allowed.
 * Example
<pre><code>
Date.today().add( { day: 1, month: 1 } )
 
new Date().add( { year: -1 } )
</code></pre> 
 * @param {Object}   Configuration object containing attributes (month, day, etc.)
 * @return {Date}    this
 */
Date.prototype.add = function (config) {
    if (typeof config == "number") {
        this._orient = config;
        return this;    
    }
    var x = config;
    if (x.millisecond || x.milliseconds) { 
        this.addMilliseconds(x.millisecond || x.milliseconds); 
    }
    if (x.second || x.seconds) { 
        this.addSeconds(x.second || x.seconds); 
    }
    if (x.minute || x.minutes) { 
        this.addMinutes(x.minute || x.minutes); 
    }
    if (x.hour || x.hours) { 
        this.addHours(x.hour || x.hours); 
    }
    if (x.month || x.months) { 
        this.addMonths(x.month || x.months); 
    }
    if (x.year || x.years) { 
        this.addYears(x.year || x.years); 
    }
    if (x.day || x.days) {
        this.addDays(x.day || x.days); 
    }
    return this;
};

// private
Date._validate = function (value, min, max, name) {
    if (typeof value != "number") {
        throw new TypeError(value + " is not a Number."); 
    } else if (value < min || value > max) {
        throw new RangeError(value + " is not a valid value for " + name + "."); 
    }
    return true;
};

/**
 * Validates the number is within an acceptable range for milliseconds [0-999].
 * @param {Number}   The number to check if within range.
 * @return {Boolean} true if within range, otherwise false.
 */
Date.validateMillisecond = function (n) {
    return Date._validate(n, 0, 999, "milliseconds");
};

/**
 * Validates the number is within an acceptable range for seconds [0-59].
 * @param {Number}   The number to check if within range.
 * @return {Boolean} true if within range, otherwise false.
 */
Date.validateSecond = function (n) {
    return Date._validate(n, 0, 59, "seconds");
};

/**
 * Validates the number is within an acceptable range for minutes [0-59].
 * @param {Number}   The number to check if within range.
 * @return {Boolean} true if within range, otherwise false.
 */
Date.validateMinute = function (n) {
    return Date._validate(n, 0, 59, "minutes");
};

/**
 * Validates the number is within an acceptable range for hours [0-23].
 * @param {Number}   The number to check if within range.
 * @return {Boolean} true if within range, otherwise false.
 */
Date.validateHour = function (n) {
    return Date._validate(n, 0, 23, "hours");
};

/**
 * Validates the number is within an acceptable range for the days in a month [0-MaxDaysInMonth].
 * @param {Number}   The number to check if within range.
 * @return {Boolean} true if within range, otherwise false.
 */
Date.validateDay = function (n, year, month) {
    return Date._validate(n, 1, Date.getDaysInMonth(year, month), "days");
};

/**
 * Validates the number is within an acceptable range for months [0-11].
 * @param {Number}   The number to check if within range.
 * @return {Boolean} true if within range, otherwise false.
 */
Date.validateMonth = function (n) {
    return Date._validate(n, 0, 11, "months");
};

/**
 * Validates the number is within an acceptable range for years [0-9999].
 * @param {Number}   The number to check if within range.
 * @return {Boolean} true if within range, otherwise false.
 */
Date.validateYear = function (n) {
    return Date._validate(n, 1, 9999, "seconds");
};

/**
 * Set the value of year, month, day, hour, minute, second, millisecond of date instance using given configuration object.
 * Example
<pre><code>
Date.today().set( { day: 20, month: 1 } )

new Date().set( { millisecond: 0 } )
</code></pre>
 * 
 * @param {Object}   Configuration object containing attributes (month, day, etc.)
 * @return {Date}    this
 */
Date.prototype.set = function (config) {
    var x = config;

    if (!x.millisecond && x.millisecond !== 0) { 
        x.millisecond = -1; 
    }
    if (!x.second && x.second !== 0) { 
        x.second = -1; 
    }
    if (!x.minute && x.minute !== 0) { 
        x.minute = -1; 
    }
    if (!x.hour && x.hour !== 0) { 
        x.hour = -1; 
    }
    if (!x.day && x.day !== 0) { 
        x.day = -1; 
    }
    if (!x.month && x.month !== 0) { 
        x.month = -1; 
    }
    if (!x.year && x.year !== 0) { 
        x.year = -1; 
    }

    if (x.millisecond != -1 && Date.validateMillisecond(x.millisecond)) {
        this.addMilliseconds(x.millisecond - this.getMilliseconds()); 
    }
    if (x.second != -1 && Date.validateSecond(x.second)) {
        this.addSeconds(x.second - this.getSeconds()); 
    }
    if (x.minute != -1 && Date.validateMinute(x.minute)) {
        this.addMinutes(x.minute - this.getMinutes()); 
    }
    if (x.hour != -1 && Date.validateHour(x.hour)) {
        this.addHours(x.hour - this.getHours()); 
    }
    if (x.month !== -1 && Date.validateMonth(x.month)) {
        this.addMonths(x.month - this.getMonth()); 
    }
    if (x.year != -1 && Date.validateYear(x.year)) {
        this.addYears(x.year - this.getFullYear()); 
    }
    
	/* day has to go last because you can't validate the day without first knowing the month */
    if (x.day != -1 && Date.validateDay(x.day, this.getFullYear(), this.getMonth())) {
        this.addDays(x.day - this.getDate()); 
    }
    if (x.timezone) { 
        this.setTimezone(x.timezone); 
    }
    if (x.timezoneOffset) { 
        this.setTimezoneOffset(x.timezoneOffset); 
    }
    
    return this;   
};

/**
 * Resets the time of this Date object to 12:00 AM (00:00), which is the start of the day.
 * @return {Date}    this
 */
Date.prototype.clearTime = function () {
    this.setHours(0); 
    this.setMinutes(0); 
    this.setSeconds(0);
    this.setMilliseconds(0); 
    return this;
};

/**
 * Determines whether or not this instance is in a leap year.
 * @return {Boolean} true if this instance is in a leap year, else false
 */
Date.prototype.isLeapYear = function () { 
    var y = this.getFullYear(); 
    return (((y % 4 === 0) && (y % 100 !== 0)) || (y % 400 === 0)); 
};

/**
 * Determines whether or not this instance is a weekday.
 * @return {Boolean} true if this instance is a weekday
 */
Date.prototype.isWeekday = function () { 
    return !(this.is().sat() || this.is().sun());
};

/**
 * Get the number of days in the current month, adjusted for leap year.
 * @return {Number}  The number of days in the month
 */
Date.prototype.getDaysInMonth = function () { 
    return Date.getDaysInMonth(this.getFullYear(), this.getMonth());
};

/**
 * Moves the date to the first day of the month.
 * @return {Date}    this
 */
Date.prototype.moveToFirstDayOfMonth = function () {
    return this.set({ day: 1 });
};

/**
 * Moves the date to the last day of the month.
 * @return {Date}    this
 */
Date.prototype.moveToLastDayOfMonth = function () { 
    return this.set({ day: this.getDaysInMonth()});
};

/**
 * Move to the next or last dayOfWeek based on the orient value.
 * @param {Number}   The dayOfWeek to move to.
 * @param {Number}   Forward (+1) or Back (-1). Defaults to +1. [Optional]
 * @return {Date}    this
 */
Date.prototype.moveToDayOfWeek = function (day, orient) {
    var diff = (day - this.getDay() + 7 * (orient || +1)) % 7;
    return this.addDays((diff === 0) ? diff += 7 * (orient || +1) : diff);
};

/**
 * Move to the next or last month based on the orient value.
 * @param {Number}   The month to move to. 0 = January, 11 = December.
 * @param {Number}   Forward (+1) or Back (-1). Defaults to +1. [Optional]
 * @return {Date}    this
 */
Date.prototype.moveToMonth = function (month, orient) {
    var diff = (month - this.getMonth() + 12 * (orient || +1)) % 12;
    return this.addMonths((diff === 0) ? diff += 12 * (orient || +1) : diff);
};

/**
 * Get the numeric day number of the year, adjusted for leap year.
 * @return {Number} 0 through 364 (365 in leap years)
 */
Date.prototype.getDayOfYear = function () {
    return Math.floor((this - new Date(this.getFullYear(), 0, 1)) / 86400000);
};

/**
 * Get the week of the year for the current date instance.
 * @param {Number}   A Number that represents the first day of the week (0-6) [Optional]
 * @return {Number}  0 through 53
 */
Date.prototype.getWeekOfYear = function (firstDayOfWeek) {
    var y = this.getFullYear(), m = this.getMonth(), d = this.getDate();
    
    var dow = firstDayOfWeek || Date.CultureInfo.firstDayOfWeek;
	
    var offset = 7 + 1 - new Date(y, 0, 1).getDay();
    if (offset == 8) {
        offset = 1;
    }
    var daynum = ((Date.UTC(y, m, d, 0, 0, 0) - Date.UTC(y, 0, 1, 0, 0, 0)) / 86400000) + 1;
    var w = Math.floor((daynum - offset + 7) / 7);
    if (w === dow) {
        y--;
        var prevOffset = 7 + 1 - new Date(y, 0, 1).getDay();
        if (prevOffset == 2 || prevOffset == 8) { 
            w = 53; 
        } else { 
            w = 52; 
        }
    }
    return w;
};

/**
 * Determine whether Daylight Saving Time (DST) is in effect
 * @return {Boolean} True if DST is in effect.
 */
Date.prototype.isDST = function () {
    /* TODO: not sure if this is portable ... get from Date.CultureInfo? */
    return this.toString().match(/(E|C|M|P)(S|D)T/)[2] == "D";
};

/**
 * Get the timezone abbreviation of the current date.
 * @return {String} The abbreviated timezone name (e.g. "EST")
 */
Date.prototype.getTimezone = function () {
    return Date.getTimezoneAbbreviation(this.getUTCOffset, this.isDST());
};

Date.prototype.setTimezoneOffset = function (s) {
    var here = this.getTimezoneOffset(), there = Number(s) * -6 / 10;
    this.addMinutes(there - here); 
    return this;
};

Date.prototype.setTimezone = function (s) { 
    return this.setTimezoneOffset(Date.getTimezoneOffset(s)); 
};

/**
 * Get the offset from UTC of the current date.
 * @return {String} The 4-character offset string prefixed with + or - (e.g. "-0500")
 */
Date.prototype.getUTCOffset = function () {
    var n = this.getTimezoneOffset() * -10 / 6, r;
    if (n < 0) { 
        r = (n - 10000).toString(); 
        return r[0] + r.substr(2); 
    } else { 
        r = (n + 10000).toString();  
        return "+" + r.substr(1); 
    }
};

/**
 * Gets the name of the day of the week.
 * @param {Boolean}  true to return the abbreviated name of the day of the week
 * @return {String}  The name of the day
 */
Date.prototype.getDayName = function (abbrev) {
    return abbrev ? Date.CultureInfo.abbreviatedDayNames[this.getDay()] : 
        Date.CultureInfo.dayNames[this.getDay()];
};

/**
 * Gets the month name.
 * @param {Boolean}  true to return the abbreviated name of the month
 * @return {String}  The name of the month
 */
Date.prototype.getMonthName = function (abbrev) {
    return abbrev ? Date.CultureInfo.abbreviatedMonthNames[this.getMonth()] : 
        Date.CultureInfo.monthNames[this.getMonth()];
};

// private
Date.prototype._toString = Date.prototype.toString;

/**
 * Converts the value of the current Date object to its equivalent string representation.
 * Format Specifiers
<pre>
Format  Description                                                                  Example
------  ---------------------------------------------------------------------------  -----------------------
 s      The seconds of the minute between 1-59.                                      "1" to "59"
 ss     The seconds of the minute with leading zero if required.                     "01" to "59"
 
 m      The minute of the hour between 0-59.                                         "1"  or "59"
 mm     The minute of the hour with leading zero if required.                        "01" or "59"
 
 h      The hour of the day between 1-12.                                            "1"  to "12"
 hh     The hour of the day with leading zero if required.                           "01" to "12"
 
 H      The hour of the day between 1-23.                                            "1"  to "23"
 HH     The hour of the day with leading zero if required.                           "01" to "23"
 
 d      The day of the month between 1 and 31.                                       "1"  to "31"
 dd     The day of the month with leading zero if required.                          "01" to "31"
 ddd    Abbreviated day name. Date.CultureInfo.abbreviatedDayNames.                  "Mon" to "Sun" 
 dddd   The full day name. Date.CultureInfo.dayNames.                                "Monday" to "Sunday"
 
 M      The month of the year between 1-12.                                          "1" to "12"
 MM     The month of the year with leading zero if required.                         "01" to "12"
 MMM    Abbreviated month name. Date.CultureInfo.abbreviatedMonthNames.              "Jan" to "Dec"
 MMMM   The full month name. Date.CultureInfo.monthNames.                            "January" to "December"

 yy     Displays the year as a maximum two-digit number.                             "99" or "07"
 yyyy   Displays the full four digit year.                                           "1999" or "2007"
 
 t      Displays the first character of the A.M./P.M. designator.                    "A" or "P"
        Date.CultureInfo.amDesignator or Date.CultureInfo.pmDesignator
 tt     Displays the A.M./P.M. designator.                                           "AM" or "PM"
        Date.CultureInfo.amDesignator or Date.CultureInfo.pmDesignator
</pre>
 * @param {String}   A format string consisting of one or more format spcifiers [Optional].
 * @return {String}  A string representation of the current Date object.
 */
Date.prototype.toString = function (format) {
    var self = this;

    var p = function p(s) {
        return (s.toString().length == 1) ? "0" + s : s;
    };

    return format ? format.replace(/dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|zz?z?/g, 
    function (format) {
        switch (format) {
        case "hh":
            return p(self.getHours() < 13 ? self.getHours() : (self.getHours() - 12));
        case "h":
            return self.getHours() < 13 ? self.getHours() : (self.getHours() - 12);
        case "HH":
            return p(self.getHours());
        case "H":
            return self.getHours();
        case "mm":
            return p(self.getMinutes());
        case "m":
            return self.getMinutes();
        case "ss":
            return p(self.getSeconds());
        case "s":
            return self.getSeconds();
        case "yyyy":
            return self.getFullYear();
        case "yy":
            return self.getFullYear().toString().substring(2, 4);
        case "dddd":
            return self.getDayName();
        case "ddd":
            return self.getDayName(true);
        case "dd":
            return p(self.getDate());
        case "d":
            return self.getDate().toString();
        case "MMMM":
            return self.getMonthName();
        case "MMM":
            return self.getMonthName(true);
        case "MM":
            return p((self.getMonth() + 1));
        case "M":
            return self.getMonth() + 1;
        case "t":
            return self.getHours() < 12 ? Date.CultureInfo.amDesignator.substring(0, 1) : Date.CultureInfo.pmDesignator.substring(0, 1);
        case "tt":
            return self.getHours() < 12 ? Date.CultureInfo.amDesignator : Date.CultureInfo.pmDesignator;
        case "zzz":
        case "zz":
        case "z":
            return "";
        }
    }
    ) : this._toString();
};


/**
 * Version: 1.0 Alpha-1 
 * Build Date: 12-Nov-2007
 * Copyright (c) 2006-2007, Coolite Inc. (http://www.coolite.com/). All rights reserved.
 * License: Licensed under The MIT License. See license.txt and http://www.datejs.com/license/. 
 * Website: http://www.datejs.com/ or http://www.coolite.com/datejs/
 */

/**
 **************************************************************
 ** SugarPak - Domain Specific Language -  Syntactical Sugar **
 **************************************************************
 */
 
/**
 * Gets a date that is set to the current date and time. 
 * @return {Date}    The current date and time.
 */
Date.now = function () {
    return new Date();
};

/** 
 * Gets a date that is set to the current date. The time is set to the start of the day (00:00 or 12:00 AM).
 * @return {Date}    The current date.
 */
Date.today = function () {
    return Date.now().clearTime();
};

// private
Date.prototype._orient = +1;

/** 
 * Moves the date to the next instance of a date as specified by a trailing date element function (eg. .day(), .month()), month name function (eg. .january(), .jan()) or day name function (eg. .friday(), fri()).
 * Example
<pre><code>
Date.today().next().friday();
Date.today().next().fri();
Date.today().next().march();
Date.today().next().mar();
Date.today().next().week();
</code></pre>
 * 
 * @return {Date}    this
 */
Date.prototype.next = function () {
    this._orient = +1;
    return this;
};

/** 
 * Moves the date to the previous instance of a date as specified by a trailing date element function (eg. .day(), .month()), month name function (eg. .january(), .jan()) or day name function (eg. .friday(), fri()).
 * Example
<pre><code>
Date.today().last().friday();
Date.today().last().fri();
Date.today().last().march();
Date.today().last().mar();
Date.today().last().week();
</code></pre>
 *  
 * @return {Date}    this
 */
Date.prototype.last = Date.prototype.prev = Date.prototype.previous = function () {
    this._orient = -1;
    return this;
};

// private
Date.prototype._is = false;
    
/** 
 * Performs a equality check when followed by either a month name or day name function.
 * Example
<pre><code>
Date.today().is().friday(); // true|false
Date.today().is().fri();
Date.today().is().march();
Date.today().is().mar();
</code></pre>
 *  
 * @return {bool}    true|false
 */
Date.prototype.is = function () { 
    this._is = true; 
    return this; 
}; 

// private
Number.prototype._dateElement = "day";

/** 
 * Creates a new Date (Date.now()) and adds this (Number) to the date based on the preceding date element function (eg. second|minute|hour|day|month|year).
 * Example
<pre><code>
// Undeclared Numbers must be wrapped with parentheses. Requirment of JavaScript.
(3).days().fromNow();
(6).months().fromNow();

// Declared Number variables do not require parentheses. 
var n = 6;
n.months().fromNow();
</code></pre>
 *  
 * @return {Date}    A new Date instance
 */
Number.prototype.fromNow = function () {
    var c = {};
    c[this._dateElement] = this;
    return Date.now().add(c);
};

/** 
 * Creates a new Date (Date.now()) and subtract this (Number) from the date based on the preceding date element function (eg. second|minute|hour|day|month|year).
 * Example
<pre><code>
// Undeclared Numbers must be wrapped with parentheses. Requirment of JavaScript.
(3).days().ago();
(6).months().ago();

// Declared Number variables do not require parentheses. 
var n = 6;
n.months().ago();
</code></pre>
 *  
 * @return {Date}    A new Date instance
 */
Number.prototype.ago = function () {
    var c = {};
    c[this._dateElement] = this * -1;
    return Date.now().add(c);
};

// Build dynamic date element, month name and day name functions.
(function () {
    var $D = Date.prototype, $N = Number.prototype;

    /* Do NOT modify the following string tokens. These tokens are used to build dynamic functions. */
    var dx = ("sunday monday tuesday wednesday thursday friday saturday").split(/\s/),
        mx = ("january february march april may june july august september october november december").split(/\s/),
        px = ("Millisecond Second Minute Hour Day Week Month Year").split(/\s/),
        de;
    
    // Create day name functions and abbreviated day name functions (eg. monday(), friday(), fri()).
    var df = function (n) {
        return function () { 
            if (this._is) { 
                this._is = false; 
                return this.getDay() == n; 
            }
            return this.moveToDayOfWeek(n, this._orient);
        };
    };
    
    for (var i = 0 ; i < dx.length ; i++) { 
        $D[dx[i]] = $D[dx[i].substring(0, 3)] = df(i);
    }
    
    // Create month name functions and abbreviated month name functions (eg. january(), march(), mar()).
    var mf = function (n) { 
        return function () {
            if (this._is) { 
                this._is = false; 
                return this.getMonth() === n; 
            }
            return this.moveToMonth(n, this._orient); 
        };
    };
    
    for (var j = 0 ; j < mx.length ; j++) { 
        $D[mx[j]] = $D[mx[j].substring(0, 3)] = mf(j);
    }
    
    // Create date element functions and plural date element functions used with Date (eg. day(), days(), months()).
    var ef = function (j) { 
        return function () {
            if (j.substring(j.length - 1) != "s") { 
                j += "s"; 
            }
            return this["add" + j](this._orient); 
        };
    };
    
    // Create date element functions and plural date element functions used with Number (eg. day(), days(), months()).
    var nf = function (n) {
        return function () {
            this._dateElement = n;
            return this;
        };
    };
    
    for (var k = 0 ; k < px.length ; k++) {
        de = px[k].toLowerCase();
        $D[de] = $D[de + "s"] = ef(px[k]);
        $N[de] = $N[de + "s"] = nf(de);
    }
}());

/**
 * Converts the current date instance into a JSON string value.
 * @return {String}  JSON string of date
 */
Date.prototype.toJSONString = function () {
    return this.toString("yyyy-MM-ddThh:mm:ssZ");
};

/**
 * Converts the current date instance to a string using the culture specific shortDatePattern.
 * @return {String}  A string formatted as per the culture specific shortDatePattern
 */
Date.prototype.toShortDateString = function () {
    return this.toString(Date.CultureInfo.formatPatterns.shortDatePattern);
};

/**
 * Converts the current date instance to a string using the culture specific longDatePattern.
 * @return {String}  A string formatted as per the culture specific longDatePattern
 */
Date.prototype.toLongDateString = function () {
    return this.toString(Date.CultureInfo.formatPatterns.longDatePattern);
};

/**
 * Converts the current date instance to a string using the culture specific shortTimePattern.
 * @return {String}  A string formatted as per the culture specific shortTimePattern
 */
Date.prototype.toShortTimeString = function () {
    return this.toString(Date.CultureInfo.formatPatterns.shortTimePattern);
};

/**
 * Converts the current date instance to a string using the culture specific longTimePattern.
 * @return {String}  A string formatted as per the culture specific longTimePattern
 */
Date.prototype.toLongTimeString = function () {
    return this.toString(Date.CultureInfo.formatPatterns.longTimePattern);
};

/**
 * Get the ordinal suffix of the current day.
 * @return {String}  "st, "nd", "rd" or "th"
 */
Date.prototype.getOrdinal = function () {
    switch (this.getDate()) {
    case 1: 
    case 21: 
    case 31: 
        return "st";
    case 2: 
    case 22: 
        return "nd";
    case 3: 
    case 23: 
        return "rd";
    default: 
        return "th";
    }
};


/**
 * Version: 1.0 Alpha-1 
 * Build Date: 12-Nov-2007
 * Copyright (c) 2006-2007, Coolite Inc. (http://www.coolite.com/). All rights reserved.
 * License: Licensed under The MIT License. See license.txt and http://www.datejs.com/license/. 
 * Website: http://www.datejs.com/ or http://www.coolite.com/datejs/
 */
 
(function () {
    Date.Parsing = {
        Exception: function (s) { 
            this.message = "Parse error at '" + s.substring(0, 10) + " ...'"; 
        }
    };
    
    var $P = Date.Parsing; 
    var _ = $P.Operators = {
        //
        // Tokenizers
        //
        rtoken: function (r) { // regex token
            return function (s) {
                var mx = s.match(r);
                if (mx) { 
                    return ([ mx[0], s.substring(mx[0].length) ]); 
                } else { 
                    throw new $P.Exception(s); 
                }
            };
        },
        token: function (s) { // whitespace-eating token
            return function (s) {
                return _.rtoken(new RegExp("^\s*" + s + "\s*"))(s);
                // Removed .strip()
                // return _.rtoken(new RegExp("^\s*" + s + "\s*"))(s).strip();
            };
        },
        stoken: function (s) { // string token
            return _.rtoken(new RegExp("^" + s)); 
        },

        //
        // Atomic Operators
        // 

        until: function (p) {
            return function (s) {
                var qx = [], rx = null;
                while (s.length) { 
                    try { 
                        rx = p.call(this, s); 
                    } catch (e) { 
                        qx.push(rx[0]); 
                        s = rx[1]; 
                        continue; 
                    }
                    break;
                }
                return [ qx, s ];
            };
        },
        many: function (p) {
            return function (s) {
                var rx = [], r = null; 
                while (s.length) { 
                    try { 
                        r = p.call(this, s); 
                    } catch (e) { 
                        return [ rx, s ]; 
                    }
                    rx.push(r[0]); 
                    s = r[1];
                }
                return [ rx, s ];
            };
        },

        // generator operators -- see below
        optional: function (p) {
            return function (s) {
                var r = null; 
                try { 
                    r = p.call(this, s); 
                } catch (e) { 
                    return [ null, s ]; 
                }
                return [ r[0], r[1] ];
            };
        },
        not: function (p) {
            return function (s) {
                try { 
                    p.call(this, s); 
                } catch (e) { 
                    return [null, s]; 
                }
                throw new $P.Exception(s);
            };
        },
        ignore: function (p) {
            return p ? 
            function (s) { 
                var r = null; 
                r = p.call(this, s); 
                return [null, r[1]]; 
            } : null;
        },
        product: function () {
            var px = arguments[0], 
            qx = Array.prototype.slice.call(arguments, 1), rx = [];
            for (var i = 0 ; i < px.length ; i++) {
                rx.push(_.each(px[i], qx));
            }
            return rx;
        },
        cache: function (rule) { 
            var cache = {}, r = null; 
            return function (s) {
                try { 
                    r = cache[s] = (cache[s] || rule.call(this, s)); 
                } catch (e) { 
                    r = cache[s] = e; 
                }
                if (r instanceof $P.Exception) { 
                    throw r; 
                } else { 
                    return r; 
                }
            };
        },
    	  
        // vector operators -- see below
        any: function () {
            var px = arguments;
            return function (s) { 
                var r = null;
                for (var i = 0; i < px.length; i++) { 
                    if (px[i] == null) { 
                        continue; 
                    }
                    try { 
                        r = (px[i].call(this, s)); 
                    } catch (e) { 
                        r = null; 
                    }
                    if (r) { 
                        return r; 
                    }
                } 
                throw new $P.Exception(s);
            };
        },
        each: function () { 
            var px = arguments;
            return function (s) { 
                var rx = [], r = null;
                for (var i = 0; i < px.length ; i++) { 
                    if (px[i] == null) { 
                        continue; 
                    }
                    try { 
                        r = (px[i].call(this, s)); 
                    } catch (e) { 
                        throw new $P.Exception(s); 
                    }
                    rx.push(r[0]); 
                    s = r[1];
                }
                return [ rx, s]; 
            };
        },
        all: function () { 
            var px = arguments, _ = _; 
            return _.each(_.optional(px)); 
        },

        // delimited operators
        sequence: function (px, d, c) {
            d = d || _.rtoken(/^\s*/);  
            c = c || null;
            
            if (px.length == 1) { 
                return px[0]; 
            }
            return function (s) {
                var r = null, q = null;
                var rx = []; 
                for (var i = 0; i < px.length ; i++) {
                    try { 
                        r = px[i].call(this, s); 
                    } catch (e) { 
                        break; 
                    }
                    rx.push(r[0]);
                    try { 
                        q = d.call(this, r[1]); 
                    } catch (ex) { 
                        q = null; 
                        break; 
                    }
                    s = q[1];
                }
                if (!r) { 
                    throw new $P.Exception(s); 
                }
                if (q) { 
                    throw new $P.Exception(q[1]); 
                }
                if (c) {
                    try { 
                        r = c.call(this, r[1]);
                    } catch (ey) { 
                        throw new $P.Exception(r[1]); 
                    }
                }
                return [ rx, (r?r[1]:s) ];
            };
        },
    		
	    //
	    // Composite Operators
	    //
    		
        between: function (d1, p, d2) { 
            d2 = d2 || d1; 
            var _fn = _.each(_.ignore(d1), p, _.ignore(d2));
            return function (s) { 
                var rx = _fn.call(this, s); 
                return [[rx[0][0], r[0][2]], rx[1]]; 
            };
        },
        list: function (p, d, c) {
            d = d || _.rtoken(/^\s*/);  
            c = c || null;
            return (p instanceof Array ?
                _.each(_.product(p.slice(0, -1), _.ignore(d)), p.slice(-1), _.ignore(c)) :
                _.each(_.many(_.each(p, _.ignore(d))), px, _.ignore(c)));
        },
        set: function (px, d, c) {
            d = d || _.rtoken(/^\s*/); 
            c = c || null;
            return function (s) {
                // r is the current match, best the current 'best' match
                // which means it parsed the most amount of input
                var r = null, p = null, q = null, rx = null, best = [[], s], last = false;

                // go through the rules in the given set
                for (var i = 0; i < px.length ; i++) {

                    // last is a flag indicating whether this must be the last element
                    // if there is only 1 element, then it MUST be the last one
                    q = null; 
                    p = null; 
                    r = null; 
                    last = (px.length == 1); 

                    // first, we try simply to match the current pattern
                    // if not, try the next pattern
                    try { 
                        r = px[i].call(this, s);
                    } catch (e) { 
                        continue; 
                    }

                    // since we are matching against a set of elements, the first
                    // thing to do is to add r[0] to matched elements
                    rx = [[r[0]], r[1]];

                    // if we matched and there is still input to parse and 
                    // we don't already know this is the last element,
                    // we're going to next check for the delimiter ...
                    // if there's none, or if there's no input left to parse
                    // than this must be the last element after all ...
                    if (r[1].length > 0 && ! last) {
                        try { 
                            q = d.call(this, r[1]); 
                        } catch (ex) { 
                            last = true; 
                        }
                    } else { 
                        last = true; 
                    }

				    // if we parsed the delimiter and now there's no more input,
				    // that means we shouldn't have parsed the delimiter at all
				    // so don't update r and mark this as the last element ...
                    if (!last && q[1].length === 0) { 
                        last = true; 
                    }


				    // so, if this isn't the last element, we're going to see if
				    // we can get any more matches from the remaining (unmatched)
				    // elements ...
                    if (!last) {

                        // build a list of the remaining rules we can match against,
                        // i.e., all but the one we just matched against
                        var qx = []; 
                        for (var j = 0; j < px.length ; j++) { 
                            if (i != j) { 
                                qx.push(px[j]); 
                            }
                        }

                        // now invoke recursively set with the remaining input
                        // note that we don't include the closing delimiter ...
                        // we'll check for that ourselves at the end
                        p = _.set(qx, d).call(this, q[1]);

                        // if we got a non-empty set as a result ...
                        // (otw rx already contains everything we want to match)
                        if (p[0].length > 0) {
                            // update current result, which is stored in rx ...
                            // basically, pick up the remaining text from p[1]
                            // and concat the result from p[0] so that we don't
                            // get endless nesting ...
                            rx[0] = rx[0].concat(p[0]); 
                            rx[1] = p[1]; 
                        }
                    }

				    // at this point, rx either contains the last matched element
				    // or the entire matched set that starts with this element.

				    // now we just check to see if this variation is better than
				    // our best so far, in terms of how much of the input is parsed
                    if (rx[1].length < best[1].length) { 
                        best = rx; 
                    }

				    // if we've parsed all the input, then we're finished
                    if (best[1].length === 0) { 
                        break; 
                    }
                }

			    // so now we've either gone through all the patterns trying them
			    // as the initial match; or we found one that parsed the entire
			    // input string ...

			    // if best has no matches, just return empty set ...
                if (best[0].length === 0) { 
                    return best; 
                }

			    // if a closing delimiter is provided, then we have to check it also
                if (c) {
                    // we try this even if there is no remaining input because the pattern
                    // may well be optional or match empty input ...
                    try { 
                        q = c.call(this, best[1]); 
                    } catch (ey) { 
                        throw new $P.Exception(best[1]); 
                    }

                    // it parsed ... be sure to update the best match remaining input
                    best[1] = q[1];
                }

			    // if we're here, either there was no closing delimiter or we parsed it
			    // so now we have the best match; just return it!
                return best;
            };
        },
        forward: function (gr, fname) {
            return function (s) { 
                return gr[fname].call(this, s); 
            };
        },

        //
        // Translation Operators
        //
        replace: function (rule, repl) {
            return function (s) { 
                var r = rule.call(this, s); 
                return [repl, r[1]]; 
            };
        },
        process: function (rule, fn) {
            return function (s) {  
                var r = rule.call(this, s); 
                return [fn.call(this, r[0]), r[1]]; 
            };
        },
        min: function (min, rule) {
            return function (s) {
                var rx = rule.call(this, s); 
                if (rx[0].length < min) { 
                    throw new $P.Exception(s); 
                }
                return rx;
            };
        }
    };
	

	// Generator Operators And Vector Operators

	// Generators are operators that have a signature of F(R) => R,
	// taking a given rule and returning another rule, such as 
	// ignore, which parses a given rule and throws away the result.

	// Vector operators are those that have a signature of F(R1,R2,...) => R,
	// take a list of rules and returning a new rule, such as each.

	// Generator operators are converted (via the following _generator
	// function) into functions that can also take a list or array of rules
	// and return an array of new rules as though the function had been
	// called on each rule in turn (which is what actually happens).

	// This allows generators to be used with vector operators more easily.
	// Example:
	// each(ignore(foo, bar)) instead of each(ignore(foo), ignore(bar))

	// This also turns generators into vector operators, which allows
	// constructs like:
	// not(cache(foo, bar))
	
    var _generator = function (op) {
        return function () {
            var args = null, rx = [];
            if (arguments.length > 1) {
                args = Array.prototype.slice.call(arguments);
            } else if (arguments[0] instanceof Array) {
                args = arguments[0];
            }
            if (args) { 
                for (var i = 0, px = args.shift() ; i < px.length ; i++) {
                    args.unshift(px[i]); 
                    rx.push(op.apply(null, args)); 
                    args.shift();
                    return rx;
                } 
            } else { 
                return op.apply(null, arguments); 
            }
        };
    };
    
    var gx = "optional not ignore cache".split(/\s/);
    
    for (var i = 0 ; i < gx.length ; i++) { 
        _[gx[i]] = _generator(_[gx[i]]); 
    }

    var _vector = function (op) {
        return function () {
            if (arguments[0] instanceof Array) { 
                return op.apply(null, arguments[0]); 
            } else { 
                return op.apply(null, arguments); 
            }
        };
    };
    
    var vx = "each any all".split(/\s/);
    
    for (var j = 0 ; j < vx.length ; j++) { 
        _[vx[j]] = _vector(_[vx[j]]); 
    }
	
}());

(function () {
    var flattenAndCompact = function (ax) { 
        var rx = []; 
        for (var i = 0; i < ax.length; i++) {
            if (ax[i] instanceof Array) {
                rx = rx.concat(flattenAndCompact(ax[i]));
            } else { 
                if (ax[i]) { 
                    rx.push(ax[i]); 
                }
            }
        }
        return rx;
    };
    
    Date.Grammar = {};
	
    Date.Translator = {
        hour: function (s) { 
            return function () { 
                this.hour = Number(s); 
            }; 
        },
        minute: function (s) { 
            return function () { 
                this.minute = Number(s); 
            }; 
        },
        second: function (s) { 
            return function () { 
                this.second = Number(s); 
            }; 
        },
        meridian: function (s) { 
            return function () { 
                this.meridian = s.slice(0, 1).toLowerCase(); 
            }; 
        },
        timezone: function (s) {
            return function () {
                var n = s.replace(/[^\d\+\-]/g, "");
                if (n.length) { 
                    this.timezoneOffset = Number(n); 
                } else { 
                    this.timezone = s.toLowerCase(); 
                }
            };
        },
        day: function (x) { 
            var s = x[0];
            return function () { 
                this.day = Number(s.match(/\d+/)[0]); 
            };
        }, 
        month: function (s) {
            return function () {
                this.month = ((s.length == 3) ? Date.getMonthNumberFromName(s) : (Number(s) - 1));
            };
        },
        year: function (s) {
            return function () {
                var n = Number(s);
                this.year = ((s.length > 2) ? n : 
                    (n + (((n + 2000) < Date.CultureInfo.twoDigitYearMax) ? 2000 : 1900))); 
            };
        },
        rday: function (s) { 
            return function () {
                switch (s) {
                case "yesterday": 
                    this.days = -1;
                    break;
                case "tomorrow":  
                    this.days = 1;
                    break;
                case "today": 
                    this.days = 0;
                    break;
                case "now": 
                    this.days = 0; 
                    this.now = true; 
                    break;
                }
            };
        },
        finishExact: function (x) {  
            x = (x instanceof Array) ? x : [ x ]; 
	        
            var now = new Date();

            this.year = now.getFullYear(); 
            this.month = now.getMonth(); 
            this.day = 1; 

            this.hour = 0; 
            this.minute = 0; 
            this.second = 0;

            for (var i = 0 ; i < x.length ; i++) { 
                if (x[i]) { 
                    x[i].call(this); 
                }
            } 

            this.hour = (this.meridian == "p" && this.hour < 13) ? this.hour + 12 : this.hour;

            if (this.day > Date.getDaysInMonth(this.year, this.month)) {
                throw new RangeError(this.day + " is not a valid value for days.");
            }

            var r = new Date(this.year, this.month, this.day, this.hour, this.minute, this.second);

            if (this.timezone) { 
                r.set({ timezone: this.timezone }); 
            } else if (this.timezoneOffset) { 
                r.set({ timezoneOffset: this.timezoneOffset }); 
            }
            return r;
        },			
        finish: function (x) {
            x = (x instanceof Array) ? flattenAndCompact(x) : [ x ];

            if (x.length === 0) { 
                return null; 
            }

            for (var i = 0 ; i < x.length ; i++) { 
                if (typeof x[i] == "function") {
                    x[i].call(this); 
                }
            }

            if (this.now) { 
                return new Date(); 
            }

            var today = Date.today(); 
            var method = null;

            var expression = !!(this.days != null || this.orient || this.operator);
            if (expression) {
                var gap, mod, orient;
                orient = ((this.orient == "past" || this.operator == "subtract") ? -1 : 1);

                if (this.weekday) {
                    this.unit = "day";
                    gap = (Date.getDayNumberFromName(this.weekday) - today.getDay());
                    mod = 7;
                    this.days = gap ? ((gap + (orient * mod)) % mod) : (orient * mod);
                }
                if (this.month) {
                    this.unit = "month";
                    gap = (this.month - today.getMonth());
                    mod = 12;
                    this.months = gap ? ((gap + (orient * mod)) % mod) : (orient * mod);
                    this.month = null;
                }
                if (!this.unit) { 
                    this.unit = "day"; 
                }
                if (this[this.unit + "s"] == null || this.operator != null) {
                    if (!this.value) { 
                        this.value = 1;
                    }

                    if (this.unit == "week") { 
                        this.unit = "day"; 
                        this.value = this.value * 7; 
                    }

                    this[this.unit + "s"] = this.value * orient;
                }
                return today.add(this);
            } else {
                if (this.meridian && this.hour) {
                    this.hour = (this.hour < 13 && this.meridian == "p") ? this.hour + 12 : this.hour;			
                }
                
                //	Have to find the actual source of this bug. However, for now, we watch for
                //	this.hour getting to `24`, which is illegal for js Date(), and reset it to `12`.
                // 	Very disturbing...
                //
				if(this.hour == 24) {
					this.hour = 12;
				}

                if (this.weekday && !this.day) {
                    this.day = (today.addDays((Date.getDayNumberFromName(this.weekday) - today.getDay()))).getDate();
                }
                if (this.month && !this.day) { 
                    this.day = 1; 
                }
                return today.set(this);
            }
        }
    };

    var _ = Date.Parsing.Operators, g = Date.Grammar, t = Date.Translator, _fn;

    g.datePartDelimiter = _.rtoken(/^([\s\-\.\,\/\x27]+)/); 
    g.timePartDelimiter = _.stoken(":");
    g.whiteSpace = _.rtoken(/^\s*/);
    g.generalDelimiter = _.rtoken(/^(([\s\,]|at|on)+)/);
  
    var _C = {};
    g.ctoken = function (keys) {
        var fn = _C[keys];
        if (! fn) {
            var c = Date.CultureInfo.regexPatterns;
            var kx = keys.split(/\s+/), px = []; 
            for (var i = 0; i < kx.length ; i++) {
                px.push(_.replace(_.rtoken(c[kx[i]]), kx[i]));
            }
            fn = _C[keys] = _.any.apply(null, px);
        }
        return fn;
    };
    g.ctoken2 = function (key) { 
        return _.rtoken(Date.CultureInfo.regexPatterns[key]);
    };

    // hour, minute, second, meridian, timezone
    g.h = _.cache(_.process(_.rtoken(/^(0[0-9]|1[0-2]|[1-9])/), t.hour));
    g.hh = _.cache(_.process(_.rtoken(/^(0[0-9]|1[0-2])/), t.hour));
    g.H = _.cache(_.process(_.rtoken(/^([0-1][0-9]|2[0-3]|[0-9])/), t.hour));
    g.HH = _.cache(_.process(_.rtoken(/^([0-1][0-9]|2[0-3])/), t.hour));
    g.m = _.cache(_.process(_.rtoken(/^([0-5][0-9]|[0-9])/), t.minute));
    g.mm = _.cache(_.process(_.rtoken(/^[0-5][0-9]/), t.minute));
    g.s = _.cache(_.process(_.rtoken(/^([0-5][0-9]|[0-9])/), t.second));
    g.ss = _.cache(_.process(_.rtoken(/^[0-5][0-9]/), t.second));
    g.hms = _.cache(_.sequence([g.H, g.mm, g.ss], g.timePartDelimiter));
  
    // _.min(1, _.set([ g.H, g.m, g.s ], g._t));
    g.t = _.cache(_.process(g.ctoken2("shortMeridian"), t.meridian));
    g.tt = _.cache(_.process(g.ctoken2("longMeridian"), t.meridian));
    g.z = _.cache(_.process(_.rtoken(/^(\+|\-)?\s*\d\d\d\d?/), t.timezone));
    g.zz = _.cache(_.process(_.rtoken(/^(\+|\-)\s*\d\d\d\d/), t.timezone));
    g.zzz = _.cache(_.process(g.ctoken2("timezone"), t.timezone));
    g.timeSuffix = _.each(_.ignore(g.whiteSpace), _.set([ g.tt, g.zzz ]));
    g.time = _.each(_.optional(_.ignore(_.stoken("T"))), g.hms, g.timeSuffix);
	  
    // days, months, years
    g.d = _.cache(_.process(_.each(_.rtoken(/^([0-2]\d|3[0-1]|\d)/), 
        _.optional(g.ctoken2("ordinalSuffix"))), t.day));
    g.dd = _.cache(_.process(_.each(_.rtoken(/^([0-2]\d|3[0-1])/), 
        _.optional(g.ctoken2("ordinalSuffix"))), t.day));
    g.ddd = g.dddd = _.cache(_.process(g.ctoken("sun mon tue wed thu fri sat"), 
        function (s) { 
            return function () { 
                this.weekday = s; 
            }; 
        }
    ));
    g.M = _.cache(_.process(_.rtoken(/^(1[0-2]|0\d|\d)/), t.month));
    g.MM = _.cache(_.process(_.rtoken(/^(1[0-2]|0\d)/), t.month));
    g.MMM = g.MMMM = _.cache(_.process(
        g.ctoken("jan feb mar apr may jun jul aug sep oct nov dec"), t.month));
    g.y = _.cache(_.process(_.rtoken(/^(\d\d?)/), t.year));
    g.yy = _.cache(_.process(_.rtoken(/^(\d\d)/), t.year));
    g.yyy = _.cache(_.process(_.rtoken(/^(\d\d?\d?\d?)/), t.year));
    g.yyyy = _.cache(_.process(_.rtoken(/^(\d\d\d\d)/), t.year));
	
	// rolling these up into general purpose rules
    _fn = function () { 
        return _.each(_.any.apply(null, arguments), _.not(g.ctoken2("timeContext")));
    };
    
    g.day = _fn(g.d, g.dd); 
    g.month = _fn(g.M, g.MMM); 
    g.year = _fn(g.yyyy, g.yy);

    // relative date / time expressions
    g.orientation = _.process(g.ctoken("past future"), 
        function (s) { 
            return function () { 
                this.orient = s; 
            }; 
        }
    );
    g.operator = _.process(g.ctoken("add subtract"), 
        function (s) { 
            return function () { 
                this.operator = s; 
            }; 
        }
    );  
    g.rday = _.process(g.ctoken("yesterday tomorrow today now"), t.rday);
    g.unit = _.process(g.ctoken("minute hour day week month year"), 
        function (s) { 
            return function () { 
                this.unit = s; 
            }; 
        }
    );
    g.value = _.process(_.rtoken(/^\d\d?(st|nd|rd|th)?/), 
        function (s) { 
            return function () { 
                this.value = s.replace(/\D/g, ""); 
            }; 
        }
    );
    g.expression = _.set([ g.rday, g.operator, g.value, g.unit, g.orientation, g.ddd, g.MMM ]);

    // pre-loaded rules for different date part order preferences
    _fn = function () { 
        return  _.set(arguments, g.datePartDelimiter); 
    };
    g.mdy = _fn(g.ddd, g.month, g.day, g.year);
    g.ymd = _fn(g.ddd, g.year, g.month, g.day);
    g.dmy = _fn(g.ddd, g.day, g.month, g.year);
    g.date = function (s) { 
        return ((g[Date.CultureInfo.dateElementOrder] || g.mdy).call(this, s));
    }; 

    // parsing date format specifiers - ex: "h:m:s tt" 
    // this little guy will generate a custom parser based
    // on the format string, ex: g.format("h:m:s tt")
    g.format = _.process(_.many(
        _.any(
        // translate format specifiers into grammar rules
        _.process(
        _.rtoken(/^(dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|zz?z?)/), 
        function (fmt) { 
        if (g[fmt]) { 
            return g[fmt]; 
        } else { 
            throw Date.Parsing.Exception(fmt); 
        }
    }
    ),
    // translate separator tokens into token rules
    _.process(
    _.rtoken(/^[^dMyhHmstz]+/), // all legal separators 
        function (s) { 
            return _.ignore(_.stoken(s)); 
        } 
    )
    )), 
        // construct the parser ...
        function (rules) { 
            return _.process(_.each.apply(null, rules), t.finishExact); 
        }
    );
    
    var _F = {
		//"M/d/yyyy": function (s) { 
		//	var m = s.match(/^([0-2]\d|3[0-1]|\d)\/(1[0-2]|0\d|\d)\/(\d\d\d\d)/);
		//	if (m!=null) { 
		//		var r =  [ t.month.call(this,m[1]), t.day.call(this,m[2]), t.year.call(this,m[3]) ];
		//		r = t.finishExact.call(this,r);
		//		return [ r, "" ];
		//	} else {
		//		throw new Date.Parsing.Exception(s);
		//	}
		//}
		//"M/d/yyyy": function (s) { return [ new Date(Date._parse(s)), ""]; }
	}; 
    var _get = function (f) { 
        return _F[f] = (_F[f] || g.format(f)[0]);      
    };
  
    g.formats = function (fx) {
        if (fx instanceof Array) {
            var rx = []; 
            for (var i = 0 ; i < fx.length ; i++) {
                rx.push(_get(fx[i])); 
            }
            return _.any.apply(null, rx);
        } else { 
            return _get(fx); 
        }
    };

	// check for these formats first
    g._formats = g.formats([
        "yyyy-MM-ddTHH:mm:ss",
        "ddd, MMM dd, yyyy H:mm:ss tt",
        "ddd MMM d yyyy HH:mm:ss zzz",
        "d"
    ]);

	// starting rule for general purpose grammar
    g._start = _.process(_.set([ g.date, g.time, g.expression ], 
        g.generalDelimiter, g.whiteSpace), t.finish);
	
	// real starting rule: tries selected formats first, 
	// then general purpose rule
    g.start = function (s) {
        try { 
            var r = g._formats.call({}, s); 
            if (r[1].length === 0) {
                return r; 
            }
        } catch (e) {}
        return g._start.call({}, s);
    };
		
}());


Date._parse = Date.parse;

/**
 * Converts the specified string value into its JavaScript Date equivalent using CultureInfo specific format information.
 * 
 * Example
<pre><code>
///////////
// Dates //
///////////

// 15-Oct-2004
var d1 = Date.parse("10/15/2004");

// 15-Oct-2004
var d1 = Date.parse("15-Oct-2004");

// 15-Oct-2004
var d1 = Date.parse("2004.10.15");

//Fri Oct 15, 2004
var d1 = Date.parse("Fri Oct 15, 2004");

///////////
// Times //
///////////

// Today at 10 PM.
var d1 = Date.parse("10 PM");

// Today at 10:30 PM.
var d1 = Date.parse("10:30 P.M.");

// Today at 6 AM.
var d1 = Date.parse("06am");

/////////////////////
// Dates and Times //
/////////////////////

// 8-July-2004 @ 10:30 PM
var d1 = Date.parse("July 8th, 2004, 10:30 PM");

// 1-July-2004 @ 10:30 PM
var d1 = Date.parse("2004-07-01T22:30:00");

////////////////////
// Relative Dates //
////////////////////

// Returns today's date. The string "today" is culture specific.
var d1 = Date.parse("today");

// Returns yesterday's date. The string "yesterday" is culture specific.
var d1 = Date.parse("yesterday");

// Returns the date of the next thursday.
var d1 = Date.parse("Next thursday");

// Returns the date of the most previous monday.
var d1 = Date.parse("last monday");

// Returns today's day + one year.
var d1 = Date.parse("next year");

///////////////
// Date Math //
///////////////

// Today + 2 days
var d1 = Date.parse("t+2");

// Today + 2 days
var d1 = Date.parse("today + 2 days");

// Today + 3 months
var d1 = Date.parse("t+3m");

// Today - 1 year
var d1 = Date.parse("today - 1 year");

// Today - 1 year
var d1 = Date.parse("t-1y"); 


/////////////////////////////
// Partial Dates and Times //
/////////////////////////////

// July 15th of this year.
var d1 = Date.parse("July 15");

// 15th day of current day and year.
var d1 = Date.parse("15");

// July 1st of current year at 10pm.
var d1 = Date.parse("7/1 10pm");
</code></pre>
 *
 * @param {String}   The string value to convert into a Date object [Required]
 * @return {Date}    A Date object or null if the string cannot be converted into a Date.
 */
Date.parse = function (s) {
    var r = null; 
    if (!s) { 
        return null; 
    }

   // try { 
        r = Date.Grammar.start.call({}, s); 
   // } catch (e) { 
     //   return null; 
   // }
    return ((r[1].length === 0) ? r[0] : null);
};

Date.getParseFunction = function (fx) {
    var fn = Date.Grammar.formats(fx);
    return function (s) {
        var r = null;
        try { 
            r = fn.call({}, s); 
        } catch (e) { 
            return null; 
        }
        return ((r[1].length === 0) ? r[0] : null);
    };
};
/**
 * Converts the specified string value into its JavaScript Date equivalent using the specified format {String} or formats {Array} and the CultureInfo specific format information.
 * The format of the string value must match one of the supplied formats exactly.
 * 
 * Example
<pre><code>
// 15-Oct-2004
var d1 = Date.parseExact("10/15/2004", "M/d/yyyy");

// 15-Oct-2004
var d1 = Date.parse("15-Oct-2004", "M-ddd-yyyy");

// 15-Oct-2004
var d1 = Date.parse("2004.10.15", "yyyy.MM.dd");

// Multiple formats
var d1 = Date.parseExact("10/15/2004", [ "M/d/yyyy" , "MMMM d, yyyy" ]);
</code></pre>
 *
 * @param {String}   The string value to convert into a Date object [Required].
 * @param {Object}   The expected format {String} or an array of expected formats {Array} of the date string [Required].
 * @return {Date}    A Date object or null if the string cannot be converted into a Date.
 */
Date.parseExact = function (s, fx) { 
    return Date.getParseFunction(fx)(s); 
};


/**
 * Version: 1.0 Alpha-1 
 * Build Date: 12-Nov-2007
 * Copyright (c) 2006-2007, Coolite Inc. (http://www.coolite.com/). All rights reserved.
 * License: Licensed under The MIT License. See license.txt and http://www.datejs.com/license/. 
 * Website: http://www.datejs.com/ or http://www.coolite.com/datejs/
 */
 
/* 
 * TimeSpan(days, hours, minutes, seconds, milliseconds);
 * TimeSpan(milliseconds);
 */
TimeSpan = function (days, hours, minutes, seconds, milliseconds) {
    this.days = 0;
    this.hours = 0;
    this.minutes = 0;
    this.seconds = 0;
    this.milliseconds = 0;
    
    if (arguments.length == 5) { 
        this.days = days; 
        this.hours = hours; 
        this.minutes = minutes; 
        this.seconds = seconds; 
        this.milliseconds = milliseconds; 
    } 
    else if (arguments.length == 1 && typeof days == "number") {
        var orient = (days < 0) ? -1 : +1;
        this.milliseconds = Math.abs(days);
        
        this.days = Math.floor(this.milliseconds / (24 * 60 * 60 * 1000)) * orient;
        this.milliseconds = this.milliseconds % (24 * 60 * 60 * 1000);

        this.hours = Math.floor(this.milliseconds / (60 * 60 * 1000)) * orient;
        this.milliseconds = this.milliseconds % (60 * 60 * 1000);

        this.minutes = Math.floor(this.milliseconds / (60 * 1000)) * orient;
        this.milliseconds = this.milliseconds % (60 * 1000);

        this.seconds = Math.floor(this.milliseconds / 1000) * orient;
        this.milliseconds = this.milliseconds % 1000;

        this.milliseconds = this.milliseconds * orient;
        return this;
    } 
    else {
        return null;
    }
};

TimeSpan.prototype.compare = function (timeSpan) {
    var t1 = new Date(1970, 1, 1, this.hours(), this.minutes(), this.seconds()), t2;
    if (timeSpan === null) { 
        t2 = new Date(1970, 1, 1, 0, 0, 0); 
    }
    else { 
        t2 = new Date(1970, 1, 1, timeSpan.hours(), timeSpan.minutes(), timeSpan.seconds()); /* t2 = t2.addDays(timeSpan.days()); */ 
    }
    return (t1 > t2) ? 1 : (t1 < t2) ? -1 : 0;
};

TimeSpan.prototype.add = function (timeSpan) { 
    return (timeSpan === null) ? this : this.addSeconds(timeSpan.getTotalMilliseconds() / 1000); 
};

TimeSpan.prototype.subtract = function (timeSpan) { 
    return (timeSpan === null) ? this : this.addSeconds(-timeSpan.getTotalMilliseconds() / 1000); 
};

TimeSpan.prototype.addDays = function (n) { 
    return new TimeSpan(this.getTotalMilliseconds() + (n * 24 * 60 * 60 * 1000)); 
};

TimeSpan.prototype.addHours = function (n) { 
    return new TimeSpan(this.getTotalMilliseconds() + (n * 60 * 60 * 1000)); 
};

TimeSpan.prototype.addMinutes = function (n) { 
    return new TimeSpan(this.getTotalMilliseconds() + (n * 60 * 1000)); 
};

TimeSpan.prototype.addSeconds = function (n) {
    return new TimeSpan(this.getTotalMilliseconds() + (n * 1000)); 
};

TimeSpan.prototype.addMilliseconds = function (n) {
    return new TimeSpan(this.getTotalMilliseconds() + n); 
};

TimeSpan.prototype.getTotalMilliseconds = function () {
    return (this.days() * (24 * 60 * 60 * 1000)) + (this.hours() * (60 * 60 * 1000)) + (this.minutes() * (60 * 1000)) + (this.seconds() * (1000)); 
};

TimeSpan.prototype.get12HourHour = function () {
    return ((h = this.hours() % 12) ? h : 12); 
};

TimeSpan.prototype.getDesignator = function () { 
    return (this.hours() < 12) ? Date.CultureInfo.amDesignator : Date.CultureInfo.pmDesignator;
};

TimeSpan.prototype.toString = function (format) {
    function _toString() {
        if (this.days() !== null && this.days() > 0) {
            return this.days() + "." + this.hours() + ":" + p(this.minutes()) + ":" + p(this.seconds());
        }
        else { 
            return this.hours() + ":" + p(this.minutes()) + ":" + p(this.seconds());
        }
    }
    function p(s) {
        return (s.toString().length < 2) ? "0" + s : s;
    } 
    var self = this;
    return format ? format.replace(/d|dd|HH|H|hh|h|mm|m|ss|s|tt|t/g, 
    function (format) {
        switch (format) {
        case "d":	
            return self.days();
        case "dd":	
            return p(self.days());
        case "H":	
            return self.hours();
        case "HH":	
            return p(self.hours());
        case "h":	
            return self.get12HourHour();
        case "hh":	
            return p(self.get12HourHour());
        case "m":	
            return self.minutes();
        case "mm":	
            return p(self.minutes());
        case "s":	
            return self.seconds();
        case "ss":	
            return p(self.seconds());
        case "t":	
            return ((this.hours() < 12) ? Date.CultureInfo.amDesignator : Date.CultureInfo.pmDesignator).substring(0, 1);
        case "tt":	
            return (this.hours() < 12) ? Date.CultureInfo.amDesignator : Date.CultureInfo.pmDesignator;
        }
    }
    ) : this._toString();
};

/* 
 * TimePeriod(startDate, endDate);
 */
var TimePeriod = function (years, months, days, hours, minutes, seconds, milliseconds) {
    this.years = 0;
    this.months = 0;
    this.days = 0;
    this.hours = 0;
    this.minutes = 0;
    this.seconds = 0;
    this.milliseconds = 0;
    
    // startDate and endDate as arguments
    if (arguments.length == 2 && arguments[0] instanceof Date && arguments[1] instanceof Date) {
    
        var date1 = years.clone();
        var date2 = months.clone();
    
        var temp = date1.clone();
        var orient = (date1 > date2) ? -1 : +1;
        
        this.years = date2.getFullYear() - date1.getFullYear();
        temp.addYears(this.years);
        
        if (orient == +1) {
            if (temp > date2) {
                if (this.years !== 0) {
                    this.years--;
                }
            }
        } else {
            if (temp < date2) {
                if (this.years !== 0) {
                    this.years++;
                }
            }
        }
        
        date1.addYears(this.years);

        if (orient == +1) {
            while (date1 < date2 && date1.clone().addDays(date1.getDaysInMonth()) < date2) {
                date1.addMonths(1);
                this.months++;
            }
        }
        else {
            while (date1 > date2 && date1.clone().addDays(-date1.getDaysInMonth()) > date2) {
                date1.addMonths(-1);
                this.months--;
            }
        }
        
        var diff = date2 - date1;

        if (diff !== 0) {
            var ts = new TimeSpan(diff);
            
            this.days = ts.days;
            this.hours = ts.hours;
            this.minutes = ts.minutes;
            this.seconds = ts.seconds;
            this.milliseconds = ts.milliseconds;
        }

        // UTC Hacks required...
        return this;
    }
};


uni.addKit("date", {
    parse:  function(d) {    
        return Date.parse(d);
    }
});

})()