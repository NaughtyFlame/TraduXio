function(o, req) {
  // !code lib/traduxio.js
  // !code lib/mustache.js

  return Mustache.to_html(this.templates.welcome, {
    i18n:localized()
  });
}
