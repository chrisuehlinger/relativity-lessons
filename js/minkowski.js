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
    useLorentzBoost = true,
    showLightCones = true;

var player = {
        absolutePosition: 0,
        relativePosition: 0,
        mass: 100,
        thrust: 1,
        velocity: 0,
        color: [0,0, 255],
        size: 5,
        reference: useRelativity
    },
    others = lodash.fill(Array(0), 0).map(function(){
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
            velocity: 0,
            color: [0, 100, 0],
            size: 4,
            reference: false
        };
    }),
    objects = [player].concat(others),
    eventCount = events.length,
    objectCount = objects.length;

console.log(events)

var present;

initDiagram(objectCount, eventCount);

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
    var lastFrameTime = startTime = Date.now();
    var updateFrame = setTimeout(function update(){
        var timeSinceLastFrame = (Date.now() - lastFrameTime) / 1000;
        timeElapsed = (Date.now() - startTime) / 1000;
        lastFrameTime = Date.now();

        var referenceFrame = objects.filter(function(obj) { return obj.reference; })[0] || {
            absolutePosition: 0,
            velocity: 0
        }
        referenceFrame.absolutePosition += referenceFrame.velocity * timeSinceLastFrame;

        objects.map(function(object){
            if(!object.reference) {
                var relativeVelocity = referenceFrame.velocity - object.velocity;
                var lorentzBoost = useLorentzBoost ? Math.sqrt(1 - relativeVelocity*relativeVelocity) : 1;
                object.absolutePosition += object.velocity * timeSinceLastFrame;
                object.relativePosition = lorentzBoost * (object.absolutePosition - referenceFrame.absolutePosition);
            }
        });

        var gamma = Math.sqrt(1 - referenceFrame.velocity*referenceFrame.velocity);
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

        updateFrame = setTimeout(update, 50);
    }, 50);

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
            range: [[-10, 10], [-10, 10], [-10, 10]],
            scale: [1, 1, 1],
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
        divideX: 20,
        divideY: 10,
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
        alignHeight: 1,
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

    view.array({
        id: 'events',
        width: numEvents,
        channels: 2,
        expr:function(emit, i, t){
            emit(events[i].relativePosition[0], events[i].relativePosition[1]);
        }
    }).array({
        id: 'eventColors',
        width: numEvents,
        channels: 4,
        expr:function(emit, i, t){
            var color = events[i].color;
            emit(color[0], color[1], color[2], 1.0);
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
            [-10, -10], [-10,10],
            [10, 10], [10, -10]
        ]
    }).line({
        color:0xFFFF00,
        width: 5,
        visible: showLightCones,
        end: false
    })

}

