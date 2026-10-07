/* Live feed demo: connects to the Socket.io server and prints every event it receives. */
(function () {
  var EVENTS = [
    'need:new', 'need:updated', 'need:verified', 'need:deleted',
    'donation:new', 'volunteer:new',
    'camp:new', 'camp:updated', 'map:update', 'alert:new'
  ];

  var statusEl = document.getElementById('status');
  var roomsEl = document.getElementById('rooms');
  var feedEl = document.getElementById('feed');
  var emptyEl = document.getElementById('empty');
  var tokenEl = document.getElementById('token');

  var socket = null;
  var joined = [];
  var denied = [];

  function setStatus(text, on) {
    statusEl.textContent = text;
    statusEl.className = on ? 'pill on' : 'pill';
  }

  function showRooms() {
    var text = 'Listening to: ' + (joined.length ? joined.join(', ') : 'nothing yet');
    if (denied.length) text += '  |  ' + denied.join(', ') + ' room locked (needs an admin token)';
    roomsEl.textContent = text;
  }

  function summarize(ev, d) {
    if (!d) return '';
    if (ev === 'alert:new') return d.title + ' - ' + d.message;
    if (ev === 'donation:new') return d.type + (d.amount ? ' - Rs ' + d.amount : '');
    if (ev === 'need:deleted') return 'id ' + d.id;
    if (ev === 'map:update') return d.type || '';
    if (d.skills && d.skills.length) return d.skills.join(', ');
    return d.title || d.name || '';
  }

  function addRow(ev, data) {
    emptyEl.style.display = 'none';
    var li = document.createElement('li');
    li.className = 'ev ' + ev.split(':')[0];

    var head = document.createElement('div');
    head.className = 'head';
    var time = document.createElement('span');
    time.className = 'time';
    time.textContent = new Date().toLocaleTimeString();
    var name = document.createElement('strong');
    name.textContent = ev;
    var sum = document.createElement('span');
    sum.className = 'sum';
    sum.textContent = summarize(ev, data);
    head.appendChild(time);
    head.appendChild(name);
    head.appendChild(sum);

    var details = document.createElement('details');
    var summary = document.createElement('summary');
    summary.textContent = 'full payload';
    var pre = document.createElement('pre');
    pre.textContent = JSON.stringify(data, null, 2);
    details.appendChild(summary);
    details.appendChild(pre);

    li.appendChild(head);
    li.appendChild(details);
    feedEl.insertBefore(li, feedEl.firstChild);
  }

  function connect() {
    if (socket) socket.disconnect();
    joined = [];
    denied = [];
    showRooms();

    var token = tokenEl.value.trim();
    socket = io(token ? { auth: { token: token } } : {});

    socket.on('connect', function () {
      setStatus('connected', true);
      ['map', 'alerts', 'admin'].forEach(function (room) { socket.emit('join', room); });
    });
    socket.on('disconnect', function () { setStatus('disconnected', false); });
    socket.on('connect_error', function () { setStatus('cannot reach server', false); });
    socket.on('joined', function (room) { joined.push(room); showRooms(); });
    socket.on('join:denied', function (info) { denied.push(info.room); showRooms(); });

    EVENTS.forEach(function (ev) {
      socket.on(ev, function (data) { addRow(ev, data); });
    });
  }

  document.getElementById('connect').addEventListener('click', connect);
  document.getElementById('clear').addEventListener('click', function () {
    feedEl.textContent = '';
    emptyEl.style.display = '';
  });

  connect();
})();
