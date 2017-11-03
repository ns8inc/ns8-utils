/// <reference path="epoch.ts" />
/// <reference path="ip.ts" />
export let ip = require('./ip');
export let epoch = require('./epoch');
export let config = require('./config');
import crypto = require('crypto');
import cloneLib = require('clone');
import http = require('http');
import https = require('https');

/*
 Common utility functions
 */

let iconv = require("iconv-lite");

/**
 * Escape all characters not included in SingleStringCharacters
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.4
 *
 * This is used to format strings with special characters into parsable JSON.
 * @param {string} str
 * @returns {string}
 * @constructor
 */
export function JSONEscape(str: string): string {
    return ('' + str).replace(/["\\\n\r\t\b\f\u2028\u2029]/g, function (character) {
        // Escape all characters not included in SingleStringCharacters and
        // Escape all characters not included in SingleStringCharacters and
        // http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.4
        switch (character) {
            case '"':
            case '\\':
                return '\\' + character;
            // characters need to be escaped:
            case '\n':
                return '\\n';
            case '\t':
                return '\\t';
            case '\b':
                return '\\b';
            case '\f':
                return '\\f';
            case '\r':
                return '\\r';
            case '\u2028':
                return '\\u2028';
            case '\u2029':
                return '\\u2029'
        }
    })
}

/**
 * Parse string into JSON, but trap errors if the JSON is not valid.  A common cause of parse
 * failures are special characters in values.  Use JSONEscape to handle them.
 * @param {string} str
 * @returns {Object}    The JSON object, or null if the string is not valid JSON.
 * @constructor
 */
export function JSONSafeParse(str: string): Object {
    try {
        return JSON.parse(str);
    } catch(err) {
        return null;
    }
}

/**
 * Create a string of random base64 characters.
 * @param numBytes         The length of the string to create.
 * @returns {string}
 */
export function superRandom(numBytes: number = 20) {
    return crypto.randomBytes(numBytes).toString('base64');
}

/**
 * Return whether an object is an array or not.
 * @param obj
 * @returns {boolean}
 */
export function isArray(obj): boolean {
    return Object.prototype.toString.call(obj) === '[object Array]';
}

/**
 * Add a prefix to all the attributes on an object.  This is used when manipulating nested objects.
 * @param obj
 * @param prefix
 * @returns {Object}
 */
export function prefixAttributes(obj: Object, prefix: string): Object {

    for (let attrib in obj) {

        if (obj.hasOwnProperty(attrib)) {

            //  skip over arrays and $ operators
            if (!isArray(obj) && attrib.substr(0, 1) != '$') {
                obj[prefix + '.' + attrib] = obj[attrib];
                delete obj[attrib];
            } else {

                if (typeof obj[attrib] == 'object') {
                    obj[attrib] = prefixAttributes(obj[attrib], prefix);
                }
            }
        }
    }

    return obj;
}

/**
 * Return whether the parameter is a number or not.  The parameter can be a string containing a number.
 * @param n
 * @returns {boolean}
 */
export function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * Convert string currencies to their numeric equivalent.
 * @param n
 * @returns {number}
 */
export function currencyToNumber(n): number {

    if (typeof n == 'string') {
        n = n.replace('$', '');
        n = n.replace('€', '');
        n = n.replace('£', '');
        n = n.replace('¥', '');
    }

    if (isNumeric(n))
        return +n;
    else
        return null;
}

/**
 * Convert an integer to a 4 byte array.
 * @param num
 * @returns {Uint8Array}
 */
export function toBytes(num: number) {
    let data = new Uint8Array(4);

    for (let i = 0; i < 4; i++) {
        data[i] = (num >> (i * 8)) & 0xff;
    }

    return data;
}

/**
 * Create a UUID.
 * @param len           The length of the id.
 * @param radix
 * @returns {string}
 */
export function uuid(len?: number, radix?: number) {
    let CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

    let chars = CHARS, uuid = [], i;

    radix = radix || chars.length;

    if (len) {
        // Compact form
        for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
    } else {
        // rfc4122, version 4 form
        let r;

        // rfc4122 requires these characters
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';

        // Fill in random data.  At i==19 set the high bits of clock sequence as
        // per rfc4122, sec. 4.1.5
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random() * 16;
                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
            }
        }
    }
    return uuid.join('');
}

