$.fn.concordancify = function() {

  default_language=$("html").prop("lang") || currentLanguage;
  default_query=$("body").data("query") || "";

  var search = $("#nav").data("i_search");

  this.append('<input id="query" type="search" name="query" placeholder="' + search + '" value="'
    +  default_query + '" />');
  this.append('<input id="submit" type="submit" value="'+getTranslated("i_search")+'"/>');
  this.append('<select id="language" name="language"/>');

  var form=this;

  getLanguageNames(function() {
    $.getJSON(getPrefix()+"/languages", function(result) {
      $.each(result.rows, function(i, o) {
        $("#language").append("<option value=\""+o.key+"\">" + o.key + " - " + getLanguageName(o.key) + "</option>");
      });
      $("#language").val($("html").prop("lang"));
    });
  });

  var submitForm=function(event) { //TODO jQuery 2
    event.preventDefault();
    var query = form.find('#query').val().toLowerCase();
    var language = $("#language").val();
    window.location.href = getPrefix()+'/works/concordance?' + $.param({
      startkey: '["' + language + '","' + query + '"]',
      endkey: '["' + language + '","' + query + '\\u9999"]',
      query: query,
      language: language
    });
  };

  this.on("submit",submitForm);
  $(".submit",form).on("click",submitForm);
  $("#language",form).on("keypress",function(e) {
      if(e.which == 13) {
        submitForm(e);
      }
  });
};

var languagesNames;
var currentLanguage='en';

function getLanguageName(id,target) {
  var result=id;
  target=target || default_language;
  if (languagesNames[id]) {
    var list=languagesNames[id];
    if(list[target]) {
      return list[target];
    } else if (list['en']) {
      return list['en'];
    } else if (list[id]) {
      return list[id];
    } else {
      result=list[Object.keys(list)[0]];
    }
  }
  return result;
}

function getLanguageNames(callback) {
  if (!languagesNames) {
    $.getJSON(getPrefix()+"/shared/languages.json",function(result) {
      languagesNames=result;
      callback(true);
    });
  } else {
     callback(true);
  }
}

$.fn.outerHtml = function() {
  return this.clone().wrap("<div>").parent().html();
};

function getPrefix() {
  return $("body").data("prefix");
}

function fixLanguages(container) {
  getLanguageNames(function() {
    if (container) {
      var language=$(container).find(".language").andSelf().filter(".language");
    } else {
      language=$(".language").not("select");
    }
    language.each(function() {
      var lang=$(this);
      var langID=lang.data("id");
      if (langID) {
        var langName=langID?getLanguageName(langID):"";
        if (lang.is(".expand")) {
          lang.text(langName);
          lang.prop('title',langID);
        } else {
          lang.prop('title',langName);
        }
      }
    });
  });
}

function getTranslated(name) {
  var args=Array.slice ? Array.slice(arguments) : Array.prototype.slice.call(arguments);
  args.shift();
  //show function only sends requested i18n elements, so need to modify the
  //js_i18n_elements array to get them here (and load them inside the template)
  var translation=i18n[name] || name;
  args.forEach(function(arg,i) {
    translation=translation.replace("{"+i+"}",arg);
  });
  return translation;
}

$(document).ready(function() {
  fixLanguages();
  $("form.concordance").concordancify();
  $("#nav li."+$(document.body).attr("id")).addClass("active");
});

Traduxio=$.extend({},{
    version:"1.0",
    getPrefix:getPrefix,
    getLanguagesNames:getLanguageNames,
    getLanguageName:getLanguageName,
    getTranslated:getTranslated,
    addCss:function(name) {
      $("<link/>", {
         rel: "stylesheet",
         type: "text/css",
         href: Traduxio.getPrefix()+"/shared/css/"+name+".css"
      }).appendTo("head");
    },
    getId:function() {
      return $("#hexapla").data("id");
    },
    getSeqNum:function() {
      return $(document.body).data("seq");
    }
  }
);
