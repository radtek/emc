var DEFSMALLSEL="FILESERVERS";
var DEFBIGSEL="FILESERVERS,WEBSITES";
var msSettingsPath=System.Gadget.path+"\\UserSettings.xml";
var msContactsPath=System.Gadget.path+"\\EMCSourceOneResources.xml";
var msSourceURL="http://CNRDWANGN6L1C.corp.emc.com/Gadgets/EMCSourceOneResources.xml";
var msSourcePath="\\\\es1fileserver.corp.emc.com\\Team\\Tools\\SourceOneResourceGadget\\EMCSourceOneResources.xml";
var msSettingsRemotePath = "\\\\es1fileserver.corp.emc.com\\Team\\Tools\\SourceOneResourceGadget\\UserSettings.xml";
var msSettingsPersonalFolder = "\\\\es1fileserver.corp.emc.com\\Team\\Tools\\SourceOneResourceGadget\\PersonalFoldersSettings.txt";
var personalFoldersList="";
var updateinterval=24*60*1000;
var moDebug=null;

function DebugTrace(NewText) {
if (!moDebug) {
  var z=new ActiveXObject("InternetExplorer.Application");
  z.Navigate2("about:blank");
  while (z.Busy);
  z.visible=true;
  z.Document.innerHTML="<head><title>debug</title><body>Debugging...<br /></body>";
  moDebug=z.document.body;
  }
moDebug.innerHTML+=NewText+"<br />";
}

function ReadPersonalFoldersSettings(path)
{
	personalFoldersList = new Array();
	try{
		var fso = new ActiveXObject("Scripting.FileSystemObject");
		var fl = fso.OpenTextFile(msSettingsPersonalFolder);
		
		while(!fl.AtEndOfStream)
		{
			var folderStr = fl.ReadLine();
			if(folderStr!="")
			personalFoldersList.push(folderStr);
		}
		fl.close();
	}
	catch(ex)
	{
	//don't care
	}
	return personalFoldersList;
}


function ReadXMLURL(URL) {
var oXML=null;
try {
  var xml=new ActiveXObject("MSXML2.XMLHTTP");
  xml.open("GET", URL+'?t='+(new Date()).getDate(), 0); // forced to be unique to prevent caching
  xml.send();
  oXML=new ActiveXObject("MSXML2.DOMDocument");
  if (!oXML.loadXML(xml.responseXML.xml)) oXML=null;
  }
catch (ex) {
  //don't care
  }
return oXML;
}

function CacheKiller() {
var d=new Date();
return d.getFullYear().toString()+'M'+d.getMonth().toString()+'D'+d.getDate().toString()+'H'+d.getHours().toString()+'m'+d.getMinutes().toString();
}

function CheckForUpdates(ForcedUpdate) {
bUpdated=false;
/*
var resourceUpdated= false;
var settingsUpdated = false;
*/
var s=System.Gadget.document.getElementById("settingsopen").innerText;
if ((System.Gadget.Flyout.show==false && s=="false") || ForcedUpdate==true) {

  var dLastTime=ReadSetting("LastUpdated","0");
  var dLast=null;
  
  try {
    dLastTime=parseInt(dLastTime);
    if (dLastTime>0) dLast=new Date(dLastTime);
    }
  catch (ex) {
    dLast=new Date(1900,1,1,0,0,0,0);
    }
  var dNow=new Date();
  if (dNow-dLast>=updateinterval || ForcedUpdate) {
  //update the source list
    var local=ReadXMLFile(msContactsPath);
    var src=ReadXMLURL(msSourceURL+"?nocache="+CacheKiller());
    if (src==null) src=ReadXMLFile(msSourcePath);
    if (src) {
      if ((local!=null) && (src.xml==local.xml)) {
        //resourceUpdated=true;
		bUpdated=true;
        }
      else if (src.xml.length>0) {
        bUpdated=WriteXMLFile(src,msContactsPath);
        }
      }    
	//update the user setting. Added by Neil
	/*
	var localUserSetting=ReadXMLFile(msSettingsPath);
    src=ReadXMLFile(msSettingsRemotePath);
    if (src) {
	DebugTrace(src.xml);
	DebugTrace(localUserSetting.xml);
      if ((localUserSetting!=null) && (src.xml==localUserSetting.xml)) {
        settingsUpdated=true;
        }
      else if (src.xml.length>0) {
        settingsUpdated=WriteXMLFile(src,msSettingsPath);
        }
      }
	 */
    }
  }
  if (bUpdated) {
  //if (resourceUpdated&&settingsUpdated) {
  //bUpdated = true;
  SaveSetting("LastUpdatedUR",dNow.toLocaleDateString()+" "+dNow.toLocaleTimeString());
  SaveSetting("LastUpdated",dNow.getTime());
  System.Gadget.document.getElementById("didupdate").innerText="Yes";
  }
return bUpdated;
}

