var mlFullSize = 310;
var mlShortSize = 280;
var msTickerURL = "";
var mlTickerRefresh = 15 * 60000;
var mdTickerUpdated = new Date(1900, 1, 1, 0, 0);
var maxCharactersToShowInLink = 32;
var returnCountEachSearch = 10;
var defaultCQServerURL="http://na-ccrc.otg.com:12080/cqweb/#/7.0.0/CQSDR/RECORD/";
var defaultPersonalSharedFolder='\\\\es1fileserver.corp.emc.com\\Personal\\';

function ShowNode(TheNode)
{
   var n = TheNode.nodeName;
   var s = "<div class='txtblock'>";
   s += FormatEntry(TheNode.xml, "/" + n)[1];
   currentcol.innerHTML += s + "</div>\r\n";
}

function UpdateFlyoutNow()
{
   if (CheckForUpdates(true)) InitFlyoutForm();
}

function PropertyToString(TheProperty)
{
   var s = "";
   if (TheProperty.value != null)
   {
      if (TheProperty.IsArray)
      {
         var a = TheProperty.Value.toArray();
         for (var v = 0; v < a.length; v ++ )
         {
            s += a[v].split("|")[0];
            if (v < a.length - 1) s += "<br />";
         }
      }
      else
      s = TheProperty.value.split("|")[0];
   }
   return s;
}

function TryQuery(WMI, SNQuery)
{
   var c = WMI.ExecQuery(SNQuery);
   var s = "";
   var e = new Enumerator(c);
   while ( ! e.atEnd())
   {
      s = PropertyToString(e.item().properties_("SerialNumber"));
      e.moveNext();
   }
   return s;
}

function SerialNumber(WMI)
{
   var s = TryQuery(WMI, "SELECT SerialNumber FROM Win32_BIOS WHERE PrimaryBIOS = TRUE");
   if (s.length == 0)
   s = TryQuery(WMI, "SELECT SerialNumber FROM Win32_SystemEnclosure WHERE Tag = 'System Enclosure 0'");
   if (s.length == 0)
   s = TryQuery(WMI, "SELECT SerialNumber FROM Win32_BaseBoard WHERE Tag = 'Base Board'");
   return s;
}

function ExtractText(el)
{
   var t = "";
   var t1 = "";
   var c = el.firstChild;
   var c1 = null;
   while (c)
   {
      c1 = c.Children;
      if ( ! c1)
      {
         c1 = c.name;
         if (c1 == "fld" || c1 == "txt" || c1 == "title")
         {
            t1 = c.innerText;
            if (t1 != "")
            {
               if (c1 == "title") t += "\r\n";
               t += t1;
               if (c1 != "fld") t += "\r\n";
            }
         }
      }
      t += ExtractText(c);
      c = c.nextSibling;
   }
   return t;
}

function DoCopy()
{
   var t = "";
   t = ExtractText(document.getElementById('flyout'));
   if (t.length > 2) t = t.substr(2);
   window.clipboardData.setData('text', t);
}

function CloseFlyout()
{
   document.getElementById("copybutton").style.display = "none";
   System.Gadget.Flyout.show = false;
}

function CurrentUser()
{
   var n = null;
   var u = "";
   try
   {
      n = new ActiveXObject("WScript.Network");
      u = n.UserDomain + '\\' + n.Username;
   }
   catch (ex)
   {
      // don't care
   }
   return u;
}

