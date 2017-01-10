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
        useLorentzBoost: true,
        useBlackHoles: true,
        showLightCones: true
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
        absolutePosition: [0, 0],
        relativePosition: [0, 0],
        mass: 100,
        thrust: 5,
        velocity: [0, 0],
        color: [0, 0, 255],
        size: 5,
        reference: options.useRelativity
    },
        others = _.fill(Array(0), 0).map(function () {
            var pos = [Math.random() * 20 - 10, Math.random() * 20 - 10];
            return {
                absolutePosition: pos,
                relativePosition: pos,
                velocity: [0, 0],
                color: [100, 0, 0],
                size: 4,
                reference: false
            };
        }),
        events = _.fill(Array(100), 0).map(function () {
            var pos = [Math.random() * 40 - 20, Math.random() * 40 - 20, Math.random() * 60 - 10];
            return {
                absolutePosition: pos,
                relativePosition: pos,
                color: [0, 100, 0],
                size: 4
            };
        }),
        objects = [player].concat(others),
        objectCount = objects.length;

    var thrustSign = [0, 0];
    window.onkeydown = function (e) {
        if (timerEnded) {
            return;
        }

        switch (e.keyCode) {
            case 65:
            case 37:
                thrustSign = [-1, 0];
                break;
            case 87:
            case 38:
                thrustSign = [0, 1];
                break;
            case 68:
            case 39:
                thrustSign = [1, 0];
                break;
            case 83:
            case 40:
                thrustSign = [0, -1];
                break;
        }
    }

    window.onkeyup = function () {
        thrustSign = [0, 0];
    }

    initDiagram(objectCount);
    setTimeout(function () {
        timerStarted = true;
        initSimulation();
    }, 1000);

    function initSimulation() {
        var lastFrameTime = startTime = Date.now();
        var updateFrame = setTimeout(update, 50);

        var $vDisplay = $('<div></div>');
        var $xDisplay = $('<div></div>');
        var $display = $('<div class="info-display"></div>').append($vDisplay).append($xDisplay);
        $('body').append($display);

        function update() {
            var timeSinceLastFrame = options.timeFactor*(Date.now() - lastFrameTime) / 1000;
            timeElapsed += timeSinceLastFrame;
            lastFrameTime = Date.now();

            var referenceFrame = objects.filter(function (obj) { return obj.reference; })[0] || {
                absolutePosition: [0, 0],
                velocity: [0, 0],
                thrust: 0,
                mass: 10
            }
            var beta = Math.sqrt(referenceFrame.velocity[0] * referenceFrame.velocity[0] + referenceFrame.velocity[1] * referenceFrame.velocity[1]);
            var gamma = Math.sqrt(1 - beta * beta);
            var relThrust = referenceFrame.thrust / (gamma * referenceFrame.mass);
            referenceFrame.velocity[0] += thrustSign[0] * relThrust * timeSinceLastFrame;
            referenceFrame.velocity[1] += thrustSign[1] * relThrust * timeSinceLastFrame;
            beta = Math.sqrt(referenceFrame.velocity[0] * referenceFrame.velocity[0] + referenceFrame.velocity[1] * referenceFrame.velocity[1]);
            var theta = Math.atan2(referenceFrame.velocity[1], referenceFrame.velocity[0]),
                sinTheta = Math.sin(theta),
                cosTheta = Math.cos(theta),
                sin2Theta = sinTheta * sinTheta,
                cos2Theta = cosTheta * cosTheta;

            if (Math.abs(beta) > 1) {
                beta = 0.9999;
                referenceFrame.velocity = [
                    beta * cosTheta,
                    beta * sinTheta
                ];

                theta = Math.atan2(referenceFrame.velocity[1], referenceFrame.velocity[0]),
                    sinTheta = Math.sin(theta),
                    cosTheta = Math.cos(theta),
                    sin2Theta = sinTheta * sinTheta,
                    cos2Theta = cosTheta * cosTheta;
            }
            gamma = Math.sqrt(1 - beta * beta);

            $vDisplay.text('v = ' + _.round(beta, 3) + 'c');
            $xDisplay.text('x = ' + _.round(referenceFrame.absolutePosition[0], 3) + ' y = ' + _.round(referenceFrame.absolutePosition[1], 3));


            referenceFrame.absolutePosition[0] += referenceFrame.velocity[0] * timeSinceLastFrame;
            referenceFrame.absolutePosition[1] += referenceFrame.velocity[1] * timeSinceLastFrame;

            // objects.map(function(object){
            //     if(!object.reference) {
            //         // var relativeVelocityX = referenceFrame.velocity[0] - object.velocity[0],
            //         //     relativeVelocityY = referenceFrame.velocity[1] - object.velocity[1],
            //         //     relativeVelocity = Math.sqrt(relativeVelocityX*relativeVelocityX + relativeVelocityY*relativeVelocityY);
            //         // var lorentzBoost = options.useLorentzBoost ? Math.sqrt(1 - relativeVelocity*relativeVelocity) : 1;
            //         object.absolutePosition[0] += object.velocity[0] * timeSinceLastFrame;
            //         object.absolutePosition[1] += object.velocity[1] * timeSinceLastFrame;
            //         // object.relativePosition = [
            //         //     lorentzBoost * (object.absolutePosition[0] - referenceFrame.absolutePosition[0]),
            //         //     lorentzBoost * (object.absolutePosition[1] - referenceFrame.absolutePosition[1])
            //         // ];
            //     }
            // });

            events.map(function (event) {
                event.relativePosition = [
                    event.absolutePosition[0] - referenceFrame.absolutePosition[0],
                    event.absolutePosition[1] - referenceFrame.absolutePosition[1],
                    event.absolutePosition[2] - timeElapsed
                ];
                if (options.useLorentzBoost) {
                    var x = event.relativePosition[0],
                        y = event.relativePosition[1],
                        t = event.relativePosition[2]

                    event.relativePosition = [
                        -beta * gamma * cosTheta * t + (gamma * cos2Theta + sin2Theta) * x + (gamma - 1) * sinTheta * cosTheta * y,
                        -beta * gamma * sinTheta * t + (gamma * sin2Theta + cos2Theta) * y + (gamma - 1) * sinTheta * cosTheta * x,
                        gamma * t + -gamma * beta * cosTheta * x + -gamma * beta * sinTheta * y
                    ];
                }
            });

            updateFrame = setTimeout(update, 50);
        }


        setTimeout(updateEvents, (1/options.updatesPerSecond) * 1000);
        function updateEvents() {
            var timeSinceLastFrame = options.timeFactor*(Date.now() - lastFrameTime) / 1000;
            timeElapsed += timeSinceLastFrame;
            lastFrameTime = Date.now();

            objects.map(function (object) {
                events.push({
                    absolutePosition: [object.absolutePosition[0], object.absolutePosition[1], timeElapsed],
                    relativePosition: [0, 0, 0],
                    color: object.color,
                    size: object.size
                });
            });

            update();
            setTimeout(updateEvents, (1/options.updatesPerSecond) * 1000);
        }

        // setTimeout(function () {
        //     console.log('ADVANCE');
        //     clearTimeout(updateFrame);
        //     timerEnded = true;
        // }, options.timeLimit * 1000);
    }

    function initDiagram(numItems) {
        var view = mathbox
            .set({
                focus: 3,
            })
            .cartesian({
                range: [[-options.stRadius, options.stRadius], [-options.stRadius, options.stRadius], [-options.stRadius, options.stRadius]],
                scale: [1, 1, 1],
            });

        view
            .axis({
                detail: 30,
            })
            .axis({
                axis: 3,
                detail: 30,
            }).scale({
                divide: 1,
            }).ticks({
                classes: ['foo', 'bar'],
                width: 2
            })
            .grid({
                axes: [1, 3],
                divideX: 2 * options.stRadius,
                divideY: 2 * options.stRadius,
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
                id: 'objectColors',
                width: numItems,
                channels: 4,
                expr: function (emit, i, t) {
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
                position: [0, -options.stRadius, 0]
            }).grid({
                axes: [1, 3],
                divideX: 2 * options.stRadius,
                divideY: 2 * options.stRadius,
                width: 1,
                opacity: 0.5,
            })
            .end()
            .transform({
                position: [0, options.stRadius, 0]
            }).grid({
                axes: [1, 3],
                divideX: 2 * options.stRadius,
                divideY: 3 * options.stRadius,
                width: 1,
                opacity: 0.5,
            })
            .end()
            .array({
                id: 'events',
                channels: 3,
                width: 1e4,
                expr: function (emit, i, t) {
                    if (i < events.length &&
                        Math.abs(events[i].relativePosition[0]) < options.stRadius &&
                        Math.abs(events[i].relativePosition[1]) < options.stRadius &&
                        Math.abs(events[i].relativePosition[2]) < options.stRadius) {
                        emit(events[i].relativePosition[0], events[i].relativePosition[2], -events[i].relativePosition[1]);
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
                            Math.abs(events[i].relativePosition[1]) < options.stRadius &&
                            Math.abs(events[i].relativePosition[2]) < options.stRadius) {
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
            });

        view.area({
            width: 32,
            height: 32,
            channels: 3,
            items: 2,
            live: false,
            expr: function(emit,x,y,i,j){
                var z = Math.sqrt(x*x+y*y);
                emit(x,z,-y);
                emit(x,-z,-y);
            }
        }).surface({
            color: [100, 0, 100],
            opacity: 0.25,
        }, {
            visible: function () {
                return options.showLightCones;
            }
        });
    }
} (lodash);