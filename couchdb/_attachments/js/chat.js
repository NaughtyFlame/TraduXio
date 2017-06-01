(function($,Traduxio){

  var defaultMessage="Ceci est le chat traduxio pour ce texte";

  var chatContent,firstMessage;

  function createChat() {
    Traduxio.addCss("chat");
    var chatOuter = $("<div/>").attr("id","chat").hide();
    var header=$("<h1/>").text("Chat");
    var chatWindow=$("<div/>").addClass("chat");
    chatContent=$("<div/>").addClass("chat-content");
    var chatForm=$("<form>")
      .append($("<input/>",{type:"text",name:"message"}))
      .append($("<input/>",{type:"submit",name:"submit"}));
    chatOuter.append(header).append(chatWindow);
    chatWindow.append(chatContent).append(chatForm);
    var button=$("<span/>").attr("id","show-chat").attr("title","Chat")
      .on("click",function() {
        chatOuter.slideToggle(function(){
          var unread=chatOuter.find("div.message.unread");
          if (chatContent.is(":visible") && unread.length) {
            chatContent.clearQueue().animate({scrollTop:chatContent.scrollTop()+unread.filter(":first").position().top});
            unread.delay(1000).queue(function() {
              $(this).removeClass("unread");
              button.removeClass("unread");
            });
          }
        });
      }).insertBefore("#header form.concordance");
    header.on("click",function() {
      chatOuter.slideUp();
    });

    chatForm.on("submit",function(e) {
      e.preventDefault();
      var input=$("input[name=message]",this);
      var msg=input.val();
      if (msg) {
        $(input,this).attr("disabled","disabled");
        $.ajax({
          url:Traduxio.getId()+"/chat",
          type:"POST",
          dataType:"json",
          data:msg,
          success:function(result) {
            //addMessage(result);
            input.val("");
          },
          complete:function() {
            $(input,this).attr("disabled",null);
            Traduxio.activity.wasActive();
          }
        });
      }
    });
    $("#body").append(chatOuter);
    firstMessage=addMessage({author:"TraduXio",when:new Date().toISOString(),message:defaultMessage});
  }

  function addMessage(message) {
    if (message.message) {
      var div=$("<div/>").addClass("message");
      var author=$("<span/>").addClass("chat-author").text(message.author || "anonyme");
      if (message.anonymous || !message.author) author.addClass("anonymous");
      var date=$("<span/>").addClass("date").attr("title",message.when || "date inconnue")
        .text(new Date(message.when).toLocaleString());
      div.append(date).append(author).append(message.message || "empty");
      author.css({color:message.color});

      if (!message.isPast) {
        chatContent.append(div);
        if (!message.isMe) {
          div.addClass("unread");
          if (firstMessage && chatContent.is(":hidden")) {
            $("#show-chat").addClass("unread");
          }
        }
      } else {
        div.insertBefore(firstMessage);
      }
      if (chatContent.is(":visible")) {
        chatContent.clearQueue().animate({scrollTop:chatContent.get(0).scrollHeight}).delay(1000).queue(function() {
          $("#chat .unread").removeClass("unread");
        });
      }
      return div;
    }
  }

  $.extend(Traduxio,{
    chat:{addMessage:addMessage}
  });

  $(document).ready(function() {
    if (Traduxio.getId()) {
      createChat();
      Traduxio.activity.register("forum",addMessage);
    }
  });
})(jQuery,Traduxio);