function ShortDate(TheDate) {
var m=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var mn=TheDate.getMonth();
var sOut=m[mn]+" "+TheDate.getDate()+", "+TheDate.getFullYear();
m="0"+TheDate.getMinutes();
if (m.length>2) m=m.substr(m.length-2);
sOut+=" "+TheDate.getHours()+":"+m;
return sOut;
}

function ShowUpdateNow(doc,PageName) {
var dSetTime=ReadSetting("LastUpdated","None");
var dLast=null;
var dSet=null;
try {
  dSetTime=parseInt(dSetTime);
  if (dSetTime>0) dSet=new Date(dSetTime);
  if (dSet)
    dLast=ShortDate(dSet);
  else
    dLast="None";
  }
catch (ex) {
  dLast="None";
  }
var div=doc.getElementById("updatenow");
var f;
if (PageName=="Settings") {
  f="UpdateSettingsNow";
  }
else {
  f="UpdateFlyoutNow";
  }
var btn="<input type=\"button\" value=\"Update Now!\" onclick=\""+f+"();\" />";
div.innerHTML="<div style=\"float:left;\">Last update:<br />"+dLast+"</div>"
  + "<div style=\"float:right;\">"+btn+"</div>";
div.style.display="block";
}

function HideUpdateNow(doc) {
var div=doc.getElementById("updatenow");
div.style.display="none";
}

function ShowTicker(doc) {
var div=doc.getElementById("ticker");
div.style.display="block";
}

function HideTicker(doc) {
var div=doc.getElementById("ticker");
div.style.display="none";
}

function FormatSingleLine(TheNode) {
var nLines=1;
var stype=TheNode.getAttribute("type");
stype=stype.toLowerCase();
var sicon=TheNode.getAttribute("icon");
var stitle=TheNode.getAttribute("title");
var surl=TheNode.getAttribute("url");
if (sicon=="" || sicon==null) {
  switch (stype) {
    case "email":
      sicon="entry_mail.png";
      break;
    case "website":
      sicon="entry_website.png";
      break;
    case "phone":
      sicon="entry_phone.png";
      break;
    case "chat":
      sicon="entry_chat.png";
      break;
    default:
      sicon="entry_other.png";
    }
  }
var sOut="<div class='fullentry'>";
if (stitle==null || stitle=="") stitle=surl;
if (stitle==null || stitle=="") stitle=TheNode.text;
if (stitle==null || stitle=="") stitle=stype;
//if (System.Gadget.docked==false || stype=="chat" || stype=="email") {
  sOut+="<div class='entryicon'><img src='images/"+sicon+"'";
  if (stitle) sOut+=" title='"+stitle+"'";
  sOut+=" /></div>";
  if ((TheNode.text.length>15) && System.Gadget.docked) nLines++;
//  }
//else {
//  if ((TheNode.text.length>20) && System.Gadget.docked) nLines++;
//  }
sOut=sOut+"<div class='entrytext "+stype+"'";
if (stitle) sOut+=" title='"+stitle+"'";
sOut+=">";
if (surl) sOut+="<a href='"+surl+"'>";
sOut+=TheNode.text;
if (surl) sOut+="</a>";
sOut+="</div></div>\r\n";
var r=new Array(2);
r[0]=nLines;
r[1]=sOut;
return r;
}

function FormatEntry(TheBlock,ThePath) {
var oXML;
var oNodes;
var oNode;
var s="";
var klines=0;
var showsize="";
var e;
try {
  oXML=new ActiveXObject("MSXML2.DOMDocument");
  if (oXML.loadXML(TheBlock)) {
    oNode=oXML.selectSingleNode(ThePath+"/title");
    if (oNode) {
      s+="<div id='title' name='title' class='blocktitle'>"+oNode.text+"</div>";
	  klines+=2;
      if (System.Gadget.docked) //wrap the text for small window
        s+="<div class='break'>";
      else
        s+="<div class='indent break'>";//unwrap the text for small window

      oNodes=oXML.selectNodes(ThePath+"/entry");
      for (var i=0;i<oNodes.length;i++) {
        oNode=oNodes.item(i);
        showsize=oNode.getAttribute("size");
        if (!showsize) showsize="";
        if ((System.Gadget.docked && showsize!="undocked")
            || (System.Gadget.docked==false && showsize!="docked")) {
          e=FormatSingleLine(oNode);
          klines+=e[0];
          s+=e[1];
          }
        }
      s=s+"</div><br />\r\n";
      }
    }
  }
catch (ex) {
  // don't care!
  }
if (System.Gadget.docked) {
  s+="<br />";
  klines++;
  }
var r=new Array(2);
r[0]=klines;
r[1]=s;
//(s.replace(/</ig,"&lt;"));
return r;
}


