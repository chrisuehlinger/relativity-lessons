lodash = _;
_.noConflict();

mathbox = mathBox({
    plugins: ['core', 'controls', 'cursor'],
    controls: {
        klass: THREE.DeviceOrientationControls
    },
});
three = mathbox.three;
three.camera.position.set(0, 0, 3);
three.renderer.setClearColor(new THREE.Color(0xffffff), 1.0);

var position = lodash.fill(Array(21),0),
    positions = [lodash.fill(Array(21),0)],
    numLights = 0,
    velocity = 0,
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
            velocity += (-1 - velocity)*0.05;
            break;
        case 39:
        case 40:
            velocity += (1-velocity)*0.05;
            break;
    }
    console.log(velocity);

    if(!timerStarted){
        timerStarted = true;

        var lastFrameTime = Date.now();
        var updateFrame = setTimeout(function update(){
            var timeSinceLastFrame = Date.now() - lastFrameTime;
            lastFrameTime = Date.now();
            position[0] += velocity / (1000/timeSinceLastFrame);
            for(var i = 1; i < position.length; i++){
                var offset = position.length - i;
                if(offset <= numLights) {
                    position[i] += Math.pow(-1, offset) / (1000/timeSinceLastFrame);
                } else {
                    position[i] = position[0];
                }
            }
            positions.push(position.slice());
            // if(positions.length > 200) {
            //     positions = positions.slice(1);
            // }

            updateFrame = setTimeout(update, 50);
        }, 50);

        var lightInterval = setInterval(function(){
            // position.push(position[0]);
            // position.push(position[0]);
            numLights += 2;
        }, 1000);

        setTimeout(function(){
            console.log('ADVANCE');
            present.set("index", 2);
            clearTimeout(updateFrame);
            clearInterval(lightInterval);
            timerEnded = true;
        }, 10000);
    }
}

var present;

init(21);
function init(numItems){    
    var view = mathbox
        .set({
            focus: 3,
        })
        .cartesian({
            range: [[-10, 10], [0, 10], [-10, 10]],
            scale: [2, 1, 2],
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
    }).step({
        script:[
            { rangeY: [0,0] },
            { rangeY: [0,10]}
        ]
    }).interval({
        id: 'currentPosition',
        width:numItems,
        expr: function (emit, x, i, t) {
            emit(position[i], 0);
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
        items: numItems,
        expr: function (emit, x, i, t) {
            y = i/20;
            if(i < positions.length)
                for(var j = 0; j < numItems; j++)
                    emit(positions[i][j], y);
        },
        channels: 2,
    }).line({
        points: '#trajectory',
        color: 0x3090FF,
        width: 5,
    });;

}

