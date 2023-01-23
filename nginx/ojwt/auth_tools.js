
/**
 * We use the jwt-simple library and the local my_keys.js (which you
 * can create manually or by using "node otools.js make_keys") with a
 * simple decode_jwt method for nginx.

 * Note: jwt-simple package seems better than jsonwebtoken since the
 * NGINX javascript engine (njs) is flaky and crashes strangely
 * when using jsonwebtoken.
 */

const jwt = require('jwt-simple')
const my_keys = require('./my_keys.js')

/**
 * Takes cookie string from header and parses to dictionary of cookies.
 * For example, doing `parseCookiesToDict(cookieStr)["jwtcookie"]` will
 * give you the value of the cookie named "jwtcookie" in `cookieStr`.
 *
 * @param {string} cookieStr The cookie string from an HTTP header to parse.
 * @return {number} Dict representation of the cookies.
 *
 */
function parseCookiesToDict(cookieStr) {
  if (cookieStr === "")
    return {};

  let pairs = cookieStr.split(";");
  let splittedPairs = pairs.map(cookie => cookie.split("="));
  const cookieObj = splittedPairs.reduce(function (obj, cookie) {
    let cookieKey = cookie[0]
    let cookieVal = cookie[1]
    // Use decodeURIComponent() for handling special characters like '$'.
    obj[decodeURIComponent(cookieKey.trim())]
      = decodeURIComponent(cookieVal.trim());
    return obj;
  }, {})
  return cookieObj;
}

/**
 * Helper function to take HTTP request from nginx, extract JWT ot token,
 * and verify it. This should mainly be called by decode_jwt and not directly.
 *
 * @param {obj} r The HTTP request we are trying to prase.
 * @return {string} Either a string of the form `'failed: <reason>'` if
 *                  the JWT is invalid or a JSON representation of the
 *                  JWT payload.
 *
 */
function decode_jwt_verify(r) {
  let token = r.args.jwt
  let cookie_headers = r.headersIn['Cookie']
  let from_cookie = false
  let result = 'failed: unknown reason'  // will change on success
  if ( token ) {
    r.log(`auth_tools.js parsing token`)
  } else if ( cookie_headers ) {
    r.log('no JWT in request args so trying cookie headers')
    let cookies = parseCookiesToDict(cookie_headers)
    token = cookies["jwtcookie"];
    r.log(`extracted token from cookie: ${token}`)
    from_cookie = true
  } else if ( r.headersIn['Api-key'] ) {
    r.log(`Extracted token from Api-key header`)
    token = r.headersIn['Api-key']
  }
  if ( ! token ) {
    return 'failed: not jwt found';
  }
  r.log(`decoding jwt with length ${token.length}`)
  try {
    result = jwt.decode(token,my_keys.public_key);
    r.log(`finished jwt.decode with result ${result}`)
  } catch (err) {
    r.warn(`error in jwt.decode: ${err}`)
    let msg = `failed: ${err}`
    return msg
  }
  r.log('jwt.decode succeeded')
  if (result.Host != r.headersIn['Host']) {
    let msg = `failed: token host is ${result.Host} != r.HeadersIn["Host"]`
    r.log(`Returning msg: ${msg}`)
    return msg
  }
  if (! from_cookie) {
    r.log('will set response cookie')
    r.headersOut['Set-Cookie'] = 'jwtcookie=' + token
  }
  return JSON.stringify(result);
}


/**
 * Main function for nginx to use to decode a JWT in a request. If the JWT
 * is missing or invalid we return `'failed<reason>'` where `<reason>` is
 * a possibly empty string indicating the reason decoding failed. If the JWT
 * is valid, then we return a JSON representation of the payload.
 *
 * The idea is that you can use a line like
 *
 *     js_set $my_jwt auth_tools.decode_jwt;
 *
 * in your nginx config to set the value of the variable `my_jwt` to the
 * result of trying to decode the JWT and then have nginx take actions
 * based on whether the JWT is valid and what it contains.
 *
 *
 * @param {obj} req The HTTP request we are trying to prase.
 * @return {string} Either a string of the form `'failed: <reason>'` if
 *                  the JWT is invalid or a JSON representation of the
 *                  JWT payload.
 *
 */
function decode_jwt(req) {
    let result = "failed";
    try {
        result = decode_jwt_verify(req);
    } catch (error) {
        result = `failed with error: ${error}`;
    }
    return result;
}

module.exports = {decode_jwt, decode_jwt_verify}

