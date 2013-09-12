function shuffle(v) {
    for (var j, x, i = v.length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x);
    return v;
};

var bbDatabase = {};

bbDatabase.instance = null;

bbDatabase.init = function () {
    bbDatabase.instance.transaction(bbDatabase.populateDB, bbDatabase.errorCB, bbDatabase.successCB);
};

bbDatabase.isTopic = false;

bbDatabase.ids = [];
bbDatabase.callback = function () { };
bbDatabase.questions = [];
bbDatabase.topics = [];
bbDatabase.subjects = [];

bbDatabase.param0 = '';
bbDatabase.param1 = '';
bbDatabase.param2 = '';
bbDatabase.isTopic = true;

//bbDatabase.termsData = [];

//
// Words to learn
//
bbDatabase.showWordsToLearn = function () {
    bbDatabase.instance.transaction(function (tx) {
        //var query = "SELECT q.*, t.name as termName FROM QUESTIONS as q JOIN TERMS as t ON q.termId = t.id WHERE testedState = \'1\' ORDER BY t.name";
        var query = "SELECT termId, termName FROM QUESTIONS WHERE testedState = \'1\' ORDER BY termName LIMIT 50";
        tx.executeSql(query, [], bbDatabase.qsShowWordsToLearn, function () { });
    },
    bbDatabase.errorCB);
}

bbDatabase.qsShowWordsToLearn = function (tx, results) {
    $('#game-wrong-words-list').empty();
    $('#game-correct-words-list').empty();
    $('#game-correct-words-header').css('visibility', "hidden");
    $('.game-correct-list-container').css('visibility', "hidden");
    for (var i = 0; i < results.rows.length; i++) {
        var item = results.rows.item(i);

        var li = '<li><a href="#descr-page" data-icon="plus" data-role="button" data-theme="a" onclick="bbDatabase.getDescr(' + "'" + item.termId + "', true" + ')">' + item.termName + '</a></li>';
        $(li).appendTo($('#game-wrong-words-list'));
    }
	try {
		$('#game-wrong-words').trigger('pagecreate');
		$('#game-wrong-words-list').listview('refresh');
	}
	catch (e) { }
	
    $('#game-wrong-words-header').html('Words to learn:');
    $("#game-wrong-words div[data-role='header'] h1").css('visibility', "hidden");

    $('#game-wrong-words').unbind('pagebeforeshow');
    $('#game-wrong-words').bind('pagebeforeshow', function (event) {
        bindBackBtnNavigateBack();
    });

    $.mobile.changePage("#game-wrong-words");
}

