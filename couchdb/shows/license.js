function(work, req) {
  // !code lib/traduxio.js
  // !code lib/mustache.js

  var version=req.query.version;

  var data={id:work._id};
  data.work_title=work.title;
  data.work_creator=work.creator;
  data.work_date=work.date;
  data.text=null;
  data.i18n=localized();

  if (version) {
    if (version=="original") {
      data.text=work;
      data.text.creator=work.creator?work.creator:"Anonymous";
    } else if (work.translations && work.translations[version]) {
      data.text=work.translations[version];
      data.text.creator=data.i18n["i_trad"]+" "+version;
    }
  }
  if (!data.text) {
    log("No text");
    start({"code":404});
    return "Not Found";
  }
  data.text.license=data.text.creativeCommons;
  data.name="license";
  data.css=true;
  data.script=true;
  data.prefix="../../..";
  data.page_title=data.i18n.getTranslated("i_license_for",data.text.creator,data.text.title);

  return Mustache.to_html(this.templates.license, data, this.templates.partials);
}
