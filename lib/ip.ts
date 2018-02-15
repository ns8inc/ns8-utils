import utils = require('./index');

/*
 Common IP functions
 */

/**
 * Return whether the current request is from the local server.
 * @param req
 * @returns {boolean}
 */
export function localHost(req): boolean {
    return req.connection.remoteAddress.substring(0, 8) == "127.0.0." || req.connection.remoteAddress == "::1";
}

/**
 * Whether an IP address is IPV6.
 * @param address
 * @returns {boolean}
 */
export function isIPV6(address: string): boolean {

    if (!address) { return false; }

    return typeof address == 'object' || address.indexOf(':') > -1;
}

/**
 * Return the I.P. address of the request (checking for proxy server forwarding).
 * @param req
 * @returns {string}
 */
export function remoteAddress(req): string {

    //   The X-Forwarded-For header is used to identify the originating IP address when a hit is passed via a proxy server.
    //   This is easily faked and cannot be considered authoritative except for trusted proxies, like the Opera Mini proxy.  In addition, this
    //   header often contains intranet IP addresses, like 10.1.1.1.  Therefore, only use it in special cases.
    if (req.headers['x-forwarded-for']) {

        let xf: string = req.headers['x-forwarded-for'].trim();
        let xfs: Array<string> = null;

        //  see if multiple addresses are in the XFF header
        if (xf.indexOf(",") > -1) {
            xfs = xf.split(',');
        } else {
            if (xf.indexOf(" ") > -1) {
                xfs = xf.split(' ');
            }
        }

        if (xfs != null) {

            //  get first public address, since multiple private routings can occur and be added to forwarded list
            for (let i = 0; i < xfs.length; i++) {

                let ipTrim: string = xfs[i].trim();

                //  ipv4 addresses sometimes are in ipv6 format:  ::ffff:1.2.3.4 - strip off the ipv6 part
                if (ipTrim.substr(0, 7) == '::ffff:' && ipTrim.split('.').length == 4)
                    ipTrim = ipTrim.substr(7);

                //  strange values are sometimes placed in the ip list, like hatbld.det.  Filter these out.
                if (ipTrim.split('.').length != 2) {     //  they always have a single . - ignore ips with a single period

                    if (ipTrim != "" && ipTrim.substring(0, 3) != "10." && ipTrim.substring(0, 7) != "172.16."&& ipTrim.substring(0, 7) != "172.31."&& ipTrim.substring(0, 8) != "127.0.0." && ipTrim.substring(0, 8) != "192.168." && ipTrim != "unknown" && ipTrim != "::1") {
                        return ipTrim;
                    }
                }
            }

            xf = xfs[0].trim();
        }

        //  ipv4 addresses sometimes are in ipv6 format:  ::ffff:1.2.3.4 - strip off the ipv6 part
        if (xf.substr(0, 7) == '::ffff:' && xf.split('.').length == 4)
            xf = xf.substr(7);

        //  a tiny % of hits have an unknown ip address
        if (xf.substring(0, 7) == "unknown") {
            return "127.0.0.1";
        }

        return xf;
    } else {

        let xf: string = req.connection.remoteAddress;

        //  a tiny % of hits have an unknown ip address, so return a default address
        if (xf.substring(0, 7) == "unknown") {
            return "127.0.0.1";
        }

        return xf;
    }
}

/**
 * Return whether the network address is a loopback address, like 127.0.0.1.
 * @param addr
 * @returns {boolean}
 */
export function isLoopback(addr) {
    return /^127\.0\.0\.1/.test(addr)
        || /^fe80::1/.test(addr)
        || /^::1/.test(addr);
}

/**
 * Return a 32-bit integer hash from an IPv6 address.  This uses a variation of the murmur3 hash algorithm.  The collision
 * rate is small, roughly one in 100,000,000.
 * @param ip
 * @returns {number}
 */
export function hashIPV6(ip: string): number {
    let hash = 0, len: number;

    for (let i = 0, len = ip.length; i < len; i++) {
        hash  = ((hash << 5) - hash) + ip.charCodeAt(i);
        hash |= 0; // Convert to 32-bit integer
    }
    return hash;
}

/**
 * Convert an IP address to a shardable number.
 * @param address
 * @returns {number}
 */
export function hash(address: string): number {

    if (isIPV6(address)) {

        //  hash an IPv6 address to 4 bytes - this is because IPv6 addresses are too big for effective indexing
        //  and it is acceptably close to uniqueness with the hash
        return hashIPV6(address);

    } else {

        let _ip = address.split('.');

        //  reverse the order of bytes of the IP address for better shard distribution
        return Number(_ip[0]) * 16777216 +
            Number(_ip[1]) * 65536 +
            Number(_ip[2]) * 256 +
            Number(_ip[3]);
    }
}

