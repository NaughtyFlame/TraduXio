function(doc) {

  getActivity=function(activity,data) {
    function touch(ac) {
      var a={};
      for (var t in ac) {
        a[t]=ac[t];
      }
      for (var t in data) {
        a[t]=data[t];
      }
      return a;
    };

    if (activity && activity.map) {
      return activity.map(touch);
    }
    return [];

  };

  var activity=[];


  activity=activity.concat(getActivity(doc.edits,{type:"edit"}))
    .concat(getActivity(doc.session,{type:"session"}))
    .concat(doc.glossary?getActivity(doc.glossary.edits,{type:"glossary"}):[]);

  if (doc.messages) for(var forum in doc.messages ) {
      activity=activity.concat(getActivity(doc.messages[forum],{type:"forum",forum:forum}));
  }

  activity.forEach(function(a) {
    if (a.when && a.type)  emit([doc._id,a.type,new Date(a.when).toISOString()], a);
  });

}
