var bbGame = {};

bbGame.redTime = 10;
bbGame.thinkingTime = 3;
bbGame.readingTime = 0;
bbGame.cdtValue = 0;

//bbGame.connection = null;

bbGame.questions = [];
bbGame.answers = [];
bbGame.skipped = [];

bbGame.currentIndex = 0;

bbGame.score = 0;
bbGame.gameName = '';
bbGame.isTopicGame = true;
bbGame.topicSubjectId = '';

bbGame.mpTopScore = 0;
bbGame.leaderId = 'me';
bbGame.readingFactor = 14;

// Shows if game is running
bbGame.gameRunning = false;

// Countdown before game is running
bbGame.countDown = false;

bbGame.mpScores = [];

bbGame.cancel = function () {
    // 1. Leave BBM connection if connected to any...
    bbConnections.leaveGame();

    // 2. Stop game
    this.clear();

    // 3. Show main page
    $.mobile.changePage("#splash-screen-page");
};

bbGame.sendStats = function () {
    if (this.score >= this.mpTopScore) {
        var mpd = {
            name: 'me',
            number: this.currentIndex,
            score: this.score,
            ppid: 'me'
        };
        this.updateMPStats(mpd);
    }

    if (bbConnections.conn != null) {
        var data = {
            qn: this.currentIndex,
            score: this.score
        };
        bbConnections.sendStats(data);
    }
};

bbGame.showMPScoresScreen = function () {
    $('#mp-final-scores').empty();
    $.each(bbGame.mpScores, function (i, v) {

        var userPic = "images/avatar.png";
        if (v.ppid != 'me') {
            for (var j = 0; j < bbConnections.conn.joinedUsers.length; j++) {
                if (bbConnections.conn.joinedUsers[j].ppid == v.ppid) {
                    if (bbConnections.conn.joinedUsers[j].displayPicture != null) {
                        userPic = bbConnections.conn.joinedUsers[j].displayPicture;
                    }
                }
            }
        }
        else {
            if (blackberry.bbm.platform.self.displayPicture != null) {
                userPic = blackberry.bbm.platform.self.displayPicture;
            }
        }
        //        var li = '<li><a href=""><img src="' + userPic + '" class="ui-li-thumb" alt=""/><h3>' + (i + 1) + '. ' + v.name + '</h3>' + v.score * 10 + '</a></li>';
        var lineclass = ' class="li-gray-bottom"';
        if ((i + 1) == bbGame.mpScores.length) {
            lineclass = '';
        }

        var placeAbc = '';
        var placeColor = "";
        switch (i) {
            case 0:
                placeAbc = 'st';
                placeColor = " green";
                break;
            case 1:
                placeAbc = 'nd';
                placeColor = " yellow";
                break;
            case 2:
                placeAbc = 'rd';
                placeColor = " red";
                break;
            default:
                placeAbc = 'th';
                placeColor = " red";
                break;
        }

        var li = '<li' + lineclass + '>' +
                    '<a href="">' +
                        '<img onLoad="lobbyAvatarLoaded(this)" src="' + userPic + '" class="ui-li-thumb" alt=""/>' +
                        '<div class="game-place"><div>' + (i + 1) + '</div><div class="game-place-abc">' + placeAbc + '</div></div>' +
                        '<div class="game-results-name' + placeColor + '">' + v.name + '</div>' +
                        '<div class="game-results-score green">' + v.score * 10 + '</div>' +
                    '</a>' +
                '</li>';
        $(li).appendTo($('#mp-final-scores'));
    });

    try {
        $('#mp-final-scores').listview('refresh');
    } catch (e) { }

    $.mobile.changePage("#game-final-scores");
};

bbGame.sendFinalStats = function () {
    var obj = {
        name: 'me',
        ppid: 'me',
        score: this.score
    };

    var data = { score: this.score };
    bbConnections.sendFinalStats(data);

    this.updateFinalScores(obj, true);
};

