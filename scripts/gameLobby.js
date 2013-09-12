var lobbyUserStatus =
{
    host: "JOINED (HOST)",
    ready: "JOINED",
    pending: "INVITE SENT...",
    declined: "DECLINED",
    left: "LEFT",
    timeout: "TIME OUT"
};  
  
// ==========================================
//      Lobby handler
// ==========================================
var bbGameLobby = {};

bbGameLobby.usersData = [];
bbGameLobby.timerValue = 0;
bbGameLobby.isTimerRunning = false;

bbGameLobby.cancel = function() {
    this.usersData.length = 0;
    this.timerValue = 0;

    $.mobile.changePage("#splash-screen-page");
};

bbGameLobby.getStatusClassColor = function (status) {
    switch (status) {
        case lobbyUserStatus.ready:
        case lobbyUserStatus.host:
            return "green";
        case lobbyUserStatus.pending:
            return "yellow";
        default:
            return "red";
    }
}

//
// HOST. Updates data of invited users
bbGameLobby.updateStoredUserData = function (users, status) {
    var color = this.getStatusClassColor(status);

    for (var i = 0; i < users.length; i++) {
        var user = users[i];

        for (var j = 0; j < this.usersData.length; j++) {
            if (user.ppid == this.usersData[j].ppid) {
                this.usersData[j].status = status;
            }
        }
        $('li[data-userId="' + user.ppid + '"] span[data-role="status"]').html(status);
        $('li[data-userId="' + user.ppid + '"] a').removeClass("green yellow red").addClass(color);
    }

    if ((bbGame.gameRunning == false) && (bbGame.countDown == false)) {
        bbGameLobby.asdfasdf(false);
    }

    $('#game-lobby-players').listview('refresh');
    bbConnections.sendLobbyData();
};

bbGameLobby.markTimeoutUsers = function () {

    var status = lobbyUserStatus.timeout;
    var color = this.getStatusClassColor(status);

    for (var i = 0; i < this.usersData.length; i++) {
        if (this.usersData[i].status == lobbyUserStatus.pending) {
            this.usersData[i].status = status;
            $('li[data-userId="' + this.usersData[i].ppid + '"] span[data-role="status"]').html(status);
            $('li[data-userId="' + this.usersData[i].ppid + '"] a').removeClass("green yellow red").addClass(color);
        }
    }
};

bbGameLobby.asdfasdf = function (timeRanOut) {
    var pending = 0;
    var ready = 0;
    for (var i = 0; i < this.usersData.length; i++) {
        if (this.usersData[i].status === lobbyUserStatus.ready) {
            ready = ready + 1;
        }
        if (this.usersData[i].status === lobbyUserStatus.pending) {
            pending = pending + 1;
        }
    }

    if (ready > 0) {
        $("#btn-start-mp-game").css('visibility', "visible");
        if ((pending == 0) || (timeRanOut === true)) {
            this.isTimerRunning = false;
            setTimeout(startMPGame, 1000);
        }
    } else {
        $("#btn-start-mp-game").css('visibility', "hidden");
        if (timeRanOut) {
            bbGameLobby.markTimeoutUsers();
        }
    }
};

// 
// HOST. Stores data of invited users....
bbGameLobby.storeUserData = function (users) {
    this.usersData.length = 0;
    for (var i = 0; i < users.length; i++) {
        var obj = {
            ppid: users[i].ppid,
            displayName: users[i].displayName,
            status: lobbyUserStatus.pending
        };
        this.usersData.push(obj);
    }

    // 1. Clear lobby
    var list = $('#game-lobby-players');
    list.empty();

    // Add self
    //$('<li data-userId="me">Me<p class="ui-li-aside">Host</p></li>').appendTo(list);
    //$('<li data-userId="' + hostUser.ppid + '">' + hostUser.displayName + '<p class="ui-li-aside">Host</p></li>').appendTo(list);

    var hostPic = "images/avatar.png";
    if (blackberry.bbm.platform.self.displayPicture != null) {
        hostPic = blackberry.bbm.platform.self.displayPicture;
    }

    // 
    var bclass = 'li-gray-bottom';
    if (users.length < 1) bclass = "";
    $('<li data-userId="me" class="' + bclass + '"><a href="" class="green"><img onLoad="lobbyAvatarLoaded(this)" src="' + hostPic + '" class="ui-li-thumb" alt=""/><h3>Me</h3>JOINED (HOST)</a></li>').appendTo(list);

    // 2. Add users
    for (var i = 0; i < users.length; i++) {
        var user = users[i];
        var picSrc = 'images/avatar.png';
        if (user.displayPicture != null) {
            picSrc = user.displayPicture;
        }
        if (i == (users.length - 1)) {
            bclass = "";
        }
        $('<li data-userId="' + user.ppid + '" class="' + bclass + '"><a href="" class="yellow"><img onLoad="lobbyAvatarLoaded(this)" src="' + picSrc + '" class="ui-li-thumb" alt=""/><h3>' + user.displayName + '</h3><span data-role="status">INVITE SENT...</span></a></li>').appendTo(list);
    }

    // 3. Init timer
    this.timerValue = 60; // 60 seconds
    $('#game-lobby-timer').html(this.timerValue);
    $('#game-lobby-players').listview('refresh');

    this.isTimerRunning = true;
    this.updateTimer();
};

