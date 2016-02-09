/**
 * From http://stackoverflow.com/questions/13745519/send-custom-data-along-with-handshakedata-in-socket-io
 * Provides a means to pass custom data to socket io
 * This fixes the user A/B concurrent request bug
 **/
var socket = io.connect();

//keep a list of rooms that the client is in so we don't make a lot of server requests
var userRoomsList;

//the current room that the user is in.
var currentRoom;

//the client's username
var myUsername;

/**
 * From http://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript
 * Provides a means to escape user inputted messages
 * The rationale to use this is that this is a cleaner, simple, and effective way to escape HTML entities
 * than some hack way with jQuery functions (eg. text()) that may not work cross browsers.
 **/
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Transforms a string into an HTML attribute
 * ie. replaces all spaces with dashes
 **/
function toClassString(str) {
    return str.replace(/\s/g, "-");
}

function toClassStringr(str) {
    return str.replace(/-/g, " ");
}

/**
 * Handles putting the message in the DOM
 * msg = the actual message, pre sanitation
 * roomName = the room which this msg was sent to
 * username = the user who sent this msg
 * other = a boolean to differentiate a message sent by self/others
 **/
function addMessage(msg, roomName, username, other) {
    var roomNameClass = toClassString(roomName);

    //check if user is in the room. If not, add 1 new unread message.
    if (currentRoom != roomName) {
        var index = userRoomsList.map(function(e) {
            return e.roomName;
        }).indexOf(roomName);
        userRoomsList[index].numNewMsgs++;
        //show badge if it is hidden
        if ($('#' + roomNameClass + '-badge').is(":hidden")) {
            $('#' + roomNameClass + '-badge').parent().addClass("tab-badge-notification-bg");
            $('#' + roomNameClass + '-badge').show();
        }
        $('#' + roomNameClass + '-badge').text(userRoomsList[index].numNewMsgs);
    }

    //create message timestamp
    var time = new Date();
    var hour = time.getHours();
    var minute = time.getMinutes();
    var second = time.getSeconds();
    var sign = "am";
    if (hour > 11) {
        sign = "pm";
        if (hour > 12) {
            hour = hour % 12;
        }
    }
    else if (hour == 0) {
        hour = 12;
    }
    if (minute < 10) {
        minute = "0" + minute;
    }
    if (second < 10) {
        second = "0" + second;
    }
    time = hour + ":" + minute + ":" + second + " " + sign;

    //append to the right div/ie to the right room
    //var bgCSSClass = other ? "bg-info" : "bg-primary";
    // if it's private message have to add class "private";
    if(other){
        var bgCSSClass = "bg-danger";
    }
    else{
    var bgCSSClass = "bg-mess";
    }
    bgCSSClass = username == "@FightBOT" ? "bg-success" : bgCSSClass;
    var message = username == "@FightBOT" ? msg : escapeHtml(msg);
    $('div#chat-panel div#room-' + roomNameClass + ' div.chat-entries').append('<div class="message ' + bgCSSClass + '"><span class="msg-user">' + username + '</span> : <span class="msg-content">' + message + '</span>' + '<span class="message-timestamp">' + time + '</span>' + '</div>');

    var roomChatEntries = $('div#chat-panel div#room-' + roomNameClass + ' div.chat-entries');
    if (Math.abs((roomChatEntries[0].scrollHeight - roomChatEntries.scrollTop() - roomChatEntries.outerHeight())) < $("#chat-panel").height() + 200) {
        roomChatEntries.animate({
            scrollTop: roomChatEntries[0].scrollHeight
        }, 200);
    }
    else {
        $('#more-msgs').filter(':hidden').fadeIn(500).delay(1500).fadeOut(500);
    }

    emojify.run(); //enable emojis
}

function sentMessage() {
    if ($('#message-input').val() != "") {
        var messageBody = $('#message-input').val();
        var data = {
            "messageBody": messageBody,
            "messageRoom": currentRoom,
            "username": username
        };
        socket.emit('sendMessage', data);

        //this current implementation is that when you send a message, for you, the message doesn't go to the server, only for others
        addMessage(messageBody, currentRoom, "Me", false);
        $('#message-input').val(''); //clear the input field
    }
}

