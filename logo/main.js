mathbox = mathBox({
    plugins: ['core', 'controls', 'cursor', 'stats'],
    controls: {
    klass: THREE.OrbitControls
    },
});
three = mathbox.three;

three.renderer.setClearColor(new THREE.Color(0), 1.0);

view = mathbox
.set({
    scale: 720,
    focus: 5,
})
.camera({
    proxy: true,
    position: [0, 0, 2],
})
.cartesian({
    range: [[-1, 1], [-1, 1], [-1, 1]],
    scale: [1, 1, 1],
});

var startTime = Date.now();
var gridnoiseShader = mathbox.shader({
    code: '#circle-grid',
}, {
    t: function () {
        return (Date.now() - startTime)/1000;
    },

});


view
.fragment({
    pass:'eye',
    shader:gridnoiseShader
})
.area({
    width:16,
    height:16,
    channels:3,
    expr: function(emit, x, y){
        emit(x, y, 0);
    }
})
.surface({
    fill: false,
    lineX: true,
    lineY: true,
    color: 0xFFFFFF,
    width: 1,
});