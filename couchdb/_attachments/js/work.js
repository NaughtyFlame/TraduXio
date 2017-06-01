var getTranslated=Traduxio.getTranslated;

$.fn.toggleName = function(name1, name2) {
  this.val(
    (this.val()==name1)? name2 : name1
  );
};

$.fn.toggleText = function(text1, text2) {
  this.text(
    (this.text()==text1)? text2 : text1
  );
};

function browseGlossary(callback) {
  var args=Array.slice ? Array.slice(arguments) : Array.prototype.slice.call(arguments);
  if (glossary) {
    var language,sentence;
    for (language in glossary) {
      for (sentence in glossary[language]) {
        args.shift();
        args.unshift(getGlossaryEntry(language,sentence));
        callback.apply(this,args);
      }
    }
  }
}

function getGlossaryEntry(language,sentence) {
  if (glossary && glossary[language] && glossary[language][sentence] ) {
    return {src_sentence:sentence,src_language:language,targets:glossary[language][sentence]};
  } else {
    return false;
  }
}

function addGlossaryEntry(glossaryEntry) {
  with (glossaryEntry) {
    glossary[src_language]=
        glossary[src_language] || {};
    glossary[src_language][src_sentence]=
        glossary[src_language][src_sentence] || {};
    if (!Object.keys(glossary[src_language][src_sentence]).length) {
      displayGlossaryAllText(glossaryEntry);
    }
    glossary[src_language][src_sentence][target_language]=target_sentence;
  }
}

function displayGlossaryAllText(glossaryEntry,version) {
  var versions;
  if (version) versions=[version];
  else versions=getVersions();
  versions.forEach(function(version) {
    displayGlossary(glossaryEntry,$(".unit",find(version)));
  });
}

function displayGlossary(glossaryEntry,element) {
  var l=element.getLanguage();
  if (l==glossaryEntry.src_language) {
    $("span.temp.glossary",
      element.highlight(glossaryEntry.src_sentence,"temp glossary"))
    .data("sentence",glossaryEntry.src_sentence)
    .removeClass("temp");
  }
}

function removeGlossary(glossaryEntry) {
  var g=getGlossaryEntry(glossaryEntry.src_language,glossaryEntry.src_sentence);
  if (g) {
    delete glossary[glossaryEntry.src_language][glossaryEntry.src_sentence][glossaryEntry.target_language];
    if (!Object.keys(glossary[glossaryEntry.src_language][glossaryEntry.src_sentence]).length) {
      getVersions().forEach(function(version) {
        var v=find(version);
        if (v.getLanguage()==glossaryEntry.src_language) {
          v.removeHighlight("glossary",glossaryEntry.src_sentence);
        }
      });
    }
  }
}

function editGlossaryEntry(glossaryEntry,language) {
  $("form#addGlossaryForm [name='src']").val(glossaryEntry.src_sentence);
  $("form#addGlossaryForm [name='target']").val(glossaryEntry.targets && glossaryEntry.targets[language] ? glossaryEntry.targets[language] : "");
  $("form#addGlossaryForm [name='src_language']").val(glossaryEntry.src_language);
  $("form#addGlossaryForm [name='target_language']").val(language);
  if (!$("form#addGlossaryForm").is(":visible")) {
    toggleGlossaryEntry();
  }
}

function request(options) {
  return $.ajax(options)
    .retry({times:3,statusCodes:[0,409]})
    .fail(function (jqXHR) {
      if (jqXHR.responseText) {
        alert("request failed "+jqXHR.responseText);
      }
    });
}

function find(version) {
  return $(".pleat.open[data-version='"+version+"']");
}

function findPleat(version) {
  return $(".pleat.close[data-version='"+version+"']");
}

$.fn.getHeight = function() {
  var fake=$("<div>").css({"position":"fixed","left":"-1000px"}).append(this.clone());
  $(document.body).append(fake);
  var height=fake.outerHeight();
  fake.remove();
  return height;
};

$.fn.rotate = function () {
  return $("<div>").addClass("rotated-text__wrapper").append(
    $("<div>").addClass("rotated-text").append(this)
  );
};

function addPleat(version) {
  var header=find(version).filter("th").first();
  var pleat=$("<td/>").addClass("pleat").addClass("close")
    .prop("rowspan",$("tbody tr").length)
    .attr("data-version",version);
  var language=header.find(".language").clone(true,true);
  language.prop("title",language.html()).html(language.data("id")).removeClass("expand");
  pleat.append(language.rotate());
  pleat.append(header.find(".creator").clone(true,true).rotate());
  find(version).filter("td").first().after(pleat);
  var pleatHead=$("<th/>").addClass("pleat").addClass("close").append(
    $("<div>").addClass("relative-wrapper").append(
      $("<span>").addClass("button show").html(getTranslated("i_show"))
    )
  ).attr("data-version",version);
  header.after(pleatHead.clone());
  var pleatFoot=$("<th/>").addClass("pleat").addClass("close")
    .attr("data-version",version);
  find(version).filter("th").last().after(pleatHead);
}