//
//  Progress
//
bbDatabase.getProgressData = function () {
    bbDatabase.instance.transaction(function (tx) {
        tx.executeSql("SELECT COUNT(*) as c FROM TERMS WHERE read=\'true\'", [],
            function (tx, results) {
                var v = results.rows.item(0).c;
                $('#progress-left').html(Math.round((v / bbDatabase.termsData.length) * 100) + '%');
                drawMyChart('progress-left-chart', v, bbDatabase.termsData.length - v);
                $("#progress-left-chart-container").css({ 'visibility': "visible" });
            });

        tx.executeSql("SELECT subjId as subjId, read as read, COUNT(*) as c FROM TERMS GROUP BY subjId, read", [],
            function (tx, results) {
                var subjects = new Array();

                for (var i = 0; i < results.rows.length; i++) {
                    var count = results.rows.item(i).c;
                    var subjId = results.rows.item(i).subjId;

                    if (jQuery.inArray(subjId, subjects) == -1) {
                        subjects.push(subjId);
                    }
                }

                for (var i = 0; i < subjects.length; i++) {
                    var id = subjects[i];
                    var notread = 0;
                    var read = 0;
                    for (var j = 0; j < results.rows.length; j++) {
                        var item = results.rows.item(j);
                        if (item.subjId == id) {
                            if (item.read == "true") {
                                read = item.c;
                            } else {
                                notread = item.c;
                            }
                        }
                    }
                    //alert(id + ': ' + read + ' / ' + read + notread);
                    //18 - 19 - 20
                    $('#progress-left-' + id).html(Math.round((read / (read + notread)) * 100) + '%');
                    drawMyChart('progress-left-chart-' + id, read, notread);
                    $("#progress-left-chart-container-" + id).css({ 'visibility': "visible" });
                }

                subjects.length = 0;
                subjects = null;
            });


        tx.executeSql("SELECT correct as c, totalQuestions as t FROM GAMESHISTORY ORDER BY id DESC LIMIT 1", [],
            function (tx, results) {
                if (results.rows.length > 0) {
                    var item = results.rows.item(0);
                    var c = parseFloat(item.c);
                    var t = parseFloat(item.t);
                    $('#progress-center').html(Math.round((c / t) * 100) + '%');
                    drawMyChart('progress-center-chart', c, t - c);
                    $("#progress-center-chart-container").css({ 'visibility': "visible" });
                } else {
                    $("#progress-center-chart-container").css({ 'visibility': "hidden" });
                }
            });

        var query = 'SELECT gh.correct as c, gh.totalQuestions as tq, sq.subjId FROM GAMESHISTORY as gh JOIN ('
                + 'SELECT subjId as subjId, MAX(id) AS id FROM '
                + '(SELECT gh.id as id, ifnull(gh.subjId, t.subjId) as subjId FROM GAMESHISTORY as gh LEFT JOIN TOPICS as t ON gh.topicId = t.id) AS tt '
                + 'GROUP BY subjId'
                + ') as sq ON gh.id = sq.id';

        tx.executeSql(query, [],
            function (tx, results) {

                //$("#progress-center-chart-container").css({ 'visibility': "hidden" });


                for (var i = 0; i < results.rows.length; i++) {
                    var item = results.rows.item(i);

                    $('#progress-center-' + item.subjId).html(Math.round((item.c / item.tq) * 100) + '%');
                    var c = parseFloat(item.c);
                    var tq = parseFloat(item.tq);
                    drawMyChart('progress-center-chart-' + item.subjId, c, tq - c);
                    $("#progress-center-chart-container-" + item.subjId).css({ 'visibility': "visible" });
                }

                

            }, function (err) {
                alert('errr');
            });

        tx.executeSql("SELECT COUNT(*) as c FROM QUESTIONS WHERE testedState = \'2\'", [],
            function (tx, results) {
                var p = parseInt(results.rows.item(0).c);
                $('#progress-right').html(Math.round(p / bbDatabase.termsData.length * 100) + '%');
                try {
                    drawMyChart('progress-right-chart', p, bbDatabase.termsData.length);
                    $("#progress-right-chart-container").css({ 'visibility': "visible" });
                } catch (e) {
                    alert('Cannot draw a chart: ' + e.message);
                }
            });

        tx.executeSql("SELECT subjId as subjId, testedState as ts, COUNT(*) as c FROM QUESTIONS GROUP BY subjId, testedState", [],
            function (tx, results) {

                var subjects = new Array();

                for (var i = 0; i < results.rows.length; i++) {
                    var count = results.rows.item(i).c;
                    var subjId = results.rows.item(i).subjId;

                    if (jQuery.inArray(subjId, subjects) == -1) {
                        subjects.push(subjId);
                    }
                }

                for (var i = 0; i < subjects.length; i++) {
                    var id = subjects[i];
                    var tested = 0;
                    var total = 0;
                    for (var j = 0; j < results.rows.length; j++) {
                        var item = results.rows.item(j);
                        if (item.subjId == id) {
                            if (item.ts == 2) {
                                tested = item.c;
                            }
                            total += item.c;
                        }
                    }
                    //alert(id + ': ' + tested + ' / ' + total);
                    $('#progress-right-' + id).html(Math.round((tested / total) * 100) + '%');
                    drawMyChart('progress-right-chart-' + id, tested, total - tested);
                    $("#progress-right-chart-container-" + id).css({ 'visibility': "visible" });
                }

                subjects.length = 0;
                subjects = null;

            });
    });
};

//
//
//
bbDatabase.saveGameData = function (isTopic, id, correct, total) {
    this.isTopic = isTopic;
    this.param0 = id;
    this.param1 = correct;
    this.param2 = total;
    bbDatabase.instance.transaction(bbDatabase.querySaveGameData, bbDatabase.errorCB);
};

