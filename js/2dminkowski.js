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
        clipEvents: false,
        debugSR: false,
        useRelativity: true,
        useLorentzBoost: false,
        useBlackHoles: true,
        showLightCones: false
    };

    var gui = new dat.GUI();
    gui.add(options, 'timeLimit', 0, 1000);
    gui.add(options, 'timeFactor', 0, 2);
    gui.add(options, 'updatesPerSecond', 0, 5);
    // gui.add(options, 'stRadius', 0, 100);
    gui.add(options, 'clipEvents');
    gui.add(options, 'debugSR');
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
        properTime: 0,
        mass: 100,
        thrust: 5,
        velocity: [0.25, 0.25],
        color: [0, 0, 255],
        size: 5,
        reference: options.useRelativity
    },
        others = _.fill(Array(1), 0).map(function () {
            // var pos = [Math.random() * 20 - 10, Math.random() * 20 - 10];
            var pos = [5,-5];
            return {
                absolutePosition: pos,
                relativePosition: pos,
                properTime: 0,
                velocity: [0.000001, 0.5],
                color: [100, 0, 0],
                size: 4,
                reference: false
            };
        }),
        events = _.fill(Array(1), 0).map(function () {
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

    gui.add(player.velocity, '0', -1, 1).listen();
    gui.add(player.velocity, '1', -1, 1).listen();
    var thrustSign = [0, 0];
    window.onkeydown = function (e) {
        if (timerEnded) {
            return;
        }
        
        if(e.keyCode >= 48 && e.keyCode < 59) {
            changeFrame(e.keyCode-48);
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

    function changeFrame(index){
        objects.map(function(object) { object.reference = false; });
        objects[index].reference = true;
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
            var relThrust = player.thrust / (gamma * player.mass);
            player.velocity[0] += thrustSign[0] * relThrust * timeSinceLastFrame;
            player.velocity[1] += thrustSign[1] * relThrust * timeSinceLastFrame;
            beta = Math.sqrt(referenceFrame.velocity[0] * referenceFrame.velocity[0] + referenceFrame.velocity[1] * referenceFrame.velocity[1]);
            var theta = Math.atan2(referenceFrame.velocity[1], referenceFrame.velocity[0]),
                sinTheta = Math.sin(theta),
                cosTheta = Math.cos(theta),
                sin2Theta = sinTheta * sinTheta,
                cos2Theta = cosTheta * cosTheta;

            if (Math.abs(beta) > 1) {
                beta = 0.9999;
                referenceFrame.velocity[0] = beta * cosTheta;
                referenceFrame.velocity[1] = beta * sinTheta;

                theta = Math.atan2(referenceFrame.velocity[1], referenceFrame.velocity[0]),
                    sinTheta = Math.sin(theta),
                    cosTheta = Math.cos(theta),
                    sin2Theta = sinTheta * sinTheta,
                    cos2Theta = cosTheta * cosTheta;
            }
            gamma = Math.sqrt(1 - beta * beta);

            $vDisplay.text('v = ' + _.round(beta, 3) + 'c (' + _.round(referenceFrame.velocity[0],3) + ', ' + _.round(referenceFrame.velocity[1],3) + ')');
            $xDisplay.text('x = ' + _.round(referenceFrame.absolutePosition[0], 3) + ' y = ' + _.round(referenceFrame.absolutePosition[1], 3));


            referenceFrame.absolutePosition[0] += referenceFrame.velocity[0] * timeSinceLastFrame;
            referenceFrame.absolutePosition[1] += referenceFrame.velocity[1] * timeSinceLastFrame;
            referenceFrame.properTime = timeElapsed;
            referenceFrame.currentTime = 0;
            referenceFrame.relativePosition = [0,0];

            objects.map(function(object){
                if(!object.reference) {
                    if(options.useLorentzBoost){
                        var vFX = referenceFrame.velocity[0],
                            vFY = referenceFrame.velocity[1],
                            tF = referenceFrame.properTime,
                            xF = referenceFrame.absolutePosition[0],
                            yF = referenceFrame.absolutePosition[1],
                            vX = object.velocity[0],
                            vY = object.velocity[1],
                            t0 = object.properTime,
                            x0 = object.absolutePosition[0],
                            y0 = object.absolutePosition[1],
                            t = (vX*vFX*(t0 - x0/vX) + vY*vFY*(t0-y0/vY) - (tF - vFX*xF - vFY*yF)) / (vX*vFX + vY*vFY - 1),
                            x = vX*(t - (t0 - x0/vX)),
                            y = vY*(t - (t0 - y0/vY)),
                            dt = t - referenceFrame.properTime,
                            dx = x - referenceFrame.absolutePosition[0],
                            dy = y - referenceFrame.absolutePosition[1],
                            xPrime = -beta * gamma * cosTheta * dt + (gamma * cos2Theta + sin2Theta) * dx + (gamma - 1) * sinTheta * cosTheta * dy,
                            yPrime = -beta * gamma * sinTheta * dt + (gamma * sin2Theta + cos2Theta) * dy + (gamma - 1) * sinTheta * cosTheta * dx,
                            tPrime = gamma * dt + -gamma * beta * cosTheta * dx + -gamma * beta * sinTheta * dy;;

                        // console.log(x,y,t);
                        object.absolutePosition = [x,y];
                        object.properTime = t;
                        object.relativePosition = [
                            xPrime,
                            yPrime
                        ];
                        object.currentTime = tPrime;
                    } else {
                        object.absolutePosition[0] += object.velocity[0] * timeSinceLastFrame;
                        object.absolutePosition[1] += object.velocity[1] * timeSinceLastFrame;
                        object.properTime = timeElapsed;

                        object.relativePosition = [
                            (object.absolutePosition[0] - referenceFrame.absolutePosition[0]),
                            (object.absolutePosition[1] - referenceFrame.absolutePosition[1])
                        ];
                        object.currentTime = 0;
                    
                    }
                    
                }
            });

            events.map(function (event) {
                var time = event.absolutePosition[2] - timeElapsed;
                event.relativePosition = [
                    event.absolutePosition[0] - referenceFrame.absolutePosition[0] - referenceFrame.velocity[0]*time,
                    event.absolutePosition[1] - referenceFrame.absolutePosition[1] - referenceFrame.velocity[1]*time,
                    time
                ];
                if (options.useLorentzBoost) {
                    var x = event.relativePosition[0],
                        y = event.relativePosition[1],
                        t = event.relativePosition[2],
                        xF = referenceFrame.absolutePosition[0],
                        yF = referenceFrame.absolutePosition[1],
                        xPrime = -beta * gamma * cosTheta * t + (gamma * cos2Theta + sin2Theta) * x + (gamma - 1) * sinTheta * cosTheta * y,
                        yPrime = -beta * gamma * sinTheta * t + (gamma * sin2Theta + cos2Theta) * y + (gamma - 1) * sinTheta * cosTheta * x,
                        tPrime = gamma * t + -gamma * beta * cosTheta * x + -gamma * beta * sinTheta * y;

                    event.relativePosition = [
                        xPrime,
                        yPrime,
                        tPrime
                    ];
                }
            });

            updateFrame = setTimeout(update, 50);
        }


        setTimeout(updateEvents, (1/options.updatesPerSecond) * 1000);
        function updateEvents() {

            objects.map(function (object) {
                events.push({
                    absolutePosition: [object.absolutePosition[0], object.absolutePosition[1], object.properTime],
                    relativePosition: [0, 0, 0],
                    color: object.color,
                    size: object.size-2
                });
            });

            clearTimeout(updateFrame);
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
        var warpShader = mathbox.shader({
            code: '#sr-debug',
        }, {
            vFrame: function(){
                return player.velocity;
            },
            tFrame: function(){
                return player.properTime;
            },
            xFrame: function(){
                return player.absolutePosition[0];
            },
            yFrame: function(){
                return player.absolutePosition[1];
            },
            debugSR: function () {
                return options.debugSR ? 1 : 0;
            },
        });
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
                .axis({
                    axis: 3,
                    detail: 64
                })
                .grid({
                    axes: [1,3],
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
                width: numItems,
                expr: function (emit, i, t) {
                    options.debugSR
                        ? emit(objects[i].absolutePosition[0], objects[i].properTime, -objects[i].absolutePosition[1])
                        : emit(objects[i].relativePosition[0], objects[i].currentTime, -objects[i].relativePosition[1]);
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
                        (!options.clipEvents || 
                        Math.abs(events[i].relativePosition[0]) < options.stRadius &&
                        Math.abs(events[i].relativePosition[1]) < options.stRadius &&
                        Math.abs(events[i].relativePosition[2]) < options.stRadius)) {
                            options.debugSR
                                ? emit(events[i].absolutePosition[0], events[i].absolutePosition[2], -events[i].absolutePosition[1])
                                : emit(events[i].relativePosition[0], events[i].relativePosition[2], -events[i].relativePosition[1]);
                    }
                }
            }).array({
                id: 'eventColors',
                width: 1e4,
                channels: 4,
                expr: function (emit, i, t) {
                    if (i < events.length) {
                        if (i < events.length &&
                            (!options.clipEvents || 
                            Math.abs(events[i].relativePosition[0]) < options.stRadius &&
                            Math.abs(events[i].relativePosition[1]) < options.stRadius &&
                            Math.abs(events[i].relativePosition[2]) < options.stRadius)) {
                            var color = events[i].color;
                            emit(color[0], color[1], color[2], 1.0);
                        }
                    }
                }
            })
            .point({
                points: '#events',
                // color: 0x3090FF,
                colors: '#eventColors',
                size: 10
            });

        

        view.area({
            channels: 3,
            width: 10,
            height: 10,
            expr: function (emit, x, y) {
                if(options.debugSR) {
                    var t = (x*player.velocity[0]) + (y*player.velocity[1]) + (player.properTime - (player.velocity[0]*player.absolutePosition[0]) - (player.velocity[1]*player.absolutePosition[1]));
                    emit(x, t, -y);
                }
            }
        }).surface({
            color: 0x0000FF,
            opacity: 0.5

        })

        view.interval({
            channels: 3,
            width: 10,
            expr: function (emit, t) {
                if(options.debugSR) {
                    var object = objects[1];
                    var x = object.velocity[0]*(t - (object.properTime - object.absolutePosition[0]/object.velocity[0]));
                    var y = object.velocity[1]*(t - (object.properTime - object.absolutePosition[1]/object.velocity[1]));
                    emit(x, t, -y);
                }
            }
        }).line({
            color: 0xFF0000,
        });

        view.array({
            channels: 3,
            width: 1,
            expr: function (emit) {
                if(options.debugSR) {
                    var obj = objects[1],
                        vFX = player.velocity[0],
                        vFY = player.velocity[1],
                        tF = player.properTime,
                        xF = player.absolutePosition[0],
                        yF = player.absolutePosition[1],
                        vX = obj.velocity[0],
                        vY = obj.velocity[1],
                        t0 = obj.properTime,
                        x0 = obj.absolutePosition[0],
                        y0 = obj.absolutePosition[1],
                        t = (vX*vFX*(t0 - x0/vX) + vY*vFY*(t0-y0/vY) - (tF - vFX*xF - vFY*yF)) / (vX*vFX + vY*vFY - 1),
                        x = vX*(t - (t0 - x0/vX)),
                        y = vY*(t - (t0 - y0/vY));
                    emit(x,t, -y);
                }
            }
        }).point({
            color: 0x00FF00,
            size: 20
        })

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