function findUnits(version) {
  return find(version).find(".unit");
}

function getVersions() {
  var versions=[];
  $("#hexapla thead tr:first-child .pleat.open").each(function() {
    versions.push($(this).data("version"));
  });
  return versions;
}

function getSize(unit) {
  var rowspan=unit.closest("td").prop("rowspan");
  if (rowspan) return parseInt(rowspan);
  else return 1;
}

function positionSplits(context) {
  $("span.split",context).each(function() {
    var currTd=$(this).closest("td");
    var line=$(this).data("line");
    var position={};
    var tableLine=findLine(line);
    if (tableLine.find("td:visible").length>0) {
      position=tableLine.find("td:visible").position();
      $(this).removeClass("dynamic");
      var currPos=currTd.position();
      $(this).css("top",(position.top-currPos.top-24)+"px");
    } else {
      $(this).addClass("dynamic");
    }
  });
  positionDynamicSplits(context);
}

function positionDynamicSplits(context) {
  $("span.split.dynamic",context).each(function() {
    var unit=$(this).closest(".unit");
    var currTop=unit.position().top;
    var currLine=$(this).data("line");
    var startTop,endTop,startLine,endLine;
    var prev=$(this).prev(".split:not(.dynamic)");
    if (prev.length==1) {
      startTop=prev.position().top-currTop;
      startLine=prev.data("line");
    } else {
      startTop=0;
      startLine=unit.getLine();
    }
    var next=$(this).next(".split:not(.dynamic)");
    if (next.length==1) {
      endTop=next.position().top-currTop;
      endLine=next.data("line");
    } else {
      endTop=unit.height();
      endLine=unit.getLine()+getSize(unit);
    }
    var lineDiff=(currLine-startLine)/(endLine-startLine);
    var top=lineDiff*(endTop-startTop);
    $(this).css("top",(top-24)+"px");
  });
}

function positionPleats() {
  var closedPleats=$(".pleat.close:visible");
  //pleats positioning is done automatically with FF23 and Chromium 28
  //chromium has a bug, which requires to redraw the fixed elements
  closedPleats.children(":visible").redraw();
  return;
}

//http://forrst.com/posts/jQuery_redraw-BGv
$.fn.redraw = function() {
  return this.hide(0, function(){$(this).show()});
};

function fixWidths() {
  var nbOpen=$("thead tr:first-child th.pleat.open:visible").length;
  if (nbOpen==0) {
    $("#hexapla").removeClass("full");
  } else {
    $("#hexapla").addClass("full");
    $("thead tr:first-child th.pleat.open:visible").css("width",100/nbOpen+"%");
  }
}

function toggleShow(e) {
  var version=$(this).getVersion("th");
  find(version).toggle();
  findPleat(version).toggle();
  setTimeout(function(){
    fixWidths();
    positionSplits();
  },0);
  if (e.cancelable) {
    updateUrl();
  }
}

$.fn.isEdited = function() {
  return this.hasClass("edit");
};

function stringToHtml(formattedString) {
  formattedString = formattedString || "";
  return formattedString
       .replace(/</g,"&lt")
       .replace(/>/g,"&gt;")
       .replace(/^ /gm,"&nbsp;")
       .replace(/  /g," &nbsp;")
       .replace(/\n/g, "<br>\n")
       ;
}

$.fn.getVersion = function(ancestor) {
  return this.closest(ancestor).data("version");
};

$.fn.getReference = function() {
  return {
    version: this.closest(".unit").data("version"),
    line: this.closest("tr").data("line")
  };
};

$.fn.getLanguage = function() {
  return find(this.getVersion("td.open")).find(".language").data("id");
};

$.fn.getLine = function() {
  return this.closest("tr").data("line");
};

function autoSize() {
  // Copy textarea contents; browser will calculate correct height of copy,
  // which will make overall container taller, which will make textarea taller.
  var text = stringToHtml($(this).val());
  $(this).parent().find("div.text").html(text);
  if ($(this).parents().is(".box-wrapper")) {
      $(this).css({'width':'100%','height':'100%'});
  }
}

function modified() {
  $(this).addClass("dirty");
  if ($(this).is(".autosize")) {
    autoSize.apply(this);
    positionSplits($(this).closest(".unit"));
    positionSplits($(".pleat.open").not("[data-version='"+$(this).getVersion()+"']"));
  }
}

