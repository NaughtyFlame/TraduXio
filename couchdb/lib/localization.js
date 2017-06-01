// !json i18n

function getMyLanguage() {
  if (req.headers["Accept-Language"]) {
    return req.headers["Accept-Language"].split(",")[0];
  }
  return "en";
}

function getPreferredLanguage() {
  var available = "en";
  var required = req.headers["Accept-Language"];
  if (required) {
    for each (var l in required.split(",")) {
      var preferred = l.substring(0,2);
      if (i18n.hasOwnProperty(preferred)) {
        available = preferred;
        break;
      }
    }
  }
  return available;
}

function localized(language) {
  var available = "en";
  var language=language || getPreferredLanguage();
  var items=i18n[language];
  items.lang=language;
  if (language != available) {
    for (var item in i18n[available]) {
      if (!items[item]) items[item]=i18n[available][item];
    }
  }
  if (js_i18n_elements) {
    var js_i18n={};
    js_i18n_elements.forEach(function (item) {
      if (items[item]) js_i18n[item]=items[item];
    });
    items.str=JSON.stringify(js_i18n);
  }
  items.getTranslated=function(item) {
    var args=Array.slice ? Array.slice(arguments) : Array.prototype.slice.call(arguments);
    args.shift();
    //show function only sends requested i18n elements, so need to modify the
    //js_i18n_elements array to get them here (and load them inside the template)
    var translation=items[item] || item;
    args.forEach(function(arg,i) {
      translation=translation.replace("{"+i+"}",arg);
    });
    return translation;
  }
  return items;
}
