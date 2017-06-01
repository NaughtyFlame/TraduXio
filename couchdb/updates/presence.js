function(doc,req) {
  //!code lib/traduxio.js
  if (!doc) return [null,{code:404,body:JSON.stringify({error:"Not found"})}];
  try {
    var body=(req.body && req.body!='undefined')?JSON.parse(req.body):{};
  } catch (e) {
    return [null,{code:400,body:JSON.stringify({error:"JSON parsing error "+req.body})}];
  }
  var result={};
  var user=Traduxio.getUser();
  result.user=user.name;
  result.anonymous=user.anonymous;
  if (req.method=="DELETE") {
    if (Traduxio.userQuit(user.name)) {
      result.ok="left correctly";
    } else {
      result.error=user.name+" was not registered";
    }
  } else {
    var msg="pinged correctly";
    if (!doc.users || !doc.users[user.name]) {
      msg="registered correctly";
    } else {
      if (body.changename && body.changename != user.name && user.anonymous) {
        var msg="changed name correctly";
        var oldname=user.name;
        if (Traduxio.userRename(user.name,body.changename,user.anonymous)) {
          result.user=body.changename;
          Traduxio.userQuit(oldname);
          var ok=true;
        } else {
          var error="could not change name";
        }
      }
    }
    if (ok && !error || Traduxio.userActivity()) {
      result.ok=msg;
    } else {
      result.error=error || "too early";
    }
    result.sessionLength=Traduxio.sessionLength*0.95;
    result.users={};
    for (var u in Traduxio.doc.users) {
      result.users[u]={name:doc.users[u].name,anonymous:doc.users[u].anonymous};
    }
  }
  if (result.ok)
    return [doc,JSON.stringify(result)];
  else
    return [null,JSON.stringify(result)];
}
