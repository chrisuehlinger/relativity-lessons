lodash = _;
_.noConflict();

!function (_) {

    mathbox = mathBox({
        plugins: ['core', 'controls', 'cursor', 'stats'],
        controls: {
            klass: THREE.OrbitControls
        },
    });
    three = mathbox.three;

    three.renderer.setClearColor(new THREE.Color(0xFFFFFF), 1.0);

    var rS = 2,
        r0 = 5,
        v0 = 0.61,
        R = rS / (rS/r0 - v0*v0),
        Q = Math.sqrt(R/rS - 1),
        a0 = Math.acos(2*r0/R - 1),
        tau0 = (R/2)*Math.sqrt(R/rS)*(a0 + Math.sin(a0)),
        t0 = (R/2 + rS)*Q*a0 + (R/2)*Q*Math.sin(a0) + rS*Math.log(Math.abs((Q + Math.tan(a0/2))/(Q - Math.tan(a0/2))))
    console.log({r0,v0,R, a0, tau0, t0});

    var view = mathbox
        .set({
            focus: 3
        })
        .camera({
            proxy: true,
            position: [0, 3, 3],
        })
        .cartesian({
            range: [[0, 12], [-60, 60], [-60, 60]],
            scale: [1, 1, 1],
        })
        .grid({
            axes: [1, 3]
        })
        .axis({
                axis: 1
            }).axis({
                axis: 3
            })

    // tau(r)
    view
        .interval({
            width: 4000,
            channels:3,
            items: 2,
            live:false,
            expr: function(emit, r){
                var a = Math.acos(2*r/R - 1),
                    tau = (R/2)*Math.sqrt(R/rS)*(a + Math.sin(a));
                // console.log(r,tau);
                emit(r, 0, tau - tau0);
                emit(r, 0, -tau - tau0);
            }
        })
        .line({
            color: '#0f0'
        })

    // t(r)
    view
        .interval({
            width: 8192,
            channels:3,
            items: 2,
            live: false,
            expr: function(emit, r){
                var a = Math.acos(2*r/R - 1),
                    t = (R/2 + rS)*Q*a + (R/2)*Q*Math.sin(a) + rS*Math.log(Math.abs((Q + Math.tan(a/2))/(Q - Math.tan(a/2))));
                // console.log(r,t);
                emit(r, 0, t - t0);
                emit(r, 0, -t - t0);
            }
        })
        .line({
            color: '#00f'
        })

    // // t(tau_observer)
    // var tau_observer = 1;
    // view
    //     .interval({
    //         width: 1000,
    //         channels:3,
    //         items: 2,
    //         live: false,
    //         expr: function(emit, r){
    //             var a = Math.acos(2*r/R - 1),
    //                 t = (R/2 + rS)*Q*a + (R/2)*Q*Math.sin(a) + rS*Math.log(Math.abs((Q + Math.tan(a/2))/(Q - Math.tan(a/2))));
    //             // console.log(r,t);
    //             emit(r, 0, t);
    //             emit(r, 0, -t);
    //         }
    //     })
    //     .line({
    //         color: '#f00'
    //     })

    // rS
    view
        .interval({
            width: 2,
            channels:3,
            live: false,
            data:[[rS,0,-60], [rS,0,60]]
        })
        .line({
            color: '#f00'
        })

    // view
    //     .area({
    //         width: 20,
    //         height: 20,
    //         channels: 3,
    //         live:false,
    //         expr: function (emit, t, tau) {
    //             var r = rS*(1 + Math.exp((t - tau)/rS)),
    //                 a = Math.acos(2*r/R - 1),
    //                 x = (R/2 + rS)*Q*a + (R/2)*Q*Math.sin(a) + rS*Math.log(Math.abs((Q + Math.tan(a/2))/(Q - Math.tan(a/2)))) - t;

    //             emit(t,x,tau);
    //         }
    //     })
    //     .surface({
    //         color: '#f00',
    //         opacity: .75,
    //         lineX: true,
    //         lineY: true,
    //         fill: false,
    //         width: 1
    //         // zBias: -10,
    //     });
} (lodash);