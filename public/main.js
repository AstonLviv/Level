let socket;
let playerEntityTemplate;
let myId = '';

function initEvents() {
    const app = document.ourApp;
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
        let playerEntity = app.root.findByName(obj.id);
        if (playerEntity) {            
            playerEntity.setPosition(obj.position.x, obj.position.y, obj.position.z);
            playerEntity.setRotation(obj.rotation.x, obj.rotation.y, obj.rotation.z, obj.rotation.w);
            if (obj.hasOwnProperty('forward')) {
                playerEntity.anim.setFloat('zDirection', obj.forward);
            }
            if (obj.hasOwnProperty('rotate')) {
                playerEntity.anim.setFloat('xDirection', obj.rotate);
            }
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

function ourMain() {
    const app = document.ourApp;
    //const canvas = document.getElementById('application');
    
    // setTimeout(() => {
    //     pc.basisInitialize();
    // }, 2);

    // app = new pc.Application(canvas, {
    //     elementInput: new pc.ElementInput(canvas),
    //     mouse: new pc.Mouse(canvas),
    //     touch: !!('ontouchstart' in window) ? new pc.TouchDevice(canvas) : null,
    //     keyboard: new pc.Keyboard(window),
    //     gamepads: new pc.GamePads()
    // });

    // pc.WasmModule.setConfig('Ammo', {
    //     glueUrl: `ammo/ammo.wasm.js`,
    //     wasmUrl: `ammo/ammo.wasm.wasm`,
    //     fallbackUrl: `ammo/ammo.js`
    // });
        
    // await new Promise((resolve) => {
    //     pc.WasmModule.getInstance('Ammo', () => resolve());
    // });

    // app.setCanvasResolution(pc.RESOLUTION_AUTO);
    // app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    // app.start();

    // window.addEventListener('resize', () => app.resizeCanvas(1280, 720));

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
    
    playerEntityTemplate.enabled = false;
    let cameraEntity = playerEntityTemplate.findByName("Camera");
    cameraEntity.enabled = false;
    let speed = 0.1;

    let floor = app.root.findByName("Floor");
    floor.render.material = blue;

    // app.on('update', (dt) => {
    //     console.log('app.on(update)');
    // });           
    
    socket = io();

    initCallbacks();
}

document.ourMain = ourMain;

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
    let button = buttonEntity.button;
    buttonEntity.pressed = false,
    button.on("pressedstart", () => { 
        buttonEntity.pressed = true;        
        socket.emit("keydown", buttonEntity.name);
    });
    button.on("pressedend",   () => { 
        buttonEntity.pressed = false;
        socket.emit("keyup", buttonEntity.name);
    });
}

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