//populates public rooms list in the Arena
function populatePublicRoomsList(data) {
    $('#public-rooms-list').empty();
    for (var i = 0; i < data.publicRoomsList.length; i++) {
        $('#public-rooms-list').append('<div class="public-room-entry" id=' + toClassString(data.publicRoomsList[i]) +
            '-public-room><span class="glyphicon glyphicon-home public-room-icon"></span>' + data.publicRoomsList[i] + '</div>');
        var publicRoomElement = $('div.public-room-entry:contains(' + data.publicRoomsList[i] + ')');
        publicRoomElement.on({
            click: function(e) {
                //join the public room if it hasn't been joined yet, otherwise open the public room's tab
                var roomName = this.id;
                var index = roomName.indexOf("-public-room");
                roomName = roomName.slice(0, index);
                roomName = toClassStringr(roomName);
                index = userRoomsList.map(function(e) {
                    return e.roomName;
                }).indexOf(roomName);
                if (index == -1) {
                    socket.emit("joinRoom", {
                        "roomName": roomName,
                        "hasAccepted": true
                    });
                }
                else {
                    $('a[href="#room-' + toClassString(roomName) + '"]').click();
                }
            }
        });
    }
}

socket.on('disconnect', function(data) {
    notify_alert('Connection terminated');
});
socket.on('reconnecting',function(data) {
    notify_alert('Connection try to reconnecting');
});

socket.on('reconnect', function(data) {
    $(".chat-entries").empty();
    $("body .alerting").hide();
    $("reginfight").addClass("btn-success").removeClass("btn-warning").button('reset');
});
socket.on('connect', function(data) {
    $("body .alert:first").hide();
    // зовем статы пользователя
     socket.emit('showMagicList');
});
socket.on('GoTo', function(data) {
    window.location.href = data.url;
});

socket.on('sendMessageResponse', function(data) {
    addMessage(data['message'], data['roomName'], data['username'], false);
});
// Private Msg
socket.on('PrivateMsg',function(data) {
    addMessage(data.message,'Arena',data.from,true);
     document.getElementById('prvtmsg').play();
});
socket.on('numConnected', function(data) {
    if (data.roomName == "Arena") {
        $('#num-connected-Arena').html('Users online: ' + data.numConnected);
    }
    else {
        $('#num-connected-' + toClassString(data.roomName)).html('Users in room: ' + data.numConnected);
    }
});

socket.on('initRoomsList', function(roomsList, publicRoomsList) {
    userRoomsList = [{
        'roomName': roomsList[0],
        numNewMsgs: 0
    }];
    $('#public-rooms-title').text("Public Rooms:");
    populatePublicRoomsList({
        "publicRoomsList": publicRoomsList
    });
});

socket.on('saveUsername', function(data) {
    myUsername = data.clientUsername;
});