function WMIInfo(WMI, title, fields, classname, whereclause, addserial, showcopy)
{
   var s = "";
   var c = WMI.ExecQuery("select " + fields + " from " + classname + " " + whereclause);
   if (c.Count)
   {
      if (showcopy)
      {
         document.getElementById("copybutton").style.display = "block";
      }
      s += "<div style='width:100%'><div name='title' class='infotitle'>" + title + "</div>\r\n";
      s += "</div>";
      var f = fields.split(",");
      var e = new Enumerator(c);
      var d;
      var dv;
      while ( ! e.atEnd())
      {
         var o = e.item();
         for (var fld = 0; fld < f.length; fld ++ )
         {
            try
            {
               d = o.properties_(f[fld]);
               dv = PropertyToString(d);
            }
            catch (ex)
            {
               dv = "";
            }
            if (dv.length == 0 && f[fld] == 'Username') dv = CurrentUser();
            if (f[fld] == 'Name' && classname == 'win32_computersystem') f[fld] = 'Host';
            if (dv.length > 0)
            {
               s += "<div class='infoset'><div name='fld' class='infofield'>" + f[fld] + ": </div>"
               s += "<div name='txt' class='infodata'>";
               s += dv + "</div></div>\r\n";
            }
         }
         if (addserial)
         {
            s += "<div class='infoset'><div class='infofield' name='fld'>Serial: </div>";
            s += "<div class='infodata' name='txt'>" + SerialNumber(WMI) + "</div></div>\r\n";
         }
         s += "<br />\r\n\r\n";
         e.moveNext();
      }
   }
   return s;
}

function ShowSystemInfo()
{
   try
   {
      var loc = new ActiveXObject("WBemScripting.SWbemLocator");
      var wmi = loc.ConnectServer(".", "/root/cimv2");
      var s = WMIInfo(wmi, "General Info", "Username,Name,Domain,Manufacturer,Model", "win32_computersystem", "", true, true);
      s += WMIInfo(wmi, "Operating System", "Name,Version,OSArchitecture", "win32_operatingsystem", "", false, false);
      s += WMIInfo(wmi, "Network", "Description,MACAddress,IPAddress", "win32_networkadapterconfiguration",
      "where ipenabled=true", false, false);
      s += WMIInfo(wmi, "Disks", "Name,Description,FileSystem,Size,FreeSpace", "win32_logicaldisk", "", false, false);
      s += WMIInfo(wmi, "Mount Points", "Name,Label,FileSystem,Capacity,FreeSpace,Compressed,DirtyBitSet,ErrorDescription,IndexingEnabled,LastErrorCode",
      "win32_volume", "where driveletter is null and not Name like '\\\\%'", false, false);
      s += WMIInfo(wmi, "Video", "Name,VideoProcessor,VideoModeDescription", "win32_videocontroller", "", false, false);
   }
   catch (ex)
   {
      s = "WMI error: " + ex.description;
   }
   currentcol.innerHTML = s;
   // .replace(/</ig, "&lt;");
}

function ShowSearchResult(start, count, isFullTextSearch)
{
   var s = "<div class='txtblock'>";
   var commonReturnFields = "fileName,filePath,fileType";
   var q = System.Gadget.document.getElementById("q").value == "" ? "*" : System.Gadget.document.getElementById("q").value;
   var targetNormalSearchURL = ReadSetting("searchServerURL","");
   var targetFullTextSearchURL = ReadSetting("fullTextSearchServerURL","");
   targetSearchURL = (isFullTextSearch)?targetFullTextSearchURL:targetNormalSearchURL;
   targetSearchURL += "select?wt=xml&fl=" + commonReturnFields + "&q=" + q;
   targetSearchURL += "&start=" + start.toString();
   targetSearchURL += "&rows=" + count.toString();
   targetSearchURL += "&t=" + CacheKiller();
   var result = ReadHTTPXMLURL(targetSearchURL);
   if(result && result.xml && result.xml.length > 0)
   {
      var r1 = FormatResultHeader(result);
      s += r1[1];
      // the format string for the header
      var r2 = FormatEachResult(result, "/response/result/doc");
      s += r2[1];
      // the format string
      GenerateSearchResultNavigator(start, r1[0]/* total match count */ , r2[0]/* The doc count */ , isFullTextSearch);
      }
   else
   {
	s+="<p style='color:red;'>Something is wrong with the search server, please contact Neil for help.</p>";
   }
   s += "</div>\r\n";
   currentcol.innerHTML = s;
}

function FormatResultHeader(xmlDoc)
{   
   var r = new Array(2);
   var numsFound="0";
   try{
   numsFound = xmlDoc.selectSingleNode("/response/result").getAttribute("numFound");
   }catch(e)
   {
   //ignore
   }
   r[0] = Number(numsFound);
   r[1] = "Total: " + numsFound;
   return r;
}

