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


var transitionDuration = 1000,
    inTransition = false,
    transitionFrame,
    transitionAF,
    transitionEndTimeout;
function changeFrame(index){
    var startFrame = lodash.cloneDeep(objects.filter(function (obj) { return obj.reference; })[0] || {
        absolutePosition: 0,
        velocity: 0,
        absoluteTime: timeElapsed,
        properTime: timeElapsed,
    }),
    endFrame = lodash.cloneDeep(objects[index]),
    transitionStartTime = Date.now();

    if(inTransition){
        cancelAnimationFrame(transitionAF);
        clearTimeout(transitionEndTimeout);
        startFrame = transitionFrame;
    }
    inTransition = true;

    objects.map(function(object) { object.reference = false; });

    (function transition(){
        var t = Math.min(1, (Date.now() - transitionStartTime) / transitionDuration);
        transitionFrame = {
            absolutePosition: startFrame.absolutePosition + t*(endFrame.absolutePosition - startFrame.absolutePosition),
            velocity: startFrame.velocity + t*(endFrame.velocity-startFrame.velocity),
            absoluteTime: startFrame.absoluteTime + t*(Math.max(startFrame.absoluteTime, endFrame.absoluteTime) - startFrame.absoluteTime),
        };
        transitionAF = requestAnimationFrame(transition);
    })()

    transitionEndTimeout = setTimeout(function(){
        cancelAnimationFrame(transitionAF);
        objects[index].reference = true;
        inTransition = false;
    }, transitionDuration);
    
}

