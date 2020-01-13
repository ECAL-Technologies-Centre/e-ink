let SOCKET, RESOLVECONNECTION, CONNECTED;

const DOM = {};

const ACTIONS = {
    clientConnected(clientInfo) {
        addClient(clientInfo);
    },

    removeClient(id) {
        let clientNode = document.getElementById(btoa(id));
        clientNode.parentNode.removeChild(clientNode);
    },

    clientSending(id) {
        let clientNode = document.getElementById(btoa(id));
        clientNode.classList.remove('loading');
    },

    clientsOnline(list) {
        console.log(list);
        for (const clientInfos of list) {
            addClient(clientInfos);
        }
    },

    highLightClient(id) {
        highLightClient(btoa(id));
    }
}

function addClient(clientInfos) {
    const clone = DOM.model.cloneNode(true);
    clone.textContent = clientInfos.id;
    clone.id = btoa(clientInfos.id);
    DOM.grid.appendChild(clone);

    if (clientInfos.selected)
        clientLoaded(clone);
}

async function message(action, options) {
    if (CONNECTED === false)
        return;

    await CONNECTED;

    SOCKET.send(JSON.stringify({
        type: action,
        data: options
    }));
}

function hideMessage() {
    console.log('CONNECTED');
    DOM.offline.classList.add('hide');
}

function showMessage(msg) {
    let inner = msg || "Make sure it's running and that you have only one <i>Sketch Selector</i> open.";
    DOM.offline.classList.remove('hide');
    DOM.offline.querySelector('.msg').innerHTML = inner;
}

function selectClient(clientNode) {

    if (!clientNode.classList.contains('client'))
        return;

    highLightClient(clientNode.id);

    let id = atob(clientNode.id);

    message('selectClient', id);
}

function highLightClient(id) {
    let clientNode = document.getElementById(id);
    DOM.grid.querySelectorAll('.client.selected').forEach(c => c.classList.remove('selected'));
    clientNode.classList.add('selected');
    clientNode.classList.add('loading');
}

function clientLoaded(clientNode) {
    clientNode.classList.add('selected');
    clientNode.classList.remove('loading');
}

function init() {
    constructHTML();
    setSocket();
}

function setSocket() {
    SOCKET = new WebSocket(`ws://${window.location.host}/server/?admin`);
    CONNECTED = new Promise(resolve => RESOLVECONNECTION = resolve);

    window.addEventListener('beforeunload', function (e) {
        SOCKET.close();
        return;
    });

    SOCKET.onclose = e => {
        showMessage();
    }

    SOCKET.onerror = e => {
        showMessage();
    }

    SOCKET.onmessage = e => {
        let msg = JSON.parse(e.data);
        ACTIONS[msg.type](msg.data);
    }

    SOCKET.onopen = e => {
        hideMessage();
        RESOLVECONNECTION();
    }
}

function constructHTML() {
    DOM.model = document.createElement('button');
    DOM.grid = document.querySelector('.users');
    DOM.offline = document.querySelector('.offline');

    DOM.model.classList.add('client');
    DOM.grid.addEventListener('click', e => selectClient(e.target));
}

window.addEventListener('load', function() {
    init();
});