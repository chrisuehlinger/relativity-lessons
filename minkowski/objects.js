var player = {
    absolutePosition: 0,
    relativePosition: 0,
    velocity: 0,
    absoluteTime:0,
    properTime: 0,
    mass: 100,
    thrust: 5,
    color: [0, 0, 255],
    size: 5,
    reference: options.useRelativity
},
    others = lodash.fill(Array(0), 0).map(function (thing, i) {
        var pos = 5*Math.pow(-1, i);//Math.random()*20 - 10;
        return {
            absolutePosition: pos,
            relativePosition: pos,
            velocity: 0.5*(i+1),
            absoluteTime: 0,
            properTime: 0,
            color: [100, 0, 0],
            size: 4,
            reference: false
        };
    }).concat([
        // {
        //     absolutePosition: -5,
        //     relativePosition: -5,
        //     velocity: 1,
        //     absoluteTime: 0,
        //     properTime: 0,
        //     color: [100, 0, 0],
        //     size: 4,
        //     reference: false
        // },
        {
            absolutePosition: 5,
            relativePosition: 0,
            velocity: 0.000001,
            absoluteTime: 0,
            properTime: 0,
            color: [100, 0, 0],
            size: 4,
            reference: false
        },
        // {
        //     absolutePosition: 5,
        //     relativePosition: 5,
        //     velocity: 0.5,
        //     absoluteTime: 0,
        //     properTime: 0,
        //     color: [100, 0, 0],
        //     size: 4,
        //     reference: false
        // },
        // {
        //     absolutePosition: 10,
        //     relativePosition: 10,
        //     velocity: -0.5,
        //     absoluteTime: 0,
            // properTime: 0,
        //     color: [100, 0, 0],
        //     size: 4,
        //     reference: false
        // },
    ]),
    blackHole = {
        absolutePosition: -20,
        relativePosition: -20,
        velocity: 0,
        absoluteTime: 0,
        properTime: 0,
        radius: 2,
        color: [0, 0, 0],
        size: 4
    },
    blackHoles = [blackHole],
    bhmm = -10
    blackHoleEvents = lodash.fill(Array(options.useBlackHoles ? 300 : 0), 0).map(function (zero, i) {
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
    events = lodash.fill(Array(0), 0).map(function () {
    var pos = [Math.random()*20 - 10, Math.random() * 100 - 10];
        return {
            absolutePosition: pos,
            relativePosition: pos,
            velocity: 0,
            color: [0, 100, 0],
            size: 4
        };
    }).concat(lodash.fill(Array(0), 0).map(function () {
        var pos = [0.5 * hmm + 4, hmm];
        hmm++;
        return {
            absolutePosition: pos,
            relativePosition: pos,
            velocity: 0.5,
            color: [0, 100, 0],
            size: 4
        };
    })).concat(blackHoleEvents),
    objects = [player].concat(others),
    eventCount = events.length,
    objectCount = objects.length;

gui.add(player, 'velocity', -1, 1).listen();