lodash = _;
lodash.noConflict();

mathbox = mathBox({
    plugins: ['core', 'controls', 'cursor', 'stats'],
    controls: {
        klass: THREE.OrbitControls
    },
});
three = mathbox.three;
three.camera.position.set(0, 0, 3);
three.renderer.setClearColor(new THREE.Color(0xffffff), 1.0);

function displayTime(t){
    var absT = Math.abs(t);
    if(absT === Infinity){
        t = '\u221e';
    } else if (absT > 31557600) {
        t = lodash.floor(t/31557600) + 'year' +  lodash.floor((t%31557600)/86400) + 'day';
    } else if (absT > 86400) {
        t = lodash.floor(t/86400) + 'day' +  lodash.floor((t%86400)/3600) + 'hr';
    } else if (absT > 3600) {
        t = lodash.floor(t/3600) + 'hr' +  lodash.floor((t%3600)/60) + 'm';
    } else if (absT > 60) {
        t = lodash.floor(t/60) + 'm' +  lodash.floor(t%60) + 's';
    } else if (absT > 1) {
        t = lodash.floor(t) + 's';
    } else {
        t = lodash.round(t,2) + 's';
    }
    return t;
}

function initDiagram() {
    var lorentzShader = mathbox.shader({
        code: '#lorentz-transform',
    }, {
        vFrame: function(){
            var referenceFrame = inTransition ? transitionFrame : (objects.filter(function (obj) { return obj.reference; })[0] || {
                absolutePosition: 0,
                velocity: 0,
                thrust: 0,
                mass: 1,
                absoluteTime: timeElapsed,
                properTime: timeElapsed,
            });
            return referenceFrame.velocity;
        },
        tFrame: function(){
            var referenceFrame = inTransition ? transitionFrame : (objects.filter(function (obj) { return obj.reference; })[0] || {
                absolutePosition: 0,
                velocity: 0,
                thrust: 0,
                mass: 1,
                absoluteTime: timeElapsed,
                properTime: timeElapsed,
            });
            return referenceFrame.absoluteTime;
        },
        xFrame: function(){
            var referenceFrame = inTransition ? transitionFrame : (objects.filter(function (obj) { return obj.reference; })[0] || {
                absolutePosition: 0,
                velocity: 0,
                thrust: 0,
                mass: 1,
                absoluteTime: timeElapsed,
                properTime: timeElapsed,
            });
            return referenceFrame.absolutePosition;
        },
        debugSR: function () {
            return options.debugSR ? 1 : 0;
        },

    });
    var blackHoleShader = mathbox.shader({
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
        .vertex({
            pass:'data',
            shader:blackHoleShader
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
        .end();
    
    view
        .array({
            id: 'currentPosition',
            width: 50,
            expr: function (emit, i, t) {
                if (i < objects.length) {
                    options.debugSR 
                        ? emit(objects[i].absolutePosition, objects[i].absoluteTime)
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
        })
        .text({
            font: 'Helvetica',
            width:  50,
            height: 5,
            depth:  2,
            expr: function (emit, i) {
                if(i < objects.length) {
                    emit(displayTime(objects[i].properTime));
                }
            },
        })
        .label({
            color: '#000000',
            points: '#currentPosition',
            snap: false,
            outline: 2,
            size: 20,
            offset: [32, 32],
            depth: .5,
            zIndex: 1,
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
            if (options.useBlackHoles && i < blackHoles.length) {
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

    view
    .group({
        id:'srDebugGrid'
    }, {
        visible: function(){
            return options.debugSR;
        }
    })
        .vertex({
            pass: 'data',
            shader: lorentzShader
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
        });

    view.interval({
        channels: 2,
        width: 10,
        expr: function (emit, x) {
            if(options.debugSR) {
                var t = (x*player.velocity) + (player.absoluteTime - (player.velocity*player.absolutePosition));
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
                var x = object.velocity*(t - (object.absoluteTime - object.absolutePosition/object.velocity));
                // var t = (x/object.velocity) + (object.absoluteTime - (object.absolutePosition/object.velocity));
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
                    tF = player.absoluteTime,
                    xF = player.absolutePosition,
                    v = obj.velocity,
                    t0 = obj.absoluteTime,
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