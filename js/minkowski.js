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


var options = {
    timeLimit: 100,
    timeFactor: 1,
    updatesPerSecond: 2,
    stRadius: 10,
    useRelativity: true,
    useLorentzBoost: true,
    useBlackHoles: false,
    showLightCones: true
};

var gui = new dat.GUI();
gui.add(options, 'timeLimit', 0, 1000);
gui.add(options, 'timeFactor', 0, 2);
gui.add(options, 'updatesPerSecond', 0, 5);
// gui.add(options, 'stRadius', 0, 100);
gui.add(options, 'useRelativity').onChange(function(useRelativity){
    player.reference = useRelativity;
});
gui.add(options, 'useLorentzBoost');
gui.add(options, 'useBlackHoles');
gui.add(options, 'showLightCones');

var timerStarted = false,
    timerEnded = false,
    timeElapsed = 0;

var player = {
    absolutePosition: 0,
    relativePosition: 0,
    mass: 100,
    thrust: 10,
    velocity: 0,
    color: [0, 0, 255],
    size: 5,
    reference: options.useRelativity
},
    others = lodash.fill(Array(0), 0).map(function () {
        var pos = -1;//aMath.random()*20 - 10;
        return {
            absolutePosition: pos,
            relativePosition: pos,
            velocity: 0,
            color: [100, 0, 0],
            size: 4,
            reference: false
        };
    }),
    blackHole = {
        absolutePosition: -25,
        relativePosition: -25,
        velocity: 0,
        radius: 2,
        color: [0, 0, 0],
        size: 4
    },
    blackHoles = [blackHole],
    bhmm = -10
    blackHoleEvents = lodash.fill(Array(300), 0).map(function (zero, i) {
        var sign = i%3==0 ? 0 : i%3==1 ? 1 : -1;
        var pos = [blackHole.absolutePosition + sign * blackHole.radius, bhmm];
        if (sign < 0) bhmm++;
        return {
            absolutePosition: pos,
            relativePosition: pos,
            velocity: 0,
            color: [Math.abs(sign)*0.5, Math.abs(sign)*0.5, Math.abs(sign)*0.5],
            size: 4
        };
    }),
    hmm = -10,
    events = lodash.fill(Array(100), 0).map(function () {
        var pos = [Math.random() * 10, Math.random() * 100 - 10];
        return {
            absolutePosition: pos,
            relativePosition: pos,
            velocity: 0,
            color: [0, 100, 0],
            size: 4
        };
    }).concat(lodash.fill(Array(0), 0).map(function () {
        var pos = [0.5 * hmm + 4, hmm];
        hmm++;
        return {
            absolutePosition: pos,
            relativePosition: pos,
            velocity: 0.5,
            color: [0, 100, 0],
            size: 4
        };
    }))
    .concat(blackHoleEvents),
    objects = [player].concat(others),
    eventCount = events.length,
    objectCount = objects.length;


gui.add(player, 'velocity', -1, 1).listen();


initDiagram(objectCount, eventCount);
setTimeout(function () {
    timerStarted = true;
    initSimulation();
}, 1000);

var thrustSign = 0;
window.onkeydown = function (e) {
    if (timerEnded) {
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
        case 76:
            objects.push({
                absolutePosition: objects[1].absolutePosition,
                relativePosition: 0,
                velocity: 1,
                color: [100, 0, 100],
                size: 4,
                reference: false
            });
            objects.push({
                absolutePosition: objects[1].absolutePosition,
                relativePosition: 0,
                velocity: -1,
                color: [100, 0, 100],
                size: 4,
                reference: false
            });
            console.log('LIGHT!');
    }

    // if(!timerStarted){
    //     timerStarted = true;
    //     initSimulation();
    // }
}


window.onkeyup = function () {
    thrustSign = 0;
}