//
//
bbGameLobby.initLobby = function(isHost) {
    this.usersData.length = 0;
    this.timerValue = 0;
    this.isTimerRunning = false;

    ////bbGame.clear();

    // 1. Hide/show buttons
    $("#btn-start-mp-game").css('visibility', "hidden");

    // 2. Show lobby page
    $.mobile.changePage('#game-lobby');

    bindBackBtnLeaveGame();
};

//
// CLIENT.
bbGameLobby.updateList = function (data, hostUser) {
    var list = $('#game-lobby-players');

    list.empty();

    this.timerValue = data.timeLeft;
    if (!this.isTimerRunning) {
        this.isTimerRunning = true;
        this.updateTimer();
    }

    var picSrc = 'images/avatar.png';
    if (hostUser.displayPicture != null) {
        picSrc = hostUser.displayPicture;
    }

    var users = data.users;

    var bclass = 'li-gray-bottom';
    if (users.length < 1) {
        bclass = "";
    }
    $('<li data-userId="' + hostUser.ppid + '" class="' + bclass + '"><a href="" class="green"><img onLoad="lobbyAvatarLoaded(this)" src="' + picSrc + '" class="ui-li-thumb ' + bclass + '" alt=""/><h3>' + hostUser.displayName + '</h3><span data-role="status">JOINED (HOST)</span></a></li>').appendTo(list);

    for (var i = 0; i < users.length; i++) {
        var user = users[i];
        var userPic = "images/avatar.png";
        if (user.ppid == blackberry.bbm.platform.self.ppid) {
            if (blackberry.bbm.platform.self.displayPicture != null) {
                userPic = blackberry.bbm.platform.self.displayPicture;
            }
        }
        else {
            for (var j = 0; j < bbConnections.conn.joinedUsers.length; j++) {
                if (bbConnections.conn.joinedUsers[j].ppid == user.ppid) {
                    if (bbConnections.conn.joinedUsers[j].displayPicture != null) {
                        userPic = bbConnections.conn.joinedUsers[j].displayPicture;
                    }
                }
            }
        }
        if (i == users.length - 1) bclass = "";

        var color = this.getStatusClassColor(user.status);

        $('<li data-userId="' + user.ppid + '" class="' + bclass + '"><a href="" class="' + color + '"><img onLoad="lobbyAvatarLoaded(this)" src="' + userPic + '" class="ui-li-thumb ' + bclass + '" alt=""/><h3>' + user.displayName + '</h3><span data-role="status">' + user.status + '</span></a></li>').appendTo(list);
    }
    try {
        $('#game-lobby-players').listview('refresh');
    } catch (e) {

    }

    $('#game-lobby-timer').html(this.timerValue);
};

//
//
bbGameLobby.updateTimer = function () {
    if (this.isTimerRunning == false) {
        this.timerValue = 0;
        $('#game-lobby-timer').html('-');
        return;
    }

    if (this.timerValue > 0) {
        $('#game-lobby-timer').html(this.timerValue);
        this.timerValue = this.timerValue - 1;
        setTimeout("bbGameLobby.updateTimer()", 1000);
    }
    else {
        this.timerValue = 0;
        this.isTimerRunning = false;
        $('#game-lobby-timer').html('-');

        bbGameLobby.asdfasdf(true);
    }
};