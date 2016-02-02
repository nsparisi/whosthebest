var game = 
    new Phaser.Game(
        500, 
        500, 
        Phaser.AUTO, 
        'game', 
        { 
            preload: preload, 
            create: create, 
            update: update 
        }
    );
    
var icon;
var fps;

function preload() {
    game.load.image("icon", "images/icon.png");
}

function create() {
    icon = game.add.sprite(0,0,"icon");
    fps = new Phaser.Text(game, 10, 10, 'Undefined', {
            font: '36px Tahoma',
            fill: 'white',
            align: 'left',
        });
        
    var group1 = game.add.group();
    group1.add(fps);
}

function update() {
    icon.position.x += 1;
    icon.position.y += 1;
}


// var stage = new PIXI.Container();
// var renderer = PIXI.autoDetectRenderer(400, 300, {backgroundColor : 0x1099bb});
// document.body.appendChild(renderer.view);


// var texture = PIXI.Texture.fromImage("images/icon.png");

// var sprite = new PIXI.Sprite(texture);
// sprite.position.x = 0;
// sprite.position.y = 0;
// sprite.anchor.x = 0.5;
// sprite.anchor.y = 0.5;
// sprite.width = 32;
// sprite.height = 32;

// stage.addChild(sprite);

// animate();
// function animate()
// {
//     requestAnimationFrame(animate);
//     sprite.rotation += .1;
//     sprite.position.x += .5;
//     sprite.position.y += .5;
//     renderer.render(stage);
// }

// var sound = new Howl({
//     src: ['audio/chain_mild.mp3'],
//     volume: 0.2
// });
//sound.play();