function initSimulation() {
    var lastFrameTime = startTime = Date.now();
    var updateFrame = requestAnimationFrame(update);


    var $orientationDisplay = $('<div></div>');
    var $vDisplay = $('<div></div>');
    var $xDisplay = $('<div></div>');
    var $tDisplay = $('<div></div>');
    var $tauDisplay = $('<div></div>');
    var $display = $('<div class="info-display"></div>')
        .append($orientationDisplay)
        .append($vDisplay)
        .append($xDisplay)
        .append($tauDisplay)
        .append($tDisplay);
    $('body').append($display);

    window.addEventListener("deviceorientation", handleOrientation, true);

    function handleOrientation(e){
        $orientationDisplay.text('a = ' + lodash.round(e.alpha,0) + ' B = ' + lodash.round(e.beta,0) + ' y = ' + lodash.round(e.gamma,0));
        thrustSign = e.beta/45;
    }
    
    function update() {
        var timeSinceLastFrame = options.timeFactor * (Date.now() - lastFrameTime) / 1000;
        timeElapsed += timeSinceLastFrame;
        lastFrameTime = Date.now();

        var referenceFrame = inTransition ? transitionFrame : (objects.filter(function (obj) { return obj.reference; })[0] || {
            absolutePosition: 0,
            velocity: 0,
            thrust: 0,
            mass: 1,
            absoluteTime: timeElapsed,
            properTime: timeElapsed,
        });

        var gamma = 1/Math.sqrt(1 - player.velocity * player.velocity);
        if(thrustSign !== 0) {
            var relThrust = player.thrust / (gamma * player.mass);
            player.velocity += thrustSign * relThrust * timeSinceLastFrame;
            player.velocity = Math.max(Math.min(player.velocity, 0.999999999999), -0.999999999999);
        }

        var vFrame = referenceFrame.velocity;
        gamma = 1/Math.sqrt(1 - vFrame*vFrame);
        var tau = timeElapsed;
        var tFrame = referenceFrame.absoluteTime + gamma*(timeSinceLastFrame + vFrame*0);
        var xFrame = referenceFrame.absolutePosition + gamma*(0 + vFrame*timeSinceLastFrame);
        
        referenceFrame.absolutePosition += gamma*vFrame*timeSinceLastFrame;
        referenceFrame.absoluteTime += gamma*timeSinceLastFrame;
        referenceFrame.properTime += timeSinceLastFrame;
        referenceFrame.relativePosition = 0;
        referenceFrame.currentTime = 0;
        if (options.useLorentzTransform) {
            referenceFrame.absolutePosition = xFrame;
            referenceFrame.absoluteTime = tFrame;
        }

        $vDisplay.text('v = ' + lodash.round(referenceFrame.velocity, 12) + 'c');
        $xDisplay.text('x = ' + lodash.round(referenceFrame.absolutePosition, 3));
        $tauDisplay.text('tau = ' + displayTime(referenceFrame.properTime));
        $tDisplay.text('t = ' + displayTime(tFrame));

        blackHoles.map(function (object) {
            var v = object.velocity;
            if (options.useBlackHoles) {
                // Calculated using Gullstrand-Painlevé coordinates
                var r = Math.abs(object.absolutePosition - referenceFrame.absolutePosition);
                var sign = Math.sign(object.absolutePosition - referenceFrame.absolutePosition);
                var t = r > 0 ? sign * Math.sqrt(blackHole.radius / r) : 0;
                v = (v + 1) * (1 - t) - 1;
                // console.log(sign, lodash.round(t,3), lodash.round(v,3));
            }
            // console.log(v);
            referenceFrame.absolutePosition -= v*timeSinceLastFrame;

            object.relativePosition = (object.absolutePosition - referenceFrame.absolutePosition);
        });

        objects.map(function (object, i) {
            if (!object.reference) {
                var v = object.velocity;
                if (options.useBlackHoles) {
                    // Calculated using Gullstrand-Painlevé coordinates
                    var r = Math.abs(object.absolutePosition - blackHole.absolutePosition);
                    var sign = Math.sign(object.absolutePosition - blackHole.absolutePosition);
                    var t = r > 0 ? sign * (1 - blackHole.radius / r) * Math.sqrt(blackHole.radius / r) : 0;
                    v = (v + 1) * (1 - t / 2) - 1;
                    // console.log(sign, lodash.round(t, 3), lodash.round(v, 3));
                    if (r < 0.1) {
                        objects.splice(objects.indexOf(object), 1);
                        return;
                    }
                }

                object.absolutePosition += v * timeSinceLastFrame;
                object.absoluteTime += timeSinceLastFrame;
                object.relativePosition = (object.absolutePosition - referenceFrame.absolutePosition);
                object.currentTime = 0;
                object.properTime = timeElapsed;

                if (options.useLorentzTransform) {
                    var x0 = object.absolutePosition,
                        t0 = object.absoluteTime,
                        x = ((t0 - x0/v) - (tFrame - vFrame*xFrame))/(vFrame - 1/v),
                        t = x/v + (t0 - x0/v),
                        dx = (x - referenceFrame.absolutePosition),
                        dt = (t - referenceFrame.absoluteTime),
                        xPrime = gamma*(dx - vFrame*dt),
                        tPrime = gamma*(dt - vFrame*dx),
                        objGamma = 1/Math.sqrt(1-v*v),
                        objTau = objGamma*(t - v*x);

                    object.absolutePosition = x;
                    object.absoluteTime = t;

                    object.relativePosition = xPrime;
                    object.currentTime = tPrime;

                    object.properTime = objTau;
                    // console.log(x0, v, x0/v)
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
                // i === 50 && console.log(sign, lodash.round(t,3), lodash.round(v,3));
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
                    dt = t - referenceFrame.absoluteTime,
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
                // i === 50 && console.log(sign, lodash.round(t,3), lodash.round(v,3));
            }
            // event.absolutePosition[0] += v*(timeSinceLastFrame);

            // Galillean Relativity
            event.relativePosition = [
                event.absolutePosition[0] + v * (event.absolutePosition[1] - timeElapsed) - referenceFrame.absolutePosition,
                event.absolutePosition[1] - timeElapsed
            ];

            // Special Relativity
            if (options.useLorentzTransform) {
                var x = event.absolutePosition[0] + v * (event.absolutePosition[1] - timeElapsed),
                    t = event.absolutePosition[1],
                    dx = x - referenceFrame.absolutePosition,
                    dt = t - referenceFrame.absoluteTime,
                    xPrime = gamma*(dx - vFrame*dt),
                    tPrime = gamma*(dt - vFrame*dx);
                event.relativePosition = [
                    xPrime,
                    tPrime
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
                absolutePosition: [object.absolutePosition, object.absoluteTime],
                relativePosition: [0, 0],
                velocity: object.velocity,
                color: object.color,
                size: object.size
            });
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