/**
 * This base62 is only safe for decoding to integers.
 * @param a
 * @returns {number}
 */
export function base62decode(a: string): number {

    let b, c, d;

    for (
        b = c = ( // 'false - 1' will return '-1' and 'true - 1' will return '0'
            a === (/\W|_|^$/.test(a += "") || a) // tests if 'a' is a properly base62-encoded string and coerces it to one
                ? 1 : 0) - 1; // so, 'b' and 'c' are initialized with either '-1' or '0'
 
        d = a.charCodeAt(c++); // if 'c' equals '-1', 'd' is 'NaN' which breaks the loop execution
        )

        b = b * 62 + d - [, 48, 29, 87][d >> 5]; // See comments : https://gist.github.com/1170594#gistcomment-48129
 
    return b; // positive base10 integer or '-1' if 'a' is not a base62 encoded string
}

/**
 * This base62 is only safe for encoding integers
 * @param a
 * @returns {string}
 */
export function base62encode(a): string {

    let b, c;

    for (
        a = a !== +a || a % 1 ? -1 : a, b = ""; // if not a base10 integer, 'a' will be '-1'
        // for example, '.5 % 1 == .5' but '1 % 1 == 0'
        a >= 0; // also prevents the user to use negative base10 integers
        a = Math.floor(a / 62) || -1 // using a bitwise hack here will fail with great numbers
        )
 
        // a%62 -> 0-61
        // 0-9   | 36-61 | 10-35
        // 48-57 | 65-90 | 97-121
        // 0-9   | A-Z   | a-z
 
        b = String.fromCharCode(((c = a % 62) > 9 ? c > 35 ? 29 : 87 : 48) + c) + b;

    return b; // will return either an empty or a base62-encoded string
}

/**
 * Return whether a character set is UTF8.
 * @param charset
 * @returns {boolean}
 */
export function isUTF8(charset) {
    if (!charset) {
        return true;
    }
    charset = charset.toLowerCase();
    return charset === 'utf8' || charset === 'utf-8';
}

/**
 * Pad a string on the left.
 * @param value         The value to pad.
 * @param padChar       The character to pad.
 * @param padCount      The number of characters to add.
 * @returns {string}
 */
export function padLeft(value: any, padChar: string, padCount: number) {
    let str = "" + value;
    let padBuff = Array(padCount + 1);
    let pad = padBuff.join(padChar);
    return pad.substring(0, pad.length - str.length) + str
}

/**
 * Decode a URL.
 * @param str
 * @param charset
 * @returns {string}
 */
export function urlDecode(str, charset): string {
    if (isUTF8(charset)) {

        try {
            return decodeURIComponent(str);
        } catch (err) {
            return str;
        }
    }

    let bytes = [];
    for (let i = 0; i < str.length;) {
        if (str[i] === '%') {
            i++;
            bytes.push(parseInt(str.substring(i, i + 2), 16));
            i += 2;
        } else {
            bytes.push(str.charCodeAt(i));
            i++;
        }
    }
    let buf = new Buffer(bytes);
    return iconv.decode(buf, charset);
}

/**
 * Deep clone an object into a new object.  Functions will be carried over.
 * @param o
 * @returns {Object}
 */
export function clone(o: Object): Object {

    if (!o || typeof (o) != 'object')
        return o;

    return cloneLib(o);
}

/**
 * Concatenate two objects into the first object
 * @param o1
 * @param o2
 * @returns {Object}
 */
export function extend(o1: Object, o2: Object): Object {

    if (o1 == null || o2 == null)
        return o1;

    for (let key in o2)
        if (o2.hasOwnProperty(key))
            o1[key] = o2[key];

}

/**
 * Copies the specified property from the second object into the first object if it exists.
 * Returns true if the property was found and copied.
 * @param property
 * @param o1
 * @param o2
 * @param allowNull
 * @param allowEmpty
 * @returns {boolean}
 */