bbDatabase.querySaveGameData = function (tx) {
    var qvalues = '';
    if (bbDatabase.isTopic) {
        qvalues = '\'' + bbDatabase.param0 + '\', ' // topicId
                + '' + 'null' + ', '            // subjId
                + '\'' + bbDatabase.param2 + '\', ' // totalQuestions
                + '\'' + bbDatabase.param1 + '\', ' // answeredCorrect
                + '\'' + new Date() + '\'';         // date test taken
    }
    else {
        qvalues = '' + 'null' + ', '            // topicId
                + '\'' + bbDatabase.param0 + '\', ' // subjId
                + '\'' + bbDatabase.param2 + '\', ' // totalQuestions
                + '\'' + bbDatabase.param1 + '\', ' // answeredCorrect
                + '\'' + new Date() + '\'';         // date test taken
    }

    tx.executeSql('INSERT INTO GAMESHISTORY (topicId, subjId, totalQuestions, correct, date) VALUES (' + qvalues + ')');
};

//
//  Questions
//
bbDatabase.getQuestionsList = function (isTopic, id, callback) {
    // TODO: check if 'callback' is function
    bbDatabase.callback = callback;
    bbDatabase.isTopic = isTopic;
    bbDatabase.param0 = id;

    bbDatabase.instance.transaction(bbDatabase.queryQuestions, bbDatabase.errorCB);
};

bbDatabase.queryQuestions = function (tx) {
    var query = '';
    if (bbDatabase.isTopic) {
        //query = 'SELECT q.*, t.name as termName, t.topicId as topicId FROM QUESTIONS as q JOIN TERMS as t ON q.termId = t.id WHERE t.topicId = \'' + bbDatabase.param0 + '\' ORDER BY testedState LIMIT 10';
        query = 'SELECT q.* FROM QUESTIONS as q WHERE q.topicId = \'' + bbDatabase.param0 + '\' ORDER BY testedState LIMIT 10';
    }
    else {
        //query = 'SELECT q.*, t.name as termName, t.subjId as subjId FROM QUESTIONS as q JOIN TERMS as t ON q.termId = t.id WHERE t.subjId = \'' + bbDatabase.param0 + '\' ORDER BY testedState LIMIT 30';
        query = 'SELECT q.* FROM QUESTIONS as q WHERE q.subjId = \'' + bbDatabase.param0 + '\' ORDER BY testedState LIMIT 30';
    }
    tx.executeSql(query, [], bbDatabase.qsQuestionList, bbDatabase.errorCB);
};

bbDatabase.qsQuestionList = function (tx, results) {
    var q = new Array();
    for (var i = 0; i < results.rows.length; i++) {
        var item = results.rows.item(i);
//        var nitem = {
//            id: item.id,
//            question: item.question,
//            wrong1: item.wrong1,
//            wrong2: item.wrong2,
//            correct: item.correct,
//            termId: item.termId,
//            topicId: item.topicId,
//            termName: item.termName,
//            subjId: item.subjId,
//            mistaken: 0
//        };
        q.push(item);
    }

    var r = shuffle(q);

    bbDatabase.callback(r);
};

//
//  Get questions by ids
//
bbDatabase.getQuestionsByIds = function (ids, callback) {
    bbDatabase.callback = callback;
    bbDatabase.ids = ids;

    bbDatabase.instance.transaction(bbDatabase.queryQuestionsByIds, bbDatabase.errorCB);
};

bbDatabase.queryQuestionsByIds = function (tx) {
    var params = '';
    for (var i = 0; i < bbDatabase.ids.length; i++) {
        var item = bbDatabase.ids[i];
        if (i != 0) {
            params = params + ',\'' + item + '\'';
        }
        else {
            params = '\'' + item + '\'';
        }
    }

    tx.executeSql('SELECT * FROM QUESTIONS WHERE id IN (' + params + ')', [], bbDatabase.qsQuestionsByIds, bbDatabase.errorCB);
};

bbDatabase.qsQuestionsByIds = function (tx, results) {
    var q = new Array();

    for (var i = 0; i < bbDatabase.ids.length; i++) {
        var cid = bbDatabase.ids[i];
        for (var j = 0; j < results.rows.length; j++) {
            var item = results.rows.item(j);
            if (item.id == cid) {
                q.push(item);
            }
        }
    }

    bbDatabase.ids.length = 0;
    bbDatabase.ids = null;

    bbDatabase.callback(q);
};

