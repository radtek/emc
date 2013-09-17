set WorkingFolder=E:\Development\ES1_Utilities_Source\Utilities\SharedFileSearching\FileIndex
set URL=http://localhost:8983/solr/SourceOne/update
set FULLINDEXURL=http://localhost:8983/solr/FullIndex/update
set ScanConfig=seed.txt
set DirToStoreInfo=%WorkingFolder%\info
if NOT exist "%DirToStoreInfo%" mkdir "%DirToStoreInfo%"
echo Start to navigate all the folders and files specified.
FileJournaling\FileJournaling.exe "%WorkingFolder%\%ScanConfig%" "%DirToStoreInfo%"
echo The scanning is done. All the xmls are generated at %DirToStoreInfo%

echo Start to post xmls to Solr server
java -Durl=%URL% -jar post.jar "%DirToStoreInfo%\index\*.xml"
java -Durl=%URL% -jar post.jar "%DirToStoreInfo%\delete\*.xml"
java -Durl=%FULLINDEXURL% -jar post.jar "%DirToStoreInfo%\delete\*.xml"
echo All the xmls are already posted into solr server

del "%DirToStoreInfo%\index\*.xml"
del "%DirToStoreInfo%\delete\*.xml"
del "%DirToStoreInfo%\toBeDeleted.txt"
echo Start to post the documents supported to be full indexed

for /f "tokens=1,2,3,4 delims=|" %%i in (Info\toBeFullTextIndexed.txt) do curl.exe "%FULLINDEXURL%/extract?literal.id=%%i&literal.resourcename=%%j&literal.category=File&literal.url=%%k&fmap.resourcename=fileName&fmap.category=fileType&fmap.url=filePath" -F "myfile=@%%l"
del "%DirToStoreInfo%\toBeFullTextIndexed.txt"
echo All files that need to be full text indexed have allready done
set LastUpdated="Last Updated %date:~0,10% %time:~0,2%-%time:~3,2%"
echo %LastUpdated%>LastUpdate.txt
echo Press any key to close
pause