bbGame.updateFinalScores = function (data, self) {
    bbGame.mpScores.push(data);
    //alert(data.name + ' - ' + data.ppid + ' - ' + data.score);
    //    var all = true;
    //    var pids = bbConnections.getPlayersIds();

    //    for (var i = 0; i < pids.length; i++) 
    //    {
    //        var found = false;
    //        for (var j = 0; j < bbGame.mpScores.length; j++) 
    //        {
    //            if (bbGame.mpScores[i].ppid == pids[i]) 
    //            {
    //                found = true;
    //            }
    //        }
    //        if (found == false) 
    //        {
    //            all = false;
    //        }
    //    }

    var tu = bbConnections.getTotalPlayersCount();

    if (this.mpScores.length >= tu)
    //if (all)
    {
        // Sort scores
        this.mpScores.sort(function (a, b) {
            if (a.score < b.score) return 1;
            if (a.score == b.score) return 0;
            if (a.score > b.score) return -1;
        });

        this.showMPScoresScreen();
        return;
    }
    if (self) {
        $.mobile.changePage("#game-score-screen-mp");
    }
};

bbGame.updateMPStats = function (data) {
    var qn = data.number + 1;

    if (data.score == this.mpTopScore) {
        if (bbGame.leaderId == data.ppid) {
            if (qn > this.questions.length) {
                $('#game-leader-qn').html('Done');
            } else {
                $('#game-leader-qn').html(qn + '/' + this.questions.length);
            }
        }
    }

    if (data.score > this.mpTopScore) {
        this.leaderId = data.ppid;
        this.mpTopScore = data.score;
        $('#game-leader-name').html(data.name);
        if (qn > this.questions.length) {
            $('#game-leader-qn').html('Done');
        }
        else {
            $('#game-leader-qn').html(qn + '/' + this.questions.length);
        }
        $('#game-leader-score').html(data.score * 10);
    }
};

bbGame.clear = function () {
    $('#game-leader-qn').html('');
    $('#game-leader-name').html('');
    $('#game-leader-score').html('');

    this.currentIndex = -1;
    this.score = 0;
    this.mpTopScore = 0;

    this.answers.length = 0;
    this.questions.length = 0;
    this.mpScores.length = 0;

    this.leaderId = 'me';
    this.cdtValue = 0;
    this.gameRunning = false;
    this.countDown = false;
};

bbGame.initList = function (questions) {
    bbGame.clear();

    // Init questions list
    for (var i = 0; i < questions.length; i++) {
        bbGame.questions.push(questions[i]);
    }
};

bbGame.initIds = function (questionIds) {
    bbDatabase.getQuestionsByIds(questionIds, bbGame.initList);
};

bbGame.start = function () {
    if (bbGame.countDown != true) {
        return;
    }

    $('#btn-first').removeClass('wrong correct');
    $('#btn-second').removeClass('correct wrong');
    $('#btn-third').removeClass('correct wrong');

    var gameType = 'SP';
    if (bbConnections.conn != null) {
        gameType = 'MP';
        this.readingFactor = 14;

        $('.game-screen-header').css({ 'height': 'auto' });
        $('.game-content').css({ 'margin-top': '56px' });
    }
    else {
        this.readingFactor = 12;
    }
    $('#game-type').html(gameType);

    bbGame.gameRunning = true;
    bbGame.countDown = false;

    // Update screen layout
    $('#game-main-screen-page').trigger('updatelayout');
    $.mobile.changePage("#game-main-screen-page");

    // Start game process
    this.getNextQuestion();
    this.gameTimerTick();
};

