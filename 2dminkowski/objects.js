var player = {
    absolutePosition: [0, 0],
    relativePosition: [0, 0],
    absoluteTime: 0,
    properTime: 0,
    mass: 100,
    thrust: 5,
    velocity: [0, 0],
    color: [0, 0, 255],
    size: 5,
    reference: options.useRelativity
},
others = lodash.fill(Array(1), 0).map(function () {
    // var pos = [Math.random() * 20 - 10, Math.random() * 20 - 10];
    var pos = [5,0];
    return {
        absolutePosition: pos,
        relativePosition: pos,
        absoluteTime: 0,
        properTime: 0,
        velocity: [0.000000001, 0.000000001],
        color: [100, 0, 0],
        size: 4,
        reference: false
    };
}),
events = lodash.fill(Array(0), 0).map(function () {
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