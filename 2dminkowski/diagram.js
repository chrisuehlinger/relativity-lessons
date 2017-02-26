lodash = _;
lodash.noConflict();

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

function initDiagram(numItems) {
    mathbox = mathBox({
        plugins: ['core', 'controls', 'cursor', 'stats'],
        controls: {
            klass: THREE.OrbitControls
        },
        // camera: {
        //     type:'orthographic'
        // }
    });
    three = mathbox.three;
    three.camera.position.set(0, 1, 1);
    three.renderer.setClearColor(new THREE.Color(0xffffff), 1.0);
    var warpShader = mathbox.shader({
        code: '#sr-debug',
    }, {
        vFrame: function(){
            return player.velocity;
        },
        tFrame: function(){
            return player.absoluteTime;
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
        .axis({
            axis: 1
        }).axis({
            axis: 2
        }).axis({
            axis: 3
        })
        // .transform({
        //     position: [0, -options.stRadius, 0]
        // }).grid({
        //     axes: [1, 3],
        //     divideX: 2 * options.stRadius,
        //     divideY: 2 * options.stRadius,
        //     width: 1,
        //     opacity: 0.5,
        // })
        // .end()
        // .transform({
        //     position: [0, options.stRadius, 0]
        // }).grid({
        //     axes: [1, 3],
        //     divideX: 2 * options.stRadius,
        //     divideY: 3 * options.stRadius,
        //     width: 1,
        //     opacity: 0.5,
        // })
        // .end();

    var maxSize = 150;
    view.matrix({
        id:'sprites',
        width: maxSize,
        height: maxSize,
        // items: 10,
        channels:4,
        live:false,
        expr: function(emit,x,y){

            var sprite = sprites[0],
                scaledX = x - Math.round((maxSize - sprite.image.width)/2),
                scaledY = y - Math.round((maxSize - sprite.image.height)/2);
            if(scaledX >= 0 && scaledX < sprite.image.width 
                && scaledY >= 0 && scaledY < sprite.image.height){
                var i = 4*(scaledX+scaledY*sprite.image.width);
                var data = sprite.image.data;
                emit(data[i]/256,data[i+1]/256,data[i+2]/256,data[i+3]/256);
            } else {
                emit(0,0,0,0);
            }
            // objects.map(function(object){
            //     var sprite = sprites[0],
            //         scaledX = x - Math.round((maxSize - sprite.image.width)/2),
            //         scaledY = y - Math.round((maxSize - sprite.image.height)/2);
            //     if(scaledX >= 0 && scaledX < sprite.image.width 
            //         && scaledY >= 0 && scaledY < sprite.image.height){
            //         var i = 4*(scaledX+scaledY*sprite.image.width);
            //         var data = sprite.image.data;
            //         emit(data[i]/256,data[i+1]/256,data[i+2]/256,data[i+3]/256);
            //     } else {
            //         emit(0,0,0,0);
            //     }
            // });
            // for(var j = objects.length; j < 10; j++){
            //     var sprite = sprites[0],
            //         scaledX = x - Math.round((maxSize - sprite.image.width)/2),
            //         scaledY = y - Math.round((maxSize - sprite.image.height)/2);
            //     if(scaledX >= 0 && scaledX < sprite.image.width 
            //         && scaledY >= 0 && scaledY < sprite.image.height){
            //         var i = 4*(scaledX+scaledY*sprite.image.width);
            //         var data = sprite.image.data;
            //         emit(data[i]/256,data[i+1]/256,data[i+2]/256,data[i+3]/256);
            //     } else {
            //         emit(0,0,0,0);
            //     }
            // }
        }
    });

    view.matrix({
        id:'spritePositions',
        width:2,
        height:2,
        items:10,
        expr: function(emit,x,y){
            x = Math.pow(-1,x);
            y = Math.pow(-1,y);

            objects.map(function(object){
                var scale =1,
                theta = Math.atan2(object.velocity[1], object.velocity[0]),
                xPrime = x*Math.cos(theta) - y*Math.sin(theta),
                yPrime = y*Math.cos(theta) + x*Math.sin(theta);

                options.debugSR 
                        ? emit(object.absolutePosition[0]+scale*yPrime, object.absoluteTime+scale*Math.pow(-1,x), -object.absolutePosition[1]+scale*xPrime)
                        : emit(object.relativePosition[0]+scale*yPrime, 0, -object.relativePosition[1]+scale*xPrime);
            });
            for(var i = objects.length; i < 10; i++){
                emit(0,0,0);
            }
        }
    }).surface({
        blending:'normal',
        color:0xFFFFFF,
        zOrder:10,
        zTest: false,
        points:'#spritePositions',
        map:'#sprites'
    });

    view.matrix({
        id:'spriteEventPositions',
        width:2,
        height:2,
        items:1000,
        expr: function(emit,x,y){
            var i = 0;
            x = Math.pow(-1,x);
            y = Math.pow(-1,y);
            events.map(function(event){
                if(i < 1000 && (!options.clipEvents || 
                    Math.abs(event.relativePosition[0]) < options.stRadius &&
                    Math.abs(event.relativePosition[1]) < options.stRadius &&
                    Math.abs(event.relativePosition[2]) < options.stRadius)) {
                    var scale = 0.75,
                        theta = Math.atan2(event.velocity[1], event.velocity[0]),
                        xPrime = x*Math.cos(theta) - y*Math.sin(theta),
                        yPrime = y*Math.cos(theta) + x*Math.sin(theta)
                    options.debugSR 
                            ? emit(event.absolutePosition[0]+scale*yPrime, event.absolutePosition[2], -event.absolutePosition[1]+scale*xPrime)
                            : emit(event.relativePosition[0]+scale*yPrime, event.relativePosition[2], -event.relativePosition[1]+scale*xPrime);
                    i++;
                }
            });
            for(; i < 1000; i++){
                emit(0,0,0);
            }
        }
    }).surface({
        blending:'normal',
        color:0xFFFFFF,
        zOrder:9,
        zTest: false,
        opacity:0.5,
        points:'#spriteEventPositions',
        map:'#sprites'
    });

    view
        .array({
            id: 'currentPosition',
            width: numItems,
            expr: function (emit, i, t) {
                options.debugSR
                    ? emit(objects[i].absolutePosition[0], objects[i].absoluteTime, -objects[i].absolutePosition[1])
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
        // .point({
        //     points: '#currentPosition',
        //     // color: 0x3090FF,
        //     colors: '#objectColors',
        //     size: 10,
        //     zBias: 1
        // })
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
        })

    // view
    //     .array({
    //         id: 'events',
    //         channels: 3,
    //         width: 1e4,
    //         expr: function (emit, i, t) {
    //             if (i < events.length &&
    //                 (!options.clipEvents || 
    //                 Math.abs(events[i].relativePosition[0]) < options.stRadius &&
    //                 Math.abs(events[i].relativePosition[1]) < options.stRadius &&
    //                 Math.abs(events[i].relativePosition[2]) < options.stRadius)) {
    //                     options.debugSR
    //                         ? emit(events[i].absolutePosition[0], events[i].absolutePosition[2], -events[i].absolutePosition[1])
    //                         : emit(events[i].relativePosition[0], events[i].relativePosition[2], -events[i].relativePosition[1]);
    //             }
    //         }
    //     }).array({
    //         id: 'eventColors',
    //         width: 1e4,
    //         channels: 4,
    //         expr: function (emit, i, t) {
    //             if (i < events.length) {
    //                 if (i < events.length &&
    //                     (!options.clipEvents || 
    //                     Math.abs(events[i].relativePosition[0]) < options.stRadius &&
    //                     Math.abs(events[i].relativePosition[1]) < options.stRadius &&
    //                     Math.abs(events[i].relativePosition[2]) < options.stRadius)) {
    //                     var color = events[i].color;
    //                     emit(color[0], color[1], color[2], 1.0);
    //                 }
    //             }
    //         }
    //     })
    //     .point({
    //         points: '#events',
    //         // color: 0x3090FF,
    //         colors: '#eventColors',
    //         size: 10
    //     });

    

    view.area({
        channels: 3,
        width: 10,
        height: 10,
        expr: function (emit, x, y) {
            if(options.debugSR) {
                var t = (x*player.velocity[0]) + (y*player.velocity[1]) + (player.absoluteTime - (player.velocity[0]*player.absolutePosition[0]) - (player.velocity[1]*player.absolutePosition[1]));
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
                var x = object.velocity[0]*(t - (object.absoluteTime - object.absolutePosition[0]/object.velocity[0]));
                var y = object.velocity[1]*(t - (object.absoluteTime - object.absolutePosition[1]/object.velocity[1]));
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
                    tF = player.absoluteTime,
                    xF = player.absolutePosition[0],
                    yF = player.absolutePosition[1],
                    vX = obj.velocity[0],
                    vY = obj.velocity[1],
                    t0 = obj.absoluteTime,
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
        items: 1,
        live: false,
        expr: function(emit,t,theta){
            theta = Math.PI*theta/10;
            var x = t*Math.cos(theta);
            var y = t*Math.sin(theta);
            emit(x,t,-y);
        }
    }).surface({
        color: [100, 0, 100],
        opacity: 0.5,
        lineX: true,
        lineY: true,
        fill: false
    }, {
        visible: function () {
            return options.showLightCones;
        }
    });
}