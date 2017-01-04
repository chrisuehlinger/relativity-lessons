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

var position = [0,0],
    velocity = [0,0],
    positions = [[0,0]],
    timerStarted = false,
    timerEnded = false,
    timeElapsed = 0;

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
            var timeSinceLastFrame = Date.now() - lastFrameTime;
            lastFrameTime = Date.now();
            position[0] += velocity[0] / (1000/timeSinceLastFrame);
            position[1] += velocity[1] / (1000/timeSinceLastFrame);
            positions.push([position[0], position[1]]);
            if(positions.length > 200) {
                positions = positions.slice(1);
            }

            updateFrame = setTimeout(update, 50);
        }, 50);

        setTimeout(function(){
            console.log('ADVANCE', positions);
            // present.set("index", 2);
            clearTimeout(updateFrame);
            timerEnded = true;
        }, 10000);
    }
}

var present;

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

    // present = view.present({
    //     index: 1
    // });
    // present.slide().reveal()
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
    }).point({
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
    .interval({
        id: 'trajectory',
        width: 200,
        expr: function (emit, x, i, t) {
            y = i/20;
            if(i < positions.length) {
                var thisPosition = positions[i];
                // console.log(thisPosition)
                emit(thisPosition[0], y, -thisPosition[1]);
            }
        },
        channels: 3,
    }).line({
        points: '#trajectory',
        color: 0x3090FF,
        width: 5,
    });;

}