socket.on('loadUsersList', function(data) {
    var roomNameClass = toClassString(data.roomName);

    $('#usersList-' + roomNameClass).empty();
    if (data.roomName == "Arena") {
        $('#all-users-list').empty();
        if (data.usernamesList.length == 1) {
            $('#all-users-list').append("(No one's online...)");
        }
    }

    $('#usersList-' + roomNameClass).append('<div class="my-username"><span class="glyphicon glyphicon-user"></span>' + myUsername + " (You)" + '</div>');
    $('#usersList-' + roomNameClass).append('<div class="bot-username"><span class="glyphicon glyphicon-user"></span>@FightBOT</div>');
    for (var i = 0; i < data.usernamesList.length; i++) {
        if (data.usernamesList[i] != myUsername) {
            $('#usersList-' + roomNameClass).append('<div class="username"><span class="glyphicon glyphicon-user"></span>' + data.usernamesList[i]);
            if (data.roomName == "Arena") {
                $('#all-users-list').append('<div class="username"><span class="glyphicon glyphicon-user"></span>' + data.usernamesList[i]);
                $('#all-users-list div.username:contains(' + data.usernamesList[i] + ')').click(function(e) {
                    socket.emit('inviteUser', {
                        'username': $(this).text(),
                        'roomName': currentRoom
                    });
                });
                $('#atc-ul').append('<li role=presentation><a>' + data.usernamesList[i] + '</a</li>');
                $('#atc-ul li').click(function(e) {
                    attackUser($(e.target), 100);
                });
                $('#ptc-ul').append('<li role=presentation><a>' + data.usernamesList[i] + '</a</li>');
                $('#ptc-ul li').click(function(e) {
                    defUser($(e.target), 100);
                });
                $('#heal-ul').append('<li role=presentation><a>' + data.usernamesList[i] + '</a</li>');
                $('#heal-ul li').click(function(e) {
                    healUser($(e.target), 100);
                });

            }
        }
    }

    //populate create-room modal's users list - START
    //allUsernamesList is undefined when a user joins/leaves/creates a room - no new users are introduced so no need to update the list
    //allUsernamesList is defined when a user connects/disconnects - needs to update the list
    if (typeof data.allUsernamesList !== "undefined") {
        if (data.allUsernamesList.length == 1) { //if there are no other users online, the user will be presented with "no one's online"
            $('#create-room-modal-invite-user-container').empty();
            $('#create-room-modal-invite-user-container').append("(No one's online...)");
        }
        else {
            $('#create-room-modal-invite-user-container').empty();
            for (var i = 0; i < data.allUsernamesList.length; i++) {
                if (data.allUsernamesList[i] != myUsername) {
                    //populate the create-new-room modal's users list
                    $('#create-room-modal-invite-user-container').append('<div class="create-room-modal-username" data-username="' + data.allUsernamesList[i] + '" data-selected="false"> <span class="glyphicon glyphicon-user"></span>' + data.allUsernamesList[i] + '</div>');
                }
            }

            //create username button behaviour
            $('div.create-room-modal-username').click(function() {
                if ($(this).data("selected") == "true") {
                    $(this).removeClass("create-room-modal-username-selected");
                    $(this).data("selected", "false");
                }
                else {
                    $(this).addClass("create-room-modal-username-selected");
                    $(this).data("selected", "true");
                }
            });
        }
    }
    //populate create-room modal's users list - END
});

socket.on('roomInvite', function(data) {
    $('#invitation-modal>div>div>div.modal-body').text("User " + data.inviter + " has invited you to " + data.roomName);
    $('#invitation-modal-accept-button').data("roomName", data.roomName);
    $('#invitation-modal').modal('show');
});

socket.on('joinRoomResponse', function(data) {
    if (data.created) {
        //adds room to client's userRoomsList array
        userRoomsList.push({
            'roomName': data.roomName,
            'numNewMsgs': 0
        });
        var roomNameClass = toClassString(data.roomName);

        //chat container DOM creation
        $('div#chat-panel').append('<div id="room-' + roomNameClass + '" class="tab-pane"><div class="chat-entries"></div></div>');
        //room num-connected DOM creation
        $('div#num-connected-container').append('<div id="num-connected-' + roomNameClass + '" class="num-connected"></div>');
        //room userList DOM creation
        $('div#username-container').append('<div id="usersList-' + roomNameClass + '" class="usersList"></div>');
            //tab dom creation
        $('ul#tab').append('<li class="span roomTab"><a href="#room-' + roomNameClass + '" data-toggle="tab">' +
            '<span id = "' + roomNameClass + '-badge" class="badge tab-badge"></span>' + data.roomName + '<span class="glyphicon glyphicon-remove"></span></a></li>');

        //open tab functionality
        $('ul#tab li:contains(' + data.roomName + ') a').click(function(e) {
            e.preventDefault();
            $(this).tab('show');
            $('div.usersList').hide(); //hide all other usersLists
            $('div#usersList-' + roomNameClass).show(); //show the specific room usersList
            currentRoom = data.roomName;

            //hide badge for the room after user clicks on the room
            var index = userRoomsList.map(function(e) {
                return e.roomName;
            }).indexOf(currentRoom);
            userRoomsList[index].numNewMsgs = 0;
            $('#' + roomNameClass + '-badge').hide();
            $('#' + roomNameClass + '-badge').parent().removeClass("tab-badge-notification-bg");

            //hide the public rooms list for rooms other than "Arena"
            $('#public-rooms-container').hide();

            //hide number of users connected in all other rooms
            $('div.num-connected').hide();

            //show number of users connected in this specific room
            $('div#num-connected-' + roomNameClass).show();

            //show the all-users-list, since we are in a user created room now
            $('div#all-users-list-container').show();
        });

        //close tab functionality
        $('ul#tab li:contains(' + data.roomName + ') span.glyphicon-remove').click(function() {
            $(this).parent().parent().remove(); //removes the li tag
            $('div#room-' + roomNameClass).remove(); //remove the main chatpanel
            $('div#userlist-' + roomNameClass).remove(); //remove userlist
            socket.emit('leaveRoom', data.roomName);

            $('ul#tab a:contains("Arena")').click(); //go back to the Arena
            currentRoom = "Arena";

            //removes room from client's userRoomsList array
            var index = userRoomsList.map(function(e) {
                return e.roomName;
            }).indexOf(data.roomName);
            userRoomsList.splice(index, 1);
        });

        $('ul#tab li:contains(' + data.roomName + ') a').click();
    }
    else {
        if (data.errorCode == 1) {
            window.alert("Illegal room name! Room name can only contain alphanumeric characters, spaces, and underscores!");
        }
        else if (data.errorCode == 2) {
            window.alert("A room with that name already exists! Please choose another name!");
        }
        else if (data.errorCode == 3) {
            window.alert("Room name 'Arena' is reserved, please choose another name!");
        }
        else {
            window.alert("Unknown error! Room cannot be created!");
        }
    }
});

