/**
 * Where EMBER lives.
 *
 * One place that knows the name, so the server's allowed origins, the app's
 * default server and the invite people paste into a group chat cannot drift
 * apart from each other.
 *
 * Nothing here is a promise that the domain is registered and pointed at
 * anything — it is the name the project was given, and the deployment notes in
 * the README say what has to exist for it to answer.
 */

export const SITE_HOST = 'emberthecardgame.com';

/** Where the game is played in a browser. */
export const SITE_URL = `https://${SITE_HOST}`;

/** Where the tables live. A separate host so the site can be static. */
export const API_HOST = `api.${SITE_HOST}`;
export const API_URL = `https://${API_HOST}`;

/**
 * Every origin a browser might legitimately be on when it talks to the server:
 * the site, the www it redirects from, and the api host itself.
 */
export const SITE_ORIGINS = [SITE_URL, `https://www.${SITE_HOST}`, API_URL];
