/*

highlight v4

Highlights arbitrary terms.

<http://johannburkard.de/blog/programming/javascript/highlight-javascript-text-higlighting-jquery-plugin.html>

MIT license.

Johann Burkard
<http://johannburkard.de>
<mailto:jb@eaio.com>

*/

jQuery.fn.highlight = function(pat,classname) {
  classname=classname || "highlight";
 function innerHighlight(node, pat) {
  var skip = 0;
  if (node.nodeType == 3) {
   var pattest=pat.toLowerCase(),nodetest=node.data.toLowerCase();
   if (pattest.length!=pat.length || nodetest.length!=node.data.length) {
     pattest=pat.toUpperCase();
     nodetest=node.data.toUpperCase();
     if (pat.toUpperCase().length==pat.length && node.data.toUpperCase().length==node.data.length) {
       pattest=pat;
       nodetest=node.data;
    }
   }
   var pos = nodetest.indexOf(pattest);
   if (pos >= 0) {
    var spannode = document.createElement('span');
    spannode.className = classname;
    var middlebit = node.splitText(pos);
    var endbit = middlebit.splitText(pat.length);
    var middleclone = middlebit.cloneNode(true);
    spannode.appendChild(middleclone);
    middlebit.parentNode.replaceChild(spannode, middlebit);
    skip = 1;
   }
  }
  else if (node.nodeType == 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) {
   for (var i = 0; i < node.childNodes.length; ++i) {
    i += innerHighlight(node.childNodes[i], pat);
   }
  }
  return skip;
 }
 return this.length && pat && pat.length ? this.each(function() {
  innerHighlight(this, pat);
 }) : this;
};

jQuery.fn.removeHighlight = function(classname,pat) {
  classname=classname || "highlight";
  return this.find("span."+classname).each(function() {
    if (!pat || pat.toUpperCase()==$(this).text().toUpperCase()) {
      with (this.parentNode) {
        replaceChild(this.firstChild, this);
        normalize();
      }
    }
  }).end();
};
