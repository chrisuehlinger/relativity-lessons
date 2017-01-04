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
    stRadius = 10,
    timerStarted = false,
    timerEnded = false,
    timeElapsed = 0;

var useRelativity = true,
    useLorentzBoost = true,
    showLightCones = true;

var player = {
        absolutePosition: 0,
        relativePosition: 0,
        mass: 100,
        thrust: 10,
        velocity: 0,
        color: [0,0, 255],
        size: 5,
        reference: useRelativity
    },
    others = lodash.fill(Array(1), 0).map(function(){
        var pos = Math.random()*20 - 10;
        return {
            absolutePosition: pos,
            relativePosition: pos,
            velocity: 0,
            color: [100, 0, 0],
            size: 4,
            reference: false
        };
    }),
    events = lodash.fill(Array(100), 0).map(function(){
        var pos = [Math.random()*40 - 20, Math.random()*60 - 10];
        return {
            absolutePosition: pos,
            relativePosition: pos,
            color: [0, 100, 0],
            size: 4
        };
    }),
    objects = [player].concat(others),
    eventCount = events.length,
    objectCount = objects.length;

console.log(events)

var present;

initDiagram(objectCount, eventCount);

var thrustSign = 0;
window.onkeydown = function (e) {
    if(timerEnded) {
        return;
    }

    switch (e.keyCode) {
        case 65:
        case 37:
            thrustSign = -1;
            break;
        case 68:
        case 39:
            thrustSign = 1;
            break;
    }

    if(!timerStarted){
        timerStarted = true;
        initSimulation();
    }
}

window.onkeyup = function(){
    thrustSign = 0;
}

function initSimulation(){
    var lastFrameTime = startTime = Date.now();
    var updateFrame = setTimeout(update, 50);
    function update(){
        var timeSinceLastFrame = (Date.now() - lastFrameTime) / 1000;
        timeElapsed = (Date.now() - startTime) / 1000;
        lastFrameTime = Date.now();

        var referenceFrame = objects.filter(function(obj) { return obj.reference; })[0] || {
            absolutePosition: 0,
            velocity: 0,
            thrust: 0,
            mass: 1
        }

        var gamma = Math.sqrt(1 - referenceFrame.velocity*referenceFrame.velocity);
        var relThrust = referenceFrame.thrust / (gamma * referenceFrame.mass);
        referenceFrame.velocity += thrustSign * relThrust * timeSinceLastFrame;
        referenceFrame.velocity = Math.max(Math.min(referenceFrame.velocity, 0.99999), -0.99999);
        gamma = Math.sqrt(1 - referenceFrame.velocity*referenceFrame.velocity);

        referenceFrame.absolutePosition += referenceFrame.velocity * timeSinceLastFrame;

        console.log('Y = ' + Math.round(gamma*10000)/10000 + ' x = ' + Math.round(referenceFrame.absolutePosition*10000)/10000 + ' v = ' + Math.round(referenceFrame.velocity*10000)/10000 + 'c');

        objects.map(function(object){
            if(!object.reference) {
                var relativeVelocity = referenceFrame.velocity - object.velocity;
                var lorentzBoost = useLorentzBoost ? Math.sqrt(1 - relativeVelocity*relativeVelocity) : 1;
                object.absolutePosition += object.velocity * timeSinceLastFrame;
                object.relativePosition = lorentzBoost * (object.absolutePosition - referenceFrame.absolutePosition);
            }
        });
        
        events.map(function(event){
            event.relativePosition = [
                event.absolutePosition[0] - referenceFrame.absolutePosition,
                event.absolutePosition[1] - timeElapsed
            ];
            if(useLorentzBoost) {
                event.relativePosition = [
                    gamma*(event.relativePosition[0] - referenceFrame.velocity*event.relativePosition[1]),
                    gamma*(event.relativePosition[1] - referenceFrame.velocity*event.relativePosition[0])
                ];
            }
        });

        events = events.filter(function(event){
            return event
        });

        updateFrame = setTimeout(update, 50);
    }

    setInterval(function(){
        timeElapsed = (Date.now() - startTime) / 1000;
        var pos = [Math.random()*20-10, Math.random()*10];
        events.push({
            absolutePosition: pos,
            relativePosition: pos,
            velocity: 0,
            color: [0, 100, 0],
            size: 4
        });

        objects.map(function(object){
            events.push({
                absolutePosition: [object.absolutePosition, timeElapsed],
                relativePosition: [0,0],
                color: object.color,
                size: object.size
            });
        });

        update();
    }, 1000);

    setTimeout(function(){
        console.log('ADVANCE');
        clearTimeout(updateFrame);
        timerEnded = true;
    }, timeLimit * 1000);
}

function initDiagram(numItems, numEvents){    
    var view = mathbox
        .set({
            focus: 3,
        })
        .cartesian({
            range: [[-stRadius, stRadius], [-stRadius, stRadius], [0, 0]],
            scale: [2, 2, 2],
        });
    view
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
        divideX: 2*stRadius,
        divideY: 2*stRadius,
        width: 1,
        opacity: 0.5,
        zBias: -5,
    })
    .array({
        id: 'currentPosition',
        width: numItems,
        expr: function(emit, i, t){
            emit(objects[i].relativePosition);
        },
        channels: 1
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
    .axis({
        axis: 2
    });
    // .array({
    //     id: 'trajectory',
    //     width: 1,
    //     items: numItems,
    //     history: 580,
    //     expr: function (emit, i, t) {
    //         for(var j=0; j < objects.length; j++){
    //             emit(objects[j].relativePosition);
    //         }
    //     },
    //     channels: 1,
    // },{
    //     live: function(){
    //         return !timerEnded;
    //     }
    // })
    // .spread({
    //     unit: 'relative',
    //     alignHeight: 1,
    //     height: [0, -10, 0],
    // })
    // .transpose({
    //     order: 'yx'
    // })
    // .line({
    //     // color: 0x3090FF,
    //     colors:"#objectColors",
    //     width: 5,
    //     end:false
    // });

    view.array({
        id: 'events',
        channels: 2,
        width: 1e4,
        expr:function(emit, i, t){
            if(i < events.length &&
                Math.abs(events[i].relativePosition[0]) < stRadius &&
                Math.abs(events[i].relativePosition[1]) < stRadius) {
                emit(events[i].relativePosition[0], events[i].relativePosition[1]);
            }
        }
    }).array({
        id: 'eventColors',
        width: 1e4,
        channels: 4,
        expr:function(emit, i, t){
            if(i < events.length) {
                if(i < events.length &&
                    Math.abs(events[i].relativePosition[0]) < stRadius &&
                    Math.abs(events[i].relativePosition[1]) < stRadius) {
                    var color = events[i].color;
                    emit(color[0], color[1], color[2], 1.0);
                }
            }
        }
    }).point({
        points: '#events',
        // color: 0x3090FF,
        colors:'#eventColors',
        size: 10
    })

    view.array({
        width: 2,
        items: 2,
        channels: 2,
        live:false,
        data:[
            [-stRadius, -stRadius], [-stRadius,stRadius],
            [stRadius, stRadius], [stRadius, -stRadius]
        ]
    }).line({
        color:0xFFFF00,
        width: 5,
        visible: showLightCones,
        end: false
    })

}

