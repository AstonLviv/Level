import * as pc from 'playcanvas';

// create an application
const canvas = document.getElementById('application');
setTimeout(() => {
    pc.basisInitialize();    
}, 2);
const app = new pc.Application(canvas, {
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

// create a camera
// const camera = new pc.Entity();
// camera.addComponent('camera', {
//     clearColor: new pc.Color(0.3, 0.3, 0.7)
// });
// camera.setPosition(0, 0, 3);
// app.root.addChild(camera);

// create a light
// const light = new pc.Entity();
// light.addComponent('light');
// light.setEulerAngles(45, 45, 0);
// app.root.addChild(light);

// create a box
const box = new pc.Entity();
box.addComponent('model', {
    type: 'box'
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
        player.render.material = yellow;
        let speed = 0.1;

        let floor = app.root.findByName("Floor");
        floor.addComponent("rigidbody");
        floor.addComponent("collision", { type: "box"});
        var currentScale = floor.getLocalScale();
        var newHalfExtents = new pc.Vec3(currentScale.x / 2, currentScale.y / 2, currentScale.z / 2);
        floor.collision.halfExtents = newHalfExtents;        
        floor.render.material = gray;
        console.log(player);

        let camera = app.root.findByName("Camera");
        camera.translateLocal(0, 0, 10);
                
        let buttonLeft = app.root.findByName("ButtonLeft");
        initButton(buttonLeft);
        let buttonRight = app.root.findByName("ButtonRight");
        initButton(buttonRight);
        let buttonForward = app.root.findByName("ButtonForward");
        initButton(buttonForward);
        let buttonBack = app.root.findByName("ButtonBack");
        initButton(buttonBack);
        app.on('update', (dt) => {
            let forward = 0;
            let right = 0; 
            if (app.keyboard.isPressed(pc.KEY_A) || buttonLeft.pressed) 
                right -= 1;
            if (app.keyboard.isPressed(pc.KEY_D) || buttonRight.pressed) 
                right += 1;
            if (app.keyboard.isPressed(pc.KEY_W) || buttonForward.pressed) 
                forward += 1;
            if (app.keyboard.isPressed(pc.KEY_S) || buttonBack.pressed)
                forward -= 1;
            
            if (forward == 0 && right == 0) return;

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

function initButton(buttonEntity) {
    let button = buttonEntity.button;
    buttonEntity.pressed = false, 
    button.on("pressedstart", () => { buttonEntity.pressed = true; 
        console.log(button.name + " pressed");
    });
    button.on("pressedend",   () => { buttonEntity.pressed = false; 
        console.log(button.name + " pressed end");
    });
}
