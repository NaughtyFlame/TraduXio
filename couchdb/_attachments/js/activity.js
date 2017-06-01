
(function($,Traduxio){

  var current="";
  var callbacks={};
  var activityTimeout=null;
  var sessionLength=600000;
  var initialWaitTime=500;
  var maxWaitTime=60000;

  function resetTimeout(time) {
    time=time||sessionLength;
    if (activityTimeout) clearTimeout(activityTimeout);
    activityTimeout=setTimeout(presence,time);
  };

  var presenceWaitTime=initialWaitTime;

  function presence (callback) {
    return $.ajax({
      url:Traduxio.getId()+"/presence",
      type:"POST",
      dataType:"json"
    }).done(function(result) {
      if (result.user) {
        me=result.user;
        if (result.ok) {
          receivedActivity({
            type:"session",
            author:result.user,
            anonymous:result.anonymous,
            isMe:true,
            entered:true
          });
        }
      }
      if (result.users) {
        for (var user in result.users) {
          receivedActivity({
            type:"session",
            author:user,
            anonymous:result.users[user].anonymous,
            entered:true
          });
        }
        var names=Object.keys(result.users);
        for (var user in result.users) {
          if (names.indexOf(user)==-1) {
            receivedActivity({
              type:"session",
              author:user,
              anonymous:result.users[user].anonymous,
              left:true
            });
          }
        }
      }
      if (result.sessionLength) {
        sessionLength=result.sessionLength;
      }
      presenceWaitTime=initialWaitTime;
      resetTimeout();
      if (typeof callback=="function") callback();
    }).fail(function(result) {
      presenceWaitTime*=2;
      presenceWaitTime=Math.min(presenceWaitTime,maxWaitTime);
      resetTimeout(presenceWaitTime);
    });
  };

  var leaving=false;
  function leave() {
    leaving=true;
    $.ajax({
      url:Traduxio.getId()+"/presence",
      type:"DELETE"
    });
  };

  $.extend(Traduxio,{
    activity:{
      register:function (type,callback) {
        callbacks[type]=callback;
      },
      wasActive:function() {
        resetTimeout();
      },
      getColor:function(user) {
        return getUser(user).color;
      },
      presence:presence
    }
  });

  var changeWaitTime=initialWaitTime;

  function listenChanges(id,seq) {
    $.ajax({
      url:id+"/changes/"+seq,
      dataType:"json"
    })
    .done(function(result) {
      if(result.last_seq!=seq) {
        seq=result.last_seq;
      }
      if (result.results && result.results.length>0) {
        checkActivity(id);
      }
      if (changeWaitTime==maxWaitTime) {
        Traduxio.chat.addMessage({message:"problème de connexion résolu",author:"Traduxio"});
      }
      changeWaitTime=initialWaitTime;
    })
    .fail(function() {
      if (changeWaitTime<maxWaitTime) {
        changeWaitTime*=2;
      }
      if (changeWaitTime>maxWaitTime) {
        changeWaitTime=maxWaitTime;
        Traduxio.chat.addMessage({message:"problème de connexion",author:"Traduxio"});
      }
    })
    .always(function() {
      setTimeout(listenChanges,changeWaitTime,id,seq);
    });
  };

  function checkActivity(id,delay,callback) {
    var url=id+"/activity";
    if (delay) url+="?delay="+delay;
    else if (current) url+="?since="+current;
    else {
      return {done:function(){}};
    }
    var s=initialWaitTime;
    function go(){
      $.ajax({
        cache:delay?false:true,
        url:url,
        dataType:"json"})
      .done(function(result) {
        if (result.now) current=result.now;
        if (result.activity) {
          try {
            result.activity.forEach(receivedActivity);
          } catch (E) {
            console.log(E);
          }
        }
        if (typeof callback =="function") callback();
      }).fail(function() {
        if (typeof callback =="function") {
          if (s>maxWaitTime) {
            alert("problème de connexion apparemment, essayez plus tard");
          } else {
            setTimeout(go,s);
            s*=2;
          }
        }
      });
    }
    go();
  };

  function receivedActivity(activity) {
    if (activity.seq && activity.seq < Traduxio.getSeqNum()) {
      activity.isPast=true;
    }
    var user;
    if (activity.type=="session") {
      user=sessionInfo(activity);
    } else if (activity.author) {
      user=getUser(activity.author);
    }
    if (activity.author==me) {
      activity.isMe=true;
    }
    if (user) {
      activity.anonymous=activity.anonymous || user.anonymous;
      activity.color=user.color;
    }

    if (activity.type && callbacks[activity.type]) {
      callbacks[activity.type](activity);
    }
  };

  function sessionInfo(activity) {
    if (activity.author)
      if (activity.entered) {
        activity.message="est entré dans la traduction";
      }
    if (activity.left) {
      activity.message="est sorti de la traduction";
      if (!activity.isPast) {
        if (activity.isMe) {
          leaving ? null : presence();
        }
      }
    }
    var user;
    if (activity.rename) {
      activity.message="est maintenant connu comme "+activity.newname;
      user=rename(activity.author,activity.newname,activity.anonymous,!activity.isPast);
    } else {
      user=getUser(activity.author);
    }
    if (Traduxio.chat && Traduxio.chat.addMessage) {
      Traduxio.chat.addMessage(activity);
    }
    return user;
  }

  var users={};
  var offlineUsers={};
  var me="";
  var offset=0;
  var colors=["blue","peru","green","red","orangered","lightskyblue","purple","seagreen","tomato"];

  function currentColor() {
    return colors[offset++ % colors.length];
  }

  function getUser(username) {
    var user=users[username] || {};
    if (!user.color) {
      user.color=currentColor();
    }
    user.name=username;
    users[username]=user;
    return user;
  }

  function rename(username,newname,anonymous,update) {
    if (!username in users || newname in users) {
      user=getUser(newname);
    } else {
      user=getUser(username);
    }
    user.name=newname;
    if (anonymous) user.anonymous=true;
    else delete user.anonymous;
    users[newname]=user;
    delete users[username];

    return user;
  }

  var defaultShowTime=5000;

  $.fn.showPane=function (after) {
    var hideBack=this.is(":hidden");
    var self=this;
    this.slideDown(function() {
      if (typeof after=="function") after(function(showtime) {
        if (typeof showtime == "undefined") showTime=defaultShowTime;
        if (hideBack && showtime) {
          self.show().delay(showtime).slideUp();
        }
      });
    });
  };

  $(document).ready(function(){
    var id = Traduxio.getId();
    if (id) {
      var p=initialWaitTime;
      presence(function() {
        checkActivity(id,86600,function(){
          listenChanges(id,Traduxio.getSeqNum());
        });
      });
      $(window).on("beforeunload",leave);
    }
  });

})(jQuery,Traduxio);