//
//
//
bbDatabase.checkIfDbExists = function () {
    var db = window.openDatabase(/*[#DATABASEID]*/"SmartStudy991", "1.1", "SmartStudy991"/*[$DATABASEID]*/, 5 * 1024 * 1024);
    bbDatabase.instance = db;
    bbDatabase.instance.transaction(function (tx) { tx.executeSql("SELECT * FROM sqlite_master WHERE type='table' AND name='SUBJECTS'", [], bbDatabase.qsCheckIfDbExists, bbDatabase.errorCB); }, bbDatabase.errorCB);
};

bbDatabase.qsCheckIfDbExists = function (tx, results) {
    //bbDatabase.something();
    if (results.rows.length == 0) {
        bbDatabase.something();
    }
    else {
        bbDatabase.trtrMain();
        bbDatabase.getProgressData();
    }
};

bbDatabase.populateDB = function (tx) {
    tx.executeSql('DROP TABLE IF EXISTS SUBJECTS');
    tx.executeSql('DROP TABLE IF EXISTS TOPICS');
    tx.executeSql('DROP TABLE IF EXISTS TERMS');
    tx.executeSql('DROP TABLE IF EXISTS QUESTIONS');
    tx.executeSql('DROP TABLE IF EXISTS GAMESHISTORY');
    tx.executeSql('CREATE TABLE IF NOT EXISTS SUBJECTS (id, name)');
    tx.executeSql('CREATE TABLE IF NOT EXISTS TOPICS (id, name, subjId)');
    tx.executeSql('CREATE TABLE IF NOT EXISTS TERMS (id, name, descr, picId, mp3Id, illId, topicId, subjId, read)');
    tx.executeSql('CREATE TABLE IF NOT EXISTS QUESTIONS (id, termId, subjId, topicId, question, wrong1, wrong2, correct, testedState, termName)');
    tx.executeSql('CREATE TABLE IF NOT EXISTS GAMESHISTORY (id integer primary key autoincrement, topicId, subjId, totalQuestions, correct, date)');
    // testedState: 0 - never tested; 1 - tested and wrong; 2 - tested and correct

    if (bbDatabase.subjects) {
        for (var i = 0; i < bbDatabase.subjects.length; i++) {
            var id = bbDatabase.subjects[i].id;
            var name = bbDatabase.subjects[i].name;
            var values = '\'' + id + '\', ' + '\'' + name + '\'';

            for (var j = 0; j < bbDatabase.subjects[i].topics.length; j++) {
                var tid = bbDatabase.subjects[i].topics[j].id;
                var tname = bbDatabase.subjects[i].topics[j].name;
                var tvalues = '\'' + tid + '\', ' + '\'' + tname + '\', ' + '\'' + id + '\'';

                for (var k = 0; k < bbDatabase.subjects[i].topics[j].terms.length; k++) {
                    var trmvalues =
                          '\'' + bbDatabase.subjects[i].topics[j].terms[k].id + '\', '
                        + '\'' + bbDatabase.subjects[i].topics[j].terms[k].name + '\', '
                        + '\'' + bbDatabase.subjects[i].topics[j].terms[k].descr + '\', '
                        + '\'' + bbDatabase.subjects[i].topics[j].terms[k].pic + '\', '
                        + '\'' + bbDatabase.subjects[i].topics[j].terms[k].audio + '\', '
                        + '\'' + bbDatabase.subjects[i].topics[j].terms[k].illustr + '\', '
                        + '\'' + bbDatabase.subjects[i].topics[j].terms[k].topicId + '\', '
                        + '\'' + bbDatabase.subjects[i].topics[j].terms[k].subjId + '\', '
                        + '\'false\'';
                    tx.executeSql('INSERT INTO TERMS (id, name, descr, picId, mp3Id, illId, topicId, subjId, read) VALUES (' + trmvalues + ')');
                }
                bbDatabase.subjects[i].topics[j].terms.length = 0;
                bbDatabase.subjects[i].topics[j].terms = null;

                tx.executeSql('INSERT INTO TOPICS (id, name, subjId) VALUES (' + tvalues + ')');
            }

            bbDatabase.subjects[i].topics.length = 0;
            bbDatabase.subjects[i].topics = null;

            tx.executeSql('INSERT INTO SUBJECTS (id, name) VALUES (' + values + ')');
        }
        bbDatabase.subjects.length = 0;
        bbDatabase.subjects = null;

        for (var i = 0; i < bbDatabase.questions.length; i++) {
            var qvalues =
                  '\'' + bbDatabase.questions[i].id + '\', '
                + '\'' + bbDatabase.questions[i].termId + '\', '
                + '\'' + bbDatabase.questions[i].subjId + '\', '
                + '\'' + bbDatabase.questions[i].topicId + '\', '
                + '\'' + bbDatabase.questions[i].question + '\', '
                + '\'' + bbDatabase.questions[i].wrong1 + '\', '
                + '\'' + bbDatabase.questions[i].wrong2 + '\', '
                + '\'' + bbDatabase.questions[i].correct + '\', '
                + '\'' + bbDatabase.questions[i].termName + '\', '
                + '\'0\'';

            tx.executeSql('INSERT INTO QUESTIONS (id, termId, subjId, topicId, question, wrong1, wrong2, correct, termName, testedState) VALUES (' + qvalues + ')');
        }
        bbDatabase.questions.length = 0;
        bbDatabase.questions = null;
    }
};

