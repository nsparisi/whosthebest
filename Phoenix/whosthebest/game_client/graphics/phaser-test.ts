/// <reference path="../references.ts" />
Debug.log("phaser-test.ts");

module PhaserTest
{
    class MainMenu
    {
        background: Phaser.Sprite;
        titleText: Phaser.Text;
        
        constructor()
        {
        }
    }
    
    export function CreateTest()
    {
        var sprite : Phaser.Sprite;
        var backwards = false;
        var direction = new Phaser.Point(2, 2);

        const game = new Phaser.Game(400,320, Phaser.AUTO, "phaserParent", 
        {
            preload: preload, create: create, update: update
        })

        function preload()
        {
            Debug.log("preload");
            game.load.image("icon", "images/icon.png");
        }
        function create()
        {
            Debug.log("create");
            sprite = game.add.sprite(0,0,"icon");
            sprite.width = 50;
            sprite.height = 50;
            
            
        }
        function update()
        {
            sprite.x += direction.x;
            sprite.y += direction.y;
            
            if(sprite.x > 400 - sprite.width)
            {
                direction.x = -2;
            }
            if(sprite.y > 320 - sprite.height)
            {
                direction.y = -2;
            }
            if(sprite.x < 1)
            {
                direction.x = 2;
            }
            if(sprite.y < 1)
            {
                direction.y = 2;
            }
        }
    }
}