socket.on('populatePublicRooms', function(data) {
    populatePublicRoomsList(data);
});

socket.on("failedInvitation", function(data) {
    $('#failed-invitation-modal>div>div>div.modal-body').text("Cannot invite user: " + data.invitee + ", they seem to already be in room: " + data.roomName);
    $('#failed-invitation-modal').modal('show');
});

socket.on("deleteTabs", function() {
    //define a temporary userRoomsList so clicking on Arena would not result in an error
    userRoomsList = [{
        'roomName': "Arena",
        numNewMsgs: 0
    }];
    //click on Arena tab
    $('ul#tab a:contains("Arena")').click();
    currentRoom = "Arena";
    //remove tabs from previous sessions
    $("ul#tab>li+li+li").remove();
    //remove tab contents
    $("div#chat-panel>div+div+div+div").remove();
});

// Фукция отображения логов боя (ЗАПИЛИТЬ!)
socket.on("BattleLog", function(data) {
    // todo: отображение логов приходящих от сервера
    var pData = parseLog(data.message);
    appendLog(pData);
});
// show funcional

socket.on("ShopShow", function(data) {
    var row;
    $("#shop-table tbody").empty();
    var d = JSON.parse(data);

    //сортировка приходящего массива на стороне пользователя.
    d.sort(function(a, b) {
        var an = a.code.substring(1);
        var bn = b.code.substring(1);
        if (Number(an) > Number(bn)) {
            return 1;
        }
        if (Number(an) < Number(bn)) {
            return -1;
        }
        // a должно быть равным b
        return 0;
    });

    for (var i in d) {
        var z = d[i];
        row = '<tr><td>' + z.code + '</td>' + '<td>' + z.name + '</td>' + '<td>' + z.price + '</td></tr>';
        $("#shop-table tbody").append(row);
    }
    $('#shop-modal').modal('show');
});


/************************* Character Show *************************************/

