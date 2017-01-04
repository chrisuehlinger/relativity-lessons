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

var position = [0,0],
    velocity = [0,0];

window.onkeydown = function (e) {
    if(timerEnded) {
        return;
    }

    switch (e.keyCode) {
        case 65:
        case 37:
            velocity[0] += (-1 - velocity[0])*0.1;
            break;
        case 87:
        case 38:
            velocity[1] += (1-velocity[1])*0.1;
            break;
        case 68:
        case 39:
            velocity[0] += (1-velocity[0])*0.1;
            break;
        case 83:
        case 40:
            velocity[1] += (-1 - velocity[1])*0.1;
            break;
    }
    console.log(velocity);

    if(!timerStarted){
        timerStarted = true;

        var lastFrameTime = Date.now();
        var updateFrame = setTimeout(function update(){
            var timeSinceLastFrame = (Date.now() - lastFrameTime) / 1000;
            lastFrameTime = Date.now();
            position[0] += velocity[0] * timeSinceLastFrame;
            position[1] += velocity[1] * timeSinceLastFrame;

            updateFrame = setTimeout(update, 50);
        }, 50);

        setTimeout(function(){
            console.log('ADVANCE');
            clearTimeout(updateFrame);
            timerEnded = true;
    }, timeLimit * 1000);
    }
}

init();
function init(){    
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
        width:1,
        expr: function (emit, i, t) {
            emit(position[0], 0, -position[1]);
        },
        channels: 3,
    })
    .point({
        points: '#currentPosition',
        color: 0x3090FF,
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
        items: 1,
        history: 580,
        expr: function (emit, i, t) {
            emit(position[0],-position[1])
        },
        channels: 2,
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

