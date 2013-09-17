var mlHeightSmall=140;
var mlDefaultSmall=140;
var mlWidthSmall=130;
var mlHeightBig=340;
var mlWidthBig=480;

var currentcol;
var currentline;
var maxlines;
var secondcol;

function InitColumns() {
var b=document.body;
var c=document.getElementById("contacts");
var m=document.getElementById("flyoutlinks");
currentcol=document.getElementById("rightcol");
currentcol.innerHTML="";
currentcol.style.display="none";
currentcol=document.getElementById("leftcol");
currentcol.innerHTML="";
currentcol.style.display="block";
currentcol.style.marginLeft="auto";
currentcol.style.marginRight="auto";
currentcol.style.position="static";
secondcol=false;
currentline=0;
if (System.Gadget.docked) {
  mlHeightSmall=mlDefaultSmall;
  currentcol.style.width="100%";
  c.style.height=52;
  m.style.fontSize="10px";
  m.style.marginTop="0px";
  maxlines=7;
  document.getElementById("allicon").innerHTML="<img src='images/allsmall.png' />";
  document.getElementById("infoicon").innerHTML="<img src='images/infosmall.png' />";
  document.getElementById("helpicon").innerHTML="<img src='images/helpsmall.png' />";
  document.getElementById("fbicon").innerHTML="<img src='images/fbsmall.png' />";
  document.getElementById("branding").style.display="block";
  document.getElementById("search").style.marginRight="10px";
  }
else {
  currentcol.style.width="auto";
  c.style.height=mlHeightBig-48;//35 the search box height
  m.style.fontSize="12px";
  m.style.marginTop="10px";
  maxlines=24;
  document.getElementById("allicon").innerHTML="<img src='images/allbig.png' />";
  document.getElementById("infoicon").innerHTML="<img src='images/infobig.png' />";
  document.getElementById("helpicon").innerHTML="<img src='images/helpbig.png' />";
  document.getElementById("fbicon").innerHTML="<img src='images/fbbig.png' />";
  document.getElementById("branding").style.display="none";
  document.getElementById("q").style.width="110px";
  document.getElementById("search").style.width = "150px";
  document.getElementById("search").style.marginRight="10px";
  }
document.getElementById("rightcol").style.display="none";
}

function enterPressed(evt) {
    var keyCode = evt ? (evt.which ? evt.which : evt.keyCode) : event.keyCode;
    if (keyCode == 13) {//Enter is pressed
      document.getElementById("bSearch").click();
      return false;
    }
    else
      return true;
  };
function AddToCurrentColumn(TheBlock,ThePath,AdjustSize) {
var f=FormatEntry(TheBlock,ThePath);
var klines=f[0];
var s=f[1];
var sOut="";
currentline+=klines;
if (secondcol==true || maxlines<0) {
  if (currentline<=maxlines || maxlines<0) sOut=s;//If the links are larger than the max lines that can show in one collumn, the content will not show
  }
else {
  if (currentline<=maxlines) {
    sOut=s;
    }
  else {//The content can not be shown on the first collumn, try to show them on the second collumn.
    if (AdjustSize==true) {//Small window
      var h=klines*12+50+50;//35 search box height
      if (h<100) h=100;
      if (h!=mlHeightSmall) {
        mlHeightSmall=h;
        System.Gadget.beginTransition();
        document.body.style.height=mlHeightSmall;
        document.getElementById("contacts").style.height=mlHeightSmall-78;
        System.Gadget.endTransition(System.Gadget.TransitionType.morph, 1);
        }
      sOut=s;
      }
    else {
      currentcol.style.width="50%";
      currentcol=document.getElementById("rightcol");
      secondcol=true;
      currentcol.style.display="block";
      currentcol.style.marginLeft="auto";
      currentcol.style.marginRight="auto";
      sOut=s;
      currentline=klines;
      }
    }
  }
currentcol.innerHTML+=sOut;
}

function UpdateCheck() {
if (CheckForUpdates(false)) LoadSettings();
}

function ShowSmall() {
InitColumns();

var b=ReadSetting("smallsel",DEFSMALLSEL);
var t=GetBlock("/emcsourceoneresourcesgadget/"+b);
AddToCurrentColumn(t,b,true);
}

