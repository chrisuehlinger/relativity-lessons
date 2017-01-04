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
    timerStarted = false,
    timerEnded = false,
    timeElapsed = 0;

var useRelativity = true,
    useLorentzBoost = false,
    showLightCones = true;

var player = {
        absolutePosition: [0,0],
        relativePosition: [0,0],
        mass: 100,
        thrust: 1,
        velocity: [0,0],
        color: [0,0, 255],
        size: 5,
        reference: useRelativity
    },
    others = lodash.fill(Array(10), 0).map(function(){
        var pos = [Math.random()*20 - 10, Math.random()*20 - 10];
        return {
            absolutePosition: pos,
            relativePosition: pos,
            velocity: [0,0],
            color: [100, 0, 0],
            size: 4,
            reference: false
        };
    }),
    objects = [player].concat(others),
    objectCount = objects.length;

window.onkeydown = function (e) {
    if(timerEnded) {
        return;
    }

    var velocity = Math.sqrt(player.velocity[0]*player.velocity[0] + player.velocity[1]*player.velocity[1]);
    var lorentzBoost = 1/Math.sqrt(1 - velocity * velocity);
    var relThrust = player.thrust / (lorentzBoost * player.mass);
    switch (e.keyCode) {
        case 65:
        case 37:
            player.velocity[0] -= player.thrust / (lorentzBoost * player.mass);
            break;
        case 87:
        case 38:
            player.velocity[1] += player.thrust / (lorentzBoost * player.mass);
            break;
        case 68:
        case 39:
            player.velocity[0] += player.thrust / (lorentzBoost * player.mass);
            break;
        case 83:
        case 40:
            player.velocity[1] -= player.thrust / (lorentzBoost * player.mass);
            break;
    }
    console.log('v = ', player.velocity);

    if(!timerStarted){
        timerStarted = true;

        var lastFrameTime = Date.now();
        var updateFrame = setTimeout(function update(){
            var timeSinceLastFrame = (Date.now() - lastFrameTime) / 1000;
            lastFrameTime = Date.now();

            var referenceFrame = objects.filter(function(obj) { return obj.reference; })[0] || {
                absolutePosition: [0,0],
                velocity: [0, 0]
            }
            referenceFrame.absolutePosition[0] += referenceFrame.velocity[0] * timeSinceLastFrame;
            referenceFrame.absolutePosition[1] += referenceFrame.velocity[1] * timeSinceLastFrame;

            objects.map(function(object){
                if(!object.reference) {
                    var relativeVelocityX = referenceFrame.velocity[0] - object.velocity[0],
                        relativeVelocityY = referenceFrame.velocity[1] - object.velocity[1],
                        relativeVelocity = Math.sqrt(relativeVelocityX*relativeVelocityX + relativeVelocityY*relativeVelocityY);
                    var lorentzBoost = useLorentzBoost ? Math.sqrt(1 - relativeVelocity*relativeVelocity) : 1;
                    object.absolutePosition[0] += object.velocity[0] * timeSinceLastFrame;
                    object.absolutePosition[1] += object.velocity[1] * timeSinceLastFrame;
                    object.relativePosition = [
                        (object.absolutePosition[0] - referenceFrame.absolutePosition[0]),
                        (object.absolutePosition[1] - referenceFrame.absolutePosition[1])
                    ];
                }
            });

            updateFrame = setTimeout(update, 50);
        }, 50);

        setTimeout(function(){
            console.log('ADVANCE');
            clearTimeout(updateFrame);
            timerEnded = true;
    }, timeLimit * 1000);
    }
}

initDiagram(objectCount);
function initDiagram(numItems){    
    var view = mathbox
        .set({
            focus: 3,
        })
        .cartesian({
            range: [[-10, 10], [-10, 10], [-10, 10]],
            scale: [1, 1, 1],
        });

    view
    .transform({
        position:[0,5,0],
        rotation:[Math.PI/40,0,0]
    })
    .axis({
        detail: 30,
    })
    .axis({
        axis:3,
        detail: 30,
    }).scale({
        divide: 1,
    }).ticks({
        classes: ['foo', 'bar'],
        width: 2
    })
    .grid({
        axes: [1,3],
        divideX: 20,
        divideY: 20,
        width: 1,
        opacity: 0.5,
    }).array({
        id: 'currentPosition',
        width: numItems,
        expr: function (emit, i, t) {
            emit(objects[i].relativePosition[0], 0, -objects[i].relativePosition[1]);
        },
        channels: 3,
    })
    .array({
        id:'objectColors',
        width: numItems,
        channels: 4,
        expr: function(emit, i, t){
            var color = objects[i].color;
            emit(color[0], color[1], color[2], 1.0);
        },
    })
    .point({
        points: '#currentPosition',
        // color: 0x3090FF,
        colors: '#objectColors',
        size: 10,
        zBias: 1
    })
    .axis({
        axis: 1
    }).axis({
        axis: 2
    }).axis({
        axis: 3
    })
    .transform({
        position:[0,-10,0]
    }).grid({
        axes: [1,3],
        divideX: 20,
        divideY: 30,
        width: 1,
        opacity: 0.5,
    })
    .end()
    .transform({
        position:[0,10,0]
    }).grid({
        axes: [1,3],
        divideX: 20,
        divideY: 30,
        width: 1,
        opacity: 0.5,
    })
    .end()
    .array({
        id: 'trajectory',
        width: 1,
        items: numItems,
        history: 580,
        expr: function (emit, i, t) {
            for(var j=0; j < objects.length; j++){
                emit(objects[j].relativePosition[0], -objects[j].relativePosition[1]);
            }
        },
        channels: 2,
    },{
        live: function(){
            return !timerEnded;
        }
    })
    .spread({
        unit: 'relative',
        alignHeight: 1,
        height: [0, 0, -10],
    })
    .swizzle({
        order:'xzy'
    })
    .point({
        color:0xFF0000,
    });
}