bbGame.getNextQuestion = function () {
    if (this.gameRunning == false) {
        return;
    }

    $('.correct-hover').remove();
    $('.wrong-hover').remove();

    var answBtn1 = $('#btn-first');
    var answBtn2 = $('#btn-second');
    var answBtn3 = $('#btn-third');
    answBtn1.unbind('click');
    answBtn2.unbind('click');
    answBtn3.unbind('click');

    this.currentIndex = this.currentIndex + 1;

    if (this.currentIndex != 0) {
        this.sendStats();
    }

    var isMultiplayer = (bbConnections.conn != null);

    if (this.currentIndex >= this.questions.length) {
        if (isMultiplayer) {
            $('span[data-name="game-score"]').html(this.score * 10);
            this.sendFinalStats();
        } else {
            var scp = Math.round((this.score / (this.questions.length * 10)) * 100);
            try {
                updateActivity('I just scored ' + scp.toString() + '% in \'' + unescape(bbGame.gameName) + '\' with Smart Study \'' + bbSettings.AppName + '\'');
            } catch (e) {
            }

            //var correctAnswers = this.questions.length - this.answers.length;
            var correctAnswers = 0;
            for (var i = 0; i < this.answers.length; i++) {
                if (this.answers[i].mistaken == 0) {
                    correctAnswers++;
                }
            }
            bbDatabase.saveGameData(this.isTopicGame, this.topicSubjectId, correctAnswers, this.questions.length);

            $.mobile.changePage("#game-score-screen");
            //update chart pie
            drawMyChart('chart-game-result', this.score, this.questions.length * 10 - this.score);
            $('span[data-name="game-score"]').html((scp).toString() + '%');
        }
    } else {
        var score = this.score;
        if (isMultiplayer) {
            score = this.score * 10;
        }
        $('span[data-name="game-score"]').html(score);
    }

    //var questionNumber = this.questions[this.currentIndex];
    var data = this.questions[this.currentIndex];
    //var data = bbDataContent.getQuestionData(questionNumber);

    $('#div-question').html(data.question);
    $('#game-question-index').html((this.currentIndex + 1) + "/" + bbGame.questions.length);

    var answ1 = $('#btn-first span.ui-btn-text');
    var answ2 = $('#btn-second span.ui-btn-text');
    var answ3 = $('#btn-third span.ui-btn-text');
    if ($(answ1).length == 0) {
        answ1 = $('#btn-first');
        answ2 = $('#btn-second');
        answ3 = $('#btn-third');
    }

    var correctIndex = 0;
    var r = Math.random();
    if (r < 0.34) {
        $(answ1).html(data.correct);

        if (Math.random() <= 0.5) {
            $(answ2).html(data.wrong1);
            $(answ3).html(data.wrong2);
            $(answBtn1).click(function () { bbGame.handleCorrectAnswer(0, 1, 2); });
            $(answBtn2).click(function () { bbGame.handleWrongAnswer(data.wrong1, 0, 1, 2); });
            $(answBtn3).click(function () { bbGame.handleWrongAnswer(data.wrong2, 0, 1, 2); });
        } else {
            $(answ2).html(data.wrong2);
            $(answ3).html(data.wrong1);
            $(answBtn1).click(function () { bbGame.handleCorrectAnswer(0, 2, 1); });
            $(answBtn2).click(function () { bbGame.handleWrongAnswer(data.wrong2, 0, 2, 1); });
            $(answBtn3).click(function () { bbGame.handleWrongAnswer(data.wrong1, 0, 2, 1); });
        }
    } else if (r < 0.67) {
        if (Math.random() <= 0.5) {
            correctAnswerIndex = 1;
            $(answ2).html(data.correct);
            $(answ3).html(data.wrong2);
            $(answBtn2).click(function () { bbGame.handleCorrectAnswer(1, 0, 2); });
            $(answBtn3).click(function () { bbGame.handleWrongAnswer(data.wrong2, 1, 0, 2); });
        } else {
            correctAnswerIndex = 2;
            $(answ2).html(data.wrong2);
            $(answ3).html(data.correct);
            $(answBtn2).click(function () { bbGame.handleWrongAnswer(data.wrong2, 2, 0, 1); });
            $(answBtn3).click(function () { bbGame.handleCorrectAnswer(2, 0, 1); });
        }

        $(answ1).html(data.wrong1);
        if (correctAnswerIndex == 1) {
            $(answBtn1).click(function () { bbGame.handleWrongAnswer(data.wrong1, 1, 0, 2); });
        }
        else {
            $(answBtn1).click(function () { bbGame.handleWrongAnswer(data.wrong1, 2, 0, 1); });
        }
    } else {

        if (Math.random() <= 0.5) {
            correctAnswerIndex = 1;
            $(answ2).html(data.correct);
            $(answ3).html(data.wrong1);
            $(answBtn2).click(function () { bbGame.handleCorrectAnswer(1, 2, 0); });
            $(answBtn3).click(function () { bbGame.handleWrongAnswer(data.wrong1, 1, 2, 0); });
        } else {
            $(answ2).html(data.wrong1);
            $(answ3).html(data.correct);
            $(answBtn2).click(function () { bbGame.handleWrongAnswer(data.wrong1, 2, 1, 0); });
            $(answBtn3).click(function () { bbGame.handleCorrectAnswer(2, 1, 0); });
            correctAnswerIndex = 2;
        }

        $(answ1).html(data.wrong2);
        if (correctAnswerIndex == 1) {
            $(answBtn1).click(function () { bbGame.handleWrongAnswer(data.wrong2, 1, 2, 0); });
        }
        else {
            $(answBtn1).click(function () { bbGame.handleWrongAnswer(data.wrong2, 2, 1, 0); });
        }
    }

    this.readingTime = this.getReadingTime(data.question);
    this.cdtValue = this.thinkingTime + this.redTime + this.readingTime;
    this.updateTimeLine();

    $.mobile.fixedToolbars.show();
};

