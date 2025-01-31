//import * as express from 'express';
import express from 'express';
import * as http from 'http';
import { Server } from "socket.io";
import * as pc from "playcanvas";
import { JSDOM } from 'jsdom';
import { setTimeout } from 'timers';
//import Ammo from "https://cdn.jsdelivr.net/npm/ammo@3.0.3/lib/index.min.js";
import Ammo from '../public/ammo/ammo.js';

global.Ammo = Ammo();

const express_app = express();
express_app.use(express.static('public'));
const server = http.createServer(express_app);
let io = new Server(server);

const PORT = 5500;

const mobSearchMaxDistance = 99;
const mobFov = 0.8;
let speed = 0.05;
let mobSpeed = 0.025;
let rotationSpeed = 1;

let appInstance = server.listen(PORT, () => {
    //console.log(`https://${ip.address()}:${PORT}`);
    console.log(`running at http://127.0.0.1:${PORT}`);  
});

let players = [];
let mobs = [];
let playerTemplate;
let mobTemplate;

function initServer() {
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
        app.root.addChild(newPlayerEntity);
        console.log('A user connected ' + socket.data.id);
      
        socket.emit('id', newPlayerEntity.name);
        //TODO: all existing players positions
        players.forEach( (player) => {
          socket.emit('newPlayer', player.entity.name);
          console.log('emit newPlayer to ' + newPlayerEntity.name);
        });
        io.emit('newPlayer', newPlayerEntity.name);
        console.log('emit newPlayer to all');
        addNewPlayer({
          "id": socket.data.id,
          "keys": new Set(),
          "entity": newPlayerEntity,
          "selectAction": selectPlayerAction
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
            console.log('A user disconnected' + socket.data.id);
            removePlayer(socket.data.id);
            io.emit('deletePlayer', socket.data.id);
        });
    });
}

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

function removePlayer(id) {
    players = players.filter(item => item.id != id);
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
        url: `http://127.0.0.1:${PORT}` // Set the URL of the document                
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
    glueUrl: `http://127.0.0.1:${PORT}/ammo/ammo.js`,
    wasmUrl: `http://127.0.0.1:${PORT}/ammo/ammo.js`,
    fallbackUrl: `http://127.0.0.1:${PORT}/ammo/ammo.js`
    //numWorkers: 1
});

await new Promise((resolve) => {
    try {
        pc.WasmModule.getInstance('Ammo', () => {        
            resolve();            
        });

    } catch (e) {
        console.log(e);
    }
});

loadScene(() => {
    initServer();
});

function loadScene(callback) {
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

    //app.configure("public/config.json", (err) => {
    app.configure("config.json", (err) => {
        if (err) {
            console.error(err);
            return;
        }
        
        //app.scenes.loadScene("public/2150422.json", (err) => {
        app.scenes.loadScene("2150422.json", (err) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log('scene loaded');
            
            const box2 = new pc.Entity();
            box2.name = 'box2';
            box2.addComponent('model', {
                type: 'box'
            });
            box2.translate(2, 4, 0);

            box2.addComponent("rigidbody", { 
                type: pc.BODYTYPE_DYNAMIC,
                mass: 10
            });
            box2.addComponent("collision", { type: "box"});
            app.root.addChild(box2);
            app.root.addChild(box3);
            
            playerTemplate = app.root.findByName("Player");
            playerTemplate.enabled = false;

            const mobId = 'Parasite';
            mobTemplate = app.root.findByName(mobId);
            mobs.push( {
                "id": mobId,                
                "entity": mobTemplate,
                "selectAction": selectMobAction
            });

            app.on('update', (dt) => {            
                if (players.length == 0) return;
                players.forEach( (playerObject) => {

                    const action = playerObject.selectAction(playerObject);
                    if (action.forward != 0 || action.right != 0) {
                        playerObject.entity.translateLocal(0, 0, action.forward * speed);
                        playerObject.entity.rotateLocal(0, -action.right * rotationSpeed, 0);
                        playerObject.entity.rigidbody.syncEntityToBody();
                    }
                    moveObject(playerObject, action);
                });

                mobs.forEach( (mobObject) => {

                    const action = mobObject.selectAction(mobObject);
                    if (action.forward != 0 || action.right != 0) {
                        mobObject.entity.translateLocal(0, 0, action.forward * mobSpeed);
                        mobObject.entity.rotateLocal(0, -action.right * rotationSpeed, 0);
                        mobObject.entity.rigidbody.syncEntityToBody();
                    }
                    moveObject(mobObject, action);
                });

                const boxObject = { entity: box2, id: box2.name };
                moveObject(boxObject, { forward:undefined, right: undefined});
            });

            callback();
        });    
    });
}


function moveObject(objectToMove, action) {
    const entity = objectToMove.entity;
    const quat = entity.getRotation();
    io.emit('move', {
        position: entity.getPosition(),
        rotation: { x: quat.x, y: quat.y, z: quat.z, w: quat.w },
        id: objectToMove.id,
        forward: action.forward,
        rotate: action.right
    });
}

function spawnMob() {
    console.log('todo');
}

function selectPlayerAction(playerObject) {
    let forward = 0;
    let right = 0;

    if (playerObject.keys.has('ButtonLeft'))
        right -= 1;
    if (playerObject.keys.has('ButtonRight'))
        right += 1;
    if (playerObject.keys.has('ButtonForward'))
        forward += 1;
    if (playerObject.keys.has('ButtonBack'))
        forward -= 1;

    return { forward, right };
}

function selectMobAction(mobObject) {
    let forward = 0;
    let right = 0;

    const closestPlayer = selectClosestPlayer(players, mobObject.entity.getPosition());

    if (closestPlayer) {
        const forwardDirection = mobObject.entity.forward.mulScalar(-1);
        const playerDir = closestPlayer.entity.getPosition().sub( mobObject.entity.getPosition() );
        playerDir.normalize();
        const cosAngle = forwardDirection.dot(playerDir);
        if (cosAngle < mobFov) {
            //TODO: select proper direction 1/-1
            right = 1;
        } else {
            forward = 1;
        }
    }

    return { forward, right };
}

function selectClosestPlayer(allPLayers, position) {
    let closestPlayer;
    let minDistance = mobSearchMaxDistance;

    allPLayers.forEach( (playerObject) => {
        let currentDistance = position.distance(playerObject.entity.getPosition());
        if (currentDistance < minDistance) {
            minDistance = currentDistance;
            closestPlayer = playerObject;
        }
    });

    return closestPlayer;
}
