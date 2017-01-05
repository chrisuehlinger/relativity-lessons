lodash = _;
_.noConflict();

mathbox = mathBox({
    plugins: ['core', 'controls', 'cursor'],
    controls: {
        klass: THREE.OrbitControls
    },
});
three = mathbox.three;

three.renderer.setClearColor(new THREE.Color(0xFFFFFF), 1.0);

var view = mathbox
    .set({
        focus: 3
    })
    .camera({
        proxy: true,
        position: [0, 3, 3],
    })
    .cartesian({
        range: [[-10, 10], [-10, 10], [-10, 10]],
        scale: [1, 1, 1],
    })
    .grid({
        axes: [1, 3]
    })
    .area({
        width: 20,
        height: 20,
        channels: 3,
        expr: function (emit, x, y, i, j, t) {
            var singularity = [0, 0],
                rS = 1;

            var dx = singularity[0] - x,
                dy = singularity[1] - y,
                r = Math.sqrt(dx * dx + dy * dy);

            var w = -Infinity;

            if (r > rS) {
                w = 2 * Math.sqrt(rS * (r - rS));
            }

            emit(x, w - 7, y);
        }
    })
    .surface({
        color: '#f00',
        opacity: .75,
        lineX: true,
        lineY: true,
        fill: false,
        width: 1
        // zBias: -10,
    });