var bbDataContent = {};

bbDataContent.contentFolder = "file:///SDCard/SmartStudy/" + /*[#CONTENTFOLDER]*/"NabaAppDetailDemo"/*[$CONTENTFOLDER]*/;
bbDataContent.fileSystem = null;
bbDataContent.downloadReset = false;

bbDataContent.memoryIssue = "You do not appear to have enough free space on your handset for this application. The content for the SmartStudy application is large and requires at least 150 MB of free space. Please free up some space, and then run this application again";
bbDataContent.downloadText = "Please wait while the app installs the photo’s and illustrations. This could take a few minutes and please do not attempt to close the app while it is progressing";
bbDataContent.downloadNeeded = "Valuable photos and illustrations come with this app (150MB space required) so would you like to download them now? or next time you open the app? (WiFi required only during the download)";
bbDataContent.installText = "Please wait while the app installs content. This could take a few minutes&hellip;";
bbDataContent.noWifiText = "Valuable photo’s and illustrations come with this app (150MB space required) but you need Wi-Fi (once only) to download them, so please connect later";
bbDataContent.noSpaceText = "You do not appear to have enough free space for the photo’s and illustrations which require at least 150 MB. Please free up some space, and then run this application again";
bbDataContent.downloadError = "There was an error downloading content: ";


bbDataContent.onError = function (e) {
    // Do something
    if (e.code == 1)
        alert('There was an error accessing file system. Please close and run the app again.');
    else
        alert(JSON.stringify(e));
};

bbDataContent.onContentExistsError = function (e) {
    alert('There was an error checking data content. Please close and run the app again.');
};

bbDataContent.onGetFileError = function (e) {
    alert('There was an error downloading content. Please close and run the app again.');
};

bbDataContent.confirmRestart = function (message, error, restartFunction) {
    navigator.notification.confirm(message + error + ". Download restarts", function (button) {
        if (button == 1) {
            restartFunction();
            return;
        }
        $("#download-button").button("enable");
        //$("#download-started").empty().html("Error: " + JSON.stringify(error));
        $("#download-started").empty().html("Error: Unable to save content to SD card");
    }, "Error");
};

bbDataContent.checkSDCardContent = function () {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, bbDataContent.onCheckSuccess, bbDataContent.onError);  
};

bbDataContent.onCheckSuccess = function (fileSystem) {
    fileSystem.root.getDirectory("file:///SDCard", { create: false }, bbDataContent.sdcardExistsCallback, bbDataContent.cannotFindSdcardCallback);
    bbDataContent.fileSystem = fileSystem;
};

bbDataContent.cannotFindSdcardCallback = function (e) {
    bbDataContent.showMessageAndExitApp('You do not appear to have an SD card in your device. The content for the SmartStudy application is large and must be installed on an SD card. Please insert an SD card and then run this application again');
};

bbDataContent.sdcardExistsCallback = function (d) {
    // TODO (ftt): we should probably make this folder hidden, so that the user doesn't accidentally changes its contents
    d.getDirectory("SmartStudy", { create: true },
        function (d) {
            d.getDirectory(/*[#CONTENTFOLDER]*/"NabaAppDetailDemo"/*[$CONTENTFOLDER]*/, { create: true }, bbDataContent.onSSDirExists, bbDataContent.cannotGetFolderCallback);
        },
        bbDataContent.cannotGetFolderCallback);

    //d.getDirectory("SmartStudy/SuperDuperSmartStudyApp", { create: true }, bbDataContent.onSSDirExists, bbDataContent.cannotGetFolderCallback);
};


bbDataContent.onSSDirExists = function (d) {
    // Check if content exists, and if not, download it
    bbDataContent.contentExists(d);
};


