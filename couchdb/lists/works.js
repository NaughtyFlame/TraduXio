function(head, req) {
  // !code lib/traduxio.js
  // !code lib/mustache.js

  start({headers: {"Content-Type": "text/html;charset=utf-8"}});
  var data = {languages:[]};
  var languageData = null;
  var authorData = null;
  var lastLanguage = null;
  var lastAuthor = null;
  while (row = getRow()) {
    var l = row.key[0];
    if (l!=lastLanguage) {
      if (languageData) {
        languageData.authors.push(authorData);
        data.languages.push(languageData);
      }
      languageData = {
        code: l,
        authors: []
      };
      lastLanguage = l;
      authorData = null;
    }
    var a = row.key[1];
    if (a!=lastAuthor || !authorData) {
      if (authorData) {
        languageData.authors.push(authorData);
      }
      authorData  = {
        name: a,
        works: []
      };
      lastAuthor= a;
    }
    authorData.works.push({
      id: row.id,
      name: row.value.title,
      original: row.value.original,
      languages: row.value.languages.join(", ")
    });
  }
  if (authorData) {
    languageData.authors.push(authorData);
    data.languages.push(languageData);
  }
  data.name="works";
  data.scripts=["ul-close"];
  data.script=true;
  data.css=true;
  data.prefix="..";
  data.i18n=localized();
  data.page_title=data.i18n["i_works_list"];
  return Mustache.to_html(this.templates.works, data,this.templates.partials);
}