socket.on("showStat", function(data) {
    // var arr = JSON.parse(data);
    var arr = data;
    //nick
    $('#nick-name-heading').html(myUsername);
    $('li#str span').html(arr.hrks.s);
    $('li#dex span').html(arr.hrks.d);
    $('li#int span').html(arr.hrks.i);
    $('li#wis span').html(arr.hrks.w);
    $('li#con span').html(arr.hrks.c);

    ///// HL MGA MGP ISPELL
    $('li#mga span').html(arr.mga);
    $('li#mgp span').html(arr.mgp);
    $('li#mgp span').html(arr.mgp);
    $('li#mgp span').html(arr.mgp);

    ///// Weight Exp Gold Free
    $('li#weight span').html(arr.weight); //Weight
    $('li#exp span').html(arr.exp);
    $('li#gold span').html(arr.gold);
    $('li#free span').html(arr.free);

    ///// HIT AT PR MAXTARG
    $('li#hit-min-max span').html(arr.hit['0']['min'] + ' x ' + arr.hit['0']['max']); //HIT min - max
    $('li#at span').html(arr.atc); //AT
    $('li#pr span').html(arr.prt); //PR
    $('li#max-targ span').html(arr.maxtarget); //MAXTARG



});




/******************************************************************************/
/*******************************************************************************
 * 
 *                          Clan Show Functions
 * 
 * ****************************************************************************/


socket.on("claninfo", function(data) {
    if (typeof data.sum == 'string') {
        //если клан отсутствует
        $('#clan-modal').modal('show');
    }
    else {
        $('#clan-info-modal').modal('show');

    }

});

/************************* MatchMaking Show ***********************************/
/*
MatchMaking
*/

socket.on("MatchMaking", function(data) {
    $('#reginfight').addClass("btn-warning").removeClass("btn-success").button('searching');
});

socket.on("regInGame", function(data) {
    // восстанавливаем статус кнопки пописка
    $('#reginfight').addClass("btn-success").removeClass("btn-warning").button('reset');
});


/******************************************************************************/

/******************************************************************************
 * 
 *                  Dynamic init Fight page
 * 
 * ****************************************************************************/
socket.on('BattleStatus', function(data) {
        //  team
    $('#team-list').empty()
    $('#enemy-list').empty()
    $('#enemy-list1').empty()
    $('#enemy-list2').empty()
    $('#enemy-list3').empty()
    var yourhp = data.you.hp / data.you.maxhp * 100
    var yourmp = data.you.mp
    var yourcol = '<div class="row"><div class="col-md-4"><img src="https://cdn2.iconfinder.com/data/icons/fantasy-characters/512/archer2-64.png" class="center-block img-responsive img-rounded"></div><div class="col-md-4"><div class="progress"><div role="progressbar" style="width:' + yourhp + '%;" class="progress-bar progress-bar-success">HP: ' + data.you.hp + '</div></div><div class="progress"><div role="progressbar" style="width:100%;" class="progress-bar">MP ' + yourmp + '</div></div></div></div>';
    $('#yourcol').empty().append(yourcol).addClass('userlist-col');
    for (var i in data.team) {
        var teamcol = '<div class="col-xs-3 team-chr"><div class="row"><div class="col-lg-6"><img src="https://cdn2.iconfinder.com/data/icons/fantasy-characters/512/knight1-64.png" class="center-block img-responsive img-rounded"></div><div class="col-lg-6"><div class="progress"><div role="progressbar" style="width:	60%;" class="progress-bar progress-bar-success">60%	Complete</div></div><div class="progress"><div role="progressbar" style="width:	60%;" class="progress-bar">' + data.team[i].hp + '</div></div></div></div></div>';
        $('#team-list').append(teamcol);
    }
    // enemy
    for (var i in data.enemy) {
        var hpproc = data.enemy[i].hp / data.enemy[i].maxhp * 100;
        var enemycol = '<div class="col-xs-2"><h6 class="text-center">' + i + '</h6><img src="https://cdn2.iconfinder.com/data/icons/fantasy-characters/512/assassin1-64.png" class="center-block img-responsive img-rounded"><div class="progress"><div role="progressbar" style="width:' + hpproc + '%;" class="progress-bar progress-bar-danger"> HP: ' + Number(data.enemy[i].hp).toFixed(2) + '</div></div></div>';
        $('#enemy-list').append(enemycol);
    }
    $('#enemy-list> .col-xs-2').addClass('userlist-col');
});

