lodash = _;
_.noConflict();

mathbox = mathBox({
    plugins: ['core', 'controls', 'cursor'],
    controls: {
        klass: THREE.OrbitControls
    },
});
three = mathbox.three;
three.camera.position.set(0, 0, 3);
three.renderer.setClearColor(new THREE.Color(0xffffff), 1.0);

var timeLimit = 100,
    player = {
        absolutePosition: 0,
        relativePosition: 0,
        mass: 100,
        thrust: 0.5,
        velocity: 0,
        color: [0,0, 255],
        size: 5
    },
    others = lodash.fill(Array(10), 0).map(function(){
        var pos = Math.random()*20 - 10;
        return {
            absolutePosition: pos,
            relativePosition: pos,
            velocity: 0,
            color: [100, 0, 0],
            size: 4
        };
    }),
    objects = [player].concat(others),
    objectCount = objects.length,
    velocity = 0,
    timerStarted = false,
    timerEnded = false,
    timeElapsed = 0;

console.log(objects)

var present;

initDiagram(objectCount);

window.onkeydown = function (e) {
    if(timerEnded) {
        return;
    }

    var lorentzBoost = 1/Math.sqrt(1 - player.velocity * player.velocity);
    var relThrust = player.thrust / (lorentzBoost * player.mass);
    switch (e.keyCode) {
        case 65:
        case 37:
            player.velocity -= player.thrust / (lorentzBoost * player.mass);
            break;
        case 68:
        case 39:
            player.velocity += player.thrust / (lorentzBoost * player.mass);
            break;
    }
    console.log('v = ' + Math.round(player.velocity*10000)/10000 + 'c');

    if(!timerStarted){
        timerStarted = true;
        initSimulation();
    }
}

function initSimulation(){
    var lastFrameTime = Date.now();
    var updateFrame = setTimeout(function update(){
        var timeSinceLastFrame = (Date.now() - lastFrameTime) / 1000;
        lastFrameTime = Date.now();
        player.absolutePosition += player.velocity * timeSinceLastFrame;

        others.map(function(object){
            var relativeVelocity = player.velocity - object.velocity;
            var lorentzBoost = Math.sqrt(1 - relativeVelocity*relativeVelocity);
            object.relativePosition = lorentzBoost * (object.absolutePosition - player.absolutePosition);
        });

        updateFrame = setTimeout(update, 50);
    }, 50);

    setTimeout(function(){
        console.log('ADVANCE');
        // present.set("index", 2);
        clearTimeout(updateFrame);
        timerEnded = true;
    }, timeLimit * 1000);
}

function initDiagram(numItems){    
    var view = mathbox
        .set({
            focus: 3,
        })
        .cartesian({
            range: [[-10, 10], [0, 10], [-10, 10]],
            scale: [2, 1, 2],
        });

    // present = view.present({
    //     index: 1
    // });
    // present.slide().reveal()
    view
    .transform()
    // .step({
    //     script: [
    //         {position:[0,5,0]},
    //         {position:[0,0,0]},
    //     ]
    // })
    .axis({
        detail: 1,
    })
    .scale({
        divide: 1,
    })
    .ticks({
        classes: ['foo', 'bar'],
        width: 2
    })
    .grid({
        divideX: 20,
        divideY: 10,
        width: 1,
        opacity: 0.5,
        zBias: -5,
    })
    // .step({
    //     script:[
    //         { rangeY: [0,0] },
    //         { rangeY: [0,10]}
    //     ]
    // })
    .array({
        id: 'currentPosition',
        width: numItems,
        expr: function(emit, i, t){
            if(i < objects.length) {
                emit(objects[i].relativePosition);
            }
        },
        channels: 1
    })
    .array({
        id:'objectColors',
        width: numItems,
        channels: 4,
        expr: function(emit, i, t){
            if(i < objects.length) {
                var color = objects[i].color;
                emit(color[0], color[1], color[2], 1.0);
            }
        },
    })
    .array({
        id:'objectSizes',
        width: numItems,
        channels: 1,
        expr: function(emit, i, t){
            if(i < objects.length) {
                emit(objects[i].size);
            }
        },
    })
    .point({
        points: '#currentPosition',
        // color: 0x3090FF,
        colors:'#objectColors',
        // size: 10
        sizes: "#objectSizes"
    })
    // .step({
    //     script:[
    //         { opacity: 1},
    //         { opacity: 0}
    //     ]
    // })
    .end()//.end()
    // .slide().reveal({
    //     duration: 1
    // })
    .axis({
        axis: 2
    }).array({
        id: 'trajectory',
        width: 1,
        items: numItems,
        history: 580,
        expr: function (emit, i, t) {
            for(var j=0; j < objects.length; j++){
                emit(objects[j].relativePosition);
            }
        },
        channels: 1,
    },{
        live: function(){
            return !timerEnded;
        }
    })
    .spread({
        unit: 'relative',
        alignHeight: -1,
        height: [0, -10, 0],
    })
    .transpose({
        order: 'yx'
    })
    .line({
        // color: 0x3090FF,
        colors:"#objectColors",
        width: 5,
        end:false
    });

}

