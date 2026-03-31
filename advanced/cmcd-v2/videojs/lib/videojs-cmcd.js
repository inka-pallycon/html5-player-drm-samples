/*! @name @montevideo-tech/videojs-cmcd @version 2.0.0 @license Apache-2.0 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('video.js')) :
  typeof define === 'function' && define.amd ? define(['video.js'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.videojsCmcd = factory(global.videojs));
})(this, (function (videojs) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var videojs__default = /*#__PURE__*/_interopDefaultLegacy(videojs);

  function _extends() {
    _extends = Object.assign || function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

    return _extends.apply(this, arguments);
  }

  /**
   * CMCD header fields.
   *
   * @group CMCD
   *
   * @beta
   */
  var CmcdHeaderField;

  (function (CmcdHeaderField) {
    /**
     * keys whose values vary with the object being requested.
     */
    CmcdHeaderField["OBJECT"] = "CMCD-Object";
    /**
     * keys whose values vary with each request.
     */

    CmcdHeaderField["REQUEST"] = "CMCD-Request";
    /**
     * keys whose values are expected to be invariant over the life of the session.
     */

    CmcdHeaderField["SESSION"] = "CMCD-Session";
    /**
     * keys whose values do not vary with every request or object.
     */

    CmcdHeaderField["STATUS"] = "CMCD-Status";
  })(CmcdHeaderField || (CmcdHeaderField = {}));

  /**
   * The map of CMCD header fields to official CMCD keys.
   *
   * @internal
   *
   * @group CMCD
   */

  const CmcdHeaderMap = {
    [CmcdHeaderField.OBJECT]: ['br', 'd', 'ot', 'tb'],
    [CmcdHeaderField.REQUEST]: ['bl', 'dl', 'mtp', 'nor', 'nrr', 'su'],
    [CmcdHeaderField.SESSION]: ['cid', 'pr', 'sf', 'sid', 'st', 'v'],
    [CmcdHeaderField.STATUS]: ['bs', 'rtp']
  };

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  /**
   * Structured Field Item
   *
   * @group Structured Field
   *
   * @beta
   */
  class SfItem {
    constructor(value, params) {
      _defineProperty(this, "value", void 0);

      _defineProperty(this, "params", void 0);

      if (Array.isArray(value)) {
        value = value.map(v => v instanceof SfItem ? v : new SfItem(v));
      }

      this.value = value;
      this.params = params;
    }

  }

  /**
   * A class to represent structured field tokens when `Symbol` is not available.
   *
   * @group Structured Field
   *
   * @beta
   */
  class SfToken {
    constructor(description) {
      _defineProperty(this, "description", void 0);

      this.description = description;
    }

  }

  const DICT = 'Dict';

  function format(value) {
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }

    if (value instanceof Map) {
      return 'Map{}';
    }

    if (value instanceof Set) {
      return 'Set{}';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  function throwError(action, src, type, cause) {
    return new Error(`failed to ${action} "${format(src)}" as ${type}`, {
      cause
    });
  }

  const BARE_ITEM = 'Bare Item';

  const BOOLEAN = 'Boolean';

  const BYTES = 'Byte Sequence';

  const DECIMAL = 'Decimal';

  const INTEGER = 'Integer';

  function isInvalidInt(value) {
    return value < -999999999999999 || 999999999999999 < value;
  }

  const STRING_REGEX = /[\x00-\x1f\x7f]+/; // eslint-disable-line no-control-regex

  const TOKEN = 'Token';

  const KEY = 'Key';

  function serializeError(src, type, cause) {
    return throwError('serialize', src, type, cause);
  }

  //
  // Given a Boolean as input_boolean, return an ASCII string suitable for
  // use in a HTTP field value.
  //
  // 1.  If input_boolean is not a boolean, fail serialization.
  //
  // 2.  Let output be an empty string.
  //
  // 3.  Append "?" to output.
  //
  // 4.  If input_boolean is true, append "1" to output.
  //
  // 5.  If input_boolean is false, append "0" to output.
  //
  // 6.  Return output.

  function serializeBoolean(value) {
    if (typeof value !== 'boolean') {
      throw serializeError(value, BOOLEAN);
    }

    return value ? '?1' : '?0';
  }

  /**
   * Encodes binary data to base64
   *
   * @param binary - The binary data to encode
   * @returns The base64 encoded string
   *
   * @group Utils
   *
   * @beta
   */
  function base64encode(binary) {
    return btoa(String.fromCharCode(...binary));
  }

  //
  // Given a Byte Sequence as input_bytes, return an ASCII string suitable
  // for use in a HTTP field value.
  //
  // 1.  If input_bytes is not a sequence of bytes, fail serialization.
  //
  // 2.  Let output be an empty string.
  //
  // 3.  Append ":" to output.
  //
  // 4.  Append the result of base64-encoding input_bytes as per
  //     [RFC4648], Section 4, taking account of the requirements below.
  //
  // 5.  Append ":" to output.
  //
  // 6.  Return output.
  //
  // The encoded data is required to be padded with "=", as per [RFC4648],
  // Section 3.2.
  //
  // Likewise, encoded data SHOULD have pad bits set to zero, as per
  // [RFC4648], Section 3.5, unless it is not possible to do so due to
  // implementation constraints.

  function serializeByteSequence(value) {
    if (ArrayBuffer.isView(value) === false) {
      throw serializeError(value, BYTES);
    }

    return `:${base64encode(value)}:`;
  }

  //
  // Given an Integer as input_integer, return an ASCII string suitable
  // for use in a HTTP field value.
  //
  // 1.  If input_integer is not an integer in the range of
  //     -999,999,999,999,999 to 999,999,999,999,999 inclusive, fail
  //     serialization.
  //
  // 2.  Let output be an empty string.
  //
  // 3.  If input_integer is less than (but not equal to) 0, append "-" to
  //     output.
  //
  // 4.  Append input_integer's numeric value represented in base 10 using
  //     only decimal digits to output.
  //
  // 5.  Return output.

  function serializeInteger(value) {
    if (isInvalidInt(value)) {
      throw serializeError(value, INTEGER);
    }

    return value.toString();
  }

  //
  // Given a Date as input_integer, return an ASCII string suitable for
  // use in an HTTP field value.
  // 1.  Let output be "@".
  // 2.  Append to output the result of running Serializing an Integer
  //     with input_date (Section 4.1.4).
  // 3.  Return output.

  function serializeDate(value) {
    return `@${serializeInteger(value.getTime() / 1000)}`;
  }

  /**
   * This implements the rounding procedure described in step 2 of the "Serializing a Decimal" specification.
   * This rounding style is known as "even rounding", "banker's rounding", or "commercial rounding".
   *
   * @param value - The value to round
   * @param precision - The number of decimal places to round to
   * @returns The rounded value
   *
   * @group Utils
   *
   * @beta
   */
  function roundToEven(value, precision) {
    if (value < 0) {
      return -roundToEven(-value, precision);
    }

    const decimalShift = Math.pow(10, precision);
    const isEquidistant = Math.abs(value * decimalShift % 1 - 0.5) < Number.EPSILON;

    if (isEquidistant) {
      // If the tail of the decimal place is 'equidistant' we round to the nearest even value
      const flooredValue = Math.floor(value * decimalShift);
      return (flooredValue % 2 === 0 ? flooredValue : flooredValue + 1) / decimalShift;
    } else {
      // Otherwise, proceed as normal
      return Math.round(value * decimalShift) / decimalShift;
    }
  }

  //
  // Given a decimal number as input_decimal, return an ASCII string
  // suitable for use in a HTTP field value.
  //
  // 1.   If input_decimal is not a decimal number, fail serialization.
  //
  // 2.   If input_decimal has more than three significant digits to the
  //      right of the decimal point, round it to three decimal places,
  //      rounding the final digit to the nearest value, or to the even
  //      value if it is equidistant.
  //
  // 3.   If input_decimal has more than 12 significant digits to the left
  //      of the decimal point after rounding, fail serialization.
  //
  // 4.   Let output be an empty string.
  //
  // 5.   If input_decimal is less than (but not equal to) 0, append "-"
  //      to output.
  //
  // 6.   Append input_decimal's integer component represented in base 10
  //      (using only decimal digits) to output; if it is zero, append
  //      "0".
  //
  // 7.   Append "." to output.
  //
  // 8.   If input_decimal's fractional component is zero, append "0" to
  //      output.
  //
  // 9.   Otherwise, append the significant digits of input_decimal's
  //      fractional component represented in base 10 (using only decimal
  //      digits) to output.
  //
  // 10.  Return output.

  function serializeDecimal(value) {
    const roundedValue = roundToEven(value, 3); // round to 3 decimal places

    if (Math.floor(Math.abs(roundedValue)).toString().length > 12) {
      throw serializeError(value, DECIMAL);
    }

    const stringValue = roundedValue.toString();
    return stringValue.includes('.') ? stringValue : `${stringValue}.0`;
  }

  const STRING = 'String';

  //
  // Given a String as input_string, return an ASCII string suitable for
  // use in a HTTP field value.
  //
  // 1.  Convert input_string into a sequence of ASCII characters; if
  //     conversion fails, fail serialization.
  //
  // 2.  If input_string contains characters in the range %x00-1f or %x7f
  //     (i.e., not in VCHAR or SP), fail serialization.
  //
  // 3.  Let output be the string DQUOTE.
  //
  // 4.  For each character char in input_string:
  //
  //     1.  If char is "\" or DQUOTE:
  //
  //         1.  Append "\" to output.
  //
  //     2.  Append char to output.
  //
  // 5.  Append DQUOTE to output.
  //
  // 6.  Return output.

  function serializeString(value) {
    if (STRING_REGEX.test(value)) {
      throw serializeError(value, STRING);
    }

    return `"${value.replace(/\\/g, `\\\\`).replace(/"/g, `\\"`)}"`;
  }

  function symbolToStr(symbol) {
    return symbol.description || symbol.toString().slice(7, -1);
  }

  function serializeToken(token) {
    const value = symbolToStr(token);

    if (/^([a-zA-Z*])([!#$%&'*+\-.^_`|~\w:/]*)$/.test(value) === false) {
      throw serializeError(value, TOKEN);
    }

    return value;
  }

  //
  // Given an Item as input_item, return an ASCII string suitable for use
  // in a HTTP field value.
  //
  // 1.  If input_item is an Integer, return the result of running
  //     Serializing an Integer (Section 4.1.4) with input_item.
  //
  // 2.  If input_item is a Decimal, return the result of running
  //     Serializing a Decimal (Section 4.1.5) with input_item.
  //
  // 3.  If input_item is a String, return the result of running
  //     Serializing a String (Section 4.1.6) with input_item.
  //
  // 4.  If input_item is a Token, return the result of running
  //     Serializing a Token (Section 4.1.7) with input_item.
  //
  // 5.  If input_item is a Boolean, return the result of running
  //     Serializing a Boolean (Section 4.1.9) with input_item.
  //
  // 6.  If input_item is a Byte Sequence, return the result of running
  //     Serializing a Byte Sequence (Section 4.1.8) with input_item.
  //
  // 7.  If input_item is a Date, return the result of running Serializing
  //     a Date (Section 4.1.10) with input_item.
  //
  // 8.  Otherwise, fail serialization.

  function serializeBareItem(value) {
    switch (typeof value) {
      case 'number':
        if (!Number.isFinite(value)) {
          throw serializeError(value, BARE_ITEM);
        }

        if (Number.isInteger(value)) {
          return serializeInteger(value);
        }

        return serializeDecimal(value);

      case 'string':
        return serializeString(value);

      case 'symbol':
        return serializeToken(value);

      case 'boolean':
        return serializeBoolean(value);

      case 'object':
        if (value instanceof Date) {
          return serializeDate(value);
        }

        if (value instanceof Uint8Array) {
          return serializeByteSequence(value);
        }

        if (value instanceof SfToken) {
          return serializeToken(value);
        }

      default:
        // fail
        throw serializeError(value, BARE_ITEM);
    }
  }

  //
  // Given a key as input_key, return an ASCII string suitable for use in
  // a HTTP field value.
  //
  // 1.  Convert input_key into a sequence of ASCII characters; if
  //     conversion fails, fail serialization.
  //
  // 2.  If input_key contains characters not in lcalpha, DIGIT, "_", "-",
  //     ".", or "*" fail serialization.
  //
  // 3.  If the first character of input_key is not lcalpha or "*", fail
  //     serialization.
  //
  // 4.  Let output be an empty string.
  //
  // 5.  Append input_key to output.
  //
  // 6.  Return output.

  function serializeKey(value) {
    if (/^[a-z*][a-z0-9\-_.*]*$/.test(value) === false) {
      throw serializeError(value, KEY);
    }

    return value;
  }

  //
  // Given an ordered Dictionary as input_parameters (each member having a
  // param_name and a param_value), return an ASCII string suitable for
  // use in a HTTP field value.
  //
  // 1.  Let output be an empty string.
  //
  // 2.  For each param_name with a value of param_value in
  //     input_parameters:
  //
  //     1.  Append ";" to output.
  //
  //     2.  Append the result of running Serializing a Key
  //         (Section 4.1.1.3) with param_name to output.
  //
  //     3.  If param_value is not Boolean true:
  //
  //         1.  Append "=" to output.
  //
  //         2.  Append the result of running Serializing a bare Item
  //             (Section 4.1.3.1) with param_value to output.
  //
  // 3.  Return output.

  function serializeParams(params) {
    if (params == null) {
      return '';
    }

    return Object.entries(params).map(([key, value]) => {
      if (value === true) {
        return `;${serializeKey(key)}`; // omit true
      }

      return `;${serializeKey(key)}=${serializeBareItem(value)}`;
    }).join('');
  }

  //
  // Given an Item as bare_item and Parameters as item_parameters, return
  // an ASCII string suitable for use in a HTTP field value.
  //
  // 1.  Let output be an empty string.
  //
  // 2.  Append the result of running Serializing a Bare Item
  //     Section 4.1.3.1 with bare_item to output.
  //
  // 3.  Append the result of running Serializing Parameters
  //     Section 4.1.1.2 with item_parameters to output.
  //
  // 4.  Return output.

  function serializeItem(value) {
    if (value instanceof SfItem) {
      return `${serializeBareItem(value.value)}${serializeParams(value.params)}`;
    } else {
      return serializeBareItem(value);
    }
  }

  //
  // Given an array of (member_value, parameters) tuples as inner_list,
  // and parameters as list_parameters, return an ASCII string suitable
  // for use in a HTTP field value.
  //
  // 1.  Let output be the string "(".
  //
  // 2.  For each (member_value, parameters) of inner_list:
  //
  //     1.  Append the result of running Serializing an Item
  //         (Section 4.1.3) with (member_value, parameters) to output.
  //
  //     2.  If more values remain in inner_list, append a single SP to
  //         output.
  //
  // 3.  Append ")" to output.
  //
  // 4.  Append the result of running Serializing Parameters
  //     (Section 4.1.1.2) with list_parameters to output.
  //
  // 5.  Return output.

  function serializeInnerList(value) {
    return `(${value.value.map(serializeItem).join(' ')})${serializeParams(value.params)}`;
  }

  //
  // Given an ordered Dictionary as input_dictionary (each member having a
  // member_name and a tuple value of (member_value, parameters)), return
  // an ASCII string suitable for use in a HTTP field value.
  //
  // 1.  Let output be an empty string.
  //
  // 2.  For each member_name with a value of (member_value, parameters)
  //     in input_dictionary:
  //
  //     1.  Append the result of running Serializing a Key
  //         (Section 4.1.1.3) with member's member_name to output.
  //
  //     2.  If member_value is Boolean true:
  //
  //         1.  Append the result of running Serializing Parameters
  //             (Section 4.1.1.2) with parameters to output.
  //
  //     3.  Otherwise:
  //
  //         1.  Append "=" to output.
  //
  //         2.  If member_value is an array, append the result of running
  //             Serializing an Inner List (Section 4.1.1.1) with
  //             (member_value, parameters) to output.
  //
  //         3.  Otherwise, append the result of running Serializing an
  //             Item (Section 4.1.3) with (member_value, parameters) to
  //             output.
  //
  //     4.  If more members remain in input_dictionary:
  //
  //         1.  Append "," to output.
  //
  //         2.  Append a single SP to output.
  //
  // 3.  Return output.

  function serializeDict(dict, options = {
    whitespace: true
  }) {
    if (typeof dict !== 'object') {
      throw serializeError(dict, DICT);
    }

    const entries = dict instanceof Map ? dict.entries() : Object.entries(dict);
    const optionalWhiteSpace = (options == null ? void 0 : options.whitespace) ? ' ' : '';
    return Array.from(entries).map(([key, item]) => {
      if (item instanceof SfItem === false) {
        item = new SfItem(item);
      }

      let output = serializeKey(key);

      if (item.value === true) {
        output += serializeParams(item.params);
      } else {
        output += '=';

        if (Array.isArray(item.value)) {
          output += serializeInnerList(item);
        } else {
          output += serializeItem(item);
        }
      }

      return output;
    }).join(`,${optionalWhiteSpace}`);
  }

  /**
   * Encode an object into a structured field dictionary
   *
   * @param input - The structured field dictionary to encode
   * @returns The structured field string
   *
   * @group Structured Field
   *
   * @beta
   */

  function encodeSfDict(value, options) {
    return serializeDict(value, options);
  }

  /**
   * Checks if the given key is a token field.
   *
   * @param key - The key to check.
   *
   * @returns `true` if the key is a token field.
   *
   * @internal
   *
   * @group CMCD
   */
  const isTokenField = key => key === 'ot' || key === 'sf' || key === 'st';

  const isValid = value => {
    if (typeof value === 'number') {
      return Number.isFinite(value);
    }

    return value != null && value !== '' && value !== false;
  };

  /**
   * Constructs a relative path from a URL.
   *
   * @param url - The destination URL
   * @param base - The base URL
   * @returns The relative path
   *
   * @group Utils
   *
   * @beta
   */
  function urlToRelativePath(url, base) {
    const to = new URL(url);
    const from = new URL(base);

    if (to.origin !== from.origin) {
      return url;
    }

    const toPath = to.pathname.split('/').slice(1);
    const fromPath = from.pathname.split('/').slice(1, -1); // remove common parents

    while (toPath[0] === fromPath[0]) {
      toPath.shift();
      fromPath.shift();
    } // add back paths


    while (fromPath.length) {
      fromPath.shift();
      toPath.unshift('..');
    }

    return toPath.join('/');
  }

  /**
   * Generate a random v4 UUID
   *
   * @returns A random v4 UUID
   *
   * @group Utils
   *
   * @beta
   */
  function uuid() {
    try {
      return crypto.randomUUID();
    } catch (error) {
      try {
        const url = URL.createObjectURL(new Blob());
        const uuid = url.toString();
        URL.revokeObjectURL(url);
        return uuid.slice(uuid.lastIndexOf('/') + 1);
      } catch (error) {
        let dt = new Date().getTime();
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = (dt + Math.random() * 16) % 16 | 0;
          dt = Math.floor(dt / 16);
          return (c == 'x' ? r : r & 0x3 | 0x8).toString(16);
        });
        return uuid;
      }
    }
  }

  const toRounded = value => Math.round(value);

  const toUrlSafe = (value, options) => {
    if (options == null ? void 0 : options.baseUrl) {
      value = urlToRelativePath(value, options.baseUrl);
    }

    return encodeURIComponent(value);
  };

  const toHundred = value => toRounded(value / 100) * 100;
  /**
   * The default formatters for CMCD values.
   *
   * @group CMCD
   *
   * @beta
   */


  const CmcdFormatters = {
    /**
     * Bitrate (kbps) rounded integer
     */
    br: toRounded,

    /**
     * Duration (milliseconds) rounded integer
     */
    d: toRounded,

    /**
     * Buffer Length (milliseconds) rounded nearest 100ms
     */
    bl: toHundred,

    /**
     * Deadline (milliseconds) rounded nearest 100ms
     */
    dl: toHundred,

    /**
     * Measured Throughput (kbps) rounded nearest 100kbps
     */
    mtp: toHundred,

    /**
     * Next Object Request URL encoded
     */
    nor: toUrlSafe,

    /**
     * Requested maximum throughput (kbps) rounded nearest 100kbps
     */
    rtp: toHundred,

    /**
     * Top Bitrate (kbps) rounded integer
     */
    tb: toRounded
  };

  /**
   * Internal CMCD processing function.
   *
   * @param obj - The CMCD object to process.
   * @param map - The mapping function to use.
   * @param options - Options for encoding.
   *
   * @internal
   *
   * @group CMCD
   */

  function processCmcd(obj, options) {
    const results = {};

    if (obj == null || typeof obj !== 'object') {
      return results;
    }

    const keys = Object.keys(obj).sort();

    const formatters = _extends({}, CmcdFormatters, options == null ? void 0 : options.formatters);

    const filter = options == null ? void 0 : options.filter;
    keys.forEach(key => {
      if (filter == null ? void 0 : filter(key)) {
        return;
      }

      let value = obj[key];
      const formatter = formatters[key];

      if (formatter) {
        value = formatter(value, options);
      } // Version should only be reported if not equal to 1.


      if (key === 'v' && value === 1) {
        return;
      } // Playback rate should only be sent if not equal to 1.


      if (key == 'pr' && value === 1) {
        return;
      } // ignore invalid values


      if (!isValid(value)) {
        return;
      }

      if (isTokenField(key) && typeof value === 'string') {
        value = new SfToken(value);
      }

      results[key] = value;
    });
    return results;
  }

  /**
   * Encode a CMCD object to a string.
   *
   * @param cmcd - The CMCD object to encode.
   * @param options - Options for encoding.
   *
   * @returns The encoded CMCD string.
   *
   * @group CMCD
   *
   * @beta
   */

  function encodeCmcd(cmcd, options = {}) {
    if (!cmcd) {
      return '';
    }

    return encodeSfDict(processCmcd(cmcd, options), _extends({
      whitespace: false
    }, options));
  }

  /**
   * Convert a CMCD data object to request headers
   *
   * @param cmcd - The CMCD data object to convert.
   * @param options - Options for encoding the CMCD object.
   *
   * @returns The CMCD header shards.
   *
   * @group CMCD
   *
   * @beta
   */

  function toCmcdHeaders(cmcd, options = {}) {
    if (!cmcd) {
      return {};
    }

    const entries = Object.entries(cmcd);
    const headerMap = Object.entries(CmcdHeaderMap).concat(Object.entries((options == null ? void 0 : options.customHeaderMap) || {}));
    const shards = entries.reduce((acc, entry) => {
      var _headerMap$find, _acc$field;

      const [key, value] = entry;
      const field = ((_headerMap$find = headerMap.find(entry => entry[1].includes(key))) == null ? void 0 : _headerMap$find[0]) || CmcdHeaderField.REQUEST;
      (_acc$field = acc[field]) != null ? _acc$field : acc[field] = {};
      acc[field][key] = value;
      return acc;
    }, {});
    return Object.entries(shards).reduce((acc, [field, value]) => {
      acc[field] = encodeCmcd(value, options);
      return acc;
    }, {});
  }

  /**
   * Append CMCD query args to a header object.
   *
   * @param headers - The headers to append to.
   * @param cmcd - The CMCD object to append.
   * @param customHeaderMap - A map of custom CMCD keys to header fields.
   *
   * @returns The headers with the CMCD header shards appended.
   *
   * @group CMCD
   *
   * @beta
   */

  function appendCmcdHeaders(headers, cmcd, options) {
    return _extends(headers, toCmcdHeaders(cmcd, options));
  }

  /**
   * CMCD parameter name.
   *
   * @group CMCD
   *
   * @beta
   */
  const CMCD_PARAM = 'CMCD';

  /**
   * Convert a CMCD data object to a query arg.
   *
   * @param cmcd - The CMCD object to convert.
   * @param options - Options for encoding the CMCD object.
   *
   * @returns The CMCD query arg.
   *
   * @group CMCD
   *
   * @beta
   */

  function toCmcdQuery(cmcd, options = {}) {
    if (!cmcd) {
      return '';
    }

    const params = encodeCmcd(cmcd, options);
    return `${CMCD_PARAM}=${encodeURIComponent(params)}`;
  }

  const REGEX = /CMCD=[^&#]+/;
  /**
   * Append CMCD query args to a URL.
   *
   * @param url - The URL to append to.
   * @param cmcd - The CMCD object to append.
   * @param options - Options for encoding the CMCD object.
   *
   * @returns The URL with the CMCD query args appended.
   *
   * @group CMCD
   *
   * @beta
   */

  function appendCmcdQuery(url, cmcd, options) {
    // TODO: Replace with URLSearchParams once we drop Safari < 10.1 & Chrome < 49 support.
    // https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
    const query = toCmcdQuery(cmcd, options);

    if (!query) {
      return url;
    }

    if (REGEX.test(url)) {
      return url.replace(REGEX, query);
    }

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${query}`;
  }

  var version = "2.0.0";

  /**
   * Common Media Object Type
   *
   * @group CMCD
   * @group CMSD
   *
   * @beta
   */
  var CmObjectType;

  (function (CmObjectType) {
    /**
     * text file, such as a manifest or playlist
     */
    CmObjectType["MANIFEST"] = "m";
    /**
     * audio only
     */

    CmObjectType["AUDIO"] = "a";
    /**
     * video only
     */

    CmObjectType["VIDEO"] = "v";
    /**
     * muxed audio and video
     */

    CmObjectType["MUXED"] = "av";
    /**
     * init segment
     */

    CmObjectType["INIT"] = "i";
    /**
     * caption or subtitle
     */

    CmObjectType["CAPTION"] = "c";
    /**
     * ISOBMFF timed text track
     */

    CmObjectType["TIMED_TEXT"] = "tt";
    /**
     * cryptographic key, license or certificate.
     */

    CmObjectType["KEY"] = "k";
    /**
     * other
     */

    CmObjectType["OTHER"] = "o";
  })(CmObjectType || (CmObjectType = {}));

  /**
   * Common Media Streaming Type
   *
   * @group CMCD
   * @group CMSD
   *
   * @beta
   */
  var CmStreamType;

  (function (CmStreamType) {
    /**
     *  All segments are available – e.g., VOD
     */
    CmStreamType["VOD"] = "v";
    /**
     * Segments become available over time – e.g., LIVE
     */

    CmStreamType["LIVE"] = "l";
  })(CmStreamType || (CmStreamType = {}));

  /**
   * Common Media Streaming Format
   *
   * @group CMCD
   * @group CMSD
   *
   * @beta
   */
  var CmStreamingFormat;

  (function (CmStreamingFormat) {
    /**
     * MPEG DASH
     */
    CmStreamingFormat["DASH"] = "d";
    /**
     * HTTP Live Streaming (HLS)
     */

    CmStreamingFormat["HLS"] = "h";
    /**
     * Smooth Streaming
     */

    CmStreamingFormat["SMOOTH"] = "s";
    /**
     * Other
     */

    CmStreamingFormat["OTHER"] = "o";
  })(CmStreamingFormat || (CmStreamingFormat = {}));

  class CmcdData {
    constructor(player, sid, cid) {
      this.player = player;
      this.vhs = player.tech(true).vhs;
      this.sid = sid;
      this.cid = cid;
    }

    getEncodedBitrate() {
      try {
        const bandwidth = this.player.tech(true).vhs.playlists.media_.attributes.BANDWIDTH;
        const encodedBitrate = Math.round(bandwidth / 1000);
        return encodedBitrate;
      } catch (e) {
        return undefined;
      }
    }

    getObjectDuration(uriBeingRequested) {
      try {
        const playlist = this.player.tech(true).vhs.playlists.media();
        const currentSegmentIndex = playlist.segments.findIndex(segment => segment.resolvedUri === uriBeingRequested);
        const currentSegmentDuration = Math.round(playlist.segments[currentSegmentIndex].duration * 1000);
        return currentSegmentDuration;
      } catch (error) {
        return undefined;
      }
    }

    getObjectType(uriBeingRequested) {
      try {
        const extension = uriBeingRequested.split('.').pop();
        const {
          MANIFEST,
          AUDIO,
          VIDEO,
          MUXED,
          CAPTION,
          OTHER
        } = CmObjectType;
        const supportedExtensions = {
          // Manifest or playlist
          m3u8: MANIFEST,
          mpd: MANIFEST,
          xml: MANIFEST,
          // Audio Only
          m4a: AUDIO,
          amp3ac: AUDIO,
          aac: AUDIO,
          caf: AUDIO,
          flac: AUDIO,
          oga: AUDIO,
          wav: AUDIO,
          // Video Only
          opus: VIDEO,
          ogv: VIDEO,
          mp4: VIDEO,
          mov: VIDEO,
          m4v: VIDEO,
          mkv: VIDEO,
          webm: VIDEO,
          ogg: VIDEO,
          flv: VIDEO,
          // Muxed audio and video
          ts: MUXED,
          // Init segment not implemented
          // Caption
          webvtt: CAPTION,
          vtt: CAPTION,
          // ISOBMFF timed text track not implemented
          // Cryptographic key, license or certificate not implemented
          // Other
          jpg: OTHER,
          jpeg: OTHER,
          gif: OTHER,
          png: OTHER,
          svg: OTHER,
          webp: OTHER
        };

        if (supportedExtensions.hasOwnProperty(extension)) {
          return supportedExtensions[extension];
        }

        return undefined;
      } catch (error) {
        return undefined;
      }
    }

    getTopBitrate() {
      try {
        const qualitylevels = this.player.qualityLevels().levels_;
        const highestBitrate = qualitylevels.reduce(function (prev, current) {
          return prev && prev.bitrate > current.bitrate ? prev : current;
        });
        const topBitrate = Math.round(highestBitrate.bitrate / 1000);
        return topBitrate;
      } catch (error) {
        return undefined;
      }
    }

    bufferLengthMs() {
      try {
        let bufferLength = 0;
        const tech = this.player.tech(true);
        const buffered = tech.buffered();

        if (buffered.length > 0) {
          const lastBufferedTime = buffered.end(buffered.length - 1);

          if (!isNaN(lastBufferedTime)) {
            bufferLength = lastBufferedTime - tech.currentTime();
          }
        }

        const bufferLengthMs = bufferLength * 1000;
        return bufferLengthMs;
      } catch (e) {
        return undefined;
      }
    }

    getBufferLength() {
      // This key SHOULD only be sent with an object type of ‘a’, ‘v’ or ‘av’.
      try {
        const bufferLengthMs = this.bufferLengthMs();
        return bufferLengthMs;
      } catch (e) {
        return undefined;
      }
    }

    getDeadline() {
      try {
        const bufferLength = this.bufferLengthMs();
        const playbackRate = this.player.playbackRate() * 1000;
        const deadline = Math.round(bufferLength / playbackRate);
        return deadline;
      } catch (e) {
        return undefined;
      }
    }

    getMeasuredThroughput() {
      try {
        const bandwidth = Math.round(this.vhs.systemBandwidth / 1000);
        return bandwidth;
      } catch (e) {
        return undefined;
      }
    }

    getNextObjectRequest(actualURIrequest) {
      try {
        let nextObject;

        if (this.player.duration().toString() !== 'Infinity' && this.player.duration() !== 0) {
          // This logic doesn't work when is live video
          const segments = this.vhs.playlists.media().segments;
          const segmentIndexFind = segments.findIndex(seg => seg.resolvedUri === actualURIrequest);

          if (segmentIndexFind !== -1 && segmentIndexFind !== segments.length) {
            nextObject = segments[segmentIndexFind + 1].uri;
          }
        }

        return nextObject;
      } catch (e) {
        return undefined;
      }
    }

    getNextRangeRequest() {
      // TODO
      return undefined;
    }

    generateHashCode(string) {
      let hash = 0;

      if (string.length === 0) {
        return hash;
      }

      for (let i = 0; i < string.length; i++) {
        const chr = string.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0;
      }

      return hash;
    }

    getContentId(src) {
      if (this.cid) {
        return this.cid;
      }

      try {
        const cid = this.generateHashCode(src);
        return cid.toString();
      } catch (e) {
        return undefined;
      }
    }

    getPlaybackRate() {
      try {
        const rate = this.player.playbackRate();

        if (rate === 1) {
          return 1;
        } else if (rate === 0) {
          return 0;
        }

        return 2;
      } catch (e) {
        return undefined;
      }
    }

    getStreamingFormat() {
      try {
        const type = this.player.currentType();

        if (type === 'application/dash+xml') {
          return CmStreamingFormat.DASH;
        } else if (type === 'application/x-mpegURL') {
          return CmStreamingFormat.HLS;
        } else if (type === 'application/vnd.ms-sstr+xml') {
          return CmStreamingFormat.SMOOTH;
        }

        return CmStreamingFormat.OTHER;
      } catch (e) {
        return undefined;
      }
    }

    getStreamType() {
      try {
        // It is a live video
        if (this.player.duration().toString() === 'Infinity' || this.player.duration() === 0) {
          return CmStreamType.LIVE;
        } // else it is a vod video


        return CmStreamType.VOD;
      } catch (e) {
        return undefined;
      }
    }

    getVersion() {
      return 1;
    }

    getBufferStarvation(isWaitingEvent) {
      try {
        return isWaitingEvent;
      } catch (e) {
        return undefined;
      }
    }

    getRequestedMaximumThroughput() {
      // TODO
      return undefined;
    }

    getKeys(uri, isWaitingEvent, src) {
      const res = {
        br: this.getEncodedBitrate(),
        d: this.getObjectDuration(uri),
        ot: this.getObjectType(uri),
        tb: this.getTopBitrate()
      };

      if ([CmObjectType.AUDIO, CmObjectType.VIDEO, CmObjectType.MUXED].includes(res.ot)) {
        res.bl = this.getBufferLength();
      }

      res.dl = this.getDeadline();
      res.mtp = this.getMeasuredThroughput();
      res.nor = this.getNextObjectRequest(uri);
      res.nrr = this.getNextRangeRequest();

      if (isWaitingEvent !== false) {
        res.su = isWaitingEvent;
      }

      res.cid = this.getContentId(src);

      if (this.getPlaybackRate() !== 1) {
        res.pr = this.getPlaybackRate();
      }

      res.sf = this.getStreamingFormat();
      res.sid = this.sid;
      res.st = this.getStreamType();

      if (this.getVersion() !== 1) {
        res.v = this.getVersion();
      }

      if (isWaitingEvent !== false) {
        res.bs = this.getBufferStarvation(isWaitingEvent);
      }

      res.rtp = this.getRequestedMaximumThroughput();
      return res;
    }

  }

  class CmcdV2Data {
    constructor(player, sid, cid) {
      this.player = player;
      this.vhs = player.tech(true).vhs;
      this.sid = sid;
      this.cid = cid;
      this.sequenceNumber = 0;
      this.mediaStartDelay = null;
      this.mediaStartDelaySent = false;
      this.requestStartTimes = new Map();
    }

    getVersion() {
      return 2;
    }

    getTimestamp() {
      return Date.now();
    }

    getTimeToFirstByte(requestStartTime, firstByteTime) {
      if (!requestStartTime || !firstByteTime) return undefined;
      return Math.round(firstByteTime - requestStartTime);
    }

    getTimeToLastByte(requestStartTime, endTime) {
      if (!requestStartTime || !endTime) return undefined;
      return Math.round(endTime - requestStartTime);
    }

    getResponseCode(xhr) {
      return xhr && xhr.status ? xhr.status : undefined;
    }

    getUrl(uri) {
      if (!uri) return undefined;
      return uri.split('?')[0];
    }

    getPlayheadTime() {
      try {
        const isLive = this.player.duration().toString() === 'Infinity' || this.player.duration() === 0;

        if (isLive) {
          return Date.now();
        } else {
          return Math.round(this.player.currentTime() * 1000);
        }
      } catch (e) {
        return undefined;
      }
    }

    getLiveLatency() {
      try {
        if (this.player.duration().toString() !== 'Infinity' && this.player.duration() !== 0) {
          return undefined;
        }

        const currentTime = this.player.currentTime();
        const liveEdge = this.vhs && this.vhs.seekable && this.vhs.seekable().length > 0 ? this.vhs.seekable().end(this.vhs.seekable().length - 1) : undefined;

        if (liveEdge && currentTime) {
          return Math.round((liveEdge - currentTime) * 1000);
        }

        return undefined;
      } catch (e) {
        return undefined;
      }
    }

    getPlayerState() {
      try {
        const video = this.player.el().querySelector('video');
        if (!video) return undefined;
        if (video.seeking) return 'k';
        if (this.player.buffering && this.player.buffering()) return 'r';
        if (video.ended) return 'e';

        if (video.paused) {
          if (video.currentTime === 0 && video.played.length === 0) {
            return 'p';
          }

          return 'a';
        }

        if (video.readyState < 3) {
          return 's';
        }

        return 'p';
      } catch (e) {
        return undefined;
      }
    }

    getMediaStartDelay() {
      if (this.mediaStartDelaySent) return undefined;

      if (this.mediaStartDelay !== null) {
        this.mediaStartDelaySent = true;
        return this.mediaStartDelay;
      }

      return undefined;
    }

    setMediaStartDelay(delay) {
      if (this.mediaStartDelay === null) {
        this.mediaStartDelay = delay;
      }
    }

    getDroppedFrames() {
      try {
        const video = this.player.el().querySelector('video');

        if (video && video.getVideoPlaybackQuality) {
          return video.getVideoPlaybackQuality().droppedVideoFrames;
        }

        return undefined;
      } catch (e) {
        return undefined;
      }
    }

    getSequenceNumber() {
      const sn = this.sequenceNumber;
      this.sequenceNumber++;
      return sn;
    }

    getEventType(eventName) {
      const eventMap = {
        'play': 'ps',
        'pause': 'ps',
        'seeking': 'ps',
        'waiting': 'ps',
        'ended': 'ps',
        'error': 'e',
        'timeupdate': 't'
      };
      return eventMap[eventName] || eventName;
    }

    getErrorCode(error) {
      if (!error) return undefined;
      return error.code || error.status || undefined;
    }

    storeRequestStartTime(uri, timestamp) {
      this.requestStartTimes.set(uri, timestamp);
    }

    getRequestStartTime(uri) {
      return this.requestStartTimes.get(uri);
    }

    clearRequestStartTime(uri) {
      this.requestStartTimes.delete(uri);
    }

    filterNullUndefined(obj) {
      const filtered = {};

      for (const key in obj) {
        if (obj[key] !== null && obj[key] !== undefined) {
          filtered[key] = obj[key];
        }
      }

      return filtered;
    }

    getResponseModeKeys(uri, xhr, requestStartTime, firstByteTime, endTime) {
      const keys = {};
      keys.ts = this.getTimestamp();

      if (requestStartTime) {
        keys.ttfb = this.getTimeToFirstByte(requestStartTime, firstByteTime);
        keys.ttlb = this.getTimeToLastByte(requestStartTime, endTime);
      }

      keys.rc = this.getResponseCode(xhr);
      keys.url = this.getUrl(uri);
      keys.pt = this.getPlayheadTime();
      keys.ltc = this.getLiveLatency();
      keys.pr = this.player.playbackRate();
      keys.sta = this.getPlayerState();
      keys.msd = this.getMediaStartDelay();
      keys.df = this.getDroppedFrames();
      keys.sn = this.getSequenceNumber();
      keys.sid = this.sid;
      keys.cid = this.cid;
      keys.v = this.getVersion();
      return this.filterNullUndefined(keys);
    }

    getEventModeKeys(eventType, eventData = {}) {
      const keys = {};
      keys.ts = this.getTimestamp();
      keys.e = this.getEventType(eventType);
      keys.pt = this.getPlayheadTime();
      keys.ltc = this.getLiveLatency();
      keys.pr = this.player.playbackRate();
      keys.sta = this.getPlayerState();
      keys.msd = this.getMediaStartDelay();
      keys.df = this.getDroppedFrames();
      keys.sn = this.getSequenceNumber();

      if (eventData.error) {
        keys.ec = this.getErrorCode(eventData.error);
      }

      keys.sid = this.sid;
      keys.cid = this.cid;
      keys.v = this.getVersion();
      return this.filterNullUndefined(keys);
    }

    formatDataForTransmission(data, transmissionMode) {
      const filtered = this.filterNullUndefined(data);

      switch (transmissionMode) {
        case 'json':
          return filtered;

        case 'query':
          return Object.entries(filtered).map(([key, value]) => {
            if (typeof value === 'string') {
              const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
              return `${key}="${escaped}"`;
            }

            return `${key}=${value}`;
          }).join(',');

        case 'header':
          const headers = {};
          Object.entries(filtered).forEach(([key, value]) => {
            const headerName = `CMCD-${key.charAt(0).toUpperCase()}`;

            if (!headers[headerName]) {
              headers[headerName] = [];
            }

            if (typeof value === 'string') {
              const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
              headers[headerName].push(`${key}="${escaped}"`);
            } else {
              headers[headerName].push(`${key}=${value}`);
            }
          });
          Object.keys(headers).forEach(headerName => {
            headers[headerName] = headers[headerName].join(',');
          });
          return headers;

        default:
          return filtered;
      }
    }

  }

  class ResponseModeController {
    constructor(player, cmcdV2Data, targets) {
      this.player = player;
      this.cmcdV2Data = cmcdV2Data;
      this.targets = targets.filter(target => target.mode === 'response' && target.enabled !== false);
      this.batches = new Map();
      this.originalXhrHook = null;
      this.init();
    }

    init() {
      if (this.targets.length === 0) return;
      this.initializeBatches();
      this.setupResponseInterception();
    }

    initializeBatches() {
      this.targets.forEach(target => {
        if (target.transmissionMode === 'json' || target.transmissionMode === 'body') {
          this.batches.set(target, []);
        }
      });
    }

    setupResponseInterception() {
      const player = this.player;
      player.ready(() => {
        player.on('xhr-hooks-ready', () => {
          const tech = player.tech();

          if (tech && tech.vhs && tech.vhs.xhr) {
            this.setupXhrHooks(tech.vhs.xhr);
          }
        });
      });
    }

    setupXhrHooks(xhr) {
      const originalOnRequest = xhr.onRequest;

      xhr.onRequest = options => {
        const requestStartTime = Date.now();
        this.cmcdV2Data.storeRequestStartTime(options.uri, requestStartTime);

        if (originalOnRequest) {
          return originalOnRequest(options);
        }

        return options;
      };

      xhr.hooks.response.push((request, next) => {
        this.handleResponse(request);
        next();
      });
    }

    handleResponse(request) {
      try {
        const {
          uri,
          response
        } = request;
        const requestStartTime = this.cmcdV2Data.getRequestStartTime(uri);
        const endTime = Date.now();
        if (!requestStartTime) return;
        const firstByteTime = response && response.responseStart ? response.responseStart : requestStartTime + 50;
        this.targets.forEach(target => {
          if (this.shouldProcessRequest(target, uri)) {
            this.processResponseForTarget(target, uri, request.xhr, requestStartTime, firstByteTime, endTime);
          }
        });
        this.cmcdV2Data.clearRequestStartTime(uri);
      } catch (error) {
        console.error('Error in ResponseModeController.handleResponse:', error);
      }
    }

    shouldProcessRequest(target, uri) {
      if (!target.includeOnRequests || target.includeOnRequests.length === 0) {
        return true;
      }

      return target.includeOnRequests.some(requestType => {
        switch (requestType) {
          case 'manifest':
          case 'mpd':
            return uri.includes('.mpd') || uri.includes('.m3u8');

          case 'segment':
            return uri.includes('.ts') || uri.includes('.m4s') || uri.includes('.mp4');

          default:
            return true;
        }
      });
    }

    processResponseForTarget(target, uri, xhr, requestStartTime, firstByteTime, endTime) {
      try {
        const responseData = this.cmcdV2Data.getResponseModeKeys(uri, xhr, requestStartTime, firstByteTime, endTime);
        const filteredData = this.filterDataByKeys(responseData, target.enabledKeys);
        if (Object.keys(filteredData).length === 0) return;
        this.sendDataToTarget(target, filteredData);
      } catch (error) {
        console.error('Error processing response for target:', error);
      }
    }

    filterDataByKeys(data, enabledKeys) {
      if (!enabledKeys || enabledKeys.length === 0) {
        return data;
      }

      const filtered = {};
      enabledKeys.forEach(key => {
        if (data[key] !== undefined) {
          filtered[key] = data[key];
        }
      });
      return filtered;
    }

    sendDataToTarget(target, data) {
      const transmissionMode = target.transmissionMode || 'query';

      switch (transmissionMode) {
        case 'json':
        case 'body':
          this.addToBatch(target, data);
          break;

        case 'query':
          this.sendQueryRequest(target, data);
          break;

        case 'header':
          this.sendHeaderRequest(target, data);
          break;
      }
    }

    addToBatch(target, data) {
      const batch = this.batches.get(target);
      if (!batch) return;
      batch.push(data);
      const batchSize = target.batchSize || 5;

      if (batch.length >= batchSize) {
        this.sendBatch(target, [...batch]);
        batch.length = 0;
      }
    }

    sendBatch(target, batchData) {
      if (!target.url || batchData.length === 0) return;
      fetch(target.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(batchData)
      }).then(response => {
        if (!response.ok) {
          console.warn(`CMCD Response Mode batch reporting failed: ${response.status}`);
        }
      }).catch(error => {
        console.error('Error sending CMCD Response Mode batch data:', error);
      });
    }

    sendQueryRequest(target, data) {
      if (!target.url) return;

      try {
        const queryString = this.cmcdV2Data.formatDataForTransmission(data, 'query');
        const url = new URL(target.url);
        url.searchParams.set('CMCD', queryString);
        fetch(url.toString(), {
          method: 'GET'
        }).then(response => {
          if (!response.ok) {
            console.warn(`CMCD Response Mode query reporting failed: ${response.status}`);
          }
        }).catch(error => {
          console.error('Error sending CMCD Response Mode query data:', error);
        });
      } catch (error) {
        console.error('Error creating query request:', error);
      }
    }

    sendHeaderRequest(target, data) {
      if (!target.url) return;

      try {
        const headers = this.cmcdV2Data.formatDataForTransmission(data, 'header');
        fetch(target.url, {
          method: 'POST',
          headers: _extends({
            'Content-Type': 'application/json'
          }, headers),
          body: JSON.stringify({})
        }).then(response => {
          if (!response.ok) {
            console.warn(`CMCD Response Mode header reporting failed: ${response.status}`);
          }
        }).catch(error => {
          console.error('Error sending CMCD Response Mode header data:', error);
        });
      } catch (error) {
        console.error('Error creating header request:', error);
      }
    }

    destroy() {
      this.batches.clear();
      this.player = null;
      this.cmcdV2Data = null;
      this.targets = null;
    }

  }

  class EventModeController {
    constructor(player, cmcdV2Data, targets) {
      this.player = player;
      this.cmcdV2Data = cmcdV2Data;
      this.targets = targets.filter(target => target.mode === 'event' && target.enabled !== false);
      this.batches = new Map();
      this.timers = new Map();
      this.sendingFlags = new Map(); // Track if a target is currently sending

      this.mediaStartTime = null;
      this.init();
    }

    init() {
      if (this.targets.length === 0) return;
      this.initializeBatches();
      this.setupEventListeners();
      this.setupTimeIntervals();
    }

    initializeBatches() {
      this.targets.forEach(target => {
        if (target.transmissionMode === 'json' || target.transmissionMode === 'body') {
          this.batches.set(target, []);
          this.sendingFlags.set(target, false);
        }

        if (target.batchTimer && target.batchTimer > 0) {
          const timer = setInterval(() => {
            if (!this.sendingFlags.get(target)) {
              this.flushBatch(target);
            }
          }, target.batchTimer * 1000);
          this.timers.set(target, timer);
        }
      });
    }

    setupEventListeners() {
      const player = this.player;
      player.ready(() => {
        const videoElement = player.el().querySelector('video');
        if (!videoElement) return;
        const eventMappings = [{
          domEvent: 'play',
          cmcdEvent: 'ps'
        }, {
          domEvent: 'pause',
          cmcdEvent: 'ps'
        }, {
          domEvent: 'seeking',
          cmcdEvent: 'ps'
        }, {
          domEvent: 'waiting',
          cmcdEvent: 'ps'
        }, {
          domEvent: 'ended',
          cmcdEvent: 'ps'
        }, {
          domEvent: 'error',
          cmcdEvent: 'e'
        }, {
          domEvent: 'volumechange',
          cmcdEvent: videoElement.muted ? 'm' : 'um'
        }];
        eventMappings.forEach(({
          domEvent,
          cmcdEvent
        }) => {
          videoElement.addEventListener(domEvent, event => {
            this.handleMediaEvent(domEvent, cmcdEvent, {
              event
            });
          });
        });
        player.on('play', () => {
          if (this.mediaStartTime === null) {
            this.mediaStartTime = Date.now();
          }
        });
        player.on('playing', () => {
          if (this.mediaStartTime !== null) {
            const delay = Date.now() - this.mediaStartTime;
            this.cmcdV2Data.setMediaStartDelay(delay);
            this.mediaStartTime = null;
          }
        });
        player.on('error', event => {
          this.handleMediaEvent('error', 'e', {
            error: {
              code: event.code || event.type,
              message: event.message
            }
          });
        });
        player.on('loadstart', () => {
          this.mediaStartTime = Date.now();
        });
      });
    }

    setupTimeIntervals() {
      this.targets.forEach(target => {
        if (target.timeInterval && target.timeInterval > 0) {
          const timer = setInterval(() => {
            this.handleMediaEvent('timeupdate', 't', {});
          }, target.timeInterval * 1000);
          this.timers.set(`interval_${target.url}`, timer);
        }
      });
    }

    handleMediaEvent(eventType, cmcdEventType, eventData = {}) {
      this.targets.forEach(target => {
        if (this.shouldProcessEvent(target, cmcdEventType)) {
          this.processEventForTarget(target, eventType, eventData);
        }
      });
    }

    shouldProcessEvent(target, cmcdEventType) {
      if (!target.events || target.events.length === 0) {
        return true;
      }

      return target.events.includes(cmcdEventType);
    }

    processEventForTarget(target, eventType, eventData) {
      try {
        const eventModeData = this.cmcdV2Data.getEventModeKeys(eventType, eventData);
        const filteredData = this.filterDataByKeys(eventModeData, target.enabledKeys);
        if (Object.keys(filteredData).length === 0) return;
        this.sendDataToTarget(target, filteredData);
      } catch (error) {
        console.error('Error processing event for target:', error);
      }
    }

    filterDataByKeys(data, enabledKeys) {
      if (!enabledKeys || enabledKeys.length === 0) {
        return data;
      }

      const filtered = {};
      enabledKeys.forEach(key => {
        if (data[key] !== undefined) {
          filtered[key] = data[key];
        }
      });
      return filtered;
    }

    sendDataToTarget(target, data) {
      const transmissionMode = target.transmissionMode || 'query';

      switch (transmissionMode) {
        case 'json':
        case 'body':
          this.addToBatch(target, data);
          break;

        case 'query':
          this.sendQueryRequest(target, data);
          break;

        case 'header':
          this.sendHeaderRequest(target, data);
          break;
      }
    }

    addToBatch(target, data) {
      const batch = this.batches.get(target);
      if (!batch) return;
      batch.push(data);
      const batchSize = target.batchSize || 10; // Always enforce batchSize limit to prevent overflow

      if (batch.length > batchSize) {
        const overflow = batch.length - batchSize;
        const removed = batch.splice(0, overflow);
        console.warn(`[CMCD EventMode] Batch exceeded limit (${batch.length + overflow}), removed ${removed.length} oldest event(s)`);
      } // Try to send if batch size reached and not currently sending


      if (batch.length >= batchSize && !this.sendingFlags.get(target)) {
        this.sendBatch(target, [...batch]);
      }
    }

    flushBatch(target) {
      const batch = this.batches.get(target);
      if (!batch || batch.length === 0) return;

      if (this.sendingFlags.get(target)) {
        console.log('[CMCD EventMode] Already sending for this target, skipping flush');
        return;
      }

      this.sendBatch(target, [...batch]);
    }

    sendBatch(target, batchData) {
      if (!target.url || batchData.length === 0) return;
      const batch = this.batches.get(target);
      if (!batch) return;

      if (this.sendingFlags.get(target)) {
        console.log('[CMCD EventMode] Already sending for this target, skipping sendBatch');
        return;
      }

      this.sendingFlags.set(target, true); // Remove batch from array immediately to prevent data loss during transmission

      const batchToSend = batch.splice(0, batch.length); // Call beforeSend callback if provided (modifies the batch copy, not the original array)

      if (target.beforeSend && typeof target.beforeSend === 'function') {
        try {
          target.beforeSend(batchToSend);
        } catch (e) {
          console.error('[CMCD EventMode] Error in beforeSend callback:', e);
        }
      }

      console.log(`[CMCD EventMode] Sending batch of ${batchToSend.length} CMCD events.`);
      fetch(target.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(batchToSend)
      }).then(response => {
        if (response.ok) {
          console.log('[CMCD EventMode] CMCD batch data reported successfully.'); // Data already removed via splice, just call afterSend callback
          // Call afterSend callback if provided

          if (target.afterSend && typeof target.afterSend === 'function') {
            try {
              target.afterSend(response);
            } catch (e) {
              console.error('[CMCD EventMode] Error in afterSend callback:', e);
            }
          }
        } else {
          console.warn(`CMCD Event Mode batch reporting failed: ${response.status}`); // If current batch + failed batch exceeds limit, trim the failed batch first (remove oldest)

          const batchSize = target.batchSize || 10;
          const currentBatchSize = batch.length;
          const totalSize = currentBatchSize + batchToSend.length;

          if (totalSize > batchSize) {
            // Trim failed batch to fit within limit (remove oldest events from failed batch)
            const overflow = totalSize - batchSize;
            const trimmedBatch = batchToSend.slice(overflow); // Keep newer part of failed batch

            console.warn(`[CMCD EventMode] After retry, would exceed limit. Trimmed ${overflow} oldest event(s) from failed batch`);
            batch.unshift(...trimmedBatch);
          } else {
            // Re-add entire failed batch to front
            batch.unshift(...batchToSend);
          }
        }
      }).catch(error => {
        console.error('Error sending CMCD Event Mode batch data:', error); // If current batch + failed batch exceeds limit, trim the failed batch first (remove oldest)

        const batchSize = target.batchSize || 10;
        const currentBatchSize = batch.length;
        const totalSize = currentBatchSize + batchToSend.length;

        if (totalSize > batchSize) {
          // Trim failed batch to fit within limit (remove oldest events from failed batch)
          const overflow = totalSize - batchSize;
          const trimmedBatch = batchToSend.slice(overflow); // Keep newer part of failed batch

          console.warn(`[CMCD EventMode] After retry, would exceed limit. Trimmed ${overflow} oldest event(s) from failed batch`);
          batch.unshift(...trimmedBatch);
        } else {
          // Re-add entire failed batch to front
          batch.unshift(...batchToSend);
        }
      }).finally(() => {
        this.sendingFlags.set(target, false);
      });
    }

    sendQueryRequest(target, data) {
      if (!target.url) return;

      try {
        const queryString = this.cmcdV2Data.formatDataForTransmission(data, 'query');
        const url = new URL(target.url);
        url.searchParams.set('CMCD', queryString);
        fetch(url.toString(), {
          method: 'GET'
        }).then(response => {
          if (!response.ok) {
            console.warn(`CMCD Event Mode query reporting failed: ${response.status}`);
          }
        }).catch(error => {
          console.error('Error sending CMCD Event Mode query data:', error);
        });
      } catch (error) {
        console.error('Error creating query request:', error);
      }
    }

    sendHeaderRequest(target, data) {
      if (!target.url) return;

      try {
        const headers = this.cmcdV2Data.formatDataForTransmission(data, 'header');
        fetch(target.url, {
          method: 'POST',
          headers: _extends({
            'Content-Type': 'application/json'
          }, headers),
          body: JSON.stringify({})
        }).then(response => {
          if (!response.ok) {
            console.warn(`CMCD Event Mode header reporting failed: ${response.status}`);
          }
        }).catch(error => {
          console.error('Error sending CMCD Event Mode header data:', error);
        });
      } catch (error) {
        console.error('Error creating header request:', error);
      }
    }

    destroy() {
      this.timers.forEach(timer => clearInterval(timer));
      this.timers.clear();
      this.batches.clear();
      this.player = null;
      this.cmcdV2Data = null;
      this.targets = null;
    }

  }

  const Plugin = videojs__default["default"].getPlugin('plugin');
  let isWaitingEvent = true; // Default options for the plugin.

  const defaults = {};
  /**
   * An advanced Video.js plugin. For more information on the API
   *
   * See: https://blog.videojs.com/feature-spotlight-advanced-plugins/
   */

  class Cmcd extends Plugin {
    /**
     * Create a Cmcd plugin instance.
     *
     * @param  {Player} player
     *         A Video.js Player instance.
     *
     * @param  {Object} [options]
     *         An optional options object.
     *
     *         While not a core part of the Video.js plugin architecture, a
     *         second argument of options is a convenient way to accept inputs
     *         from your plugin's caller.
     */
    constructor(player, options) {
      // the parent class will add player under this.player
      super(player);
      this.options = videojs__default["default"].obj.merge(defaults, options);
      const {
        sid,
        cid,
        useHeaders,
        version = 1,
        targets
      } = options || {};
      this.cid = cid;
      this.sid = sid || uuid();
      this.useHeaders = useHeaders;
      this.version = version;
      this.targets = targets || []; // V2 controllers

      this.responseModeController = null;
      this.eventModeController = null;
      this.player.ready(() => {
        player.addClass('vjs-cmcd');

        if (this.version === 2) {
          this.initializeV2(player);
        } else {
          this.initializeV1(player);
        }
      });
    }

    initializeV1(player) {
      handleEvents(player);
      player.on('xhr-hooks-ready', () => {
        const playerXhrRequestHook = opts => {
          const cmcd = new CmcdData(this.player, this.sid, this.cid);
          const keys = cmcd.getKeys(opts.uri, isWaitingEvent, this.player.currentSrc());

          if (this.useHeaders) {
            const headers = appendCmcdHeaders({}, keys);

            opts.beforeSend = xhr => {
              for (const h in headers) {
                xhr.setRequestHeader(h, headers[h]);
              }
            };
          } else {
            opts.uri = appendCmcdQuery(opts.uri, keys);
          }

          return opts;
        };

        player.tech().vhs.xhr.onRequest(playerXhrRequestHook);
      });
    }

    initializeV2(player) {
      const cmcdV2Data = new CmcdV2Data(player, this.sid, this.cid); // Initialize Response Mode Controller

      const responseModeTargets = this.targets.filter(target => target.mode === 'response');

      if (responseModeTargets.length > 0) {
        this.responseModeController = new ResponseModeController(player, cmcdV2Data, responseModeTargets);
      } // Initialize Event Mode Controller


      const eventModeTargets = this.targets.filter(target => target.mode === 'event');

      if (eventModeTargets.length > 0) {
        this.eventModeController = new EventModeController(player, cmcdV2Data, eventModeTargets);
      } // Keep v1 request mode for backward compatibility


      const requestModeTargets = this.targets.filter(target => target.mode === 'request' || !target.mode);

      if (requestModeTargets.length > 0 || this.targets.length === 0) {
        this.initializeV1(player);
      }
    }

    setId(id) {
      if (id.sid) {
        this.sid = id.sid;
      }

      if (id.cid) {
        this.cid = id.cid;
      }
    }

    getId() {
      return {
        sid: this.sid,
        cid: this.cid
      };
    }

    getSessionId() {
      return this.sid;
    }

    destroy() {
      if (this.responseModeController) {
        this.responseModeController.destroy();
        this.responseModeController = null;
      }

      if (this.eventModeController) {
        this.eventModeController.destroy();
        this.eventModeController = null;
      }

      super.destroy();
    }

  }

  function handleEvents(player) {
    // startup
    player.on('loadedmetadata', function () {
      isWaitingEvent = false;
    }); // seeking or buffer-empty event

    player.on('waiting', function () {
      isWaitingEvent = true;
    }); // all it's okey

    player.on('canplay', function () {
      isWaitingEvent = false;
    });
  } // Define default values for the plugin's `state` object here.


  Cmcd.defaultState = {}; // Include the version number.

  Cmcd.VERSION = version; // Register the plugin with video.js.

  videojs__default["default"].registerPlugin('cmcd', Cmcd);

  return Cmcd;

}));