/*****************************************************************************/
/*******************************************************************************
 * 
 *              Magic list 
 * 
 * ****************************************************************************/
 socket.on('MagicList',function(data) {
    // пришедший от сервера лист, парсим и формируем из него табы
    // и иконки магий
    $('.skill_panel').empty();
    $('.skill_content').empty();
    for(var i in data.sum){
        var f = 'active',
        sizer = 2;
        if (i > 0) {
            f = 'fade';
            sizer = 3; 
        }
        var block = '<li role="presentation" class="skill_tabs"><a href="#tc' + i + '" tag="tc'+i+'" aria-controls="profile" role="tab" data-toggle="tab">' + ' Circle'+ i + '</a></li>';
        $('.skill_panel').append(block);
        var panel = '<div id="tc'+ i + '" class ="tab-pane ' + f + '" <div class="panel panel-default"><div class="panel-body skill_cards">';
        $('.skill_content').append(panel);
        var magl = data.sum[i];
        for( var x in magl ) {
            var tab = '#tc' + i + ' > .panel-body';
        $('<div class="col-xs-'+ sizer + '"><a class="thumbnail" href="#"><img src="/img/mag/64x64_'+magl[x]+'.png"></a></div>')
            .data( 'img', '/img/mag/64x64_'+ magl[x]+'.png' ).data( 'skillid', magl[x]).appendTo(tab).draggable( {
                containment: '#content',
                stack: '.skill_cards div',
                cursor: 'move',
                revert: true
            });
        }
    }
 });
/******************************************************************************
 * 
 *                  Error From Server
 * 
 * ****************************************************************************/

socket.on('FailAction', function(data) {
    var mes = data.evnt + ' : ' + data.sum;
    notify_alert(mes);
});

/******************************************************************************/
$(function() {
    //the default active room is Arena
    currentRoom = "Arena";

    $('#message-input').keypress(function(event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13') {
            $("#submit").click();
        }
    });
    $('ul#tab a:contains("Arena")').click(function(e) {
        e.preventDefault();
        $(this).tab('show');
        $('div.usersList').hide(); //hide all other usersLists
        $('div#usersList-Arena').show(); //show the main usersList
        currentRoom = "Arena";

        //hide badge for the room after user clicks on the room
        var index = userRoomsList.map(function(e) {
            return e.roomName;
        }).indexOf(currentRoom);
        userRoomsList[index].numNewMsgs = 0;
        $('#' + currentRoom + '-badge').hide();
        $('#' + currentRoom + '-badge').parent().removeClass("tab-badge-notification-bg");

        //show the public rooms list
        $('#public-rooms-container').show();

        //hide number of users connected in all other rooms
        $('div.num-connected').hide();
        //show number of users connected in Arena
        $('div#num-connected-Arena').show();

        //hide the all-users-list-container
        $('div#all-users-list-container').hide();
    });
    //by default, show the Arena tab
    $('ul#tab a:contains("Arena")').tab('show');

    $('ul#tab li span.glyphicon-remove').click(function() {
        $(this).parent().parent().remove(); //removes the li tag
        var roomName = $(this).parent().text();
        $('div#room-' + toClassString(roomName)).remove();
        socket.emit('leaveRoom', roomName);
    });

    //Modal related functionality
    $('#add-room').click(function() {
        $('#create-room-modal').modal('show');
    });

    $('#create-room-button').click(function() {
        var roomName = $('input#create-room-modal-input').val();
        //set isPublic to true if checkbox is checked, otherwise false
        var isPublic = $('input#public-room-checkbox').prop("checked") ? true : false;
        if (roomName) {
            socket.emit('createRoom', {
                "roomName": roomName,
                "isPublic": isPublic
            });
            $('input#create-room-modal-input').val('');
            //reset the checkbox
            $('input#public-room-checkbox').prop("checked", false);
            //close the window
            $('#room-modal-close-button').click();

            //send room invitations to other users if any
            var usersToInvite = new Array();
            $.each($("#create-room-modal-invite-user-container>div"), function() {
                if ($(this).data("selected") == "true") {
                    usersToInvite.push($(this).data("username"));
                    //reset button properties
                    $(this).removeClass("create-room-modal-username-selected");
                    $(this).data("selected", "false");
                }
            });
            for (var i = 0; i < usersToInvite.length; i++) {
                socket.emit('inviteUser', {
                    'username': usersToInvite[i],
                    'roomName': roomName
                });
            }
        }
    });

    $("#create-room-modal-input").keypress(function(event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13') {
            $("#create-room-button").click();
        }
    });

    $('#invitation-modal-accept-button').click(function() {
        var roomName = $('#invitation-modal-accept-button').data("roomName");
        socket.emit('joinRoom', {
            "roomName": roomName,
            "hasAccepted": true
        });
        $('#invitation-modal').modal('hide'); //close the window
    });

    $('#invitation-modal-decline-button').click(function() {
        var roomName = $('#invitation-modal-accept-button').data("roomName");
        socket.emit('joinRoom', {
            "roomName": roomName,
            "hasAccepted": false
        });
    });
    //Modal box login ends here

    $('#submit').click(function() {
        sentMessage();
    });

    // character button:

    $('#Stats').click(function(e) {
        socket.emit("showStat");
        $("#character-modal").modal('show');
    });

    /**************** Временный набор кнопок для отладки *********************/
    ///обработчик кнопки регистрации в бой

    $('#reginfight').click(function() {
        $('#reginfight').toggleClass("btn-success");

        socket.emit('regInGame', {
            "username": myUsername
        });
    });

    $('#Shop').click(function(e) {
        shoprequest(e.a);
    });
    $('#StopGame').click(function(e) {
        var data = {
            "username": myUsername
        };
        socket.emit('StopGame', data);
    });

    $('#Clan-nav-item').click(function(e) {
        socket.emit('claninfo');
    });
    /**************************************************************************/
    /***************************************************************************
     * 
     *      Выбор таргета и функция отправки экшена
     * ************************************************************************/
    $('.fight-button').click(function(e) {
        var target = $('.selected> h6,.selected> h5').text();
        //  https://api.jqueryui.com/selectable/ надо привернуть :(
        send_action($(this).text(), target, '100');
    });
    $(document).on('click', 'a.fight-button', function() {
        var act = $(this).attr('skillid');
        var target = $('.selected> h6,.selected> h5').text();
        send_action(act, target, '100');
    });

    $(document).on('click', '.userlist-col', function() {
        $('.selected').removeClass('selected');
        $(this).addClass("selected");
    });


    /*************************************************************************/
    emojify.setConfig({
        emojify_tag_type: "span.msg-content",
        img_dir: "/img/emoji"
    });
});
////////////////////////////////////////////////////////////////////////////////


