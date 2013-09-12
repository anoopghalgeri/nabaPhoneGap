var bbmUtil = { };

bbmUtil.accessible = false;
bbmUtil.redirectOnRegisterSuccess = "";

/**
 * Performs steps necessary to start using BBM Platform.
 * 
 * Steps necessary:
 * - Sets static BBM platform callbacks which the application wishes to use.
 * - Call blackberry.bbm.platform.register() with your UUID.
 */
bbmUtil.init = function () {

    if (this.accessible) {
        return;
    }

    // This is called when:
    // - Properties on the current user or other users' profile changes.
    // - Other users install/uninstall this application.
    // - The current user receives an invitation in BBM.
    blackberry.bbm.platform.users.onupdate = function (user, event) {
        if (event === "invited") {
            alert("You were invited to a game in " + blackberry.app.name + ". Please go to BBM to accept it.");
        } else if (user.handle === blackberry.bbm.platform.self.handle) {
        }
    };
    // This is called in certain cases when the application is invoked from within BBM.
    // You can optionally handle these invocations to provide better integration, and interesting use cases.
    blackberry.bbm.platform.onappinvoked = function (reason, param, user) {
        var displayName, message;
        // Get display name
        if (user === blackberry.bbm.platform.self) {
            displayName = "your";
        } else {
            displayName = user.displayName + "'s";
        }

        //alert(reason);

        // Create message for dialog based on reason
        message = "App invoked by " + displayName + " ";
        if (reason === "profilebox") {
            var profileBoxItem = param;
            message += " profile box item:\n" + profileBoxItem.text;
            //content.showProfileBox();
        } else if (reason === "profileboxtitle") {
            message += " profile box title";
            //content.showProfileBox();
        } else if (reason === "personalmessage") {
            var personalMsg = param;
            message += "personal message:\n" + personalMsg;
        } else if (reason === "chatmessage") {
            message += "chat message";
        } else {
            // If unknown reason, do nothing
            return;
        }

        //alert(message);
    };

    bbmUtil.redirectOnRegisterSuccess = '';
    bbConnections.init();

    /*
    * Finally the application should register with the platform.
    */
    bbmUtil.register();
};

/**
 * Registers the application with BBM. Static callbacks should be set before this method is called.
 * Called by {@link bbmUtil.init()}.
 * @see bbmUtil.init()
 */
bbmUtil.register = function () {
    /**
    * Required
    * This is called when the application's access to BBM platform changes.
    */
    blackberry.bbm.platform.onaccesschanged = function (accessible, status) {

        bbmUtil.accessible = accessible; // Save the accessible state

        // If allowed, initialize the application
        if (status === "allowed") {
            if (bbmUtil.redirectOnRegisterSuccess != '')
                $.mobile.changePage(bbmUtil.redirectOnRegisterSuccess);
                $('#btn-connect-to-bbm').css('visibility', 'hidden');

        } else {
            $.mobile.changePage('#bbm-connect-failed');

            $("#bbm-connect-failed-msg").html("<h3>Connect to BBM failed</h3>" + bbmUtil.getStatusMessage(status));
            $('#btn-connect-to-bbm').css('visibility', 'visible');
            $('#bbm-connect-failed-btn-reconnect').show();
        }
    };

    try {
        blackberry.bbm.platform.register({
            // TODO You must define your own UUID
            uuid: /*[#BBMAPPUUID]*/"25a8adeb-1510-49a8-bb76-5b94b3878bc0"/*[$BBMAPPUUID]*/,
            shareContentSplat: true
        });
    } catch (e) {
        alert("You must define your own UUID. See bbmUtil.register() in code.js.");
    }
};

/**
 * Invoked by a "Connect to BBM" button which appears when registration fails due to the user blocking
 * the application.
 * 
 * Prompts the user to connect the application to BBM, which brings the user to the application's
 * BBM Options screen to connect it.
 */
bbmUtil.showBBMAppOptionsAndRegister = function () {
    blackberry.bbm.platform.showBBMAppOptions(function () {
        bbmUtil.redirectOnRegisterSuccess = "#splash-screen-page";
        bbmUtil.register();
    });
};
