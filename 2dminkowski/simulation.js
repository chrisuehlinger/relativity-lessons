var thrustSign = [0, 0];
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
            thrustSign = [-1, 0];
            break;
        case 87:
        case 38:
            thrustSign = [0, 1];
            break;
        case 68:
        case 39:
            thrustSign = [1, 0];
            break;
        case 83:
        case 40:
            thrustSign = [0, -1];
            break;
    }
}

window.onkeyup = function () {
    thrustSign = [0, 0];
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
        var timeSinceLastFrame = options.timeFactor*(Date.now() - lastFrameTime) / 1000;
        timeElapsed += timeSinceLastFrame;
        lastFrameTime = Date.now();

        var referenceFrame = objects.filter(function (obj) { return obj.reference; })[0] || {
            absolutePosition: [0, 0],
            velocity: [0, 0],
            absoluteTime: timeElapsed,
            properTime: timeElapsed,
            thrust: 0,
            mass: 10
        }
        var beta = Math.sqrt(referenceFrame.velocity[0] * referenceFrame.velocity[0] + referenceFrame.velocity[1] * referenceFrame.velocity[1]);
        var gamma = Math.sqrt(1 - beta * beta);
        var relThrust = player.thrust / (gamma * player.mass);
        player.velocity[0] += thrustSign[0] * relThrust * timeSinceLastFrame;
        player.velocity[1] += thrustSign[1] * relThrust * timeSinceLastFrame;
        beta = Math.sqrt(referenceFrame.velocity[0] * referenceFrame.velocity[0] + referenceFrame.velocity[1] * referenceFrame.velocity[1]);
        var theta = Math.atan2(referenceFrame.velocity[1], referenceFrame.velocity[0]),
            sinTheta = Math.sin(theta),
            cosTheta = Math.cos(theta),
            sin2Theta = sinTheta * sinTheta,
            cos2Theta = cosTheta * cosTheta;

        if (Math.abs(beta) > 1) {
            beta = 0.9999;
            referenceFrame.velocity[0] = beta * cosTheta;
            referenceFrame.velocity[1] = beta * sinTheta;

            theta = Math.atan2(referenceFrame.velocity[1], referenceFrame.velocity[0]),
                sinTheta = Math.sin(theta),
                cosTheta = Math.cos(theta),
                sin2Theta = sinTheta * sinTheta,
                cos2Theta = cosTheta * cosTheta;
        }
        gamma = Math.sqrt(1 - beta * beta);
        var tFrame = referenceFrame.absoluteTime + gamma*timeSinceLastFrame;

        if(options.useRelativity){
            $vDisplay.text('v = ' + lodash.round(beta, 3) + 'c (' + lodash.round(referenceFrame.velocity[0],3) + ', ' + lodash.round(referenceFrame.velocity[1],3) + ')');
            $xDisplay.text('x = ' + lodash.round(referenceFrame.absolutePosition[0], 3) + ' y = ' + lodash.round(referenceFrame.absolutePosition[1], 3));
            $tauDisplay.text('tau = ' + displayTime(referenceFrame.properTime));
        } else {
            $vDisplay.text('v = (' + lodash.round(player.velocity[0],3) + ', ' + lodash.round(player.velocity[1],3) + ')');
            $xDisplay.text('x = ' + lodash.round(player.absolutePosition[0], 3) + ' y = ' + lodash.round(player.absolutePosition[1], 3));
            $tauDisplay.text('tau = ' + displayTime(player.properTime));

        }
        $tDisplay.text('t = ' + displayTime(tFrame));


        referenceFrame.absolutePosition[0] += gamma*referenceFrame.velocity[0] * timeSinceLastFrame;
        referenceFrame.absolutePosition[1] += gamma*referenceFrame.velocity[1] * timeSinceLastFrame;
        referenceFrame.absoluteTime += gamma*timeSinceLastFrame;
        referenceFrame.properTime += timeSinceLastFrame;
        referenceFrame.currentTime = 0;
        referenceFrame.relativePosition = [0,0];

        objects.map(function(object){
            if(!object.reference) {
                if(options.useLorentzBoost){
                    var vFX = referenceFrame.velocity[0],
                        vFY = referenceFrame.velocity[1],
                        tF = referenceFrame.absoluteTime,
                        xF = referenceFrame.absolutePosition[0],
                        yF = referenceFrame.absolutePosition[1],
                        vX = object.velocity[0],
                        vY = object.velocity[1],
                        t0 = object.absoluteTime,
                        x0 = object.absolutePosition[0],
                        y0 = object.absolutePosition[1],
                        t = (vX*vFX*(t0 - x0/vX) + vY*vFY*(t0-y0/vY) - (tF - vFX*xF - vFY*yF)) / (vX*vFX + vY*vFY - 1),
                        x = vX*(t - (t0 - x0/vX)),
                        y = vY*(t - (t0 - y0/vY)),
                        dt = t - referenceFrame.absoluteTime,
                        dx = x - referenceFrame.absolutePosition[0],
                        dy = y - referenceFrame.absolutePosition[1],
                        xPrime = -beta * gamma * cosTheta * dt + (gamma * cos2Theta + sin2Theta) * dx + (gamma - 1) * sinTheta * cosTheta * dy,
                        yPrime = -beta * gamma * sinTheta * dt + (gamma * sin2Theta + cos2Theta) * dy + (gamma - 1) * sinTheta * cosTheta * dx,
                        tPrime = gamma * dt + -gamma * beta * cosTheta * dx + -gamma * beta * sinTheta * dy,
                        objBeta = Math.sqrt(object.velocity[0] * object.velocity[0] + object.velocity[1] * object.velocity[1]),
                        objGamma = 1/Math.sqrt(1-objBeta*objBeta),
                        objTau = objGamma*(t - vX*x - vY*y);

                    // console.log(x,y,t);
                    object.absolutePosition = [x,y];
                    object.absoluteTime = t;
                    object.relativePosition = [
                        xPrime,
                        yPrime
                    ];
                    object.currentTime = tPrime;
                    object.properTime = objTau;
                } else {
                    object.absolutePosition[0] += object.velocity[0] * timeSinceLastFrame;
                    object.absolutePosition[1] += object.velocity[1] * timeSinceLastFrame;
                    object.absoluteTime = timeElapsed;
                    object.properTime = timeElapsed;

                    object.relativePosition = [
                        (object.absolutePosition[0] - referenceFrame.absolutePosition[0]),
                        (object.absolutePosition[1] - referenceFrame.absolutePosition[1])
                    ];
                    object.currentTime = 0;
                
                }
                
            }
        });

        events.map(function (event) {
            var time = event.absolutePosition[2] - timeElapsed;
            event.relativePosition = [
                event.absolutePosition[0] - referenceFrame.absolutePosition[0] - referenceFrame.velocity[0]*time,
                event.absolutePosition[1] - referenceFrame.absolutePosition[1] - referenceFrame.velocity[1]*time,
                time
            ];
            if (options.useLorentzBoost) {
                var x = event.absolutePosition[0],
                    y = event.absolutePosition[1],
                    t = event.absolutePosition[2],
                    dx = x - referenceFrame.absolutePosition[0],
                    dy = y - referenceFrame.absolutePosition[1],
                    dt = t - referenceFrame.absoluteTime,
                    xPrime = -beta*gamma*cosTheta*dt + (gamma*cos2Theta + sin2Theta)*dx + (gamma - 1)*sinTheta*cosTheta*dy,
                    yPrime = -beta*gamma*sinTheta*dt + (gamma*sin2Theta + cos2Theta)*dy + (gamma - 1)*sinTheta*cosTheta*dx,
                    tPrime = gamma*dt + -gamma*beta*cosTheta*dx + -gamma*beta*sinTheta*dy;

                event.relativePosition = [
                    xPrime,
                    yPrime,
                    tPrime
                ];
            }
        });

        updateFrame = requestAnimationFrame(update);
    }


    setTimeout(updateEvents, (1/options.updatesPerSecond) * 1000);
    function updateEvents() {

        objects.map(function (object) {
            events.push({
                absolutePosition: [object.absolutePosition[0], object.absolutePosition[1], object.absoluteTime],
                velocity: [object.velocity[0], object.velocity[1]],
                relativePosition: [0, 0, 0],
                color: object.color,
                size: object.size-2
            });
        });

        cancelAnimationFrame(updateFrame);
        update();
        setTimeout(updateEvents, (1/options.updatesPerSecond) * 1000);
    }

    // setTimeout(function () {
    //     console.log('ADVANCE');
    //     cancelAnimationFrame(updateFrame);
    //     timerEnded = true;
    // }, options.timeLimit * 1000);
}

