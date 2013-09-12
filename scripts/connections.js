var messageType =
{
    userList: 0,
    questions: 1,
    start: 2,
    gameAlreadyStarted: 3
};

var bbConnections = {};

bbConnections.users = [];
bbConnections.conn = null;

bbConnections.isHost = false;
bbConnections.hostId = 'me';
bbConnections.hostStillInGame = 1;

bbConnections.getTotalPlayersCount = function () {
    return this.conn.joinedUsers.length + this.hostStillInGame;
}

bbConnections.getPlayersIds = function () {
    var d = new Array();

    for (var i = 0; i < this.conn.joinedUsers.length; i++) {
        d.push(this.conn.joinedUsers[i].ppid);
    }

    if (this.hostStillInGame > 0) {
        d.push(this.hostId);
    }

    return d;
}

bbConnections.init = function () {
    // Client accepts invite to a game
    blackberry.bbm.platform.io.onconnectionaccepted = function (type, connection) {

        if (bbConnections.conn != null) {
            bbConnections.leaveGame();
        }

        bbConnections.conn = connection;
        bbConnections.isHost = false;
        bbConnections.hostStillInGame = 1;
        bbGame.clear();
        bbConnections.setClientConnectionCallbacks(connection, 'session');

        bbGameLobby.initLobby(false);
    };
};

bbConnections.createConnection = function () {
    var conn = blackberry.bbm.platform.io.createConnection('session');
    this.setConnectionCallbacks(conn);
    this.conn = conn;
    this.isHost = true;
    this.hostStillInGame = 1;
    // expiry time == 60 sec
    conn.inviteContacts('Wanna play?', { expiryTime: 60000 });
}

//
// Client callbacks
//
bbConnections.setClientConnectionCallbacks = function (conn, type) {
    conn.onusersinvited = function (users) { };
    conn.onusersjoined = function (users, type, cookie) { };
    conn.onuserdeclined = function (user) { };

    // Host left the game...
    conn.onuserleft = function (user) {
        if ((bbGame.gameRunning == false) && (user.ppid == bbConnections.hostId)) {
            bbGameLobby.cancel();
            bbGame.cancel();
            navigator.notification.alert('Host left', function () { }, 'Smart Study', 'OK');
        }
        else {
            if (user.ppid == bbConnections.hostId) {
                bbConnections.hostStillInGame = 0;
            }
        }
    };

    // Received data
    conn.ondata = function (user, data) {
        bbConnections.hostId = user.ppid;
        var dataObj = JSON.parse(data);

        if (dataObj.type != undefined) {
            if (dataObj.type === messageType.userList) {
                bbGameLobby.updateList(dataObj, user);
            }
            else if (dataObj.type === messageType.questions) {
                bbGame.initIds(dataObj.questions);
            }
            else if (dataObj.type === messageType.start) {
                countDown();
            }
            else if (dataObj.type === messageType.gameAlreadyStarted) {
                navigator.notification.alert('Game has already started', function () { }, 'Smart Study', 'OK');
                bbGame.cancel();
            }
        }
    };

    conn.onbroadcastdata = function (user, data) {
        bbConnections.onBroadcastData(user, data);
    };

    conn.onusersremoved = function (user, users) { };
    conn.onended = function (user) {
        bbGameLobby.cancel();
        bbGame.cancel();
        bbGame.countDown = false;
        navigator.notification.alert('Host left. Game aborted.', function () { }, 'Smart Study', 'OK');
    };
}

//
// Host callbacks
//
bbConnections.setConnectionCallbacks = function (conn) {
    // Host has invited clients to the game
    conn.onusersinvited = function (users) {
        bbGameLobby.initLobby(true);
        bbGameLobby.storeUserData(users);
    };

    // Client has joined to the game
    conn.onusersjoined = function (users, type, cookie) {

        if (bbGame.gameRunning || bbGame.countDown) {
            bbConnections.sendGameAlreadyStarted(users);
        }
        else {
            bbConnections.sendQuestionsList(bbGame.questions, users);
            bbGameLobby.updateStoredUserData(users, lobbyUserStatus.ready);
        }
    };

    // Client declined invite to the game
    conn.onuserdeclined = function (user) {
        var z = [];
        z.push(user);
        bbGameLobby.updateStoredUserData(z, lobbyUserStatus.declined);
    };

    // Client left the game (also when on lobby screen)
    conn.onuserleft = function (user) {
        var z = [];
        z.push(user);
        bbGameLobby.updateStoredUserData(z, lobbyUserStatus.left);
    };

    // Recieved data from client (should never happen, because clients use 'broadcast' not 'send')
    conn.ondata = function (user, data) { };

    // Recieved data from client
    conn.onbroadcastdata = function (user, data) {
        bbConnections.onBroadcastData(user, data);
    };

    conn.onusersremoved = function (user, users) { };

    conn.onended = function (user) { };
}

bbConnections.onBroadcastData = function (user, data) {
    var dataObj = JSON.parse(data);
    if (dataObj.type != undefined) {
        if (dataObj.type === 'stats') {
            dataObj.name = user.displayName;
            dataObj.ppid = user.ppid;

            bbGame.updateMPStats(dataObj);
        }
        else if (dataObj.type === 'finalscores') {
            dataObj.name = user.displayName;
            dataObj.ppid = user.ppid;

            bbGame.updateFinalScores(dataObj, false);
        }
    }
}

//
// HOST. Send lobby data to clients (i.e. user's names, statuses)
bbConnections.sendLobbyData = function () {
    var data = {
        type: messageType.userList,
        timeLeft: bbGameLobby.timerValue,
        users: bbGameLobby.usersData
    };

    var msgStr = JSON.stringify(data);

    this.conn.send(msgStr, this.conn.joinedUsers);
}

//
// HOST. Send questions list...
bbConnections.sendQuestionsList = function (questions, users) {
    var q = new Array();

    for (var i = 0; i < questions.length; i++) {
        var id = questions[i].id;
        q.push(id);
    }

    var data = {
        type: messageType.questions,
        questions: q
    };

    var msgStr = JSON.stringify(data);
    this.conn.send(msgStr, users);
}

bbConnections.sendGameStart = function () {
    var data = { type: messageType.start };

    var msgStr = JSON.stringify(data);
    this.conn.send(msgStr, this.conn.joinedUsers);
}

bbConnections.sendGameAlreadyStarted = function (users) {
    var data = { type: messageType.gameAlreadyStarted };

    var msgStr = JSON.stringify(data);
    this.conn.send(msgStr, users);
}

//
// Broadcasts current user's stats
bbConnections.sendStats = function (data) {
    var d = {
        type: 'stats',
        score: data.score,
        number: data.qn
    };
    var msgStr = JSON.stringify(d);
    this.conn.broadcast(msgStr);
}

//
// Broadcasts current user's final scores (maybe replaced by 'sendStats')
bbConnections.sendFinalStats = function (data) {
    var d = {
        type: 'finalscores',
        score: data.score,
        name: 'user'
    };

    var msgStr = JSON.stringify(d);
    this.conn.broadcast(msgStr);
}

bbConnections.leaveGame = function () {
    if (this.conn == null) {
        return;
    }
    // If host and game hasn't started
    if (this.isHost && (bbGame.gameRunning == false)) {
        this.conn.end();
    }
    else {
        this.conn.leave();
    }
    this.conn = null;
}