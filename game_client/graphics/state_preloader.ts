module Whosthebest.Graphics
{
    export class State_Preloader extends Phaser.State
    {
        preloadText: Phaser.Text;

        preload()
        {
            this.preloadText = this.add.text(
                this.game.width / 2, 
                this.game.height /2,
                "Loading...", 
                {font: "bold 20pt Arial", fill: "#000"});
            this.preloadText.anchor.set(0.5);

            // Load all additional game assets from this screen
            // Can use this option to load all assets up front
            // May consider loading before a game, like starcraft
            this.load.spritesheet("images/menu/btn_back.png", "images/menu/btn_back.png", 51, 50);
            this.load.spritesheet("images/menu/btn_ready.png", "images/menu/btn_ready.png", 120, 52);
            this.load.spritesheet("images/menu/btn_friend.png", "images/menu/btn_friend.png", 120, 52);
            this.load.spritesheet("images/menu/btn_play.png", "images/menu/btn_play.png", 120, 52);
            this.load.spritesheet("images/menu/btn_quick.png", "images/menu/btn_quick.png", 120, 52);
            this.load.spritesheet("images/menu/btn_practice.png", "images/menu/btn_practice.png", 120, 52);
            this.load.image("images/menu/img_avatar.png", "images/menu/img_avatar.png");
        }

        create()
        {
            GAME_INSTANCE.switchToMenu();
        }
    }
}