var sprites = [
    {
        name:'ship',
        path:'../img/ship-color.svg'
    },
    {
        name:'asteroid',
        path:'../img/asteroid.svg'
    }
];

var loadingPromise = Promise.all(sprites.map(function(sprite){
    return new Promise(function(resolve,reject){
        var loader = new THREE.ImageLoader();
        loader.load(sprite.path,function(img){
            console.log('LOADED ' + sprite.path, img.width, img.height);

            // Create an empty canvas element
            var canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;

            // Copy the image contents to the canvas
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);

            sprite.image = ctx.getImageData(0,0, img.width, img.height);
            console.log('DATA ' + sprite.name, sprite.image);
            resolve();
        },
        // Function called when download progresses
        function ( xhr ) {
            console.log(sprite.name + ' ' + (xhr.loaded / xhr.total * 100) + '% loaded' );
        },
        // Function called when download errors
        function ( xhr ) {
            console.log( 'An error happened loading ' + sprite.name );
            reject();
        });
    });
}));

