var sOpt="";
var msSels="";
var olog;

function RecordNewSettings(WriteToDisk) {
var l="";
var s=document.getElementById("blocklist");
var o=s.getElementsByTagName("option");
var x;
for (x=0;x<o.length;x++) {
  if (l.length>0) l+=",";
  l+=o[x].name;
  }
msSels=","+l+","
if (l.length>0 && WriteToDisk) SaveSetting(sOpt+"sel",l);
}

System.Gadget.onSettingsClosing=function(event) {
if (event.closeAction==event.Action.commit) {
  RecordNewSettings(1);
  }
event.cancel=false;
}

function FindTitle(BlockName) {
var sOut=BlockName;
try {
var b=document.getElementById("sel_"+BlockName);
if (b) {
  b=b.firstChild;
  if (b) sOut=b.innerText;
  }
}
catch (ex) {sOut=ex.description;}
return sOut;
}

function NewOption(OldOption) {
var o=document.createElement("option");
o.text=OldOption.text;
o.name=OldOption.name;
o.value=OldOption.value;
return o;
}

function MoveUp() {
var s=document.getElementById("blocklist");
var x=s.selectedIndex;
if (x>0) {
  var o=s.getElementsByTagName("option");
  var t=o[x];
  s.options[x]=NewOption(o[x-1]);
  s.options[x-1]=NewOption(t);
  s.selectedIndex=x-1;
  }
}

function MoveDown() {
var s=document.getElementById("blocklist");
var x=s.selectedIndex;
if (x>=0) {
  var o=s.getElementsByTagName("option");
  if (x<o.length-1) {
    var t=o[x];
    s.options[x]=NewOption(o[x+1]);
    s.options[x+1]=NewOption(t);
    s.selectedIndex=x+1;
    }
  }
}

function BuildOrderList(sels,TheList) {
var asels=sels.split(",");
for (var x=0;x<asels.length;x++) {
  if (asels[x].length>0) {
    var sTitle=FindTitle(asels[x]);
    var o=document.createElement("option")
    o.text=sTitle;
    o.value=asels[x];
    o.name=asels[x];
    TheList.add(o);
    }
  }
}

function SelectNode(TheNode,sels,TheList) {
var n=TheNode.nodeName;
var bSel;
var s="<div class='selblock'>";
if (sels.indexOf(","+n+",",0)>=0) {
  bSel=true;
  }
else {
  bSel=false;
  }
if (sOpt=="small") {
  s+="<div class='selcol'><input type='radio' name='sel' value='"+n+"'";
  if (bSel==true) s+=" checked";
  s+=" onclick='UpdateList(this);'></div>";
  }
else {
  s+="<div class='selcol'><input type='checkbox' name='sel' value='"+n+"'";
  if (bSel==true) s+=" checked";
  s+=" onclick='UpdateList(this);'></div>";
  }
s+="<div class='entrycol' id='sel_"+n+"'>";
s+=FormatEntry(TheNode.xml,"/"+n)[1];
currentcol.innerHTML+=s+"</div></div>\r\n";
}

function UpdateList(sel) {
var s=document.getElementById("blocklist");
var o=s.getElementsByTagName("option");
var x;
var bDone=false;
for (x=o.length-1;x>=0;x--) {
  if (sel.value==o[x].value) {
    bDone=true;
    if (sel.checked==false) 
      s.remove(x);
    }
  else {
    if (sOpt=="small") 
      s.remove(x);
    }
  }
if (bDone==false && sel.checked==true) {
  o=document.createElement("option");
  o.name=sel.value;
  o.text=FindTitle(sel.value);
  o.value=sel.value;
  s.add(o);
  }
RecordNewSettings(0);
}

function UpdateSettingsNow() {
if (CheckForUpdates(true)) {
  RecordNewSettings(0);
  InitSettingsForm();
  }
}

function InitSettingsForm() {
var oNode;
var x;
System.Gadget.document.getElementById("settingsopen").innerText="true";
currentcol=document.getElementById("settings");
var oList=document.getElementById("blocklist");
oList.innerHTML="";
if (System.Gadget.docked) {
  sOpt="small";
  if (msSels=="") msSels=","+ReadSetting("smallsel",DEFSMALLSEL)+",";
  currentcol.innerHTML="Please select the entry to appear on the small window:<br />";
  currentcol.innerHTML+="<input type='hidden' id='wsize' value='small' />";
  currentcol.style.height="360px";
  document.getElementById("selorder").style.display="none";
  }
else {
  sOpt="big";
  if (msSels=="") msSels=","+ReadSetting("bigsel",DEFBIGSEL)+",";
  currentcol.innerHTML="Please select the entries to appear on the big window:<br />";
  currentcol.innerHTML+="<input type='hidden' id='wsize' value='big' />";
  currentcol.style.height="310px";
  document.getElementById("selorder").style.display="block";
  }
currentline=0;
secondcol=false;
maxlines=-1;
var b=GetAllBlocks();
var oTop=b.selectSingleNode("/emcsourceoneresourcesgadget");
if (oTop) {
  for (x=0;x<oTop.childNodes.length;x++) {
    SelectNode(oTop.childNodes(x),msSels,oList);
    }
  }
BuildOrderList(msSels,oList);
ShowUpdateNow(document,"Settings");
//currentcol.innerHTML=msSels.replace(/</ig,"&lt;");
//currentcol.innerHTML=currentcol.innerHTML.replace(/</ig,"&lt;");
}

document.onreadystatechange=function() {
  if (document.readyState=="complete") {
    InitSettingsForm();
  }
}
