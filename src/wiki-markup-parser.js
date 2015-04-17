var infoboxPattern = /{{[Ii]nfobox(.|\n)*}}/g;

function replaceAll(find, replace, str) {
  if (str) {
    return str.replace(new RegExp(find, 'gm'), replace).trim();
  } else {
    return null;
  }
}

export default function(data) {
  var result = {};

  var text = infoboxPattern.exec(data);

  if (!text) {
    return {};
  }

  text = text[0];

  // Remove comments.
  text = replaceAll('<!--.*-->', '', text);
  // Remove reference.
  text = replaceAll('<ref.*(/>|>.*</ref>)', '', text);
  // Remove all HTML tags.
  text = replaceAll('<[^>]+>', '', text);
  // Remove page regerences.
  text = replaceAll('\{\{refn[^\}\}]*?\}\}', '', text);

  // Check each line in text.
  if (text) {
    text.split('\n|').forEach(function(item) {
      var temp = item.split(' = ');

      if (temp.length === 2 && temp[1].trim() !== '') {
        // Get left part and right part.
        var itemName = temp[0].trim(),
          itemContent = temp[1].trim().split('\n')[0];

        // Extract all simple texts inside '[[ ]]',
        // such as [[France]], [[Language French|French]], etc.
        var find = itemContent.match(/\[\[.*?\]\]/g);
        if (find) {
          find.forEach(function(substring) {
            var arr = substring.split('|');
            if (arr.length === 1) {
              itemContent = itemContent.replace(substring,
                substring.substr(2, substring.length - 4));
            } else if (arr.length === 2) {
              itemContent = itemContent.replace(substring,
                arr[1].substr(0, arr[1].length - 2));
            }
          });
        }

        // Remove font style
        while (itemContent.indexOf('{{nowrap|') !== -1) {
          itemContent = itemContent.replace('{{nowrap|', '');
          itemContent = itemContent.replace('}}', '');
        }

        while (itemContent.indexOf('{{small|') !== -1) {
          itemContent = itemContent.replace('{{small|', '');
          itemContent = itemContent.replace('}}', '');
        }

        if (itemContent.indexOf('{{native') !== -1) {
          find = itemContent.match(/\{\{native[^\}\}]*?\}\}/g);
          if (find) {
            find.forEach(function(substring) {
              var arr = substring.split('|');
              itemContent = itemContent.replace(substring, arr[2]);
            });
          }
        }

        // Remove list tag
        if (itemContent.indexOf('{{unbulleted') !== -1) {
          find = itemContent.match(/\{\{unbulleted[^\}\}]*?\}\}/g);
          if (find) {
            find.forEach(function(substring) {
              var arr = substring.split('|');
              arr.shift();
              itemContent = itemContent.replace(substring, arr.join(',').replace('}}', ''));
            });
          }
        }

        // Remove simple vertical list tag
        if (itemContent.indexOf('{{vunblist') !== -1 &&
          itemContent.split('{{').length < 3) {
          find = itemContent.match(/\{\{vunblist[^\}\}]*?\}\}/g);
          if (find) {
            find.forEach(function(substring) {
              var arr = substring.split('|');
              arr.shift();
              itemContent = itemContent.replace(substring, arr.join(',').replace('}}', ''));
            });
          }
        }

        // Remove horizon list tag
        if (itemContent.indexOf('{{hlist') !== -1) {
          find = itemContent.match(/\{\{hlist[^\}\}]*?\}\}/g);
          if (find) {
            find.forEach(function(substring) {
              var arr = substring.split('|');
              arr.shift();
              itemContent = itemContent.replace(substring, arr.join(',').replace('}}', ''));
            });
          }
        }

        // Remove efn tag
        if (itemContent.indexOf('{{efn') !== -1) {
          find = itemContent.match(/\{\{efn[^\}\}]*?\}\}/g);
          if (find) {
            find.forEach(function(substring) {
              itemContent = itemContent.replace(substring, '');
            });
          }
        }

        itemContent = replaceAll('&nbsp', ' ', itemContent);
        itemContent = replaceAll('\n\}\}', '', itemContent);
        result[itemName] = itemContent;
      }
    });
  }

  return result;
}