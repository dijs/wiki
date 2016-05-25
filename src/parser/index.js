var utils = require('./utils');

/**
 * Main markup syndax parser
 * @param  {string}   data     markup text
 * @param  {Function} callback callback function
 * @return {undefined}         return undefined when error occurs
 */
module.exports = function(data, callback) {

  var content;

  /**********************************
   * Parse scraping result,         *
   * which is in the format of JSON *
   **********************************/

  try {
    content = JSON.parse(data);
  } catch(e) {
    callback(e);
    return;
  }

  if (!content.query) { callback(new Error('Query Not Found')); return; }

  /**
   * Get JSON data
   */
  var json = content.query.pages;
  var key  = Object.keys(json);

  if (key.indexOf('-1') === 0) {
    callback(new Error('Page Index Not Found'));
    return;
  } else if(!json[key]){
    callback(new Error('Malformed Response Payload'));
    return;
  } else if (json[key].revisions[0]['*'].indexOf('REDIRECT') > -1) {
    callback(new Error(json[key].revisions[0]['*']));
    return;
  }

  /**
   * Get the JSON data that contains infobox section
   */
  var reg    = new RegExp('{{[Ii]nfobox(.|\n)*}}', 'g');
  var text   = reg.exec(json[key].revisions[0]['*']);
  if (!text) { callback(new Error('Infobox Not Found')); return; }
  text = text[0];


  /************************
   * Remove useless marks *
   ************************/

  /*
   * Remove comments
   */
  text = utils.replaceAll('<!--.*-->', '', text);
  /*
   * Remove reference
   * TODO: support reference in advanced model
   */
  text = utils.replaceAll('<ref.*(/>|>.*</ref>)', '', text);
  /*
   * Remove all HTML tags like '<br>', etc.
   */
  text = utils.replaceAll('<[^>]+>', '', text);
  /*
   * Remove footnote
   * TODO; support footnote in advanced model
   */
  text = utils.replaceAll('\{\{refn[^\}\}]*?\}\}', '', text);

  /*
   * Merge order, bulleted, unbulleted, Pagelist
   * list items to one line
   */
  var lists = text.match(/\{\{(order|bulleted|unbulleted|Pagelist)(.*\n)*?\}\}/g);
  if (lists && lists.length) {
    lists.forEach(function(l) {
      text = text.replace(l, l.replace('{{', '').replace('}}', '')
                              .replace(/(order|bulleted|unbulleted)\slist\n\|/g, '')
                              .split('\n|').join(', '));
    });
  }

  /*
   * Parse URL
   */
  lists = text.match(/\{\{(URL)(.*)\}\}/g);
  if (lists && lists.length) {
    lists.forEach(function(l) {
      var tmp = l.replace('{{', '').replace('}}', '').split('|');
      text = (tmp && tmp.length > 0) ? text.replace(l, tmp[tmp.length - 1]) : text;
    });
  }

  /*
   * Parse Start date
   */
  lists = text.match(/\{\{(Start\sdate)(.*)\}\}/g);
  if (lists && lists.length) {
    lists.forEach(function(l) {
      var tmp = l.replace('{{', '').replace('}}', '').split('|');
      /* Pop first element: 'Start date' */
      tmp.shift();
      text = (tmp) ? text.replace(l, tmp.join('/')) : text;
    });
  }

  /*****************************
   * Analyze each line of text *
   *****************************/

  var result = {};
  text.split('\n|').forEach(function(item) {
    /**
     * Extract {item_name, item_content} from each item
     */
    var itemIndex = item.indexOf('=');
    if (itemIndex != -1) {
      var item_name = item.substr(0, itemIndex).trim();
      var item_content = item.substr(itemIndex + 1).trim().split('\n')[0];

      /*
       * Extract all simple texts inside '[[ ]]'
       * such as [[France]], [[Language French|French]], etc.
       */
      var find = item_content.match(/\[\[.*?\]\]/g);
      if (find) {
        find.forEach(function(substring) {
          var barestring = substring.replace('[[', '').replace(']]', '');
          var arr = barestring.split('|');
          /**
           * TODO: support link.
           * Reference: https://en.wikipedia.org/wiki/Help:Wiki_markup#Links_and_URLs
           */
          item_content = item_content.replace(substring, arr[arr.length - 1]);
        });
      }

      /*
       * Remove font style
       * {{fake clarify}}
       * {{fake citation needed}}
       * {{fake elucidate}}
       * {{fake heading}}
       * {{fake notes and references}}
       * {{dummy ref}}
       * {{dummy backlink}}
       * {{dummy footnote}}
       * {{break}}
       * {{break|5}}
       * {{clear}}
       * {{clear|left}}
       * {{clear|right}}
       * {{plainlist}}
       * {{startflatlist}}
       * {{flatlist}}
       * {{hlist|first item|second item|third item|...}}
       * {{bulleted list |item1 |item2 |...}}
       * {{pagelist}}
       * {{nowrap}}
       * {{italics}}
       * {{smallcaps|small caps}}
       * {{pad|4.0em}}
       */
      while (item_content.indexOf('{{nowrap|') !== -1) {
        item_content = item_content.replace('{{nowrap|', '');
        item_content = item_content.replace('}}', '');
      }

      while (item_content.indexOf('{{small|') !== -1) {
        item_content = item_content.replace('{{small|', '');
        item_content = item_content.replace('}}', '');
      }

      if (item_content.indexOf('{{native') !== -1) {
        find = item_content.match(/\{\{native[^\}\}]*?\}\}/g);
        find && find.forEach(function(substring) {
          item_content = item_content.replace(substring, substring.split('|')[2]);
        });
      }

      /* Remove simple vertical list tag */
      if (item_content.indexOf('{{vunblist') !== -1 &&
          item_content.split('{{').length < 3) {

        find = item_content.match(/\{\{vunblist[^\}\}]*?\}\}/g);
        find && find.forEach(function(substring) {
          var tmp = substring.split('|');
          tmp.shift();
          item_content = item_content.replace(substring, tmp.join(',').replace('}}', ''));
        });
      }

      /* Remove horizon list tag */
      if (item_content.indexOf('{{hlist') !== -1) {
        find = item_content.match(/\{\{hlist[^\}\}]*?\}\}/g);
        find && find.forEach(function(substring) {
          var tmp = substring.split('|');
          tmp.shift();
          item_content = item_content.replace(substring, tmp.join(',').replace('}}', ''));
        });
      }

      /* Remove efn tag */
      if (item_content.indexOf('{{efn') !== -1) {
        find = item_content.match(/\{\{efn[^\}\}]*?\}\}/g);
        find && find.forEach(function(substring) {
          item_content = item_content.replace(substring, '');
        });
      }

      item_content = utils.replaceAll('&nbsp', ' ', item_content);
      item_content = utils.replaceAll('\n\}\}', '', item_content);
      result[item_name] = item_content;
    }
  });

  callback(null, JSON.stringify(result));
  return;
};