function toggleEdit (e) {
  var version=$(this).getVersion("th");
  var doc = find(version);
  var units = findUnits(version);
  var top = doc.first();
  var edited = doc.isEdited();
  function applyToggle() {
    if (edited) {
      top.css("width","auto");
      doc.removeClass("edit");
    } else {
      doc.addClass("edit");
      top.css("width",doc.first().outerWidth()+"px");
    }
    doc.find("input.edit").toggleName(getTranslated("i_read"), getTranslated("i_edit"));
    fixScriptDirection(version);
  }
  if (getVersions().length==1) {
    if (edited) {
      var fulltext=$("textarea.fulltext").val();
      $("textarea.fulltext").prop("disabled",true);
      var lines=fulltext.split("\n\n");
      var id=Traduxio.getId();
      var update=function(){
        $("#hexapla tbody tr.fulltext").hide();
        $("#hexapla tbody tr:not(.fulltext)").remove();
        lines.forEach(function(line,i) {
          var newUnit=createUnit(line).attr("data-version",version);
          var newTd=$("<td>").addClass("pleat open").attr("data-version",version)
            .append($("<div>").addClass("box-wrapper").append(newUnit));
          newUnit.setSize(1);
          var tr=$("<tr/>").attr("id","line-"+i).data("line",i).prepend(newTd);
          $("#hexapla tbody").append(tr);
        });
        applyToggle();
        $("textarea.fulltext").removeClass("dirty")
      };
      if ($("textarea.fulltext").is(".dirty")) {
        request({
          type:"PUT",
          data:JSON.stringify({text:lines}),
          contentType: "text/plain",
          url:"work/"+id+"?version="+encodeURIComponent(version)
        })
        .done(update)
        .always(function() {
          $("textarea.fulltext").prop("disabled",false);
        });
      } else {
        update();
      }
    } else {
      $("#hexapla tbody tr:not(.fulltext)").hide();
      $("#hexapla tbody tr.fulltext").show();
      var fulltext=[];
      findUnits(version).find("textarea").not(".fulltext").each(function() {
        fulltext.push($(this).val());
      });
      $("textarea.fulltext").val(fulltext.join("\n\n"));
      autoSize.apply($("textarea.fulltext").prop("disabled",false));
      applyToggle();
    }
  } else {
    if (edited) {
      function finish() {
        units.find(".split").remove();
        units.removeClass("edit");
        applyToggle();
      }
      var unitsOk=0,
          toSave=units.find("textarea.dirty"),
          length=toSave.length;
      if (length) {
        toSave.each(function() {
          var textarea=$(this);
          saveUnit.apply(textarea,[function () {
            textarea.parents(".unit").find(".text").html(stringToHtml(textarea.val()));
            unitsOk++;
            if (unitsOk==length) {
              finish();
            }
          }]);
        });
      } else {
        finish();
      }
    } else {
      units.find("textarea").prop("disabled",false);
      units.addClass("edit");
      if (getVersions().indexOf(version)>0) {
        units.parents("td.pleat").not("[rowspan=1]").find(".unit").each(function () {
            createSplits($(this));
          });
      }
      positionSplits(units);
      applyToggle();
    }
  }
  if (e.hasOwnProperty("cancelable")) {
    //means it is an event, and as such toggle occured on user action
    updateUrl();
    fixWidths();
  }
}

var languages=null;

function fillLanguages(controls,callback) {
  function updateSelect() {
    $.each(languages, function(key, o) {
      var label=key + " (" + [ o.fr, o.en, o[key] ].join(" - ") + ")";
      controls.append($("<option>").val(key).text(label));
    });
    controls.each(function(i,c) {
      var control=$(c);
      if (control.attr("placeholder")) {
        control.prepend($("<option>").val("").text(control.attr("placeholder")).prop("disabled",true));
      }
      control.val(control.data("language"));
    });
    if (typeof callback=="function")
      callback();
  };
  if (!languages) {
    $.getJSON(getPrefix() + "/shared/languages.json", function(result) {
      languages=result;
      updateSelect();
    });
  } else {
    updateSelect();
  }
}

function updateDocInfo(data) {
  if (data.hasOwnProperty("title"))
    $(".top h1 span.title").text(data.title?data.title:getTranslated("i_no_title"));
  if (data.hasOwnProperty("work-creator"))
    $(".top h1 span.creator").text(data["work-creator"]?data["work-creator"]:getTranslated("i_no_author"));
  if (data.hasOwnProperty("language")) {
    fixLanguages($(".top h1 span.language").data("id",data.language));
  }
}

function fixScriptDirection(version,language) {
  language=language || find(version).find(".language").first().data("id");
  if (language) {
    getLanguageNames(function() {
      if (languagesNames[language] && languagesNames[language].rtl)
        findUnits(version).css("direction","rtl");
      else findUnits(version).css("direction","ltr");
    });
  }
}