/**
 * Convert an IP address to a number.
 * @param address
 * @param reverse
 * @returns {number}
 */
export function toNumber(address: string, reverse: boolean = false): number {

    if (isIPV6(address)) {

        //  hash an IPv6 address to 4 bytes - this is because IPv6 addresses are too big for effective indexing
        //  and it is acceptably close to uniqueness with the hash
        return toNumberIPV6(address);

    } else {

        let _ip = address.split('.');

        //  create a number from the octets
        if (reverse)
            return Number(_ip[3]) * 16777216 +
                Number(_ip[2]) * 65536 +
                Number(_ip[1]) * 256 +
                Number(_ip[0]);
        else
            return Number(_ip[0]) * 16777216 +
                Number(_ip[1]) * 65536 +
                Number(_ip[2]) * 256 +
                Number(_ip[3]);

    }
}

/**
 * Format an IP address to a storable format.
 *
 * If IPv4: the ip address converted to a 32-bit integer
 * If IPv6: the ip address converted to a 16 byte binary
 * @param address
 */
export function compress(address: string): any {

    if (!isIPV6(address)) {
        return toNumber32(address);
    } else {

        let parts = address.split(':');
        let bytes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let i;

        for (i = 0; i < parts.length; i++) {

            //  When the :: is hit, start filling from the end of the array
            if (parts[i] == '') {
                break;
            } else {
                parts[i] = ('000' + parts[i]).slice(-4);        //  deal with missing leading zeroes
                bytes[i * 2] = parseInt(parts[i].substr(0, 2), 16);
                bytes[i * 2 + 1] = parseInt(parts[i].substr(2, 2), 16);
            }
        }

        let index = 15;

        for (let j = parts.length - 1; j > i; j--) {
            parts[j] = ('000' + parts[j]).slice(-4);        //  deal with missing leading zeroes
            bytes[index - 1] = parseInt(parts[j].substr(0, 2), 16);
            bytes[index] = parseInt(parts[j].substr(2, 2), 16);
            index -= 2;
        }
        return bytes;
    }
}

/**
 * Format an IP address to a storable format.
 *
 * If IPv4: the ip address converted to a 32-bit integer
 * If IPv6: the ip address converted to a 16 byte binary
 * @param address
 * @returns {string}
 */
export function decompress(address: any): any {

    if (typeof address == 'number') {
        let addr = utils.toBytes(address);

        return addr[3] + '.' +
            addr[2] + '.' +
            addr[1] + '.' +
            addr[0];
    } else {

        let ret: string = '';

        for (let i = 0; i < address.length; i += 2) {
            let byte = '0' + address[i].toString(16);
            ret += byte.length == 2 ? byte : byte.substr(1, 2);

            byte = '0' + address[i + 1].toString(16);
            ret += byte.length == 2 ? byte : byte.substr(1, 2);

            if (i != address.length - 2)
                ret += ':';
        }

        return ret;
    }
}

/**
 * Convert an IP address to a 32-bit number.
 * @param address
 * @returns {number}
 */
export function toNumber32(address: string): number {

    if (isIPV6(address)) {

        //  hash an IPv6 address to 4 bytes - this is because IPv6 addresses are too big for effective indexing
        //  and it is acceptably close to uniqueness with the hash
        return toNumberIPV6(address);

    } else {

        let _ip = address.split('.');

        //  create a number from the octets
        let num: number = Number(_ip[0]) * 16777216 +
            Number(_ip[1]) * 65536 +
            Number(_ip[2]) * 256 +
            Number(_ip[3]);

        if (num >= 2147483648)
            num -= 4294967296;

        return num;
    }
}

/**
 * Convert an IP number (as created by the toNumber function) to an IP address.
 * @param ipNumber
 * @returns {string}
 */
export function fromNumber(ipNumber: number): string {

    let addr = utils.toBytes(ipNumber);

    return addr[3] + '.' +
        addr[2] + '.' +
        addr[1] + '.' +
        addr[0];
}

/**
 * Convert an IP address to a number.
 * @param address
 * @returns {number}
 */
export function toNumberIPV6(address: string): number {
    return hashIPV6(address);
}

/**
 * Return whether an I.P. address is in a private range.
 * @param address
 * @returns {boolean}
 */
export function isPrivate(address): boolean {
    return /^(::f{4}:)?10\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/i
            .test(address) ||
        /^(::f{4}:)?192\.168\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(address) ||
        /^(::f{4}:)?172\.(1[6-9]|2\d|30|31)\.([0-9]{1,3})\.([0-9]{1,3})$/i
            .test(address) ||
        /^(::f{4}:)?127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(address) ||
        /^(::f{4}:)?169\.254\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(address) ||
        /^f[cd][0-9a-f]{2}:/i.test(address) ||
        /^fe80:/i.test(address) ||
        /^::1$/.test(address) ||
        /^::$/.test(address);
}