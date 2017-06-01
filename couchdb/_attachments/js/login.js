function session() {
  $.ajax({
    url:"/_session",
    dataType:"json"
  }).done(function(result){
    updateUserInfo(result.userCtx);
  });
};

function updateUserInfo(ctx) {
  var sessionInfo=$("#session-info");
  if (ctx.name) {
    var userSpan=$("<span>").addClass("user").text(ctx.name);
    var logoutSpan=$("<span>").addClass("logout").text(Traduxio.getTranslated("i_logout")).on("click",function(){
      logout();
    });
    sessionInfo.empty().append(userSpan).append(" - ").append(logoutSpan);
  } else {
    var form=$("<form>").addClass("login");
    var username=$("<input>").addClass("username").attr("placeholder",Traduxio.getTranslated("i_username"));
    var password=$("<input>").addClass("password").attr("type","password").attr("placeholder",Traduxio.getTranslated("i_password"));
    var go=$("<input>").addClass("go").attr("type","submit").val(Traduxio.getTranslated("i_login"));
    var signup=$("<button>signup</button>").attr("onclick","signup()");
    form.append(username).append(password).append(go).append(signup).on("submit",function(e) {
      e.preventDefault();
      var name=username.val();
      var passwd=password.val();
      if (name && passwd)
        login(username.val(),password.val()).fail(function() {
          username.add(password).addClass("bad");
        });
      else username.add(password).addClass("bad");
    });
    sessionInfo.empty().append(form);
  }
}

function logout() {
  $.ajax({
    url:"/_session",
    dataType:"json",
    type:"DELETE"
  }).done(function(result){
    updateUserInfo(result);
    if (Traduxio && Traduxio.activity && Traduxio.activity.presence) {
      Traduxio.activity.presence();
    }
  });
}

function login(name,password) {
 return $.ajax({
    url:"/_session",
    dataType:"json",
    type:"POST",
    data:"name="+encodeURIComponent(name)+"&password="+encodeURIComponent(password)
  }).done(function(result){
    if (result.ok) {
      result.name=result.name || name;
      updateUserInfo(result);
      if (Traduxio && Traduxio.activity && Traduxio.activity.presence) {
        Traduxio.activity.presence();
      }
    }
  });
}

function signup(){
  var name = $(".username").val();
  var password = $(".password").val();

  var new_user = {
    "_id":"org.couchdb.user:"+name,
    "name":name,
    "password":password,
    "roles": [
   ],
   "type": "user"
  }

  var json_user = JSON.stringify(new_user);
  $.ajax({
    url:"http://127.0.0.1:5984/_users/org.couchdb.user:"+name,
    contentType:"application/json",
    type:"PUT",
    data:json_user
  });
  alert("un nouveau compte a été créé");
}

$(document).ready(function() {
  session();
});
