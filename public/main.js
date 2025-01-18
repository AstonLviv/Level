import * as pc from "https://cdn.skypack.dev/playcanvas@v1.68.0";
let socket;
let app;
let playerEntityTemplate;
let myId = '';

function initEvents() {
    document.addEventListener("keydown", (e) => {        
        if (e.key == 'w')       socket.emit("keydown", "ButtonForward");            
        else if (e.key == 'a')  socket.emit("keydown", "ButtonLeft");
        else if (e.key == 's')  socket.emit("keydown", "ButtonBack");
        else if (e.key == 'd')  socket.emit("keydown", "ButtonRight");
    });

    document.addEventListener("keyup", (e) => {
        if (e.key == 'w')       socket.emit("keyup", "ButtonForward");
        else if (e.key == 'a')  socket.emit("keyup", "ButtonLeft");
        else if (e.key == 's')  socket.emit("keyup", "ButtonBack");
        else if (e.key == 'd')  socket.emit("keyup", "ButtonRight");
    });

    socket.on('move', (obj) => {
        //console.log("on move for " + obj.id);
        let playerEntity = app.root.findByName(obj.id);
        if (playerEntity) {
            playerEntity.setPosition(obj.position.x, obj.position.y, obj.position.z);        
        } else {
            console.log("didn't find entity with name = " + obj.id);
        }        
    });

    socket.on('id', (id) => {
        console.log("on id for " + id);
        myId = id;        
    });

    socket.on('newPlayer', (id) => {
        console.log('on newPlayer for ' + id);
        let newEntity = playerEntityTemplate.clone();
        newEntity.enabled = true;
        newEntity.name = id;
        if (id == myId) {
            let cameraEntity = newEntity.findByName("Camera");
            cameraEntity.enabled = true;

            initButtons(newEntity);
        }        
        app.root.addChild(newEntity);
    });

    socket.on('deletePlayer', (id) => {
        console.log('on deletePlayer for ' + id);
        let playerEntity = app.root.findByName(id);
        playerEntity.destroy();        
    });    
}

document.addEventListener('DOMContentLoaded', () => {
    main(() => {
        socket = io();

        initCallbacks();
    });
});


async function main(callback) {
    const canvas = document.getElementById('application');    

    app = new pc.Application(canvas, {
        elementInput: new pc.ElementInput(canvas),
        mouse: new pc.Mouse(canvas),
        touch: !!('ontouchstart' in window) ? new pc.TouchDevice(canvas) : null,
        keyboard: new pc.Keyboard(window),
        gamepads: new pc.GamePads()
    });

    pc.WasmModule.setConfig('Ammo', {
        glueUrl: `ammo/ammo.wasm.js`,
        wasmUrl: `ammo/ammo.wasm.wasm`,
        fallbackUrl: `ammo/ammo.js`
    });
        
    await new Promise((resolve) => {
        pc.WasmModule.getInstance('Ammo', () => resolve());
    });
    
    app.setCanvasResolution(pc.RESOLUTION_AUTO);
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    app.start();

    window.addEventListener('resize', () => app.resizeCanvas(1280, 720));

    // create a box
    const box = new pc.Entity();
    box.addComponent('model', {
        type: 'box'
    });
    app.on('update', (dt) => {
        box.rotate(10 * dt, 20 * dt, 30 * dt);        
    });
    box.translate(5, 1, 0);
    const blue = createMaterial(pc.Color.BLUE);
    box.model.material = blue;
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
            box2.name = 'box2';
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
            
            playerEntityTemplate = app.root.findByName("Player");
            playerEntityTemplate.addComponent("rigidbody", { 
                type: pc.BODYTYPE_DYNAMIC,            
                mass: 80
            });
            playerEntityTemplate.addComponent("collision", { type: "box"});
            //playerEntityTemplate.render.material = yellow;
            playerEntityTemplate.enabled = false;
            let cameraEntity = playerEntityTemplate.findByName("Camera");
            cameraEntity.enabled = false;
            let speed = 0.1;

            let floor = app.root.findByName("Floor");
            floor.addComponent("rigidbody");
            floor.addComponent("collision", { type: "box"});
            var currentScale = floor.getLocalScale();
            var newHalfExtents = new pc.Vec3(currentScale.x / 2, currentScale.y / 2, currentScale.z / 2);
            floor.collision.halfExtents = newHalfExtents;        
            floor.render.material = gray;            

            let camera = app.root.findByName("Camera");
            camera.translateLocal(0, 0, 10);

            // app.on('update', (dt) => {
            //     console.log('app.on(update)');
            // });
            
            callback();            
        });
    });

    function createMaterial(color) {
        const material = new pc.StandardMaterial();
        material.diffuse = color;
        // we need to call material.update when we change its properties
        material.update();
        return material;
    }

    // create a few materials for our objects
    const red = createMaterial(new pc.Color(1, 0.3, 0.3));
    const gray = createMaterial(new pc.Color(0.7, 0.7, 0.7));
    const yellow = createMaterial(pc.Color.YELLOW);
}

function initCallbacks() {
    initEvents();
}

function initButtons(playerEntity) {
    let buttonLeft = playerEntity.findByName("ButtonLeft");
    initButton(buttonLeft);
    let buttonRight = playerEntity.findByName("ButtonRight");
    initButton(buttonRight);
    let buttonForward = playerEntity.findByName("ButtonForward");
    initButton(buttonForward);
    let buttonBack = playerEntity.findByName("ButtonBack");
    initButton(buttonBack);
}

function initButton(buttonEntity) {
    console.log('initButton for ' + buttonEntity);
    let button = buttonEntity.button;
    buttonEntity.pressed = false,
    button.on("pressedstart", () => { 
        buttonEntity.pressed = true;
        console.log('pressedstart ' + buttonEntity.button);
        socket.emit("keydown", buttonEntity.name);
    });
    button.on("pressedend",   () => { 
        buttonEntity.pressed = false;
        socket.emit("keyup", buttonEntity.name);
    });
}  