bbDataContent.downloadContent = function () {
    // error messages are displayed by sanityCheck() itself
    if (!bbDataContent.sanityCheck())
        return;
    $("#download-button").button("disable");
    var restartMessage = bbDataContent.downloadError;
    // Download content
    // After download is completed we have to check everything again
    var fileTransfer = new FileTransfer();
    var localFile = bbDataContent.contentFolder + "/temp.zip";
    $("#download-started").empty();
    $("#download-message").empty().html(bbDataContent.downloadText);
    $('.progressbar-container').css('display', 'block');
    fileTransfer.download(
        bbSettings.ContentDownloadLink,
        localFile,
        function (entry) {
            bbDataContent.setDownloadProgress(1, true);

            var result = smst.ext.unzip(localFile);
            $("#download-wait").css('display', "none");
            if (result) {
                // failure
                bbDataContent.confirmRestart(restartMessage, result, bbDataContent.downloadContent);
                return;
            }

            bbDataContent.deleteTempZip();
            showMainPage();
        },
        function (e) {
            bbDataContent.setDownloadProgress(-1, true);
            bbDataContent.confirmRestart(restartMessage, e, bbDataContent.downloadContent);
        }
    );
    var poller = function (fo, maxFileSize) {
        if (fo === null) {
            bbDataContent.setDownloadProgress(-1, true);
            return;
        }
        setTimeout(function () {
            var file = fo.getFile();
            if (file !== null) {
                bbDataContent.setDownloadProgress(Math.floor(file.size / maxFileSize * 100), false);
                if (file.size >= maxFileSize) {
                    return;
                }
            }
            else if (fo.getError() !== null) {
                bbDataContent.onGetFileError(fo.getError());
                return;
            }
            poller(fo, maxFileSize);
        }, 600);
    }

    poller(bbDataContent.updatableFileObject(localFile), bbSettings.DownloadSize);
};

bbDataContent.updatableFileObject = function (fileName) {
    if (!fileName)
        return null;
    var file = null;
    var fileEntry = null;
    var error = null;

    return {
        getFile: function () {
            // we have to constantly poll the FileEntry objects in order to get updated size
            if (error !== null)
                return file;
            if (fileEntry === null) {
                window.resolveLocalFileSystemURI(fileName, function(fe) {fileEntry = fe;}, function(e) {error = e;});
            }
            else {
                fileEntry.file(function(f) {file = f;}, function(e) {error = e;});
            }
            return file;
        },
        getError: function () {
            return error;
        }
    };
};

bbDataContent.setDownloadProgress = function (percentage, finish) {
    if (finish) {
        if (percentage < 0) {
            $(".progressbar").text("Error");
			$("#download-wait").css('display', "none");
        } else {
            $("#download-progress").css('width', "100%");
			$('.progressbar-container').css('display', 'none');
            $("#download-wait").css('display', "inline");
            $("#download-message").empty().html(bbDataContent.installText);
        }
    } else {
        if (percentage > 95) {
            $("#download-message").empty().html(bbDataContent.installText);
			$('.progressbar-container').css('display', 'none');
            $("#download-wait").css('display', "inline");
        }
        $("#download-progress").css('width', percentage + "%");
    }
};

bbDataContent.decryptFile = function (fileName, continuation) {
    var fullPath = bbDataContent.contentFolder + '/' + fileName;
    var result = smst.ext.decrypt(fullPath);
    var successMarker = "data:";
    if (result.substring(0, successMarker.length) !== successMarker) {
        bbDataContent.onError(result);
    }
    continuation(result);
};

bbDataContent.showMessageAndExitApp = function (message) {
    navigator.notification.alert(message, function () { navigator.app.exitApp(); }, 'Smart Study', 'OK');
	//alert(message);
};

bbDataContent.sanityCheck = function () {
    try {
        // check free space on the SD card
        if (!bbDataContent.hasEnoughFreeSpace()) {
            bbDataContent.showMessageAndExitApp('You do not appear to have enough free space on your SD card for this application. The content for the SmartStudy application is large and requires at least 150 MB of free space on your SD card. Please insert an SD card with at least this much free space, or free up some space on your current SD card, and then run this application again');
            return false;
        }
    }
    catch (e) {
        // we can only get exception here, if the SD card is suddenly removed
        bbDataContent.showMessageAndExitApp('You do not appear to have an SD card in your device. The content for the SmartStudy application is large and must be installed on an SD card. Please insert an SD card and then run this application again');
        return false;
    }
    // check WiFi
    /*if (!smst.ext.wifiOn()) {
        bbDataContent.showMessageAndExitApp(bbDataContent.noWifiText);
        bbDataContent.downloadReset = true;
        return false;
    }*/
    return true;
};

