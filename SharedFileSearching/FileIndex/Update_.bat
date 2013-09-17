set WorkingFolder=E:\Development\ES1_Utilities_Source\Utilities\SharedFileSearching\FileIndex
set URL=http://localhost:8983/solr/SourceOne/update
set FULLINDEXURL=http://localhost:8983/solr/FullIndex/update
set ScanConfig=seed.txt
set DirToStoreInfo=%WorkingFolder%\info

echo Start to post the documents supported to be full indexed

for /f "tokens=1,2,3,4 delims=|" %%i in (Info\toBeFullTextIndexed.txt) do curl.exe "%FULLINDEXURL%/extract?literal.id=%%i&literal.resourcename=%%j&literal.category=File&literal.url=%%k&fmap.resourcename=fileName&fmap.category=fileType&fmap.url=filePath" -F "myfile=@%%l"
del "%DirToStoreInfo%\toBeFullTextIndexed.txt"
echo All files that need to be full text indexed have allready done
set LastUpdated="Last Updated %date:~0,10% %time:~0,2%-%time:~3,2%"
echo %LastUpdated%>LastUpdate.txt
echo Press any key to close
pause