function FormatEachResult(xmlDoc, xmlPath)
{
   var s = "";
   s += "<div id='title' name='title' class='blocktitle'>" + "Files Match" + "</div>";
   if (System.Gadget.docked)
   s += "<div class='break'>";
   else
   s += "<div class='indent break'>";

   var docs = xmlDoc.selectNodes(xmlPath);
   for(var i = 0; i < docs.length; i ++ )
   {
      var node = docs.item(i);
      s += "<div class='fullentry'>";
      var items = node.selectNodes("str");
      var docName = "";
      var docType = "";//File or Directory
      for(var j = 0; j < items.length; j++)
	  {
		var property = items.item(j).getAttribute("name");
		switch(property)
		{
			case "fileName":
			docName = items.item(j).text;
			break;
			case "filePath":
			docPath = items.item(j).text;
			break;
			case "fileType":
			docType = items.item(j).text;
			break;			
		}
	  }
	  var sicon = (docType=="File")?"entry_file.png":"entry_folder.png";
	  if(docType=="File")
	  {
		s += "<div class='entryicon'><a href='" + docPath.substr(0,docPath.lastIndexOf('\\')) + "'><img src='images/"+sicon+"'/></a></div>";
	  }
	  else
	  {
		s += "<div class='entryicon'><img src='images/"+sicon+"'/></div>";
	  }
      docName = docName.length > maxCharactersToShowInLink ? docName.substr(0, maxCharactersToShowInLink) + "..." : docName;
      // The max lengh to show in the result page
      s += '<div class="entrytext ' + docType + '">';
      s += '<a href="';
      s += docPath;
      s += '" title="';
      s += docPath;
      s += '">';
      s += docName;
      s += "</a>";
      s += "</div>\r\n";
      // end of entrytext
      s += "</div>\r\n";
      // end of fullentry
   }
   s += "</div>\r\n";
   var r = new Array(2);
   r[0] = docs.length;
   r[1] = s;
   return r;
}

function GenerateSearchResultNavigator(start, tatalNums, returnCount, isFullTextSearch)
{
   var navigator = "";
   navigator += "<a id='previous' onclick='ShowSearchResult("+(start-returnCountEachSearch).toString() + "," + returnCountEachSearch.toString() + "," + isFullTextSearch.toString() + ")'>Previous</a>";
   navigator += "<span>" + start.toString() + " to " + (start + returnCount).toString() + " of " + tatalNums.toString() + "</span>"
   navigator += "<a id='next' onclick='ShowSearchResult("+(start+returnCountEachSearch).toString()+"," + returnCountEachSearch.toString()  + "," + isFullTextSearch.toString() +  ")'>Next</a>";
   document.getElementById("navigator").innerHTML = navigator;
   document.getElementById("navigator").style.display = "block";
   if(start + returnCount < tatalNums)
   document.getElementById("next").style.display = "block";
   else
   document.getElementById("next").style.display = "none";
   if(start > 0)
   document.getElementById("previous").style.display = "block";
   else
   document.getElementById("previous").style.display = "none";
}