bbDataContent.isWifiOn = function () {
    return smst.ext.wifiOn();
};


bbDataContent.contentExists = function (dirEntry) {
    var reader = dirEntry.createReader();
    reader.readEntries(function (entries) {

        if (!bbDataContent.allFilesExist(entries) || entries.length < bbSettings.MediaFileCount) {
            if (!bbDataContent.sanityCheck())
                return;
            //delete existing files
            //for (var i = 0; i < entries.length; ++i) {
            //entries[i].remove(null, null);
            
			//}
			
			if (!bbDataContent.isWifiOn()) {
                blackberry.ui.dialog.standardAskAsync(bbDataContent.noWifiText, blackberry.ui.dialog.D_OK, function () { }, { title: "Smart Study" });
                bbDataContent.downloadReset = true;
                return;
            }
			
			
            var buttons = ["Download Now", "Later"];
            blackberry.ui.dialog.customAskAsync(
	                bbDataContent.downloadNeeded,
	                buttons,
	                function (selectedButtonIndex) {
	                    //Download now
	                    if (selectedButtonIndex == 0) {
	                        $.mobile.changePage("#content-download-page");
	                    }
	                    //Later
	                    else {
	                        bbDataContent.downloadReset = true;
	                    }
	                },
	                {
	                    title: "Download needed",
	                    size: blackberry.ui.dialog.SIZE_MEDIUM,
	                    position: blackberry.ui.dialog.CENTER
	                }
	            );

        } else {
            showMainPage();
        }
    }, bbDataContent.onContentExistsError);
};

bbDataContent.deleteTempZip = function () {
    bbDataContent.fileSystem.root.getFile(bbDataContent.contentFolder + "/temp.zip", { create: false }, function (fileEntry) {
        fileEntry.remove(function () {
           ;
        }, bbDataContent.onError);
    }, bbDataContent.onError);
}

bbDataContent.allFilesExist = function (entries) {
    // FIXME (ftt): check file names from settings.xml (perhaps, should append .rem?)

    var allExist = true;
    var filesMissing = 0;
    for (var i = 0; i < bbSettings.FilesList.length; i++) {
        var found = false;
        for (var j = 0; j < entries.length; j++) {
            if (entries[j].name == bbSettings.FilesList[i]) {
                found = true;
            }
        }
        if (found == false) {
            filesMissing++;
        }
    }
    return filesMissing == 0;
}

bbDataContent.hasEnoughFreeSpace = function () {
    var freeSpace = bbDataContent.getFreeSpace(bbDataContent.contentFolder);
    if (freeSpace >= 157286400) // 150MB
        return true;
    return false;
};

bbDataContent.cannotGetFolderCallback = function () {
    // Do something!
    alert('cannot get folder');
};

bbDataContent.getFreeSpace = function (root) {
    return blackberry.io.dir.getFreeSpaceForRoot(root);
};


//
//  Settings
//
bbSettings = {};

bbSettings.Credits = '';
bbSettings.AppName = '';
bbSettings.ContentDownloadLink = '';
bbSettings.MediaFileCount = 0;
bbSettings.DownloadSize = 0;

bbSettings.FilesList = [];

bbSettings.init = function () {
    $.ajax({
        url: "settings.xml",
        dataType: ($.browser.msie) ? "text" : "xml",
        success: function (d) {
            var xml;

            // Doesn't work in IE without this
            if (typeof d == "string") {
                xml = new ActiveXObject("Microsoft.XMLDOM");
                xml.async = false;
                xml.loadXML(d);
            } else {
                xml = d;
            }

            var credits = $(xml).find('Credits').text();
            var contentLink = $(xml).find('ContentDownloadLink').text();
            var appName = $(xml).find('AppName').text();
            var fileCount = $(xml).find('FileCount').text();
            var downloadSize = $(xml).find('DownloadSize').text();

            bbSettings.Credits = credits;
            bbSettings.ContentDownloadLink = contentLink;
            bbSettings.AppName = appName;
            bbSettings.MediaFileCount = parseInt(fileCount, 10);
            bbSettings.DownloadSize = parseInt(downloadSize, 10);

            $($(xml).find('Files')[0]).find('file').each(function () {
                bbSettings.FilesList.push($(this).text());
            });
        }
    });
};