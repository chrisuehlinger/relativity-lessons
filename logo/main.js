// var sprites = [
//     {
//         name:'logo',
//         path:'../img/logo-1.png'
//     },
// ];

// var loadingPromise = Promise.all(sprites.map(function(sprite){
//     return new Promise(function(resolve,reject){
//         var loader = new THREE.ImageLoader();
//         loader.load(sprite.path,function(img){
//             console.log('LOADED ' + sprite.path, img.width, img.height);

//             // Create an empty canvas element
//             var canvas = document.createElement("canvas");
//             canvas.width = img.width;
//             canvas.height = img.height;

//             // Copy the image contents to the canvas
//             var ctx = canvas.getContext("2d");
//             ctx.drawImage(img, 0, 0);

//             sprite.image = ctx.getImageData(0,0, img.width, img.height);
//             console.log('DATA ' + sprite.name, sprite.image);
//             resolve();
//         },
//         // Function called when download progresses
//         function ( xhr ) {
//             console.log(sprite.name + ' ' + (xhr.loaded / xhr.total * 100) + '% loaded' );
//         },
//         // Function called when download errors
//         function ( xhr ) {
//             console.log( 'An error happened loading ' + sprite.name );
//             reject();
//         });
//     });
// }));

// loadingPromise.then(init);

init();

function init(){
    mathbox = mathBox({
        plugins: ['core', 'controls', 'cursor'],
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
        .interval({
            width:256,
            channels: 3,
            expr:function(emit, theta){
                var timeElapsed = Math.max((2/3)*(Date.now() - startTime)/1000 - 2, 0);
                theta += 1;
                theta *= Math.PI*Math.min(timeElapsed*timeElapsed, 1);
                theta += Math.PI*timeElapsed/4;
                var x = Math.sin(theta),
                    y = Math.cos(theta);
                
                emit(x,y,0);
            }
        })
        .line({
            width: 1,
            color: 0x3f51b5
        });

    view
        .interval({
            width:256,
            channels: 3,
            expr:function(emit, theta){
                var timeElapsed = Math.max((2/3)*(Date.now() - startTime)/1000 - 2, 0);
                theta -= 1;
                theta *= Math.PI*Math.min(timeElapsed*timeElapsed, 1);
                theta += Math.PI*timeElapsed/3;
                var x = 1.05*Math.sin(theta),
                    y = 1.05*Math.cos(theta);
                
                emit(x,y,0);
            }
        })
        .line({
            width: 1,
            color: 0x3f51b5,
        });


    view
    .fragment({
        pass:'eye',
        shader:gridnoiseShader
    })
    .area({
        id:'grid',
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

    // var maxSize = 1024;
    // view.matrix({
    //     id:'sprite',
    //     width: 1024,
    //     height: 1024,
    //     channels:4,
    //     live:false,
    //     expr: function(emit,x,y){
    //         var sprite = sprites[0],
    //             scaledX = x - Math.round((maxSize - sprite.image.width)/2),
    //             scaledY = y - Math.round((maxSize - sprite.image.height)/2);
    //         if(scaledX >= 0 && scaledX < sprite.image.width 
    //             && scaledY >= 0 && scaledY < sprite.image.height){
    //             var i = 4*(scaledX+scaledY*sprite.image.width);
    //             var data = sprite.image.data;
    //             emit(data[i]/256,data[i+1]/256,data[i+2]/256,data[i+3]/256);
    //         } else {
    //             emit(0,0,0,0);
    //         }
    //     }
    // })
    // .matrix({
    //     id:'spritePositions',
    //     width:2,
    //     height:2,
    //     expr: function(emit,x,y){
    //             var scale = 1.75;
    //             emit(-1*scale*Math.pow(-1,x), scale*Math.pow(-1,y), 0.01);
    //     }
    // })
    // .surface({
    //     points:'#spritePositions',
    //     map: '#sprite'
    // });
}