bbGame.getButtonIdByIndex = function (index) {
    switch (index) {
        case 0:
            return "#btn-first";
        case 1:
            return "#btn-second";
        case 2:
            return "#btn-third";
        default:
            return "#btn-first";
    }
}

bbGame.updateQuestionScreen = function (data, wrongWordsScreen) {

    var corrBtnId = bbGame.getButtonIdByIndex(data.corr);
    var wr1BtnId = bbGame.getButtonIdByIndex(data.wr1);
    var wr2BtnId = bbGame.getButtonIdByIndex(data.wr2);

    var corr = corrBtnId + ' span.ui-btn-text';
    var wr1 = wr1BtnId + ' span.ui-btn-text';
    var wr2 = wr2BtnId + ' span.ui-btn-text';

    if ($(corr).length == 0) {
        corr = corrBtnId;
        wr1 = wr1BtnId;
        wr2 = wr2BtnId;
    }

    var question = null;
    var index = 0;
    for (var i = 0; i < bbGame.questions.length; i++) {
        if (data.id == bbGame.questions[i].id) {
            question = bbGame.questions[i];
            index = i;
            break;
        }
    }
    $('#game-question-index').html((index + 1) + "/" + bbGame.questions.length);

    $(corr).html(question.correct);
    $(wr1).html(question.wrong1);
    $(wr2).html(question.wrong2);
    $('#div-question').html(question.question);

    //
    // Bind 'click' events
    $('#btn-first').unbind('click');
    $('#btn-second').unbind('click');
    $('#btn-third').unbind('click');

    if (wrongWordsScreen) {
        $(corrBtnId).removeClass('wrong').addClass('correct');
        $(wr1BtnId).removeClass('correct').addClass('wrong');
        $(wr2BtnId).removeClass('correct').addClass('wrong');

        $(corrBtnId).click(function () {
            bbDatabase.getDescr(question.termId);
            $.mobile.changePage('#descr-page');
        });

        bindBackBtnNavigateBack();
        $.mobile.changePage('#game-main-screen-page');
        $('#game-time-bar').css('width', '0%');
    }
    else {
        $(corrBtnId).click(function () { bbGame.handleCorrectAnswer(); });
        $(wr1).click(function () { bbGame.handleWrongAnswer(question.wrong1, data.corr, data.wr1, data.wr2); });
        $(wr2).click(function () { bbGame.handleWrongAnswer(question.wrong2, data.corr, data.wr1, data.wr2); });
    }
}


bbGame.getReadingTime = function (question) {
    if (question === undefined || question == null) {
        return 2;
    }
    var sec = Math.ceil(question.length / this.readingFactor);
    if (sec < 2) return 2;
    return sec;
};

bbGame.gameTimerTick = function () {
    this.updateTimeLine();
    if (this.cdtValue > 0) {
        this.cdtValue = this.cdtValue - 1;
    }
    else {
		bbGame.handleWrongAnswer('UNANSWERED', 0, 1, 2);
    }

    if ((this.currentIndex < this.questions.length) && (this.gameRunning == true)) {
        setTimeout("bbGame.gameTimerTick();", 1000);
    }
};

