'use strict';


var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('#connecting');

var stompClient = null;
var username = null;
var socket = null;


function connect() {
    // username = document.querySelector('#username').innerText.trim();
    username = localStorage.getItem('username');

    //socket = new SockJS('http://localhost:1806/ws');
    socket = new SockJS('http://localhost:1806/ws', [], {
        sessionId: (session) => {
            console.log('Session = ', session);
            return username;
        }
    });
    stompClient = Stomp.over(socket);

    stompClient.connect({}, onConnected, onError);
}

// Connect to WebSocket Server.
connect();

function onConnected(conn) {

    console.log(stompClient);
    console.log(conn.sessionId);
    console.log(socket.sessionId);

    // Subscribe to the Public Topic
    stompClient.subscribe('/topic/publicChatRoom', onMessageReceived);

    // stompClient.subscribe('/topic/privateMessage/'+username, onMessageReceived);
    // stompClient.subscribe('/user/'+username+'/queue/privateMessage', onMessageReceived);
    // stompClient.subscribe('/user/'+username+'/queue/privateMessage', onMessageReceived);
    stompClient.subscribe('/user/queue/privateMessage', onMessageReceived);

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