function getUrlOptions(opened,edited) {
  var suffix="";
  if (opened) {
    suffix+="open="+encodeURIComponent(opened.join("|"));
  }
  if (edited) {
    suffix = suffix ? suffix + "&" :"";
    suffix+="edit="+encodeURIComponent(edited.join("|"));
  }
  suffix = suffix ? "?"+suffix:"";
  return suffix;
}

function getOpenedVersions() {
  return $("thead th.open:visible").not(".edit")
    .map(function() {
      return $(this).getVersion("th");
    }).toArray();
}

function getEditedVersions() {
  return $("thead th.edit:visible")
    .map(function() {
      return $(this).getVersion("th");
    }).toArray();
}

function updateUrl() {
  window.history.pushState("object or string","",Traduxio.getId()+getUrlOptions(getOpenedVersions(),getEditedVersions()));
}

function changeVersion(oldVersion, newVersion) {
  $("#hexapla").find("*[data-version='" + oldVersion + "']")
    .attr("data-version", newVersion).data("version", newVersion)
    .find(".creator").html(newVersion);
  updateUrl();
}

function toggleHeader(item) {
  $(item).slideToggle(200);
  closeTop(item);
}

function toggleAddVersion() {
  toggleHeader("#addPanel");
}

function toggleRemoveDoc() {
  toggleHeader("#removePanel");
}

function toggleGlossaryEntry() {
  toggleHeader("#addGlossaryForm");
}

function closeTop(except) {
  $(".top form, #removePanel").not(except).slideUp(200);
}

function addGlossarySubmit() {
  var id = $("#hexapla").data("id");
  var form=$("#addGlossaryForm");
  var glossaryEntry={
    src_sentence:$("[name='src']",form).val(),
    src_language:$("[name='src_language']",form).val(),
    target_sentence:$("[name='target']",form).val(),
    target_language:$("[name='target_language']",form).val()
  };
  if (glossaryEntry.src_sentence && glossaryEntry.src_language &&
    glossaryEntry.target_sentence && glossaryEntry.target_language) {
    var url="work/"+id+"/glossary/"+glossaryEntry.src_language+"/"+encodeURIComponent(glossaryEntry.src_sentence)+"/"+glossaryEntry.target_language;
    $.ajax({
      type: "PUT",
      url: url,
      dataType:"json",
      contentType: 'application/json',
      data: glossaryEntry.target_sentence
    }).done(function(result) {
      closeTop();
      if ("ok" in result) {
        addGlossaryEntry(glossaryEntry);
      }
    }).fail(function() { alert("fail!"); });
  } else {
    alert("missing data");
  }
  return false;
}

function toggleEditDoc() {
  toggleHeader("#work-info");
}

function addPanelFormUpdate() {
  if($("#addPanel input[name='add-type']:checked").val()=="original") {
    $("#addPanel input[name='work-creator']").prop("disabled",true);
    $("#addPanel select[name='language']").prop("disabled",true);
  } else {
    $("#addPanel input[name='work-creator']").prop("disabled",false);
    $("#addPanel select[name='language']").prop("disabled",false);
  }
}

function addVersion() {
  var id = Traduxio.getId(),
      ref,
      data = {};
  if ($("input[name='add-type']:checked",this).val()=="original") {
    ref="original";
    data.original=true;
  } else {
    ref = $("input[name='work-creator']",this).val();
    data.creator=ref;
    data.language=$("select[name='language']",this).val();
    if (!data.language) return false;
  }
  if(ref != "") {
    request({
      type: "POST",
      url: "work/"+id,
      contentType: 'application/json',
      dataType: "json",
      data: JSON.stringify(data)
    }).done(function(result) {
      var version=result.version || ref;
      var edited=getEditedVersions();
      edited.push(version);
      window.location.href = id + getUrlOptions(getOpenedVersions(),edited);
    });
  }
  return false;
}

function removeDoc() {
  if(confirm(getTranslated("i_confirm_delete"))) {
    request({
      type: "DELETE",
      url: "work/"+Traduxio.getId(),
      contentType: 'text/plain'
    }).done(function() {
      window.location.href = "./";
    });
  }
}

function clickDeleteVersion() {
  var ref = $(this).closest("th").data("version"),
      message;
  if (ref=="original") {
    message=getTranslated("i_delete_original");
  } else {
    message=getTranslated("i_delete_version").replace("%s", ref);
  }
  if(confirm(message)) {
    deleteVersion(ref);
  }
}

function deleteVersion(version) {
  var id = Traduxio.getId();
  request({
    type: "DELETE",
    url: "work/"+id+"/"+encodeURIComponent(version),
    contentType: 'text/plain'
  }).done(function() {
    window.location.reload(true);
  });
}

function createJoin(unit1,unit2) {
    var p=($(unit2).offset().top-$(unit1).offset().top-$(unit1).outerHeight()+32)/(-2);
    var join=$("<span/>").addClass("join").prop("title","merge with previous").css("top",p+"px");
    unit2.prepend(join);
}