//
//  Update time line
//
bbGame.updateTimeLine = function () {
    if (this.cdtValue > 1000) {
        // Fix for issues with race conditions
        return;
    }
    var green = 33;
    var red = 33;
    var yellow = 33;
    var wdth = 99;
    //game-time-bar

    var perSecondRed = 32 / this.redTime;
    var perSecondReading = 32 / this.readingTime;
    var perSecondThinking = 32 / this.thinkingTime;

    var totalSeconds = this.readingTime + this.redTime + this.thinkingTime;
    var perSecond = 96 / totalSeconds;

    if (this.cdtValue >= this.redTime) {
        if (this.cdtValue >= (this.redTime + this.thinkingTime)) {
            wdth = 64 + (this.cdtValue - this.redTime - this.thinkingTime) * perSecondReading;
        } else {
            wdth = 32 + (this.cdtValue - this.redTime) * perSecondThinking;
        }
    } else {
        wdth = (this.cdtValue) * perSecondRed;
    }

    $('#game-time-bar').css('width', wdth + '%');
};

bbGame.getScoreForQuestion = function () {
    if (this.cdtValue >= this.redTime) {
        return this.redTime;
    }
    if (this.cdtValue <= 0) {
        return 0;
    }
    return this.cdtValue + 1;
};

bbGame.handleCorrectAnswer = function (corr, wr1, wr2) {
    this.score = this.score + this.getScoreForQuestion();
	this.cdtValue = 2000;

    var question = this.questions[this.currentIndex];
    var qd = {
        id: question.id,
        termId: question.termId,
        name: question.correct,
        corr: corr,
        wr1: wr1,
        wr2: wr2,
        mistaken: 0
    };
    this.answers.push(qd);

    bbDatabase.updateQuestionState(question.id, 2);

    $('<div class="correct-hover"></div>').appendTo($("#game-main-screen-page"));
    setTimeout("bbGame.getNextQuestion();", 1000);
};



bbGame.handleWrongAnswer = function (answer, corr, wr1, wr2) {
    this.cdtValue = 2000;
    var question = this.questions[this.currentIndex];

    var qd = {
        id: question.id,
        termId: question.termId,
        name: answer,
        corr: corr,
        wr1: wr1,
        wr2: wr2,
        mistaken: 1
    };
    this.answers.push(qd);

    bbDatabase.updateQuestionState(question.id, 1);

    $('<div class="wrong-hover"></div>').appendTo($("#game-main-screen-page"));
    setTimeout("bbGame.getNextQuestion();", 1000);
};

bbGame.initWrongWordsScreen = function () {
    $('#game-wrong-words-list').empty();
    $('#game-correct-words-list').empty();
    $.each(bbGame.answers, function (i, e) {
        var li = '<li><a data-icon="plus-swirlyq" data-role="button" data-theme="a" onclick="bbGame.showWrongQuestion(\'' + e.id + '\')">' + e.name + '</a></li>';
        if (e.mistaken) {
            $(li).appendTo($('#game-wrong-words-list'));
        }
        else {
            $(li).appendTo($('#game-correct-words-list'));
        }
    });

    $('#game-wrong-words-header').html('WRONG ANSWERS:');
    $("#game-wrong-words div[data-role='header'] h1").css('visibility', "visible");
    $('#game-correct-words-header').css('visibility', "visible");
    $('.game-correct-list-container').css('visibility', "visible");

    $('#game-wrong-words').unbind('pagebeforeshow');
    $('#game-wrong-words').bind('pagebeforeshow', function (event) {
        bindBackBtnAskIfLeaveScores();
    });

    try {
        $('#game-wrong-words').trigger('pagecreate');
        $('#game-wrong-words-list').listview('refresh');
        $('#game-correct-words-list').listview('refresh');
    }
    catch (e) { }
};

bbGame.showWrongQuestion = function (id) {
    var obj;
    for (var i = 0; i < bbGame.answers.length; i++) {
        if (bbGame.answers[i].id == id) {
            obj = bbGame.answers[i];
            break;
        }
    }
    var data = {
        id: id,
        corr: obj.corr,
        wr1: obj.wr1,
        wr2: obj.wr2
    };

    bbGame.updateQuestionScreen(data, true);
}