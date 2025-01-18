//import * as express from 'express';
import express from 'express';
import * as http from 'http';
import { Server } from "socket.io";
import * as pc from "playcanvas";
import { JSDOM } from 'jsdom';
//import Ammo from "https://cdn.jsdelivr.net/npm/ammo@3.0.3/lib/index.min.js";
import Ammo from '../ammo/ammo.js';

global.Ammo = Ammo();

import { setTimeout } from 'timers';

const express_app = express();
const server = http.createServer(express_app);
const io = new Server(server);

const PORT = 3000;

express_app.use(express.static('public'));

let appInstance = server.listen(PORT, () => {
  //console.log(`https://${ip.address()}:${PORT}`);
  console.log(`running at http://127.0.0.1:${PORT}`);  
});

io.on('connection', (socket) => {
  let hs = socket.handshake;
  
  if (hs.query.t) {
    socket.data.id = hs.address + " " + hs.query.t;
  } else {
    console.log(hs);
    socket.data.id = 'unknown'
  }

  let newPlayerEntity = playerTemplate.clone();
  newPlayerEntity.enabled = true;
  newPlayerEntity.name = socket.data.id;
  console.log('A user connected ' + socket.data.id);

  socket.emit('id', newPlayerEntity.name);
  //TODO: all existing players positions
  players.forEach( (player) => {
    socket.emit('newPlayer', player.entity.name);
  });
  io.emit('newPlayer', newPlayerEntity.name);
  addNewPlayer({
    "id": socket.data.id,
    "keys": new Set(),
    "entity": newPlayerEntity
  });

  socket.on('keydown', (message) => {
    const player = getPlayer(socket.data.id);
    player.keys.add(message);    
  });

  socket.on('keyup', (message) => {
    const player = getPlayer(socket.data.id);    
    player.keys.delete(message);    
  });

  socket.on('disconnect', () => {
    //TODO: remove player
    console.log('A user disconnected');
    setPlayerStatus(socket.data.id, "offline")
    console.log(players)
  });
});

const players = [];
let playerTemplate;

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
    let player = null;
    players.forEach(element => {
        if(id == element.id) {
            player = element;
        }
    });
    return player;
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

//////////////////////////////////////////////////////////////////////////
//JSDOM
//////////////////////////////////////////////////////////////////////////
let jsdom;

export function jsdomSetup() {
    const html = '<!DOCTYPE html><html><head></head><body></body></html>';

    jsdom = new JSDOM(html, {
        resources: 'usable',         // Allow the engine to load assets
        runScripts: 'dangerously',   // Allow the engine to run scripts
        url: 'http://127.0.0.1:3000' // Set the URL of the document                
    });

    // Copy the window and document to global scope
    global.window = jsdom.window;
    global.document = jsdom.window.document;

    // Copy the DOM APIs used by the engine to global scope
    global.ArrayBuffer = jsdom.window.ArrayBuffer;
    global.Audio = jsdom.window.Audio;
    global.DataView = jsdom.window.DataView;
    global.Image = jsdom.window.Image;
    global.KeyboardEvent = jsdom.window.KeyboardEvent;
    global.MouseEvent = jsdom.window.MouseEvent;
    global.XMLHttpRequest = jsdom.window.XMLHttpRequest;

    // Copy the PlayCanvas API to global scope (only required for 'classic' scripts)
    jsdom.window.pc = pc;
}

jsdomSetup();
//////////////////////////////////////////////////////////////////////////
//PLAYCANVAS
//////////////////////////////////////////////////////////////////////////
const canvas = document.createElement('canvas');
const graphicsDevice = new pc.NullGraphicsDevice(canvas);
const app = new pc.Application(canvas, { graphicsDevice });

pc.WasmModule.setConfig('Ammo', {
    // glueUrl: 'ammo/ammo.wasm.js',
    // wasmUrl: 'ammo/ammo.wasm.wasm',
    // fallbackUrl: 'ammo/ammo.js'
    glueUrl: 'http://127.0.0.1:3000/ammo/ammo.js',
    wasmUrl: 'http://127.0.0.1:3000/ammo/ammo.js',
    fallbackUrl: 'http://127.0.0.1:3000/ammo/ammo.js'
    //numWorkers: 1
});

await new Promise((resolve) => {
    try {
        pc.WasmModule.getInstance('Ammo', () => {        
            console.log('Ammo1 = ' + typeof Ammo);
            resolve();
            console.log('Ammo2 = ' + typeof Ammo);
        });

        // app.setCanvasResolution(pc.RESOLUTION_AUTO);
        // app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    } catch (e) {
        console.log(e);
    }
});

// create a box
const box = new pc.Entity();
box.addComponent('model', {
    type: 'box'
});
box.translate(5, 10, 0);
app.root.addChild(box);
// app.on('update', (dt) => {
//   box.rotate(10 * dt, 20 * dt, 30 * dt);  
// });

app.start();

ourUpdate();
function ourUpdate() {
    setTimeout(() => {
        app.tick(Date.now());
        ourUpdate();        
    }, 10);
}

const box3 = new pc.Entity();
box3.addComponent('model', {
    type: 'box'
});
box3.translate(3, 500, 0);

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
        console.log('scene loaded');
        
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
        app.root.addChild(box2);
        app.root.addChild(box3);
        
        playerTemplate = app.root.findByName("Player");
        playerTemplate.addComponent("collision", { type: "box"});
        playerTemplate.addComponent("rigidbody", { 
            type: pc.BODYTYPE_DYNAMIC,            
            mass: 80
        });
        playerTemplate.enabled = false;        
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
            players.forEach( (playerObject) => {
                if (playerObject.keys.has('ButtonLeft'))
                    right -= 1;
                if (playerObject.keys.has('ButtonRight'))
                    right += 1;
                if (playerObject.keys.has('ButtonForward'))
                    forward += 1;
                if (playerObject.keys.has('ButtonBack'))
                    forward -= 1;
                
                //if (forward == 0 && right == 0) return;            
                //player.translateLocal(right*speed, 0, -forward*speed);
                //player.setPosition(playerPos.x + forward*speed, playerPos.y, playerPos.z + right*speed);
                //console.log(player.getPosition());

                if (forward != 0 || right != 0) {
                    let pos = playerObject.entity.getPosition();
                    pos.x += right*speed;
                    pos.z += -forward*speed;

                    playerObject.entity.rigidbody.teleport(pos);             
                }
                io.emit('move', {
                    position: playerObject.entity.getPosition(),
                    id: playerObject.id
                });
            });
        });
    });  
});