function createJoins(unit) {
  unit.find(".join").remove();
  var version=unit.getVersion("td.open");
  var units=findUnits(version);
  var currIndex=units.index(unit);
  if (currIndex>0) {
    var prevUnit=units.eq(currIndex-1);
    createJoin(prevUnit,unit);
  }
}

function createSplits(unit) {
  unit.find(".split").remove();
  var reference=unit.getReference();
  var version=reference.version;
  var currLine=reference.line;
  var units=findUnits(version);
  var currIndex=units.index(unit);
  var size=getSize(unit);
  var lastLine=currLine+size-1;
  var maxLines=$("#hexapla").data("lines");
  var currPos=unit.position();
  if (currLine<lastLine && currLine<maxLines) {
    for (var i=currLine+1; i<=lastLine; ++i) {
      var split=$("<span/>").addClass("split").prop("title","split line "+i).data("line",i);
      unit.append(split);
    }
  }
}

function saveUnit(callback) {
  var textarea=$(this);
  if (textarea.hasClass("dirty")) {
    textarea.prop("disabled",true);
    var content=textarea.val();
    editOnServer(content, textarea.getReference())
    .done(function(message,result) {
      if (result == "success") {
        textarea.removeClass("dirty");
        if (callback && typeof(callback) == "function") {
          callback();
        }
      } else {
        alert(result+":"+message);
      }
    })
    .always(function() {
      textarea.prop("disabled",false);
    });
  } else {
    if (callback && typeof(callback) == "function") {
      callback();
    }
  }
}

function checkValid(field,value) {
  var mandatoryFields=["language"]
  if (mandatoryFields.indexOf(field)!=-1 && !value) {
    return false;
  }
  return true;
}

function saveMetadata() {
  var elem=$(this);
  var inputType=elem.prop("tagName");
  if(inputType!="INPUT" || elem.hasClass("dirty")) {
    var newValue=elem.val();
    var name=elem.prop("name");
    if (!checkValid(name,newValue)) {
      //abort
      if ($(this).hasClass("language")) {
        $(this).val($(this).data("language"));
      }
      return;
    }
    var modify={};
    modify[name]=newValue;
    var id = Traduxio.getId();
    var ref = elem.closest("th").data("version");
    request({
      type: "PUT",
      url: "work/"+id+"/"+encodeURIComponent(ref),
      contentType: 'text/plain',
      data: JSON.stringify(modify),
      dataType: "json"
    }).done(function(result) {
      if (ref=="original") updateDocInfo(result);
      var target=elem.siblings("div.metadata."+name);
      newValue=result[name] || newValue;
      elem.val(newValue);
      if(name == "creator") {
        changeVersion(ref, newValue);
      }
      if (inputType=="INPUT") {
        var displayText=newValue;
        if (!displayText && name=="work-creator" && ref=="original") displayText=Traduxio.getTranslated("i_no_author");
        target.text(displayText);
        elem.removeClass("dirty");
      }
      if (name=="language") {
        var lang_id = elem.val();
        elem.data("language",lang_id);
        fixLanguages(target.data("id",lang_id));
        fixLanguages($(".pleat.close[data-version='" + ref + "']")
          .find(".metadata.language").data("id", lang_id).text(lang_id));
        fixScriptDirection(ref,lang_id);
      }
    });
  }
}

function deleteGlossaryEntry(glossaryEntry,language) {
  var id = $("#hexapla").data("id");
  if (glossaryEntry.src_sentence && glossaryEntry.src_language && language) {
    var url="work/"+id+"/glossary/"+glossaryEntry.src_language+"/"+encodeURIComponent(glossaryEntry.src_sentence)+"/"+language;
    $.ajax({
      type: "DELETE",
      url: url,
      dataType:"json",
      contentType: 'application/json'
    }).done(function(result) {
      if ("ok" in result) {
        glossaryEntry.target_language=language;
        removeGlossary(glossaryEntry);
      }
    }).fail(function() { alert("fail!"); });
  }
}

