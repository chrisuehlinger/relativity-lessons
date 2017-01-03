mathbox = mathBox({
    plugins: ['core', 'controls', 'cursor'],
    controls: {
        klass: THREE.DeviceOrientationControls
    },
});
three = mathbox.three;
three.camera.position.set(0, 0, 3);
three.renderer.setClearColor(new THREE.Color(0xffffff), 1.0);

var position = 0,
    velocity = 0,
    positions = [0],
    timerStarted = false,
    timerEnded = false,
    timeElapsed = 0;

window.onkeydown = function (e) {
    if(timerEnded) {
        return;
    }

    switch (e.keyCode) {
        case 37:
        case 38:
            velocity += (-1 - velocity)*0.1;
            break;
        case 39:
        case 40:
            velocity += (1-velocity)*0.1;
            break;
    }
    console.log(velocity);

    if(!timerStarted){
        timerStarted = true;

        var lastFrameTime = Date.now();
        var updateFrame = setTimeout(function update(){
            var timeSinceLastFrame = Date.now() - lastFrameTime;
            lastFrameTime = Date.now();
            position += velocity / (1000/timeSinceLastFrame);
            positions.push(position);
            // if(positions.length > 200) {
            //     positions = positions.slice(1);
            // }

            updateFrame = setTimeout(update, 50);
        }, 50);

        setTimeout(function(){
            console.log('ADVANCE');
            present.set("index", 2);
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
            range: [[-10, 10], [0, 10], [-10, 10]],
            scale: [1, 1, 1],
        });

    present = view.present({
        index: 1
    });
    present.slide().reveal()
    .transform()
    .step({
        script: [
            {position:[0,5,0]},
            {position:[0,0,0]},
        ]
    })
    .axis({
        detail: 30,
    }).scale({
        divide: 1,
    }).ticks({
        classes: ['foo', 'bar'],
        width: 2
    })
    .grid({
        divideX: 20,
        divideY: 30,
        width: 1,
        opacity: 0.5,
        zBias: -5,
    }).step({
        script:[
            { rangeY: [0,0] },
            { rangeY: [0,10]}
        ]
    }).interval({
        id: 'currentPosition',
        width:1,
        expr: function (emit, x, i, t) {
            emit(position, 0);
        },
        channels: 2,
    }).point({
        points: '#currentPosition',
        color: 0x3090FF,
        size: 10
    }).step({
        script:[
            { opacity: 1},
            { opacity: 0}
        ]
    })
    .end().end()
    .slide().reveal({
        duration: 1
    }).axis({
        axis: 2
    }).interval({
        id: 'trajectory',
        width: 200,
        expr: function (emit, x, i, t) {
            y = 10 - i/20;
            emit(positions.slice(-(i+1))[0], y);
        },
        channels: 2,
    }).line({
        points: '#trajectory',
        color: 0x3090FF,
        width: 5,
    });;

}

