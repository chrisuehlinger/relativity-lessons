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

var timeLimit = 10,
    lightLimit = (timeLimit-1)*2,
    player = {
        position: 0,
        velocity: 0,
        color: [0,0, 255],
        size: 5
    },
    lights = lodash.fill(Array(lightLimit), 0).map(function(light, i){ 
        return {
            position: 0,
            velocity: Math.pow(-1, i),
            color: [255,0,0],
            size: 4
        };
    }),
    objects = [player].concat(lights),
    objectCount = objects.length,
    numLights = 0,
    velocity = 0,
    timerStarted = false,
    timerEnded = false,
    timeElapsed = 0;

var present;

initDiagram(objectCount);

window.onkeydown = function (e) {
    if(timerEnded) {
        return;
    }

    switch (e.keyCode) {
        case 65:
        case 37:
            player.velocity += (-1 - player.velocity)*0.05;
            break;
        case 68:
        case 39:
            player.velocity += (1-player.velocity)*0.05;
            break;
    }
    // console.log('v = ' + Math.round(player.velocity*10000)/10000 + 'c');

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
        player.position += player.velocity * timeSinceLastFrame;

        for(var i = 0; i < lights.length; i++){
            if(i < numLights) {
                lights[i].position += lights[i].velocity * timeSinceLastFrame;
            } else {
                lights[i].position = player.position;
            }
        }

        updateFrame = setTimeout(update, 50);
    }, 50);

    var lightInterval = setInterval(function(){
        numLights += 2;
    }, 1000);

    setTimeout(function(){
        console.log('ADVANCE', numLights);
        // present.set("index", 2);
        clearTimeout(updateFrame);
        clearInterval(lightInterval);
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
                emit(objects[i].position);
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
                emit(objects[i].color[0],objects[i].color[1],objects[i].color[2], 1.0);
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
                emit(objects[j].position);
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