function attackUser(target, addproc) {
    var data = {
        "username": myUsername,
        "messageRoom": currentRoom,
        "target": target,
        "actproc": addproc
    };
    socket.emit('attackUser', data);

}

function defUser(target, addproc) {
    var data = {
        "username": myUsername,
        "messageRoom": currentRoom,
        "target": target,
        "actproc": addproc
    };
    socket.emit('defUser', data);
}

function healUser(target, addproc) {
    var data = {
        "username": myUsername,
        "messageRoom": currentRoom,
        "target": target,
        "actproc": addproc
    };
    socket.emit('healUser', data);
}

function parseLog(data) {
    return data;
}

function appendLog(data) {
    var $log = $(".fight_log"),
        $str = $("<div></div>").text(JSON.stringify(data));
    $log.append($str);
}
// clans

function createclan(name) {
    var data = {
        "username": myUsername,
        "messageRoom": currentRoom,
        "name": name
    };
    socket.emit('createClan', data);
}

function inviteclan(name, clan) {
    var data = {
        "username": myUsername,
        "messageRoom": currentRoom,
        "name": name,
        "clanname": clan
    };
    socket.emit('inviteUser', data);
}

function shoprequest(shopid) {
    var id = shopid;
    var limit = 20;
    var page = 1;
    var data = {
        "username": myUsername,
        "magtype": id,
        "page": page,
        "limit": limit
    };
    socket.emit('Shop', data);
}
// Отправка заказа
function send_action(action, target, proc) {
    var res = ({
        action: action,
        target: target,
        proc: proc,
    });
    socket.emit('magicUse', res);
}
// Нотификация пользователя

function notify_alert(message) {
    // body...
    $("#al").show().text(message);
}