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
        useRelativity: true,
        debugSR: false,
        useLorentzTransform: true,
        useBlackHoles: false,
        showLightCones: true
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
    gui.add(options, 'useLorentzTransform');
    gui.add(options, 'useBlackHoles');
    gui.add(options, 'showLightCones');
    // gui.close();


    var timerStarted = false,
        timerEnded = false,
        timeElapsed = 0;

    var player = {
        absolutePosition: 0,
        relativePosition: 0,
        velocity: 0.5,
        properTime:0,
        mass: 100,
        thrust: 5,
        color: [0, 0, 255],
        size: 5,
        reference: options.useRelativity
    },
        others = _.fill(Array(0), 0).map(function (thing, i) {
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
        }).concat([
            {
                absolutePosition: -5,
                relativePosition: -5,
                velocity: 1,
                properTime: 0,
                color: [100, 0, 0],
                size: 4,
                reference: false
            },
            // {
            //     absolutePosition: -5,
            //     relativePosition: -5,
            //     velocity: 0,
            //     properTime: 0,
            //     color: [100, 0, 0],
            //     size: 4,
            //     reference: false
            // },
            {
                absolutePosition: 5,
                relativePosition: 5,
                velocity: 0.5,
                properTime: 0,
                color: [100, 0, 0],
                size: 4,
                reference: false
            },
            // {
            //     absolutePosition: 10,
            //     relativePosition: 10,
            //     velocity: -0.5,
            //     properTime: 0,
            //     color: [100, 0, 0],
            //     size: 4,
            //     reference: false
            // },
        ]),
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
        var pos = [Math.random()*20 - 10, Math.random() * 100 - 10];
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

    events.push({
        absolutePosition: [0,0],
        relativePosition: [0,0],
        velocity: 0,
        color: [100, 0, 100],
        size: 10
    });

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

        if(e.keyCode >= 48 && e.keyCode < 59) {
            changeFrame(e.keyCode-48);
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
                    absolutePosition: objects[0].absolutePosition,
                    relativePosition: 0,
                    velocity: 1,
                    color: [100, 0, 100],
                    size: 4,
                    reference: false
                });
                objects.push({
                    absolutePosition: objects[0].absolutePosition,
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

    function changeFrame(index){
        objects.map(function(object) { object.reference = false; });
        objects[index].reference = true;
    }

    function initSimulation() {
        var lastFrameTime = startTime = Date.now();
        var updateFrame = requestAnimationFrame(update);

        var $vDisplay = $('<div></div>');
        var $xDisplay = $('<div></div>');
        var $tDisplay = $('<div></div>');
        var $tauDisplay = $('<div></div>');
        var $display = $('<div class="info-display"></div>')
            .append($vDisplay)
            .append($xDisplay)
            .append($tauDisplay)
            .append($tDisplay);
        $('body').append($display);
        
        function update() {
            var timeSinceLastFrame = options.timeFactor * (Date.now() - lastFrameTime) / 1000;
            timeElapsed += timeSinceLastFrame;
            lastFrameTime = Date.now();

            var referenceFrame = objects.filter(function (obj) { return obj.reference; })[0] || {
                absolutePosition: 0,
                velocity: 0,
                thrust: 0,
                mass: 1,
                properTime: timeElapsed
            }

            var gamma = 1/Math.sqrt(1 - player.velocity * player.velocity);
            var relThrust = player.thrust / (gamma * player.mass);
            player.velocity += thrustSign * relThrust * timeSinceLastFrame;
            player.velocity = Math.max(Math.min(player.velocity, 0.99999999999999), -0.99999999999999);

            var vFrame = referenceFrame.velocity;
            gamma = 1/Math.sqrt(1 - vFrame*vFrame);
            var tau = timeElapsed;
            var tFrame = referenceFrame.properTime + gamma*(timeSinceLastFrame + vFrame*0);
            var xFrame = referenceFrame.absolutePosition + gamma*(0 + vFrame*timeSinceLastFrame);
            
            referenceFrame.absolutePosition += gamma*vFrame*timeSinceLastFrame;
            referenceFrame.properTime += gamma*timeSinceLastFrame;
            referenceFrame.relativePosition = 0;
            referenceFrame.currentTime = 0;
            if (options.useLorentzTransform) {
                referenceFrame.absolutePosition = xFrame;
                referenceFrame.properTime = tFrame;
            }

            $vDisplay.text('v = ' + _.round(referenceFrame.velocity, 3) + 'c');
            $xDisplay.text('x = ' + _.round(referenceFrame.absolutePosition, 3));
            $tauDisplay.text('tau = ' + _.round(tau, 3));
            $tDisplay.text('t = ' + _.round(tFrame, 3));

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
                    // if (options.useBlackHoles) {
                    //     // Calculated using Gullstrand-Painlevé coordinates
                    //     var r = Math.abs(object.absolutePosition - blackHole.absolutePosition);
                    //     var sign = Math.sign(object.absolutePosition - blackHole.absolutePosition);
                    //     var t = r > 0 ? sign * (1 - blackHole.radius / r) * Math.sqrt(blackHole.radius / r) : 0;
                    //     v = (v + 1) * (1 - t / 2) - 1;
                    //     console.log(sign, _.round(t, 3), _.round(v, 3));
                    //     if (r < 0.1) {
                    //         objects.splice(objects.indexOf(object), 1);
                    //         return;
                    //     }
                    // }


                    object.absolutePosition += v * timeSinceLastFrame;
                    object.properTime += timeSinceLastFrame;
                    object.relativePosition = (object.absolutePosition - referenceFrame.absolutePosition);
                    object.currentTime = 0;

                    if (options.useLorentzTransform) {
                        var x0 = object.absolutePosition,
                            t0 = object.properTime,
                            x = ((t0 - x0/v) - (tFrame - vFrame*xFrame))/(vFrame - 1/v),
                            t = x/v + (t0 - x0/v),
                            dx = (x - referenceFrame.absolutePosition),
                            dt = (t - referenceFrame.properTime),
                            xPrime = gamma*(dx - vFrame*dt),
                            tPrime = gamma*(dt - vFrame*dx);

                        object.absolutePosition = x;
                        object.properTime = t;

                        object.relativePosition = xPrime;
                        object.currentTime = tPrime;
                    }
                }
            });

            events.map(function (event, i) {
                var v = referenceFrame.velocity;
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
                    pos - v*time,
                    time
                ];

                // Special Relativity
                if (options.useLorentzTransform) {
                    var x = event.absolutePosition[0],
                        t = event.absolutePosition[1],
                        dx = x - referenceFrame.absolutePosition,
                        dt = t - referenceFrame.properTime,
                        xPrime = gamma*(dx - vFrame*dt),
                        tPrime = gamma*(dt - vFrame*dx);
                    event.relativePosition = [
                        xPrime,
                        tPrime
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
                if (options.useLorentzTransform) {
                    event.relativePosition = [
                        gamma * (event.relativePosition[0] - referenceFrame.velocity * event.relativePosition[1]),
                        gamma * (event.relativePosition[1] - referenceFrame.velocity * event.relativePosition[0])
                    ];
                }

            });
            updateFrame = requestAnimationFrame(update);
        }

        setTimeout(updateEvents, (1 / options.updatesPerSecond) * 1000);

        function updateEvents() {
            // var pos = [Math.random() * 20 - 10, Math.random() * 10];
            // events.push({
            //     absolutePosition: pos,
            //     relativePosition: pos,
            //     velocity: 0,
            //     color: [0, 100, 0],
            //     size: 4
            // });
            // events = [];

            objects.map(function (object, i) {
                events.push({
                    absolutePosition: [object.absolutePosition, object.properTime],
                    relativePosition: [0, 0],
                    velocity: object.velocity,
                    color: object.color,
                    size: object.size
                });
                // events.push({
                //     absolutePosition: [object.absolutePosition, object.properTime],
                //     relativePosition: [0, 0],
                //     velocity: object.velocity,
                //     color: [0,0,0],
                //     size: object.size
                // });
            });

            cancelAnimationFrame(updateFrame);
            update();
            setTimeout(updateEvents, (1 / options.updatesPerSecond) * 1000);
        }

        // setTimeout(function () {
        //     console.log('ADVANCE');
        //     cancelAnimationFrame(updateFrame);
        //     timerEnded = true;
        // }, options.timeLimit * 1000);
    }

    function initDiagram() {
        var warpShader = mathbox.shader({
            code: '#blackhole-curvature',
        }, {
                vFrame: function(){
                    return player.velocity;
                },
                tFrame: function(){
                    return player.properTime;
                },
                xFrame: function(){
                    return player.absolutePosition;
                },
                useBlackHoles: function () {
                    return options.useBlackHoles ? 1 : 0;
                },
                debugSR: function () {
                    return options.debugSR ? 1 : 0;
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
                        options.debugSR 
                            ? emit(objects[i].absolutePosition, objects[i].properTime)
                            : emit(objects[i].relativePosition, objects[i].currentTime);
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
                    (!options.clipEvents || 
                    Math.abs(events[i].relativePosition[0]) < options.stRadius &&
                    Math.abs(events[i].relativePosition[1]) < options.stRadius)) {
                        options.debugSR
                            ? emit(events[i].absolutePosition[0], events[i].absolutePosition[1])
                            : emit(events[i].relativePosition[0], events[i].relativePosition[1]);
                }
            }
        }).array({
            id: 'eventColors',
            width: 1e4,
            channels: 4,
            expr: function (emit, i, t) {
                if (i < events.length) {
                    if (i < events.length &&
                        (!options.clipEvents || Math.abs(events[i].relativePosition[0]) < options.stRadius &&
                    Math.abs(events[i].relativePosition[1]) < options.stRadius)) {
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

        view.interval({
            channels: 2,
            width: 10,
            expr: function (emit, x) {
                if(options.debugSR) {
                    var t = (x*player.velocity) + (player.properTime - (player.velocity*player.absolutePosition));
                    emit(x,t);
                }
            }
        }).line({
            color: 0x0000FF,
        })

        view.interval({
            channels: 2,
            width: 10,
            expr: function (emit, t) {
                if(options.debugSR) {
                    var object = objects[1];
                    var x = object.velocity*(t - (object.properTime - object.absolutePosition/object.velocity));
                    // var t = (x/object.velocity) + (object.properTime - (object.absolutePosition/object.velocity));
                    emit(x,t);
                }
            }
        }).line({
            color: 0xFF0000,
        })

        view.array({
            channels: 2,
            width: 1,
            expr: function (emit) {
                if(options.debugSR) {
                    var obj = objects[1],
                        vF = player.velocity,
                        tF = player.properTime,
                        xF = player.absolutePosition,
                        v = obj.velocity,
                        t0 = obj.properTime,
                        x0 = obj.absolutePosition,
                        x = ((t0 - x0/v) - (tF - vF*xF))/(vF - 1/v),
                        t = x/v + (t0 - x0/v);
                    emit(x,t);
                }
            }
        }).point({
            color: 0x00FF00,
            size: 20
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

