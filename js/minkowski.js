var stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

function showStats() {
    stats.update();
    requestAnimationFrame(showStats);
}
requestAnimationFrame(showStats);

lodash = _;
_.noConflict();

!function (_) {

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
        useLorentzBoost: false,
        useBlackHoles: false,
        showLightCones: false
    };

    var gui = new dat.GUI();
    gui.add(options, 'timeLimit', 0, 1000);
    gui.add(options, 'timeFactor', 0, 2);
    gui.add(options, 'updatesPerSecond', 0, 5);
    // gui.add(options, 'stRadius', 0, 100);
    gui.add(options, 'useRelativity').onChange(function (useRelativity) {
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
        velocity: 0.5,
        properTime:0,
        mass: 100,
        thrust: 10,
        color: [0, 0, 255],
        size: 5,
        reference: options.useRelativity
    },
        others = _.fill(Array(2), 0).map(function (thing, i) {
            var pos = 5*Math.pow(-1, i);//Math.random()*20 - 10;
            return {
                absolutePosition: pos,
                relativePosition: pos,
                velocity: 0.5*(i+1),
                properTime: 0,
                color: [100, 0, 0],
                size: 4,
                reference: false
            };
        }),
        blackHole = {
            absolutePosition: -20,
            relativePosition: -20,
            velocity: 0,
            radius: 2,
            color: [0, 0, 0],
            size: 4
        },
        blackHoles = [blackHole],
        bhmm = -10
    blackHoleEvents = _.fill(Array(300), 0).map(function (zero, i) {
        var sign = i % 3 == 0 ? 0 : i % 3 == 1 ? 1 : -1;
        var pos = [blackHole.absolutePosition + sign * blackHole.radius, bhmm];
        if (sign < 0) bhmm++;
        return {
            absolutePosition: pos,
            relativePosition: pos,
            velocity: 0,
            color: [Math.abs(sign) * 0.5, Math.abs(sign) * 0.5, Math.abs(sign) * 0.5],
            size: 4
        };
    }),
        hmm = -10,
        events = _.fill(Array(100), 0).map(function () {
            var pos = [Math.random() * 10, Math.random() * 100 - 10];
            return {
                absolutePosition: pos,
                relativePosition: pos,
                velocity: 0,
                color: [0, 100, 0],
                size: 4
            };
        }).concat(_.fill(Array(0), 0).map(function () {
            var pos = [0.5 * hmm + 4, hmm];
            hmm++;
            return {
                absolutePosition: pos,
                relativePosition: pos,
                velocity: 0.5,
                color: [0, 100, 0],
                size: 4
            };
        })),
        //.concat(blackHoleEvents),
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
        var updateFrame = requestAnimationFrame(update);

        var $vDisplay = $('<div></div>');
        var $xDisplay = $('<div></div>');
        var $display = $('<div class="info-display"></div>').append($vDisplay).append($xDisplay);
        $('body').append($display);
        
        function update() {
            var timeSinceLastFrame = options.timeFactor * (Date.now() - lastFrameTime) / 1000;
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
            referenceFrame.properTime += timeSinceLastFrame;

            $vDisplay.text('v = ' + _.round(referenceFrame.velocity, 3) + 'c');
            $xDisplay.text('x = ' + _.round(referenceFrame.absolutePosition, 3));

            blackHoles.map(function (object) {
                var v = object.velocity;
                if (options.useBlackHoles) {
                    // Calculated using Gullstrand-Painlevé coordinates
                    var r = Math.abs(object.absolutePosition - referenceFrame.absolutePosition);
                    var sign = Math.sign(object.absolutePosition - referenceFrame.absolutePosition);
                    var t = r > 0 ? sign * Math.sqrt(blackHole.radius / r) : 0;
                    v = (v + 1) * (1 - t) - 1;
                    // console.log(sign, _.round(t,3), _.round(v,3));
                }
                referenceFrame.absolutePosition -= v * timeSinceLastFrame;

                object.relativePosition = (object.absolutePosition - referenceFrame.absolutePosition);
            });

            objects.map(function (object, i) {
                if (!object.reference) {
                    var v = object.velocity;
                    if (options.useBlackHoles) {
                        // Calculated using Gullstrand-Painlevé coordinates
                        var r = Math.abs(object.absolutePosition - blackHole.absolutePosition);
                        var sign = Math.sign(object.absolutePosition - blackHole.absolutePosition);
                        var t = r > 0 ? sign * (1 - blackHole.radius / r) * Math.sqrt(blackHole.radius / r) : 0;
                        v = (v + 1) * (1 - t / 2) - 1;
                        console.log(sign, _.round(t, 3), _.round(v, 3));
                        if (r < 0.1) {
                            objects.splice(objects.indexOf(object), 1);
                            return;
                        }
                    }


                    var relGamma = 1;
                    if (options.useLorentzBoost) {
                        var relV = (referenceFrame.velocity - v) / (1 - referenceFrame.velocity * v);
                        relGamma = 1 / Math.sqrt(1 - relV * relV) || 1;
                    }

                    object.properTime += timeSinceLastFrame;
                    object.absolutePosition += v * timeSinceLastFrame;
                    console.log('t = ' + _.round(object.properTime, 3) + 
                                's v = ' + _.round(v,3) + 
                                'c x = ' + _.round(object.absolutePosition, 3));
                    object.relativePosition = (object.absolutePosition - referenceFrame.absolutePosition);

                }
            });

            events.map(function (event, i) {
                var v = event.velocity;
                if (options.useBlackHoles) {
                    // Calculated using Gullstrand-Painlevé coordinates
                    var r = Math.abs(blackHole.absolutePosition - referenceFrame.absolutePosition);
                    var sign = Math.sign(blackHole.absolutePosition - referenceFrame.absolutePosition);
                    var t = r > 0 ? sign * Math.sqrt(blackHole.radius / r) : 0;
                    v = (1 - t) - 1;
                    // i === 50 && console.log(sign, _.round(t,3), _.round(v,3));
                }

                // Galillean Relativity
                var time = event.absolutePosition[1] - timeElapsed;
                var pos = (event.absolutePosition[0] - referenceFrame.absolutePosition);
                event.relativePosition = [
                    pos - referenceFrame.velocity*time,
                    time
                ];

                // Special Relativity
                var relGamma = 1;
                if (options.useLorentzBoost) {
                    var relV = v / (1 - referenceFrame.velocity * event.velocity);
                    relGamma = 1/Math.sqrt(1 - relV * relV);
                    // console.log(v);
                    event.relativePosition = [
                        relGamma * (pos - relV * time),
                        relGamma * (time - relV * pos)
                    ];
                }

            });

            blackHoleEvents.map(function (event, i) {
                var v = 0;
                if (options.useBlackHoles) {
                    // Calculated using Gullstrand-Painlevé coordinates
                    var r = Math.abs(blackHole.absolutePosition - referenceFrame.absolutePosition);
                    var sign = Math.sign(blackHole.absolutePosition - referenceFrame.absolutePosition);
                    var t = r > 0 ? sign * Math.sqrt(blackHole.radius / r) : 0;
                    v = (1 - t) - 1;
                    // i === 50 && console.log(sign, _.round(t,3), _.round(v,3));
                }
                // event.absolutePosition[0] += v*(timeSinceLastFrame);

                // Galillean Relativity
                event.relativePosition = [
                    event.absolutePosition[0] + v * (event.absolutePosition[1] - timeElapsed) - referenceFrame.absolutePosition,
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
            updateFrame = requestAnimationFrame(update);
        }

        updateEvents();

        function updateEvents() {
            var timeSinceLastFrame = options.timeFactor * (Date.now() - lastFrameTime) / 1000;
            var newTime = timeElapsed + timeSinceLastFrame;
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
                    absolutePosition: [object.absolutePosition, object.properTime],
                    relativePosition: [0, 0],
                    velocity: object.velocity,
                    color: object.color,
                    size: object.size
                });
            });

            update();
            setTimeout(updateEvents, (1 / options.updatesPerSecond) * 1000);
        }

        setTimeout(function () {
            console.log('ADVANCE');
            cancelAnimationFrame(updateFrame);
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
                pass: 'data'
            })
            .axis({
                detail: 64,
            })
            .axis({
                axis: 2,
                detail: 64
            })
            .grid({
                divideX: 2 * options.stRadius,
                detailX: 256,
                divideY: 2 * options.stRadius,
                detailY: 256,
                width: 1,
                opacity: 0.5,
                zBias: -5,
            })
            .end()
            .array({
                id: 'currentPosition',
                width: 50,
                expr: function (emit, i, t) {
                    if (i < objects.length) {
                        emit(objects[i].relativePosition, 0);
                    }
                },
                channels: 2
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
            visible: function () {
                return options.showLightCones;
            }
        });
    }
} (lodash);