function openContextMenu(glossaryEntry,position) {
  var sentence=glossaryEntry.src_sentence;
  if (sentence.length<50) {
    var menu=$("<div/>").addClass("context-menu");
    menu.append($("<div/>").addClass("item concordance")
      .append(getTranslated("i_search_concordance")+": <em>"+sentence+"</em>"));
    if(glossaryEntry.targets) {
      $.each(glossaryEntry.targets,function(language,sentence) {
        menuItem=$("<div/>").addClass("glossaryEntry").append("<em>"+language+"</em>:"+sentence);
        menuItem.append($("<span/>").append("x").addClass("action").on("click",function() {
          deleteGlossaryEntry(glossaryEntry,language);
        }));
        menuItem.append($("<span/>").append("e").addClass("action").on("click",function() {
          editGlossaryEntry(glossaryEntry,language);
        }));
        menu.append(menuItem);
      });
    }
    menu.append($("<div/>").addClass("glossary").append(
      getTranslated("i_glossary_add_translation","<em>"+sentence+"</em>"))
    );
    menu.css(position);
    $("body .context-menu").remove();
    $("body").append(menu);
    $(".context-menu .concordance").on("click",function() {
      $("form.concordance #query").val(sentence);
      $("form.concordance #language").val(glossaryEntry.src_language);
      $("form.concordance").submit();
    }).addClass("action");
    $(".context-menu .glossary").on("click",function() {
      editGlossaryEntry(glossaryEntry);
    }).addClass("action");
    $(".context-menu .action").on("click",function() {
      $("body .context-menu").remove();
    });
  }
};

function unitContent(unit) {
  return  $("textarea",unit).val();
}

function fillUnit(unit,content) {
  var oldVal=unitContent(unit);
  if (oldVal!=content) {
    var element=$("textarea",unit).val(content);
    autoSize.apply(element);
    browseGlossary(displayGlossary,element);
    return true;
  }
  return false;
}

$.fn.queueCss=function(properties) {
  $(this).queue(function (next) {
    $(this).css(properties);
    next();
  });
};

function highlightUnit(unit,color) {
  var version=unit.getVersion("td");
  var element=unit.isEdited() ? $("textarea",unit) : $(".text",unit);
  if (element.is(":visible")) {
    element.css({"background-color":color}).delay(1000).queueCss({"background-color":""});
    find(version).css({"border-color":color,"border-width":"0px 2px"}).clearQueue().delay(1000).queueCss({"border-color":"","border-width":""});
  } else {
    findPleat(version).css({"border-color":color,"border-width":"0px 2px"}).clearQueue().delay(1000).queueCss({"border-color":"","border-width":""});
  }
}

function createUnit(content) {
  var newUnit = $("<div/>").addClass("unit");
  var text = $("<div>").addClass("text");
  newUnit.append(text);
  var textarea=$("<textarea>").addClass("autosize");
  newUnit.prepend(textarea);
  fillUnit(newUnit,content);
  return newUnit;
}

function findUnit(version,line) {
  var unit=$("tr[data-line='"+line+"'] .unit[data-version='"+version+"']");
  if (unit.length==0) return null;
  if (unit.length==1) return unit;
  return false;
}

function findLine(line) {
  return $("tr[data-line='"+line+"']");
}

function updateOnScreen(version,line,content,color) {
  var highlight=true;
  var unit=findUnit(version,line);
  if (unit) {
    if (content !== null) {
      if (!fillUnit(unit,content)) return false;
    } else {
      //join
      var units=findUnits(version);
      var previousUnit=units.eq(units.index(unit)-1);
      var previousContent=previousUnit.find("textarea").val();
      var thisContent=unit.find("textarea").val();
      fillUnit(previousUnit,previousContent+"\n"+thisContent);
      var thisLine=unit.getLine();
      var prevLine=previousUnit.getLine();
      var size=getSize(unit);
      var newSpan=thisLine-prevLine+size;
      previousUnit.closest("td").prop("rowspan",newSpan);
      previousUnit.find(".text").css("min-height",(newSpan*32)+"px");
      unit.closest("td").remove();
      createSplits(previousUnit);
      positionSplits();
      unit=previousUnit;
    }
  } else {
    if (content != null) { //otherwise, it is a join, which is already joined here
      //potential split
      var units=findUnits(version);
      units.each(function() {
        var cLine=$(this).getLine();
        if (typeof cLine != "undefined") {
          if (cLine<line) {
            unit=$(this);
          } else {
            return false;
          }
        }
      });
      if (unit) {
        // split
        var size=getSize(unit);
        var initialLine=unit.getLine();
        var newUnit=createUnit(content).attr("data-version",version);
        var direction=unit.css("direction");
        if (direction) newUnit.css("direction",direction);
        if (unit.isEdited()) newUnit.addClass("edit");
        var newTd=$("<td>").addClass("pleat open").attr("data-version",version)
          .append($("<div>").addClass("box-wrapper").append(newUnit));
        newUnit.setSize(size-(line-initialLine));
        unit.setSize(line-initialLine);
        var versions=getVersions();
        var versionIndex=versions.indexOf(version);
        if (versionIndex==0) {
          findLine(line).prepend(newTd);
        } else {
          var ok=false;
          findLine(line).find(".unit").each(function() {
            var currVersion=$(this).data("version");
            if (versions.indexOf(currVersion) > versions.indexOf(version)) {
              $(this).closest("td").before(newTd);
              ok=true;
              return false;
            }
          });
          if (!ok) {
            findLine(line).append(newTd);
          }
        }
        createSplits(unit);
        createJoins(newUnit);
        createSplits(newUnit);
        positionSplits();
        $(".tosplit").removeClass("tosplit");
        unit=unit.add(newUnit); //to highlight both units
      }
    }
  }
  return unit;
}