function UpdateTicker()
{
   var bUpdated = false;
   var src = ReadHTTPXMLURL(msTickerURL);
   var sText = "No Status Available";
   var dAsOf = "Unknown";
   if (src && src.xml && src.xml.length > 0)
   {
      sText = src.selectSingleNode("/SCStatus/Text").text;
      dAsOf = src.selectSingleNode("/SCStatus/AsOf").text;
      if (sText.length > 0)
      {
         sText = sText.replace(/&/ig, "&amp;")
         sText = sText.replace(/</ig, "&lt;")
         if (dAsOf.length == 0) dAsOf = "Unknown";
         dAsOf = dAsOf.replace(/'/ig,'"');
         sText = "<marquee title='"+dAsOf+"'>" + sText + "</marquee>";
         bUpdated = true;
      }
   }
   document.getElementById("ticker").innerHTML = sText
   return bUpdated;
}

function RefreshTicker()
{
   var bDone = false;
   var dNow = new Date();
   if (dNow - mdTickerUpdated > mlTickerRefresh)
   {
      if (UpdateTicker())
      {
         mdTickerUpdated = dNow;
         bDone = true;
      }
   }
   return bDone;
}

function InitTicker()
{
   if ( ! RefreshTicker())
   document.getElementById("ticker").innerHTML += "Status not available";
   window.setInterval(RefreshTicker, 60000);
}

function InitFlyoutForm()
{
   var oNode;
   var x;
   currentcol = document.getElementById("flyout");
   currentcol.innerHTML = "";
   currentline = 0;
   secondcol = false;
   maxlines = - 1;
   if (System.Gadget.document.getElementById("flyoutcommand").innerText == "info")
   {
      document.getElementById("caption").innerText = "System Info";
      currentcol.style.height = mlFullSize;
      //  ShowTicker(document);
      HideTicker(document);
      HideUpdateNow(document);
      ShowSystemInfo();
      window.setTimeout(InitTicker, 1000);
   }
   else if(System.Gadget.document.getElementById("flyoutcommand").innerText == "search")
   {
      document.getElementById("caption").innerText = "Result";
      document.getElementById("updatenow").style.display = "none";
      document.getElementById("ticker").style.display = "none";
      currentcol.style.height = mlShortSize;
      var qStr = System.Gadget.document.getElementById("q").value == "" ? "*" : System.Gadget.document.getElementById("q").value;
	  qStr = qStr.replace(/^\s+|\s+$/g, '');//trim
	  if(isPersonalSharedFolder(qStr))//Is a personal shared folder, if yes, directly open it
	  {
		  ShowExplorer(defaultPersonalSharedFolder+qStr);
	  }		
	  else if(isCQItemRequest(qStr))//the patter of the CQ item ID, open the CQ defect or ascalation
	  {
		  var cqNum = formatCQNumber(qStr);
		  var cqServerViewURL = ReadSetting("cqServerViewURL",defaultCQServerURL);
		  ShowIE(cqServerViewURL+cqNum+'&noframes=true&format=HTML');
	  }
	  else
	  {
		ShowSearchResult(0, returnCountEachSearch, false/*none full text search*/);
	  }
   }
   else if(System.Gadget.document.getElementById("flyoutcommand").innerText == "fullTextSearch")
   {
      document.getElementById("caption").innerText = "Full Text Search Result";
      document.getElementById("updatenow").style.display = "none";
      document.getElementById("ticker").style.display = "none";
      currentcol.style.height = mlShortSize;
      ShowSearchResult(0, returnCountEachSearch, true/*full text search*/);
   }
   else
   {
      document.getElementById("caption").innerText = "All Listings";
      currentcol.style.height = mlShortSize;
      HideTicker(document);
      ShowUpdateNow(document, "Flyout");
      var b = GetAllBlocks();
      var oTop = b.selectSingleNode("/emcsourceoneresourcesgadget");
      if (oTop)
      {
         for (x = 0; x < oTop.childNodes.length; x ++ )
         {
            ShowNode(oTop.childNodes(x));
         }
      }
   }
}
//check whether the input for search is a CQ number or shortened CQ number
function isCQItemRequest(qStr)
{
	var ret = false;
	var patt1 = /^CQSDR\d{5,8}/i;
	ret = patt1.test(qStr);
	if(ret)
	{
	  return ret;
	}
	else
	{
		patt1 = /^\d{5,8}/;
		ret = patt1.test(qStr);
		return ret;
	}
}
//check is the qStr a valid personal shared folder
function isPersonalSharedFolder(qStr)
{	var folderList;
	if(personalFoldersList=="")
	{
		folderList = ReadPersonalFoldersSettings(msSettingsPersonalFolder);
	}
	else
	{
		folderList = personalFoldersList;
	}
	var ret = false;
	var i=0;
	for(i=0;i<folderList.length;i++)
	{
		if(folderList[i].toLowerCase()==qStr.toLowerCase())
		{
			ret=true;
			break;
		}
	}
	return ret;
}

function formatCQNumber(qStr)
{
return qStr;//Currently the CQ server will do the match for the CQ number automatically, such as 23456 or 00023456 or CQSDR00023456 will leds to the same item.
}

document.onreadystatechange = function()
{
   if (document.readyState == "complete")
   {
      InitFlyoutForm();
   }
}
