var options = {
    timeLimit: 100,
    timeFactor: 1,
    updatesPerSecond: 2,
    stRadius: 10,
    clipEvents: false,
    useRelativity: true,
    debugSR: false,
    useLorentzTransform: true,
    useBlackHoles: false,
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
gui.add(options, 'useLorentzTransform');
gui.add(options, 'useBlackHoles');
gui.add(options, 'showLightCones');
// gui.close();


var timerStarted = false,
    timerEnded = false,
    timeElapsed = 0;

loadingPromise.then(function(){
    initDiagram(objectCount, eventCount);
    setTimeout(function () {
        timerStarted = true;
        initSimulation();
    }, 1000);
});