function getPreviousUnit(unit) {
  var version=unit.getVersion("td.open");
  var units=findUnits(version);
  return $(units.eq(units.index(unit)-1));
}

var editOnServer = function(content, reference) {
  return request({
    type: "PUT",
    url: "version/"+Traduxio.getId()+"?"+ $.param(reference),
    contentType: "text/plain",
    data: content
  });
};

$(document).ready(function() {

  $("#hexapla").on("click", ".button.hide", toggleShow);
  $("#hexapla").on("click", ".button.show", toggleShow);

  $("#hexapla").on("click", ".button.edit-license", function() {
    window.location=getPrefix()+"/works/license/"+Traduxio.getId()+'/'+$(this).getVersion("th");
  });

  $("input.edit").on("click",toggleEdit);

  $("tr").on("mouseup select",".unit", function (e) {
    //requires jquery.selection plugin
    var txt=$.selection().trim(),language;
    var unit=$(this);
    if (txt && (language=unit.getLanguage())) {
      e.stopPropagation();
      openContextMenu({
        src_sentence:txt,
        src_language:$(this).getLanguage(),
        target_language:$("td.pleat.open .unit.edit").getLanguage() //use first edited translation
      },{
        top:e.pageY+10,
        left:e.pageX
      });
    }
  });

  $("body").on("mouseup",".context-menu",function(e) {
    e.stopPropagation();
  });

  $("body").on("mouseup",function(e) {
    $("body .context-menu").remove();
  });

  $("tr").on("click", ".join", function(e) {
    e.stopPropagation();
    var unit=$(this).closest(".unit");
    var version=unit.getVersion("td");
    if (findUnits(version).index(unit)>0) {
      editOnServer("null", $(this).closest(".unit").getReference())
        .done(function() {
          updateOnScreen(version,unit.getLine(),null);
        });
    } else {
      $(this).remove();
    }
  });

  $.fn.setSize = function (size) {
    this.closest("td").prop("rowspan",size).find(".text")
      .css("min-height",size*40+"px");
  };

  $("tr").on("click", ".split", function(e) {
    e.stopPropagation();
    var unit=$(this).closest(".unit");
    var line=$(this).data("line");
    var version=unit.data("version");
    editOnServer("", {
      version:version,
      line: line
    }).done(function() {
      updateOnScreen(version,line,"");
    });
  });

  $("#hexapla").on('change input cut paste','textarea,input.editedMeta',modified);

  $("tr").on("focusout", ".unit.edit textarea", saveUnit);
  $("thead").on("focusout","input.editedMeta", saveMetadata);
  $("thead").on("change","select.editedMeta", saveMetadata);
  $("#hexapla").on("click","span.delete", clickDeleteVersion);

  $("input[type=text],select").each(function() {
    if (!$(this).prop("placeholder")) {
      $(this).prop("placeholder",$(this).prop("title"));
    }
    if (!$(this).prop("title")) {
      $(this).prop("title",$(this).prop("placeholder") || $(this).attr("placeholder"));
    }
  });

  $(".top").on("click", "#addVersion", toggleAddVersion);
  $(".top").on("click", "#editDoc", toggleEditDoc);
  $(".top").on("click", "#addPanel input[type=radio]", addPanelFormUpdate);
  addPanelFormUpdate();
  $("#addPanel").on("submit", addVersion);

  $(".top").on("click", "#removeDoc", toggleRemoveDoc);
  $("#removePanel").on("click", removeDoc);

  $("#addGlossaryForm").on("submit", addGlossarySubmit);

  var versions=getVersions();
  const N = versions.length;
  for (var i = N-1; i>=0; i--) {
    var version=versions[i];
    addPleat(version);
    fixScriptDirection(version);
  }
  if ($("th.pleat.opened,th.pleat.edited").length==0) {
    //hide all translations except the 2 first ones
    $("thead tr th.open.pleat").filter(":gt(1)").each(toggleShow);
  } else {
    $("thead tr th.open.pleat").not(".opened").not(".edited")
      .each(toggleShow);
  }
  $("#hexapla th.edited").removeClass("edited").not(".edit").each(toggleEdit);

  fixWidths();

  fillLanguages($("select.language"));

  if(!Traduxio.getId()) {
    $("#work-info").show().on("submit",function(e) {
      e.preventDefault();
      var data={};
      ["work-creator","language","title","date"].forEach(function(field) {
        data[field]=$("[name='"+field+"']","#work-info").val();
      });
      data.original=$("[name=original-work]").prop("checked");
      request({
        type:"POST",
        url:"work",
        data:JSON.stringify(data),
        contentType:"application/json",
        dataType:"json"
      }).done(function(result) {
        if (result.id) {
          window.location.href=result.id;
          var url=result.id;
          if (result.version) url+="?edit="+result.version;
          window.location.href=url;
        } else {
          alert("fail");
        }
      });
      return false;
    });

    $(".top h1, .workButton").hide();
  } else {
    $("#work-info").on("submit",function(e) {
      e.preventDefault();
      var data={};
      ["work-creator","language","title","date"].forEach(function(field) {
        data[field]=$("[name='"+field+"']","#work-info").val();
      });
      var id=Traduxio.getId();
      data.original=$("[name=original-work]","#work-info").prop("checked");
      request({
        type:"PUT",
        url:"work/"+id+"/original",
        data:JSON.stringify(data),
        contentType:"application/json",
        dataType:"json"
      }).done(function(result) {
        $("#work-info").hide();
        updateDocInfo(result);
      });
      return false;
    });
  }
  if (N==1) {
    $(".button.hide").remove();
  }

  Traduxio.activity.register("edit",function(edit) {
    if (edit.version) {
      var version=find(edit.version);
        switch (edit.action) {
          case "translated":
            if ("line" in edit && "content" in edit) {
              edit.message="Version <em>"+edit.version+"</em> modifiée à la ligne <a href='#"+edit.line+"'>"+edit.line+"</a>";
              if(!edit.isPast && version.length>0) {
                var unit=updateOnScreen(edit.version,edit.line,edit.content,edit.me?edit.color:null);
                if (unit && edit.color) {
                  highlightUnit(unit,edit.color);
                }
              }
            }
            break;
          case "edited":
            if (edit.key=="creator") {
              edit.message="version "+edit.version+" renomée";
              if (!edit.isPast) edit.message+=", svp rafraîchir la page pour voir les changements";
            } else {
              edit.message="informations de la version "+edit.version+" modifiées";
              if (!edit.isPast) edit.message+=", svp rafraîchir la page pour voir les changements";
            }
            break;
          case "created":
            edit.message="nouvelle version "+edit.version+" créée";
            if (!edit.isPast) edit.message+=", svp rafraîchir la page pour voir les changements";
            break;
          case "deleted":
            edit.message="version "+edit.version+" supprimée";
            if (!edit.isPast) edit.message+=", svp rafraîchir la page pour voir les changements";
            break;
        }
    }
    if (edit.message && Traduxio.chat && Traduxio.chat.addMessage) {
      Traduxio.chat.addMessage(edit);
    }
  });

  browseGlossary(displayGlossaryAllText);

  $("#hexapla").on("click",".glossary",function(e) {
    var l=$(this).getLanguage();
    var s=$(this).data("sentence");
    var entry=getGlossaryEntry(l,s);
    openContextMenu(entry,{top:e.pageY+10,left:e.pageX});
  });

  Traduxio.activity.register("glossary",function(edit) {
    if (edit.entry) {
      switch (edit.action) {
        case "added":
          edit.message="Entrée du glossaire <em>"+
            edit.entry.src_language+":"+
            edit.entry.src_sentence+"</em>"+" -> "+
            edit.entry.target_language+":"+
            edit.entry.target_sentence+"</em>"+
            " ajoutée";
          if (!edit.isPast) addGlossaryEntry(edit.entry);
          break;
        case "modified":
          edit.message="Entrée du glossaire <em>"+
            edit.entry.src_language+":"+
            edit.entry.src_sentence+"</em>"+" -> "+
            edit.entry.target_language+":"+
            edit.entry.was+"</em>"+
            " modifiée en <em>"+edit.entry.target_sentence+"</em>";
          if (!edit.isPast) addGlossaryEntry(edit.entry);
          break;
        case "deleted":
          edit.message="Entrée du glossaire <em>"+
            edit.entry.src_language+":"+
            edit.entry.src_sentence+"</em>"+" -> "+
            edit.entry.target_language+":"+
            edit.entry.was+"</em>"+
            " supprimée";
          if (!edit.isPast) removeGlossary(edit.entry);
          break;
      }

    }
    if (edit.message && Traduxio.chat && Traduxio.chat.addMessage) {
      Traduxio.chat.addMessage(edit);
    }

  });
});

$(window).load(function() {
  $(window).on("beforeunload",function() {
    if ($(".dirty").length>0) {
      return false;
    }
  });
  if (window.location.hash) {
    $("tr"+window.location.hash+" .unit").addClass("highlight");
    setTimeout(function() {
      $("tr"+window.location.hash+" .unit").removeClass("highlight");
    },500);
  }
  $("div.top").appendTo("#header");
});