function initSimulation() {
    var lastFrameTime = startTime = Date.now();
    var updateFrame = setTimeout(update, 50);
    function update() {
        var timeSinceLastFrame = options.timeFactor*(Date.now() - lastFrameTime) / 1000;
        timeElapsed += timeSinceLastFrame;
        lastFrameTime = Date.now();

        var referenceFrame = objects.filter(function (obj) { return obj.reference; })[0] || {
            absolutePosition: 0,
            velocity: 0,
            thrust: 0,
            mass: 1
        }

        var gamma = Math.sqrt(1 - player.velocity * player.velocity);
        var relThrust = player.thrust / (gamma * player.mass);
        player.velocity += thrustSign * relThrust * timeSinceLastFrame;
        player.velocity = Math.max(Math.min(player.velocity, 0.99999), -0.99999);

        gamma = Math.sqrt(1 - referenceFrame.velocity * referenceFrame.velocity);

        referenceFrame.absolutePosition += referenceFrame.velocity * timeSinceLastFrame;

        // console.log('x = ' + lodash.round(referenceFrame.absolutePosition, 3) + ' v = ' + lodash.round(referenceFrame.velocity, 3) + 'c');


        blackHoles.map(function (object) {
            var v = object.velocity;
            if (options.useBlackHoles) {
                // Calculated using Gullstrand-Painlevé coordinates
                var r = Math.abs(object.absolutePosition - referenceFrame.absolutePosition);
                var sign = Math.sign(object.absolutePosition - referenceFrame.absolutePosition);
                var t = r > 0 ? sign*Math.sqrt(blackHole.radius / r) : 0;
                v = (v + 1)*(1-t) - 1;
                // console.log(sign, lodash.round(t,3), lodash.round(v,3));
            }
            object.absolutePosition += v*timeSinceLastFrame;

            object.relativePosition = (object.absolutePosition - referenceFrame.absolutePosition);
        });

        objects.map(function (object) {
            if (!object.reference) {
                var v = object.velocity;
                if (options.useBlackHoles) {
                    // Calculated using Gullstrand-Painlevé coordinates
                    var r = Math.abs(object.absolutePosition - blackHole.absolutePosition);
                    var sign = Math.sign(object.absolutePosition - blackHole.absolutePosition);
                    var t = r > 0 ? sign*Math.sqrt(blackHole.radius / r) : 0;
                    v = (v + 1)*(1-t/2) - 1;
                    console.log(sign, lodash.round(t,3), lodash.round(v,3));
                    if (r < 0.1) {
                        objects.splice(objects.indexOf(object), 1);
                    }
                }

                object.absolutePosition += v * timeSinceLastFrame;
                object.relativePosition = object.absolutePosition - referenceFrame.absolutePosition;

                if (options.useLorentzBoost) {
                    var relativeVelocity = (referenceFrame.velocity - object.velocity) / (1 - referenceFrame.velocity * object.velocity);
                    var relGamma = Math.sqrt(1 - relativeVelocity * relativeVelocity) || 1;
                    object.relativePosition = relGamma * object.relativePosition;
                }
                var r = object.relativePosition - blackHole.relativePosition;

            }
        });

        events.map(function (event, i) {
            var v = 0;
            if (options.useBlackHoles) {
                // Calculated using Gullstrand-Painlevé coordinates
                var r = Math.abs(blackHole.absolutePosition - referenceFrame.absolutePosition);
                var sign = Math.sign(blackHole.absolutePosition - referenceFrame.absolutePosition);
                var t = r > 0 ? sign*Math.sqrt(blackHole.radius / r) : 0;
                v = (1-t)-1;
                // i === 50 && console.log(sign, lodash.round(t,3), lodash.round(v,3));
            }

            // Galillean Relativity
            event.relativePosition = [
                event.absolutePosition[0] + v*(event.absolutePosition[1] - timeElapsed) - referenceFrame.absolutePosition,
                event.absolutePosition[1] - timeElapsed
            ];

            // Special Relativity
            if (options.useLorentzBoost) {
                event.relativePosition = [
                    gamma * (event.relativePosition[0] - referenceFrame.velocity * event.relativePosition[1]),
                    gamma * (event.relativePosition[1] - referenceFrame.velocity * event.relativePosition[0])
                ];
            }

        });

        blackHoleEvents.map(function (event, i) {
            var v = 0;
            if (options.useBlackHoles) {
                // Calculated using Gullstrand-Painlevé coordinates
                var r = Math.abs(blackHole.absolutePosition - referenceFrame.absolutePosition);
                var sign = Math.sign(blackHole.absolutePosition - referenceFrame.absolutePosition);
                var t = r > 0 ? sign*Math.sqrt(blackHole.radius / r) : 0;
                v = (1-t) - 1;
                // i === 50 && console.log(sign, lodash.round(t,3), lodash.round(v,3));
            }
            event.absolutePosition[0] += v*(timeSinceLastFrame);

            // Galillean Relativity
            event.relativePosition = [
                event.absolutePosition[0] + v*(event.absolutePosition[1] - timeElapsed) - referenceFrame.absolutePosition,
                event.absolutePosition[1] - timeElapsed
            ];

            // Special Relativity
            if (options.useLorentzBoost) {
                event.relativePosition = [
                    gamma * (event.relativePosition[0] - referenceFrame.velocity * event.relativePosition[1]),
                    gamma * (event.relativePosition[1] - referenceFrame.velocity * event.relativePosition[0])
                ];
            }

        });

        events = events.filter(function (event) {
            return event
        });

        updateFrame = setTimeout(update, 50);
    }

    updateEvents();

    function updateEvents () {
        var timeSinceLastFrame = options.timeFactor*(Date.now() - lastFrameTime) / 1000;
        timeElapsed += timeSinceLastFrame;
        var pos = [Math.random() * 20 - 10, Math.random() * 10];
        // events.push({
        //     absolutePosition: pos,
        //     relativePosition: pos,
        //     velocity: 0,
        //     color: [0, 100, 0],
        //     size: 4
        // });

        objects.map(function (object) {
            events.push({
                absolutePosition: [object.absolutePosition, timeElapsed],
                relativePosition: [0, 0],
                velocity: 0,
                color: object.color,
                size: object.size
            });
        });

        update();
        setTimeout(updateEvents, (1/options.updatesPerSecond)*1000);
    }

    setTimeout(function () {
        console.log('ADVANCE');
        clearTimeout(updateFrame);
        timerEnded = true;
    }, options.timeLimit * 1000);
}

