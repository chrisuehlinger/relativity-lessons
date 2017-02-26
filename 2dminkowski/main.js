var options = {
    timeLimit: 100,
    timeFactor: 1,
    updatesPerSecond: 1,
    stRadius: 10,
    clipEvents: false,
    debugSR: false,
    useRelativity: true,
    useLorentzBoost: true,
    useBlackHoles: true,
    showLightCones: true
};

var gui = new dat.GUI();
gui.add(options, 'timeLimit', 0, 1000);
gui.add(options, 'timeFactor', 0, 2);
gui.add(options, 'updatesPerSecond', 0, 5);
// gui.add(options, 'stRadius', 0, 100);
gui.add(options, 'clipEvents');
gui.add(options, 'debugSR');
gui.add(options, 'useRelativity').onChange(function (useRelativity) {
    player.reference = useRelativity;
});
gui.add(options, 'useLorentzBoost');
gui.add(options, 'useBlackHoles');
gui.add(options, 'showLightCones');

var timerStarted = false,
    timerEnded = false,
    timeElapsed = 0;

setTimeout(function(){
    initDiagram(objectCount);
    setTimeout(function () {
        timerStarted = true;
        initSimulation();
    }, 1000);
});



