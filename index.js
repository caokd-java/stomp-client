'use strict';


var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('#connecting');

var stompClient = null;
var username = null;
var socket = null;
var sessionId = null;


function connect() {
    // username = document.querySelector('#username').innerText.trim();
    username = localStorage.getItem('username');

    //socket = new SockJS('http://localhost:1806/ws');
    socket = new SockJS('http://localhost:8067/ws', [], {
        sessionId: () => {
            sessionId = uuidv4();
            console.log('Session = ', sessionId);
            return sessionId;
        }
    });
    stompClient = Stomp.over(socket);

    stompClient.connect({}, onConnected, onError);
}

function uuidv4() {
    // 2015 version
    // return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    //     var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    //     return v.toString(16);
    // });

    // 2017 version
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}

// Connect to WebSocket Server.
connect();

function onConnected(conn) {
    // Subscribe to the Public Topic
    stompClient.subscribe('/topic/publicChatRoom', onMessageReceived);

    // stompClient.subscribe('/topic/privateMessage/'+username, onMessageReceived);
    // stompClient.subscribe('/user/'+username+'/queue/privateMessage', onMessageReceived);
    // stompClient.subscribe('/user/'+username+'/queue/privateMessage', onMessageReceived);
    stompClient.subscribe('/user/queue/privateMessage', notification);

    if (username === 'cao') {
        stompClient.subscribe('/topic/weatherStation', onMessageReceived);
    }

    if (username === 'quan') {
        stompClient.subscribe('/topic/trafficLogger', onMessageReceived);
    }

    // Tell your username to the server
    stompClient.send("/app/chat.addUser",
        {},
        JSON.stringify({sender: username, type: 'JOIN'})
    );

    connectingElement.classList.add('hidden');
}


function onError(error) {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}


function sendMessage(event) {
    var messageContent = messageInput.value.trim();
    if(messageContent && stompClient) {
        var chatMessage = {
            sender: username,
            content: messageInput.value,
            type: 'CHAT'
        };
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
    event.preventDefault();
}

function sendMessagePrivate(event) {
    var messageContent = messageInput.value.trim();
    if(messageContent && stompClient) {
        var chatMessage = {
            sender: username,
            content: messageInput.value,
            type: 'CHAT'
        };
        stompClient.send("/app/chat.sendMessage.own", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
    //event.preventDefault();
}

function sendNotification(event) {
    var messageContent = messageInput.value.trim();
    if(messageContent && stompClient) {
        var chatMessage = {
            requestId: sessionId,
            roadId: 1,
            timestamp: null,
            deviceTypeId: 1,
            deviceSubType: 2,
            deviceId: 1
        };
        stompClient.send("/app/chat.sendMessage.own", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
    //event.preventDefault();
}

function notification(payload) {
    var result = JSON.parse(payload.body);
    console.log(result);

    // push into redux
}

function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);

    var messageElement = document.createElement('li');

    if(message.type === 'JOIN') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' joined!';
    } else if (message.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' left!';
    } else if (message.type === 'CHAT') {
        messageElement.classList.add('chat-message');
        var usernameElement = document.createElement('strong');
        usernameElement.classList.add('nickname');
        var usernameText = document.createTextNode(message.sender);
        var usernameText = document.createTextNode(message.sender);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);
    } else {
        messageElement.classList.add('chat-message');
        var usernameElement = document.createElement('strong');
        usernameElement.classList.add('nickname');
        var usernameText = document.createTextNode(message.sender);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);
    }

    var textElement = document.createElement('span');
    var messageText = document.createTextNode(message.content);
    textElement.appendChild(messageText);

    messageElement.appendChild(textElement);

    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}


messageForm.addEventListener('submit', sendMessage, true);