// Transaction error callback
//
bbDatabase.errorCB = function (tx, err) {
    alert("Error processing SQL: " + tx.message);
};
// Transaction success callback
//
bbDatabase.successCB = function () {
    bbDatabase.trtrMain();
};

bbDatabase.something = function () {
    this.subjects = new Array();
    var termCount = 0;
    $.ajax({
        url: "data.xml",
        dataType: ($.browser.msie) ? "text" : "xml",
        success: function (d) {
            var xml;

            // Doesn't work in IE without this
            if (typeof d == "string") {
                xml = new ActiveXObject("Microsoft.XMLDOM");
                xml.async = false;
                xml.loadXML(d);
            }
            else {
                xml = d;
            }

            $(xml).find('Subject').each(function () {
                var topicsArray = new Array();
                var subjectName = $(this).find('> Name').text().replace(/'/g, "''");
                var subjectCode = $(this).find('> Id').text().replace(/'/g, "''");

                $(this).find('Topic').each(function () {
                    var termsArray = new Array();

                    var topicName = $(this).find('> Name').text().replace(/'/g, "''");
                    var topicCode = $(this).find('> Code').text().replace(/'/g, "''");

                    $(this).find('Term').each(function () {
                        var termId = $(this).find('Id').text();
                        var termName = $(this).find('Name').text().replace(/'/g, "''");
                        var termDescr = $(this).find('Definition').text().replace(/'/g, "''");
                        var termPic = $(this).find('PictureId').text();
                        var termAudio = $(this).find('AudioId').text();
                        var termIllustr = $(this).find('IllustrationId').text();
                        var question = $(this).find('Question').text().replace(/'/g, "''");
                        var wrong1 = $(this).find('WrongAnswer1').text().replace(/'/g, "''");
                        var wrong2 = $(this).find('WrongAnswer2').text().replace(/'/g, "''");
                        var correct = $(this).find('CorrectAnswer').text().replace(/'/g, "''");
                        var qid = $(this).find('QuestionNumber').text();
                        var questionId = '';

                        if (qid != 'undefined' && qid != '' && qid != 0) {
                            questionId = topicCode + '_' + qid;
                            bbDatabase.questions.push({
                                id: questionId,
                                termId: termId,
                                question: question,
                                wrong1: wrong1,
                                wrong2: wrong2,
                                correct: correct,
                                topicId: topicCode,
                                subjId: subjectCode,
								termName: termName
                            });
                        }

                        termsArray.push({
                            id: termId,
                            name: termName,
                            descr: termDescr,
                            pic: termPic,
                            audio: termAudio,
                            illustr: termIllustr,
                            topicId: topicCode,
                            subjId: subjectCode
                        });

                        termCount = termCount + 1;
                    });

                    topicsArray.push({
                        id: topicCode,
                        name: topicName,
                        terms: termsArray
                    });
                });

                bbDatabase.subjects.push({
                    id: subjectCode,
                    name: subjectName,
                    topics: topicsArray
                });
            });


            try {
                bbDatabase.init();
            }
            catch (e) {
                alert(e);
            }
        }
    });
};

bbDatabase.trtrMain = function () {
    bbDatabase.instance.transaction(function (tx) { tx.executeSql('SELECT id FROM SUBJECTS', [], bbDatabase.qsSubjects, bbDatabase.errorCB); }, bbDatabase.errorCB);
};

bbDatabase.trtrTopics = function () {
    bbDatabase.instance.transaction(function (tx) { tx.executeSql('SELECT id FROM TOPICS', [], bbDatabase.qsTopics, bbDatabase.errorCB); }, bbDatabase.errorCB);
};

bbDatabase.qsSubjects = function (tx, results) {
    for (var i = 0; i < results.rows.length; i++) {
        var item = results.rows.item(i);

        $(document).delegate('#subj-game-' + item.id, 'click', function (event) {
            var issubj = $(this).attr('data-isSubj');
            var itemId = $(this).attr('data-Id');
            var gamename = $(this).attr('data-name');
            chooseGame($(this), itemId, issubj, gamename);
        });
    }

    bbDatabase.trtrTopics();
};

bbDatabase.qsTopics = function (tx, results) {
    for (var i = 0; i < results.rows.length; i++) {
        var item = results.rows.item(i);
        var index = i;
        //var subjId = item.subjId;

        $(document).delegate('#' + item.id, 'click', function (event) {

            var issubj = $(this).attr('data-isSubj');
            var itemId = $(this).attr('id');
            var gamename = $(this).attr('data-name');
            chooseGame($(this), itemId, issubj, gamename);
        });
    }
};



bbDatabase.getDescr = function (key, isDetailedScores) {
    if (isDetailedScores === true) {
        bbDatabase.isTopic = false;
    }
    else {
        bbDatabase.isTopic = true;
    }

    bbDatabase.param0 = key;
    bbDatabase.instance.transaction(bbDatabase.queryDescr, bbDatabase.errorCB);
};

bbDatabase.queryDescr = function (tx) {
    var query = 'SELECT t.*, s.name as subjname FROM TERMS AS t JOIN SUBJECTS as s ON t.subjId = s.id WHERE t.id = \'' + bbDatabase.param0 + '\'';
    //var query = 'SELECT t.*, "subj" as subjname FROM TERMS AS t WHERE t.id = \'' + bbDatabase.param0 + '\'';
    var queryRead = 'UPDATE TERMS SET read = \'true\' WHERE id = \'' + bbDatabase.param0 + '\'';
    tx.executeSql(query, [], bbDatabase.qsDescr, bbDatabase.errorCB);
    tx.executeSql(queryRead, [], function (tx, results) { }, bbDatabase.errorCB);
};

bbDatabase.updateQuestionState = function (id, state) {
    bbDatabase.param0 = id;
    bbDatabase.param1 = state;
    bbDatabase.instance.transaction(bbDatabase.queryUpdateQuestionState, bbDatabase.errorCB);
};

bbDatabase.queryUpdateQuestionState = function (tx) {
    var query = 'UPDATE QUESTIONS SET testedState = \'' + bbDatabase.param1 + '\' WHERE id = \'' + bbDatabase.param0 + '\'';
    tx.executeSql(query, [], function (tx, results) { }, bbDatabase.errorCB);
};

bbDatabase.qsDescr = function (tx, results) {
    if (results.rows.length > 0) {
        var item = results.rows.item(0);
        var descr = item.descr;
        var pic = item.picId;
        var audio = item.mp3Id;
        var illustr = item.illId;
        var subjectId = item.subjId;
        var subjName = item.subjname;
        var topicId = item.topicId;
        var showBtns = false;

        $('.item-name').html(item.name);
        //$('#item-descr > span').html(descr);
        $('#item-descr-value').html(descr);
        M.parseMath($('#item-descr-value')[0]);

        if (!bbDataContent.downloadReset) {
            //
            // Picture
            if (pic != '') {
                showBtns = true;
                $('#btn-picture').show();
                $('#btn-picture').unbind('click.smst');
                $('#btn-picture').bind('click.smst', function () {
                    bbDataContent.decryptFile(pic, function (dataUrl) {
                        illustrPath = dataUrl;
                    });
                });
            }
            else {
                $('#btn-picture').unbind('click.smst');
                illustrPath = '';
                $('#btn-picture').hide();
            }

            //
            // Illustration
            if (illustr != '') {
                showBtns = true;
                $('#btn-illustr').show();
                $('#btn-illustr').unbind('click.smst');
                $('#btn-illustr').bind('click.smst', function () {
                    bbDataContent.decryptFile(illustr, function (dataUrl) {
                        illustrPath = dataUrl;
                    });
                });
            }
            else {
                $('#btn-illustr').unbind('click.smst');
                illustrPath = '';
                $('#btn-illustr').hide();
            }

            //
            // Play sound
            $('#btn-play').unbind('click.smst');
            //        if (audio != '') {
            //            showBtns = true;
            //            $('#btn-play').show();

            //            $('#btn-play').bind('click.smst', function () {
            //                bbDataContent.decryptFile(illustr, function (dataUrl) {
            //                    audio = dataUrl;
            //                    playAudio(audio);
            //                });
            //            });
            //        }
            //        else {
            //            $('#btn-play').hide();
            //        }
            $('#btn-play').hide();
        }
        else {
            $('#btn-picture').unbind('click.smst');
            illustrPath = '';
            $('#btn-picture').hide();
            $('#btn-illustr').unbind('click.smst'); illustrPath = '';
            $('#btn-illustr').hide();
            $('#btn-play').unbind('click.smst');
            $('#btn-play').hide();
        }

        if (showBtns)
            $('.desc-btns').css('display', 'block');
        else {
            $('.desc-btns').css('display', 'none');
        }

        //
        // Header
        $('#descr-page-header').html(subjName);

        if (bbDatabase.isTopic == false) {
            for (var i = 0; i < bbGame.answers.length; i++) {
                if (bbGame.answers[i].termId == item.id) {
                    var prev = '';
                    var next = '';
                    if (i > 0) {
                        prev = bbGame.answers[i - 1].termId;
                    }
                    else {
                        prev = bbGame.answers[bbGame.answers.length - 1].id;
                    }

                    if (i < (bbGame.answers.length - 1)) {
                        next = bbGame.answers[i + 1].termId;
                    }
                    else {
                        next = bbGame.answers[0].termId;
                    }

                    $('#descr-prev-term').attr('onclick', 'bbDatabase.getDescr(' + prev + ', true)');
                    $('#descr-next-term').attr('onclick', 'bbDatabase.getDescr(' + next + ', true)');
                }
            }
        }
        else {
            var prev = '';
            var next = '';
            var arr = new Array();

            for (var i = 0; i < bbDatabase.termsData.length; i++) {
                if (bbDatabase.termsData[i].topicId == item.topicId) {
                    arr.push(bbDatabase.termsData[i].id);
                }
            }

            for (var i = 0; i < arr.length; i++) {
                if (arr[i] == item.id) {

                    if (i > 0) {
                        prev = arr[i - 1];
                    }
                    else {
                        prev = arr[arr.length - 1];
                    }

                    if (i < (arr.length - 1)) {
                        next = arr[i + 1];
                    }
                    else {
                        next = arr[0];
                    }
                }
            }

            arr.length = 0;
            arr = null;

            $('#descr-prev-term').attr('onclick', 'bbDatabase.getDescr(' + prev + ')');
            $('#descr-next-term').attr('onclick', 'bbDatabase.getDescr(' + next + ')');
        }

        $('#descr-page-header').parent()[0].className = $('#descr-page-header').parent()[0].className.replace(/\bdescr-page-header-theme-\d+\b/g, '');

        //$('#descr-page-header').parent().addClass("descr-page-header-theme-" + item.subjId);

        var st = "descr-page-header-theme-4";
        for (var i = 0; i < bbDatabase.subjectStyles.length; i++) {
            if (bbDatabase.subjectStyles[i].id == item.subjId) {
                st = "descr-page-header-theme-" + bbDatabase.subjectStyles[i].style;
            }
        }

        $('#descr-page-header').parent().addClass(st);

        item = null;
    }

    results.rows.length = 0;
};