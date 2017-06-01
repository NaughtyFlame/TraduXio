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

  var work={title:doc.title,creator:doc.creator,date:doc.date,language:doc.language};

  activity=activity.concat(getActivity(doc.edits,{type:"edit",work:work}))
    .concat(doc.glossary?getActivity(doc.glossary.edits,{type:"glossary",work:work}):[]);

  if (doc.messages) for(var forum in doc.messages ) {
      activity=activity.concat(getActivity(doc.messages[forum],{type:"forum",forum:forum,work:work}));
  }

  activity.forEach(function(a) {
    if (a.when)  emit(new Date(a.when).toISOString(), a);
  });

}
