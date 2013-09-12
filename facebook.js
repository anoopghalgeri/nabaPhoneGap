function someFacebookStuff() {

    var my_client_id = "231308060271547"; //123
    var my_redirect_uri = "http://www.facebook.com/connect/login_success.html";
    var my_type = "Mozilla/5.0(Linux; U; Android 2.2; en-gb; LG-P500 Build/FRF91) AppleWebKit/533.0 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1";
    var my_display = "touch";

    var authorize_url = "https://graph.facebook.com/oauth/authorize?";
    authorize_url += "client_id=" + my_client_id;
    authorize_url += "&redirect_uri=" + my_redirect_uri;
    authorize_url += "&display=" + my_display;
    authorize_url += "&scope=read_stream,publish_stream,offline_access,publish_checkins";

    window.plugins.childBrowser.onLocationChange = function (loc) {
        facebookLocChanged(loc);
    };
    window.plugins.childBrowser.showWebPage(authorize_url, { showLocationBar: true });
}

function facebookLocChanged(loc) {
    if (loc.indexOf("http://www.facebook.com/connect/login_success.html") > -1) {
        var fbCode = loc.match(/code=(.*)#/)[1];

        window.plugins.childBrowser.close();

        $.ajax(
                {
                    url: 'https://graph.facebook.com/oauth/access_token?client_id=231308060271547&client_secret=76833bad90ca01baed53a92f26c22ef3&code=' + fbCode + '&redirect_uri=http://www.facebook.com/connect/login_success.html',
                    data: {},
                    success: function (data, status) {
                        localStorage.facebook_token = data.split("=")[1];
                        var message = $('#facebook-share-comment').val();
                        postFacebookMessage(message);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        //window.plugins.childBrowser.close();
                    },
                    dataType: 'text',
                    type: 'POST'
                });
    }
}

function postFacebookMessage(message) {
    $.ajax(
                {
                    url: 'https://graph.facebook.com/me/links',
                    data: {
                        message: message,
                        link: 'http://bbconsult.co.uk',
                        access_token: localStorage.facebook_token
                    },
                    success: function (data, status) {
                        //alert('posted!');
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                    },
                    dataType: 'text',
                    type: 'POST'
                });
}