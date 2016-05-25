/**
 * Collection of utils
 * @type {Object}
 */
var utils   = {
  /**
   * Relace all target strings
   * @method function
   * @param  {string} find    target snippet
   * @param  {string} replace new snippet
   * @param  {string} str     original string
   * @return {string}         new string with new snippet
   */
  replaceAll: function(find, replace, str) {
    if(str) {
      return str.replace(new RegExp(find, 'gm'), replace).trim();
    } else {
      return null;
    }
  },

  /**
   * Valid JSON format
   * @method function
   * @param  {string}  text        JSON string
   * @return {boolean} boolean     valid or not
   */
  checkJson: function(text) {
    if (text && /^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').
        replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
        replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
      return true;
    } else {
      return false;
    }
  }
};

module.exports = utils;