export function copyProperty(
    /*
     * The property you are copying
     */
    property: string,
    /*
     * The object you are copying to
     */
    o1: Object,
    /*
     * The object you are copying from
     */
    o2: Object,
    /*
     * Allow the copying of null values
     */
    allowNull: boolean = false,
    /*
     * Allow the copying of empty values
     */
    allowEmpty: boolean = false): boolean {

    if (o1 == null || o2 == null)
        throw new Error('both objects must have a value');

    if (property == null)
        throw new Error('you must specify a property value');

    /// I felt this was far more readable than the alternative method started with
    let copy = false;

    if (o2.hasOwnProperty(property)) {
        if (allowNull && o2[property] == null) {
            copy = true;
        }
        else if (o2[property] instanceof Date) {
            copy = true;
        }
        else if (o2[property] != null) {
            if (allowEmpty || typeof o2[property] !== 'object') {
                copy = true;
            }
            else if (!empty(o2[property])) {
                copy = true;
            }
        }
    }

    if (copy)
        o1[property] = o2[property];

    return copy;
}

/**
 * Return whether the parameter is a function or not.
 * @param functionToCheck
 * @returns {boolean}
 */
export function isFunction(functionToCheck) {
    let getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

/**
 * Replace all instances within a string.  This is needed since javascript's replace function only replaces the first instance.
 * @param original
 * @param search
 * @param replacement
 * @returns {string}
 */
export function replaceAll(original: string, search: string, replacement: string) {
    return original.split(search).join(replacement);
}

/**
 * Format an object to html with indentation and spaces
 * @param obj
 * @returns {string}
 */
export function htmlify(obj): string {
    return '<pre>' + JSON.stringify(obj, null, 4) + '</pre>';
}

/**
 * Return whether an object is empty or not.
 * @param obj
 * @returns {boolean}
 */
export function empty(obj: Object): boolean {
    return Object.keys(obj).length == 0;
}

/**
 * Trim a specific string off the start of a string.
 * @param value
 * @param start
 * @returns {string}
 */
export function trimStart(value: string, start: string) {
    if (value.length == 0) return value;

    start = start ? start : ' ';
    let i = 0, val = 0;

    for (; value.charAt(i) == start && i < value.length; i++);

    return value.substring(i);
}

/**
 * Get the value from a cookie from the raw header string.
 * @param headerVal
 * @param key
 * @returns {null}
 */
export function parseCookieValueFromString(headerVal: string, key: string) {
    let result;
    return (result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(headerVal)) ? (result[1]) : null;
}

/**
 * Trim a specific string off the end of a string.
 * @param val
 * @param end
 * @returns {string}
 */
export function trimEnd(val: string, end: string): string {

    if (val.slice(-end.length) === end)
        return val.substr(0, val.length - end.length);
    else
        return val;
}

/**
 * Repeat a string N times.
 * @param val
 * @param n
 * @returns {string}
 */
export function repeat(val: string, n: number): string {
    n = n || 1;
    return Array(n + 1).join(val);
}

/**
 * Repeat html spaces N times.
 * @param n
 * @returns {string}
 */
export function spaces(n: number): string {
    return this.repeat('&nbsp;', n);
}

/**
 * Merge two object - overwrite existing elements, if specified.
 * @param o1
 * @param o2
 * @param overwrite
 * @returns {Object}
 */
export function merge(o1: any, o2: any, overwrite: boolean): Object {

    if (!o1)
        return o2;

    let o: Object = clone(o1);

    for (let key in o2) {

        if (o2.hasOwnProperty(key)) {

            if (o[key] == undefined) {
                o[key] = o2[key];
            } else {

                if (typeof o2[key] == 'object') {
                    o[key] = merge(o[key], o2[key], overwrite);
                } else {
                    if (overwrite) {
                        o[key] = o2[key];
                    }
                }
            }
        }
    }

    return o;
}

/**
 * DEPRECATED - use validator modules.  This does a simple check whether an email is valid.
 * @param email
 * @returns {string|boolean}
 */
export function validEmail(email: string) {
    return email && email.indexOf('@') > -1 && email.indexOf('.') > -1;
}

/**
 * Collect missing arguments on a REST request.
 * @param params
 * @param requiredParams
 * @returns {Array}
 */
export function missingParams(params: Object, requiredParams: Array<string>): Array<string> {
    let missing = [];

    for (let a = 0; a < requiredParams.length; a++) {

        if (!params || !params.hasOwnProperty(requiredParams[a])) {
            missing.push(requiredParams[a]);
        }
    }

    return missing;
}

/**
 *  Generates a GUID string.
 *  Example af8a8416-6e18-a307-bd9c-f2c947bbb3aa.
 * @returns {string}
 */
export function guid() {
    function _p8(s?) {
        let p = (Math.random().toString(16) + "000000000").substr(2, 8);
        return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
    }
    return _p8() + _p8(true) + _p8(true) + _p8();
}

/**
 * Return a 32-bit integer hash from a string.  This uses a variation of the murmur3 hash algorithm.  The collision
 * rate is very small.
 * @param input         The string to hash.
 * @returns {number}
 */
export function hash(input: string): number {

    let hash = 0, len: number;

    for (let i = 0, len = input.length; i < len; i++) {
        hash = ((hash << 5) - hash) + input.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}

/**
 * Set headers to prevent caching on a response.
 * @param res   The express or restify response object.
 */
export function noCache(res: any) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
}

/**
 * Strip the protocol off a URL (https://, ftp://, etc.).
 * @param url
 * @returns {string}
 */
export function stripProtocol(url: string): string {
    let ret = url;

    if (url.indexOf('://') > -1)
        ret = ret.substr(url.indexOf('://') + 3);

    return ret;
}

/**
 * Parses mixed type values into booleans. This is the same function as filter_var in PHP using boolean validation.
 * @param value
 * @param nullOnFailure
 * @returns {boolean}
 */
export function parseBoolean(value, nullOnFailure = false): boolean {

    switch(value){
        case true:
        case 'true':
        case 1:
        case '1':
        case 'on':
        case 'yes':
            value = true;
            break;
        case false:
        case 'false':
        case 0:
        case '0':
        case 'off':
        case 'no':
            value = false;
            break;
        default:
            if(nullOnFailure){
                value = null;
            }else{
                value = false;
            }
            break;
    }
    return value;
}

/**
 * Rename an attribute.
 * @param obj
 * @param name
 * @param replacement
 * @returns {Object}
 */
export function renameAttribute(obj: Object, name: string, replacement: string): Object {

    for (let attrib in obj) {

        if (obj.hasOwnProperty(attrib) && attrib == name) {

            //  skip over arrays and $ operators
            if (!isArray(obj) && attrib.substr(0, 1) != '$') {
                obj[replacement] = obj[attrib];
                delete obj[attrib];
            }

        } else {

            if (typeof obj[attrib] == 'object') {
                obj[attrib] = renameAttribute(obj[attrib], name, replacement);
            }
        }
    }

    return obj;
}

/**
 * Get the contents of a URL.
 * @param url
 * @param callback
 */
export function getUrlText(url, callback) {
    let lib: any = http;

    if (url.indexOf('https:') == 0)
        lib = https;

    lib.get(url, function(res) {

        // explicitly treat incoming data as utf8 (avoids issues with multi-byte chars)
        res.setEncoding('utf8');

        // incrementally capture the incoming response body
        let body = '';

        res.on('data', function(d) {
            body += d;
        });

        // do whatever we want with the response once it's done
        res.on('end', function() {
            callback(null, body);
        });
    }).on('error', function(err) {
        callback(err);
    });
}

/**
 * Append a query string parameter onto an URL considering whether it should be prefixed with & or ?.  The
 * value will be encoded.
 * @param {string} url
 * @param {string} name
 * @param {string} value
 * @returns {string}
 */
export function appendQueryString(url: string, name: string, value: string): string {
    let result = url;

    if (result.indexOf('?') > 0) {
        result += '&';
    } else {
        result += '?';
    }

    return result += name + '=' + encodeURIComponent(value);
}