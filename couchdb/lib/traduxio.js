Traduxio= {

  sessionLength:30 * 60 * 1000, //1/2 hour

  doc:doc,
  req:req,

  compareActivities:function(a1,a2) {
    return new Date(a1.when).getTime()-new Date(a2.when).getTime();
  },

  age:function(activity,r) {
    r=r||new Date();
    return r.getTime()-this.time(activity);
  },

  time:function(activity) {
    return new Date(activity.when).getTime();
  },

  checkActiveUsers:function() {
    var toQuit=[];
    for (var user in this.doc.users) {
      var activeDate=new Date(this.doc.users[user].active);
      var expirationDate=new Date(activeDate.getTime()+this.sessionLength);
      if (expirationDate < new Date()) {
        toQuit.push(user);
      }
    }
    toQuit.forEach(function(user){log(user+" leaves for inactivity");Traduxio.userQuit(user);});
  },

  userRename:function(oldName,newName,anonymous) {
    if (this.doc.users && this.doc.users[oldName] && newName && oldName!=newName && !this.doc.users[newName]) {
      user=this.doc.users[oldName];
      user.name=newName;
      user.anonymous=anonymous;
      this.doc.users[newName]=user;
      delete this.doc.users[oldName];
      this.doc.session=this.doc.session || [];
      this.addActivity(this.doc.session,{rename:true,author:oldName,newname:newName,anonymous:anonymous},false);
      delete user.active;
      if (user.footprint && this.doc.browsers) {
        this.doc.browsers[user.footprint]=user;
      }
      return true;
    }
    return false;
  },

  userQuit:function(username) {
    if (this.doc.users && this.doc.users[username]) {
      this.doc.session=this.doc.session || [];
      this.addActivity(this.doc.session,{left:true,author:username},false);
      delete this.doc.users[username];
      log("removing "+username+" from active users of "+this.doc._id);
      return true;
    }
    return false;
  },

  userActivity:function(username) {
    this.doc.users=this.doc.users || {};

    var washere=false;
    var user;
    if (username) {
      user=this.doc.users[username];
      //conversion from old format
      if (!user.name) user.name=username;
      //TODO remove when data is conform
    } else {
      user=this.getUser();
      username=user.name;
      if (this.doc.users[username] && this.doc.users[username].active) {
        user.active=this.doc.users[username].active;
      } else {
        delete user.active;
      }
      log(user);
    }
    if (!user) return false;
    var alreadyActive=false;
    if(this.doc.users[username]) {
      alreadyActive=true;
    }
    this.doc.users[username]=user;
    log(this.doc.users);
    var update=false;
    if (this.doc.users[username].active) {
      var activeDate=new Date(this.doc.users[username].active);
      var expirationDate=new Date(activeDate.getTime()+this.sessionLength/2);
      if (expirationDate < new Date()) {
        update=true;
      }
    } else {
      update=true;
    }
    if (update) {
      this.doc.users[username].active=new Date();
      if (username==this.getUser().name) this.checkActiveUsers();
    }
    if (!alreadyActive) {
      this.doc.session=this.doc.session || [];
      this.addActivity(this.doc.session,{entered:true,author:username,anonymous:user.anonymous},false);
    }
    return update;
  },

  clearActivity:function (activityList,delay) {
    delay=delay || this.sessionLength;
    if (activityList && activityList.length) {
      this.doc.activity.sort(this.compareActivities);
      var now=new Date();
      for (var i=0;i<activityList.length && this.age(activityList[i],now)>delay;i++);
      log("splicing activity for "+i);
      activityList.splice(0,i);
    }
  },


  getNewName:function() {

    var generateName=function(i) {
      return "anonym-"+this.req.uuid.substr(-3-i,3);
    }.bind(this);

    var exists=function (name) {
      if (!this.doc.browsers) return false;
      for (var f in this.doc.browsers) {
        if (this.doc.browsers[f].name==name) return true;
      }
      return false;
    }.bind(this);

    var i=0,name;
    do {
      name=generateName(i++);
    } while (exists(name) && i<this.req.uuid.length);
    return exists(name) ? false : name;
  },

  getUser:function() {
    var user;

    //conversion from old data
    if (this.doc.anonymous) {
      this.doc.browsers={};
      for (var f in this.doc.anonymous) {
        this.doc.browsers[f]={name:this.doc.anonymous[f],anonymous:true};
      }
      delete this.doc.anonymous;
    }
    //TODO remove when all data is converted

    var footprint=this.req.peer+"|"+this.req.headers["User-Agent"]+"|"+this.req.headers.Host;
    this.doc.browsers=this.doc.browsers || {};
    if (this.req.userCtx.name) {
      user={name:this.req.userCtx.name};
      if (this.doc.browsers[footprint] && this.doc.browsers[footprint].name!=user.name) {
        this.userRename(this.doc.browsers[footprint].name,user.name);
      }
      if (this.doc.users[user.name] && this.doc.users[user.name].anonymous && this.doc.users[user.name].footprint && this.doc.users[user.name].footprint!=footprint) {
        this.userRename(user.name,this.getNewName());
      }
    } else {
      if (this.doc.browsers[footprint]) {
        user=this.doc.browsers[footprint];
        if (!user.anonymous) {
          this.userQuit(user.name);
          user.anonymous=true;
          user.name=this.getNewName();
        }
        if (!user.name || this.doc.users[user.name] && this.doc.users[user.name].footprint && this.doc.users[user.name].footprint!=footprint) {
          user.name=this.getNewName();
        }
      } else {
        user={name:this.getNewName(),anonymous:true};
      }
    }
    if (user.anonymous) user.footprint=footprint;
    else delete user.footprint;
    this.doc.browsers[footprint]=user;
    return user;
  },

  addActivity: function(activityList,data,active) {
    if (typeof active == "undefined") active=true;
    var activity=data || {};
    activity.when = activity.when || new Date();
    activity.seq = this.req.info.update_seq;
    if (!activity.author) {
      var user=this.getUser();
      activity.author=user.name;
      if (user.anonymous) activity.anonymous=true;
    }
    activityList.push(activity);
    if (active) this.userActivity();
    this.fixActivity(activityList);
    activityList.sort(this.compareActivities);
  },

  fixActivity: function(activityList) {
    for (var i in activityList) {
      var activity=activityList[i];
      activity.when=new Date(activity.when);
      activity.seq=activity.seq || this.req.info.update_seq;
      if (!activity.seq || activity.seq > this.req.info.update_seq) {
        activity.seq=this.req.info.update_seq-1;
      }
      //for old data
      if (!activity.anonymous && (!activity.author || (activity.author.indexOf("anonym-")==0)) ) {
        activity.anonymous=true;
      }
      //TODO remove when all data is converted
    }
  },

  getActivity: function(activityList,since,data,activity) {
    data=data || {};
    var activity=activity || [];
    for (var i=activityList.length-1;i>=0 && this.age(activityList[i],since)<=0;i--) {
      var a={};
      for (var t in activityList[i]) {
        a[t]=activityList[i][t];
      }
      for (var t in data) {
        a[t]=data[t];
      }
      activity.unshift(a);
    }
    return activity;
  }

};