function GetBlock(BlockPath) {
var oXML;
var sOut="";
try {
  oXML=new ActiveXObject("MSXML2.DOMDocument");
  if (oXML.load(msContactsPath)) {
    oNode=oXML.selectSingleNode(BlockPath);
    if (oNode) sOut=oNode.xml;
    }
  }
catch (ex) {
  // don't care!
  }
return sOut;
}

function ReadXMLFile(FilePath) {
var oXML=null;
var bOK=false;
try {
  oXML=new ActiveXObject("MSXML2.DOMDocument");
  oXML.async=false;
  bOK=oXML.load(FilePath);
   if (!bOK) oXML=null;
  }
catch (ex) {
  // don't care!
  }
return oXML;
}

function WriteXMLFile(XMLData,FilePath) {
var bOK=false;
try {
  XMLData.save(FilePath);
  bOK=true;
  }
catch (ex) {
  // don't care!
  }
return bOK;
}

function GetAllBlocks() {
return ReadXMLFile(msContactsPath);
}

function ReadTextFile(FilePath) {
var sOut="";
try {
  var fso=new ActiveXObject("Scripting.FileSystemObject");
  var txt=fso.opentextfile(FilePath,1,0,-2);
  sOut=txt.ReadAll();
  txt.Close();
  }
catch (ex) {
  // don't care
  }
return sOut;
}

function ReadHTTPXMLURL(URL) {
var oXML=null;
try {
  var xml=new ActiveXObject("MSXML2.XMLHTTP");
  xml.open("GET", URL, 0);
  xml.send();
  var xml2=xml.responseText;
  oXML=new ActiveXObject("MSXML2.DOMDocument");
  if (!oXML.loadXML(xml2)) oXML=null;
  }
catch (ex) {
  //don't care
  }
return oXML;
}

function LogIn(URL)
{
var ret = false;
try{
var xml=new ActiveXObject("MSXML2.XMLHTTP");
xml.open("POST", URL, 0);
xml.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
xml.send("loginId=nwang&password=Neil0516&repository=7.0.0");
var response = xml.responseText;
DebugTrace(response);
var cqServerViewURL = ReadSetting("cqServerViewURL",defaultCQServerURL);
xml.open("GET",cqServerViewURL+cqNum+'&noframes=true&format=HTML', 0);
xml.send();
response = xml.responseText;
DebugTrace(response);
}
catch(ex)
{

}
return ret;
}

function ReadSetting(TheName,DefaultValue) {
var oXML;
var oNode;
var sOut=System.Gadget.Settings.readString(TheName);
if (!sOut) sOut="";
if (sOut.length==0) {
  sOut=DefaultValue;
  try {
    oXML=new ActiveXObject("MSXML2.DOMDocument");
    if (oXML.load(msSettingsPath)) {
      oNode=oXML.selectSingleNode("/Settings/"+TheName);
      if (oNode) if (oNode.text.length>0) sOut=oNode.text;
      }
    }
  catch (ex) {
    // don't care!
    }
  }
return sOut;
}

function SaveSetting(TheName,TheValue) {
var oXML;
var oNode;
var oNode2;
try {
  oXML=new ActiveXObject("MSXML2.DOMDocument");
  if (!oXML.load(msSettingsPath)) {
    oNode=oXML.createElement("Settings");
    oNode=oXML.appendChild(oNode);
    }
  oNode=oXML.selectSingleNode("/Settings");
  if (oNode) {
    }
  else {
    oNode=oXML.createElement("Settings");
    oNode=oXML.appendChild(oNode);
    }
  oNode2=oXML.selectSingleNode("/Settings/"+TheName);
  if (oNode2) {}
  else {
    oNode2=oXML.createElement(TheName);
    oNode2=oNode.appendChild(oNode2);
    }
  oNode2.text=TheValue;
  oXML.save(msSettingsPath);
  }
catch (ex) {
  // don't care
  }
System.Gadget.Settings.writeString(TheName,TheValue);
}

function ShowIE(URL) {
URL=URL.replace(".\\",System.Gadget.path+"\\");
URL="IExplore.exe \""+URL+"\"";
var shell=new ActiveXObject("WScript.Shell");
shell.run(URL,1,false);
}

function ShowExplorer(FOLDERPATH)
{
FOLDERPATH="Explorer.exe \""+FOLDERPATH+"\"";
var shell=new ActiveXObject("WScript.Shell");
shell.run(FOLDERPATH,1,true);
}