function ShowLarge() {
var b1;
var t;
var n;
InitColumns();
var b=ReadSetting("bigsel",DEFBIGSEL).replace(" ","");
b=b.split(",");
for (b1 in b) {
  t=GetBlock("/emcsourceoneresourcesgadget/"+b[b1]);
  AddToCurrentColumn(t,b[b1],false);
  }
if (secondcol==false) {
  n=currentcol.offsetWidth;
  t=document.getElementById("contacts").offsetWidth;
  currentcol.style.position="absolute";
  currentcol.style.left=(t-n)/2;
  }
//var z=document.getElementById("contacts");
//z.innerHTML=z.outerHTML.replace(/</ig,"&lt;");//.replace(/>/ig,"><br />");
}

function CheckDockedState() {
var body=document.body.style;
var bg=document.getElementById("gbackground");
bg.style.width=0;
System.Gadget.beginTransition();
if (System.Gadget.docked) {
  body.width=mlWidthSmall;
  body.height=mlHeightSmall;
  document.getElementById("q").style.width="80px";
  bg.src="url(images/backgroundsmall.png)";
  bg.backgroundSize="100%";
  ShowSmall();
  }
else {
  body.width=mlWidthBig;
  body.height=mlHeightBig;
  document.getElementById("q").style.width="120px";
  bg.src="url(images/backgroundbig.png)";
  bg.backgroundSize="100%";
  ShowLarge();
  }
System.Gadget.endTransition(System.Gadget.TransitionType.morph, 2);
}

function InitializeSettings() {
var s=ReadSetting("smallsel","");
var s1=ReadSetting("bigsel","");
var searchURL = ReadSetting("searchServerURL","");
if (s.length==0 || s1.length==0 || searchURL.length==0){
  var oNet=new ActiveXObject("WScript.Network");
  var sDomain=oNet.UserDomain.toUpperCase();
  var sUser=oNet.UserName;
  if (sDomain=="CORP" || sDomain=="ENG") {
    //s="http://itcentral.corp.emc.com/gcc/gadgets/EMCResourcesSettings.asp?u="+sDomain+"\\"+sUser;
	s=msSettingsRemotePath;
    try {
      s=ReadXMLFile(s);
      var n=s.selectSingleNode("/Settings");
      var nc=n.childNodes;
      for (var x=0;x<nc.length;x++) {
        n=nc[x].nodeName;
        s=ReadSetting(n,"");
        if (s.length==0) {
          SaveSetting(n,nc[x].text);
          }
        }
      }
    catch (ex) {
      // don't care
      }
    }
  }
  else
  {//update the segement of searchServerURL if it's not the same as remote
	 var s=ReadXMLFile(msSettingsRemotePath);
	 if(s && s.xml && s.xml.length>0){
     var n=s.selectSingleNode("/Settings/searchServerURL");
     var nc=n.childNodes[0].text;
	 if(nc!=searchURL)
	 {
	   SaveSetting("searchServerURL",nc);
	   searchURL = nc;
	 }
	 }
	 else
	 {}
  }
}

function LoadSettings() {
if (System.Gadget.docked)
  ShowSmall();
else
  ShowLarge();
}

function SettingsChanged(event) {
var uf=System.Gadget.document.getElementById("didupdate");
if (event.closeAction==event.Action.commit || uf.innerText=="Yes") {
  LoadSettings();
  uf.innerText="No";
  }
}

function FlyoutHidden() {
var uf=System.Gadget.document.getElementById("didupdate");
if (uf.innerText=="Yes") {
  LoadSettings();
  uf.innerText="No";
  }
}

function ShowFlyout(content) {
document.getElementById("flyoutcommand").innerText=content;
System.Gadget.Flyout.show=true;
}

document.onreadystatechange=function() {
if (document.readyState=="complete") {
  System.Gadget.onDock=CheckDockedState;
  System.Gadget.onUndock=CheckDockedState;
  System.Gadget.settingsUI="Settings.htm";
  System.Gadget.onSettingsClosed=SettingsChanged;
  System.Gadget.Flyout.file="Flyout.htm";
  System.Gadget.Flyout.onHide=FlyoutHidden;
  InitializeSettings();
  LoadSettings();
  window.setInterval(UpdateCheck,600000);
  }
}