function initDiagram() {
    var warpShader = mathbox.shader({
      code: '#blackhole-curvature',
    }, {
      useBlackHoles: function () {
          return options.useBlackHoles ? 1 : 0; 
        },
      singularity: function (t) {
        //   console.log(blackHole.relativePosition);
        return blackHole.relativePosition;
      },
      rS: function (t) {
        return blackHole.radius;
      },

    });

    var view = mathbox
        .set({
            focus: 3,
        })
        .cartesian({
            range: [[-options.stRadius, options.stRadius], [-options.stRadius, options.stRadius], [-10, 10]],
            scale: [1.5, 1.5, 1.5],
        });
    view
        .scale({
            divide: 1,
        })
        .ticks({
            classes: ['foo', 'bar'],
            width: 2
        })
        .vertex({
            pass:'data'
        })
        .axis({
            detail: 64,
        })
        .axis({
            axis: 2,
            detail: 64
        })
        .grid({
            divideX: 4 * options.stRadius,
            detailX: 128,
            divideY: 4 * options.stRadius,
            detailY: 128,
            width: 1,
            opacity: 0.5,
            zBias: -5,
        }, {
            divideX: function(){
                return options.stRadius;
            }
        })
        .end()
        .array({
            id: 'currentPosition',
            width: 50,
            expr: function (emit, i, t) {
                if (i < objects.length) {
                    emit(objects[i].relativePosition);
                }
            },
            channels: 1
        })
        .array({
            id: 'objectColors',
            width: 50,
            channels: 4,
            expr: function (emit, i, t) {
                if (i < objects.length) {
                    var color = objects[i].color;
                    emit(color[0], color[1], color[2], 1.0);
                }
            },
        })
        .array({
            id: 'objectSizes',
            width: 50,
            channels: 1,
            expr: function (emit, i, t) {
                if (i < objects.length) {
                    emit(objects[i].size);
                }
            },
        })
        .point({
            points: '#currentPosition',
            // color: 0x3090FF,
            colors: '#objectColors',
            // size: 10
            sizes: "#objectSizes"
        });

    view.array({
        id: 'events',
        channels: 2,
        width: 1e4,
        expr: function (emit, i, t) {
            if (i < events.length &&
                Math.abs(events[i].relativePosition[0]) < options.stRadius &&
                Math.abs(events[i].relativePosition[1]) < options.stRadius) {
                emit(events[i].relativePosition[0], events[i].relativePosition[1]);
            }
        }
    }).array({
        id: 'eventColors',
        width: 1e4,
        channels: 4,
        expr: function (emit, i, t) {
            if (i < events.length) {
                if (i < events.length &&
                    Math.abs(events[i].relativePosition[0]) < options.stRadius &&
                    Math.abs(events[i].relativePosition[1]) < options.stRadius) {
                    var color = events[i].color;
                    emit(color[0], color[1], color[2], 1.0);
                }
            }
        }
    }).point({
        points: '#events',
        // color: 0x3090FF,
        colors: '#eventColors',
        size: 10
    })



    view.array({
        id: 'blackHoles',
        channels: 1,
        items: 3,
        width: 10,
        expr: function (emit, i, t) {
            if (i < blackHoles.length) {
                // Math.abs(events[i].relativePosition[0]) < options.stRadius &&
                // Math.abs(events[i].relativePosition[1]) < options.stRadius) {
                emit(blackHoles[i].relativePosition);
                emit(blackHoles[i].relativePosition - blackHoles[i].radius);
                emit(blackHoles[i].relativePosition + blackHoles[i].radius);
            }
        }
    }).point({
        points: '#blackHoles',
        color: 0,
        size: 10
    })

    view.array({
        width: 2,
        items: 2,
        channels: 2,
        live: false,
        data: [
            [-options.stRadius, -options.stRadius], [-options.stRadius, options.stRadius],
            [options.stRadius, options.stRadius], [options.stRadius, -options.stRadius]
        ]
    }).line({
        color: [100, 0, 100],
        width: 1,
        end: false
    }, {
        visible: function(){
            return options.showLightCones;
        }
    })

}

