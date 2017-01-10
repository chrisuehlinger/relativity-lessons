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

    three.renderer.setClearColor(new THREE.Color(0xFFFFFF), 1.0);

    view = mathbox
        .set({
            focus: 3
        })
        .camera({
            proxy: true,
            position: [0, 0, 3],
        })
        .polar({
            bend: 1,
            range: [[-2 * π, 2 * π], [0, 100], [-50, 50]],
            scale: [1, 1, 1],
            helix: 0,
        });


    view.transform({
        position: [0, .5, 0],
    }).axis({
        detail: 256,
    })
        .scale({
            divide: 10,
            unit: π,
            base: 2,
        })
        .ticks({
            width: 2,
            classes: ['foo', 'bar'],
        })
        .ticks({
            opacity: .5,
            width: 1,
            size: 50,
            normal: [0, 1, 0],
            classes: ['foo', 'bar'],
        });

    view.axis({
        axis: 2,
    });
    view.transform({
        position: [π / 2, 0, 0],
    }).axis({
        axis: 2,
    });
    view.transform({
        position: [-π / 2, 0, 0],
    }).axis({
        axis: 2,
    });

    view
        .area({
            width: 50,
            height: 50,
            expr: function (emit, theta, r, i, j, time, delta) {
                var rS = 9 * Math.sin(time) + 11;
                if ((r - rS) > 0) {
                    var w = 2 * Math.sqrt(rS * (r - rS));
                    emit(theta, r, w);
                }
            },
            channels: 3
        })
        .surface({
            color: '#f00',
            opacity: .75,
            lineX: true,
            lineY: true,
            fill: false,
            zBias: -10,
        });

    view.grid({
        divideX: 5,
        detailX: 256,
        width: 1,
        opacity: 0.5,
        unitX: π,
        baseX: 2,
        zBias: -5,
        zOrder: -2
    });

} (lodash);