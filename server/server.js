const pc = require('playcanvas');
const express = require('express');
//import * as pc from "playcanvas";
const http = require('http');
const socketIo = require('socket.io');
//import * as pc from "playcanvas";
let ip = require('ip'); // to determine server ip

const express_app = express();
const server = http.createServer(express_app);
const io = socketIo(server);

const PORT = 3000;

// Serve static files from the 'public' directory
express_app.use(express.static('public'));

let appInstance = server.listen(PORT, () => {
  console.log(`https://${ip.address()}:${PORT}`);
});

io.on('connection', (socket) => {
  let hs = socket.handshake;
  if (hs.query.t) {
    socket.data.id = hs.address + " " + hs.query.t;
  } else {
    console.log(hs);
    socket.data.id = 'unknown'
  }
  console.log('A user connected ' + socket.data.id);
  addNewPlayer({
    "id": socket.data.id,
    "keys": new Set()
  });

  //console.log(players)
  //sendPlayers()

  //console.log(hs);

  socket.on('keydown', (message) => {
    console.log('***')
    //console.log(playerName(socket.data.id));
    const msg = `${playerName(socket.data.id)} : keydown - ${message}`
    console.log(msg);
    const player = getPlayer(socket.data.id);
    player.keys.add(message);
    // Broadcast the message to all connected clients
    //io.emit('chatMessage', msg);
  });

  socket.on('keyup', (message) => {
    console.log('***')
    //console.log(playerName(socket.data.id));
    const msg = `${playerName(socket.data.id)} : keyup - ${message}`
    console.log(msg);
    const player = getPlayer(socket.data.id);
    player.keys.delete(message);
    // Broadcast the message to all connected clients
    //io.emit('chatMessage', msg);
  });

  // socket.on('chatMessage', (message) => {
  //   console.log('***')
  //   console.log(playerName(socket.data.id));
  //   const msg = `${playerName(socket.data.id)} : ${message}`
  //   console.log(msg);
  //   // Broadcast the message to all connected clients
  //   io.emit('chatMessage', msg);
  // });

  // socket.on('usernameMessage', (username) => {
  //   setUsername(socket.data.id, username)
  //   const msg = `${socket.data.id} : ${username}`
  //   console.log(msg);
  //   // Broadcast the message to all connected clients
  //   io.emit("chatMessage", `player: ${socket.data.id} gonna be known as: ${username}`);
  // });

  // socket.on("createRoom", () => {
  //   console.log("a room has been created")
  //   const room = {
  //     "id":roomId++,
  //     "owner":socket.data.id,  
  //     "players":[]
  //   }
  //   rooms.push(room)
  //   sendRooms()
  // })

  socket.on('disconnect', () => {
    console.log('A user disconnected');
    setPlayerStatus(socket.data.id, "offline")
    console.log(players)
    //sendPlayers()
  });
});

// wss.on('connection', (ws) => {
//   ws.on('message', (message) => {
//       // Broadcast the message to all connected clients
//       wss.clients.forEach((client) => {
//           if (client !== ws && client.readyState === WebSocket.OPEN) {
//               client.send(message);
//           }
//       });
//   });
  
//   ws.send('Welcome to the chat!');
// });

//Lobby
const players = []
//const rooms = []
//let roomId = 1

function addNewPlayer(player) { 
    if (!checkPlayerExist(player)){
        players.push(player)
    }
}

function checkPlayerExist(player) {
    players.forEach(element => {
        if (player.id == element.id) {
            return true
        }
    }) 
    return false
}

function setPlayerStatus(id, status) {
    players.forEach(element => {
        if(id == element.id) {
          element.status = status
        }
    })
}

function getPlayer(id) {
    players.forEach(element => {
        if(id == element.id) {
            return element;
        }
    });
    return null;
}

function setUsername(id, username) {
    players.forEach(element => {
        if(id == element.id) {
          element.username = username
        }
    })
    sendPlayers()
}

function playerName(id) {
    let name = id
    players.forEach(element => {
        if(id == element.id) {
            let exists = Object.keys(element).includes("username");
            if (exists) {        
              name = element.username        
            }
            return
        }
    });
    return name
}

function sendPlayers() {
  io.emit("Players", JSON.stringify(players));
}

function sendRooms() {
  io.emit("Rooms", JSON.stringify(rooms));
}

//////////////////////////////////////////////////////////////////////////
//PLAYCANVAS
//////////////////////////////////////////////////////////////////////////
const canvas = document.getElementById('application');
const app = new pc.Application(canvas, {});

pc.WasmModule.setConfig('Ammo', {
    glueUrl: `ammo/ammo.wasm.js`,
    wasmUrl: `ammo/ammo.wasm.wasm`,
    fallbackUrl: `ammo/ammo.js`
});
await new Promise((resolve) => {
    pc.WasmModule.getInstance('Ammo', () => resolve());
});

app.start();

// create a box
const box = new pc.Entity();
box.addComponent('model', {
    type: 'box'
});
box.translate(5, 1, 0);
app.root.addChild(box);

const box3 = new pc.Entity();
box3.addComponent('model', {
    type: 'box'
});
box3.translate(3, 0, 0);

box3.addComponent("rigidbody", {
    type: pc.BODYTYPE_DYNAMIC,
    mass: 10
});
box3.addComponent("collision", {
    type: "box"
});

app.configure("config.json", (err) => {
    if (err) {
        console.error(err);
        return;
    }
    
    app.scenes.loadScene("2150422.json", (err) => {
        if (err) {
            console.error(err);
            return;
        }
        
        const box2 = new pc.Entity();
        box2.addComponent('model', {
            type: 'box'
        });
        box2.translate(0, 4, 0);

        box2.addComponent("rigidbody", { 
            type: pc.BODYTYPE_DYNAMIC,
            mass: 10
        });
        box2.addComponent("collision", { type: "box"});
        box2.model.material = red;
        box3.model.material = yellow;
        app.root.addChild(box2);
        app.root.addChild(box3);
        
        let player = app.root.findByName("Player");
        player.addComponent("rigidbody", { 
            type: pc.BODYTYPE_DYNAMIC,            
            mass: 80
        });
        player.addComponent("collision", { type: "box"});        
        let speed = 0.1;

        let floor = app.root.findByName("Floor");
        floor.addComponent("rigidbody");
        floor.addComponent("collision", { type: "box"});
        var currentScale = floor.getLocalScale();
        var newHalfExtents = new pc.Vec3(currentScale.x / 2, currentScale.y / 2, currentScale.z / 2);
        floor.collision.halfExtents = newHalfExtents;        
        
        app.on('update', (dt) => {
            let forward = 0;
            let right = 0;
            if (players.length == 0) return;
            
            const playerObject = players[0];
            if (playerObject.keys.has('ButtonLeft'))
                right -= 1;
            if (playerObject.keys.has('ButtonRight')) 
                right += 1;
            if (playerObject.keys.has('ButtonForward')) 
                forward += 1;
            if (playerObject.keys.has('ButtonBack'))
                forward -= 1;
            
            if (forward == 0 && right == 0) return;
            console.log('*****');
            //player.translateLocal(right*speed, 0, -forward*speed);
            //player.setPosition(playerPos.x + forward*speed, playerPos.y, playerPos.z + right*speed);
            //console.log(player.getPosition());

            let pos = player.getPosition();
            pos.x += right*speed;
            pos.z += -forward*speed;

            player.rigidbody.teleport(pos);
        });
    });
});
