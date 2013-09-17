This folder contains the solr(apache-solr-4.0.0) 
To run the server, make sure 
1	the java JDK is installed and the JRE_HOME and JAVA_HOME is set in the system environment variable:
	Below is an example:
	JAVA_HOME: C:\Program Files\Java\jdk1.6.0_33
	JRE_HOME: C:\Program Files\Java\jre6

2	Then navigator to the folder of apache-solr-4.0.0\example
3	Run the command "java -jar start.jar"
4	To make sure the solr is started, access http://localhost:8983/solr, you should get the admin page of solr.



For the content to be full text indexed, we use the parameters to store the related information of the document:
category--->fileType
resourcename----->fileName
url----->filePath

The url to submit the document is: 
curl.exe http://localhost:8983/solr/SourceOne/update/extract?literal.id=Neil15&literal.resourcename=Solr&literal.category=OfficeDoc&literal.url=\\es1all\share\solr.docx&fmap.resourcename=fileName&fmap.category=fileType&fmap.url=filePath&commit=true" -F "myfile=@E:\Solr.docx