using System;
using System.IO;
using System.Xml;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace FileJournaling
{
    class Program
    {
        static System.Collections.ArrayList scanFolderList = new System.Collections.ArrayList();
        static System.Collections.ArrayList notScanFolderList = new System.Collections.ArrayList();
        static int processedFileCount = 0;
        static int processedDirectoryCount = 0;
        static int skippedDirectoryCount = 0;
        static int errorCoult = 0;
        static IndexRecord indexRecord = null;
        static string logFilePath = "";
        static void Main(string[] args)
        {

            if (args.Length < 2 || !File.Exists(args[0]) || !Directory.Exists(args[1]))
            {
                printUsage();
                return;
            }
            string foldersListConfigFile = args[0];
            string destinationFolder = args[1];
            logFilePath = destinationFolder + @"/log.txt";
            indexRecord = new IndexRecord(destinationFolder);
            using (StreamReader reader = new StreamReader(foldersListConfigFile))
            {
                while (reader.Peek() >= 0)
                {
                    string folder = reader.ReadLine();
                    if (folder.StartsWith("-"))
                        notScanFolderList.Add(folder.Remove(0, 1));
                    else
                        scanFolderList.Add(folder);
                }
            }
            foreach (string folder in scanFolderList)
            {
                Console.WriteLine("Start Scan Folder: " + folder);
                recordAllFileInfo(folder, destinationFolder);
            }
            indexRecord.scanCleanAndGenerateFileIDToDeleteList(destinationFolder + @"\delete");
            indexRecord.saveFileIDIndexedList();
            Console.WriteLine("Done! File Processed: {0}; Directory Processed: {1}; Directory Skipped: {2}; Error: {3}", processedFileCount, processedDirectoryCount, skippedDirectoryCount, errorCoult);

        }

        static void printUsage()
        {
            Console.WriteLine("Make sure the path you specified exist and Try again.");
            Console.WriteLine("Usage: ");
            Console.WriteLine("FileJournaling.exe <seed file path> <destination folder>");
            Console.WriteLine("<seed file path>:\t the configure file for the folders to be scanned or skipped");
            Console.WriteLine("<destination folder>:\t destination folder path to store the xmls");
            Console.WriteLine("");
            Console.WriteLine("This tool just scan all the files under the folder specified in seed file");
            Console.WriteLine("Then record the location and file name into the xml file");
            Console.WriteLine("Then save them under the destination folder.");
            Console.WriteLine("The xmls then will be added into the solr site to be indexed. ");
            Console.WriteLine("Then user can search the folder through the Solr web site.");
        }

        static void recordAllFileInfo(string folder, string destFolder)
        {
            string destinationFolder = destFolder + @"\index";
            try
            {
                if (!Directory.Exists(destinationFolder))
                {
                    Directory.CreateDirectory(destinationFolder);
                }
                string[] fileList = Directory.GetFiles(folder);
                for (int i = 0; i < fileList.Length; i++)
                {
                    string file = fileList[i];
                    FileInfo fileInfo = new FileInfo(file);
                    if (indexRecord.isFileTypeSupported(fileInfo.Extension))
                    {
                        if (indexRecord.isFileTypeToBeFullIndexed(fileInfo.Extension))
                        {
                            recordFileInfo(fileInfo, destinationFolder, true);
                        }
                        else
                        {
                            recordFileInfo(fileInfo, destinationFolder, false);
                        }
                    }
                }
                string[] dirList = Directory.GetDirectories(folder);
                for (int i = 0; i < dirList.Length; i++)
                {
                    string dir = dirList[i];
                    if (notScanFolderList.Contains(dir))
                    {
                        Console.WriteLine("Skipped Folder: " + dir);
                        skippedDirectoryCount++;
                        continue;
                    }
                    if (dir != "." && dir != "..")
                    {
                        recordDirectoryInfo(dir, destinationFolder);
                        recordAllFileInfo(dir, destFolder);
                    }
                }
            }
            catch (Exception e)
            {
                log("Exception when process folder: \t" + folder);
                log(e.Message);
                log(e.StackTrace);
            }
        }

        static void log(string message)
        {
            using (StreamWriter r = new StreamWriter(logFilePath, true, Encoding.UTF8))
            {
                r.WriteLine(DateTime.Now.ToString() + "\t" + message);
                r.Close();
            }
        }

        static void recordDirectoryInfo(string dir, string destinationFolder)
        {
            try
            {
                Console.WriteLine("Processing: " + dir);
                string id = indexRecord.generateDocIdByHash(dir);
                if (!indexRecord.isFileIndexed(id))//if not already indexed, index it
                {
                    string xmlFileName = destinationFolder + @"\" + indexRecord.generateDocNameByDate() + ".xml";
                    string folderName = new DirectoryInfo(dir).Name;
                    string folderExtension = "";
                    string folderPath = dir;
                    string folderType = "Directory";
                    recordToXML(xmlFileName, id, folderName, folderExtension, folderPath, folderType);
             
                    indexRecord.addFileIDToIndexedList(id, true);
                    processedDirectoryCount++;
                }
                else
                {
                    indexRecord.setFileScanned(id);
                }
            }
            catch (Exception e)
            {
                log("Exception when record directory info: \t" + dir);
                log(e.Message);
                log(e.StackTrace);
            }
        }

        static void recordFileInfo(FileInfo fileInfo, string destinationFolder, bool isToBeFullIndexed)
        {
            try
            {
                Console.WriteLine("Processing: " + fileInfo.FullName);
                string id = indexRecord.generateDocIdByHash(fileInfo.FullName);
                if (!indexRecord.isFileIndexed(id))//not indexed yet, index it
                {
                    string xmlFileName = destinationFolder + @"\" + indexRecord.generateDocNameByDate() + ".xml";
                    string fileName = fileInfo.Name;
                    string fileExtension = fileInfo.Extension.Replace(".", "");
                    string filePath = fileInfo.FullName;
                    string fileType = "File";
                    if (isToBeFullIndexed)
                    {
                        indexRecord.addToFileListToBeFullIndexed(id /*The unique ID for the full text index*/, filePath, fileName);
                        //addToFileListToBeFullIndexed(id + "Full"/*The unique ID for the full text index*/, filePath, destinationFolder);
                    }
                    recordToXML(xmlFileName, id, fileName, fileExtension, filePath, fileType);
                    processedFileCount++;
                    indexRecord.addFileIDToIndexedList(id, true);
                }
                else
                    indexRecord.setFileScanned(id);
            }
            catch (Exception e)
            {
                log("Exception when process file: \t" + fileInfo.FullName);
                log(e.Message);
                log(e.StackTrace);
                errorCoult++;
            }

        }

     
        static void recordToXML(string xmlFileName, string id, string fileName, string fileExtension, string filePath, string fileType)
        {
            XmlDocument doc = new XmlDocument();
            doc.LoadXml("<add><doc></doc></add>");

            writeProperty("id", id, doc);
            writeProperty("fileName", fileName, doc);//add the file name with extension into the field to be indexed
            writeProperty("fileExtension", fileExtension, doc);
            writeProperty("filePath", filePath, doc);
            writeProperty("fileType", fileType, doc);
            writeProperty("name", fileName.Substring(0, fileName.LastIndexOf('.') > 0 ? fileName.LastIndexOf('.') : 0), doc);//add the file name without extension into the field to be indexed
            doc.Save(xmlFileName);
        }

        static void writeProperty(string propertyName, string propertyValue, XmlDocument doc)
        {
            XmlElement node = doc.CreateElement( "field");
            XmlAttribute attr = doc.CreateAttribute("name");
            attr.Value = propertyName;
            node.SetAttributeNode(attr);
            XmlCDataSection cData = doc.CreateCDataSection(replaceSpecialChar(propertyValue));
            node.AppendChild(cData);
            doc.GetElementsByTagName("doc")[0].AppendChild(node);
        }

        static string replaceSpecialChar(string strSource)
        {      

            string strTemp = strSource;
            strTemp = strTemp.Replace(@"&", "&amp;");
            strTemp = strTemp.Replace(@"<", "&lt;");
            strTemp = strTemp.Replace(@">", "&gt;");
            strTemp = strTemp.Replace(@"'", "&apos;");
            strTemp = strTemp.Replace("\"", "&quot;");
            return strTemp;
        }

        class IndexRecord
        {
            private System.Collections.ArrayList hashCodeList = new System.Collections.ArrayList();
            private System.Collections.ArrayList isAlreadyScannedList = new System.Collections.ArrayList();
            private string fileIndexed, fileToBeDeleted, fileToBeFullTextIndexed;
            public IndexRecord(string destinationFolder)
            {
                this.fileIndexed = destinationFolder + @"/allIndexed.txt";
                this.fileToBeDeleted = destinationFolder + @"/toBeDeleted.txt";
                this.fileToBeFullTextIndexed = destinationFolder + @"/toBeFullTextIndexed.txt";
                initiateHashList();
            }
            private void initiateHashList()
            {
                if (File.Exists(fileIndexed))
                {
                    using (StreamReader reader = new StreamReader(fileIndexed))
                    {
                        while (reader.Peek() > 0)
                        {
                            string line = reader.ReadLine();
                            hashCodeList.Add(line);
                            isAlreadyScannedList.Add(false);
                        }
                        reader.Close();
                    }
                }
            }
            public void addToFileListToBeFullIndexed(string id, string filePath, string fileName)
            {
                using (StreamWriter writer = new StreamWriter(this.fileToBeFullTextIndexed, true))
                {
                    writer.WriteLine(System.Web.HttpUtility.UrlEncode(id)/*The doc id*/ + @"|" + System.Web.HttpUtility.UrlEncode(fileName)/*The file full path to import from*/ + @"|" + System.Web.HttpUtility.UrlEncode(filePath) + @"|" + filePath);
                }
            }
            public string generateDocNameByDate()
            {
                System.Threading.Thread.Sleep(1);
                return DateTime.Now.ToString("yyyyMMddHHmmssffff");
            }

            public string generateDocIdByHash(string folderPath)
            {
                byte[] b = { 20, 10, 12, 25, 19, 82, 04, 15, 123, 0 };
                return SimpleHash.ComputeHash(folderPath, "SHA512", b);
            }

            public bool isFileTypeSupported(string fileExtension)
            {
                string[] notSupportFileExtensions = null;
                using (StreamReader reader = new StreamReader(AppDomain.CurrentDomain.BaseDirectory + @"\fileTypesSkipped.txt")) 
                {
                    notSupportFileExtensions = reader.ReadLine().Split(',');
                }
                return !notSupportFileExtensions.Contains(fileExtension.ToLower());
            }

            public bool isFileTypeToBeFullIndexed(string fileExtention)
            {
                string[] fileTypeToBeFullIndexed = null;
                using (StreamReader reader = new StreamReader(AppDomain.CurrentDomain.BaseDirectory + @"\fileTypesToBeFullIndexed.txt"))
                {
                    fileTypeToBeFullIndexed = reader.ReadLine().Split(',');
                }
                return fileTypeToBeFullIndexed.Contains(fileExtention);
            }

            public bool isFileIndexed(string fileID)
            {
                bool r = false;
                if (hashCodeList.Contains(fileID))
                {
                    r = true;
                    isAlreadyScannedList[hashCodeList.IndexOf(fileID)] = true;
                }
                return r;
            }

            public bool isFileScanned(string fileID)
            {
                return isAlreadyScannedList.Cast<bool>().ElementAt<bool>(hashCodeList.IndexOf(fileID));
            }

            public void addFileIDToIndexedList(string fileID, bool isScanned)
            {
                hashCodeList.Add(fileID);
                isAlreadyScannedList.Add(isScanned);
            }

            public void saveFileIDIndexedList()
            {

                using (StreamWriter writer = new StreamWriter(fileIndexed, false, Encoding.UTF8))
                {
                    foreach (string docID in hashCodeList)
                    {
                        writer.WriteLine(docID);
                    }
                    writer.Close();
                }

            }

            public void setFileScanned(string fileID)
            {
                isAlreadyScannedList[hashCodeList.IndexOf(fileID)] = true;
            }

            public void scanCleanAndGenerateFileIDToDeleteList(string filePathToStoreDeleteXML)
            {
                using (StreamWriter writer = new StreamWriter(this.fileToBeDeleted, true, Encoding.UTF8))
                {
                    for (int i = 0; i < hashCodeList.Count; i++)
                    {
                        string fileID = hashCodeList[i] as string;
                        if (isAlreadyScannedList.Cast<bool>().ElementAt<bool>(i) == false)//not scanned, means not existing any more
                        {
                            hashCodeList.Remove(fileID);
                            writer.WriteLine(fileID);
                            if (!Directory.Exists(filePathToStoreDeleteXML))
                                Directory.CreateDirectory(filePathToStoreDeleteXML);
                            using (StreamWriter r = new StreamWriter(filePathToStoreDeleteXML + @"/" + generateDocNameByDate() + ".xml", false, Encoding.UTF8))
                            {
                                r.WriteLine(@"<delete><id>" + fileID + @"</id></delete>");
                                r.Close();
                            }
                        }
                    }
                    writer.Close();
                }
            }
        }
    }
}