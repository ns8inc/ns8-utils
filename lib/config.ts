/*
    Runtime configuration routines.
 */

/**
 * Return the environment the instance is running under.
 * @returns {string}
 */
export function env(): string {
    if (process.env['NODE_ENV']) {
        return (<string>process.env['NODE_ENV']).toLowerCase();
    } else {
        return "default";
    }
}

/**
 * Return whether the instance is in development mode or not.
 * @returns {boolean}
 */
export function dev(): boolean {
    let check: string = process.env['NODE_ENV'] || "";
    return check.toLowerCase() == 'development' || check.toLowerCase() == 'local' || check.toLowerCase() == 'dev';
}

/**
 * Get the settings for a specific runtime environment.
 * @param envir     The runtime environment, which is generally 'development', 'local', or nothing for production.
 *                  There needs to be a file in the 'settings' folder that matches the environment.  For example,
 *                  for development, put the settings in the 'settings/settings-development.js' file.
 * @returns {T}
 */
export function settings<T>(envir: string = env()): T {

    let path = '~/settings/';

    let cwd = process.cwd();

    if (cwd.indexOf('tests') > 1) {
        cwd = cwd.substr(0, cwd.indexOf('tests') - 1);
        path = cwd + '/' + path.replace(/\~\//, '');
    } else {
        path = cwd + '/' + path.replace(/\~\//, '');
    }

    let settings: T;

    try {
        settings = require(path + "settings-" + envir.toLowerCase());
    } catch (ex) {
        settings = require(path + "settings");
    }

    return settings;
}
