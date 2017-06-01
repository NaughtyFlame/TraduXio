function(doc,req) {
  //!code lib/traduxio.js
  if (req.body === "undefined") req.body=false;

  if (doc) {
    var message=req.body;
    if (message) {
      var subject=req.query.subject || "chat";
      doc.messages=doc.messages || {};
      doc.messages[subject]=doc.messages[subject] || [];
      var forum=doc.messages[subject];
      var time=new Date();
      var entry={message:message};
      if (req.query.from) entry.author=req.query.from;
      Traduxio.addActivity(forum,entry);
      return [doc,JSON.stringify(entry)];
    } else {
      return [null,{code:403,body:"Empty message"}];
    }
  }
  return [null,{code:404,body:"No doc"}];
}