module Whosthebest.Graphics
{
    export class State_Boot extends Phaser.State
    {
        create()
        {
            // handle various game-wide settings, such as
            // any differences between mobile/desktop, screen scaling, etc.
            this.input.maxPointers = 1;
            this.stage.disableVisibilityChange = true;
            this.stage.backgroundColor = "#15befd";

            // various phaser settings
            this.game.time.advancedTiming = true;
            
            // gamepad setup
            this.input.gamepad.start();
            InputEngine.Instance.gamePad1 = this.input.gamepad.pad1;

            // immediately jump to the preloader
            this.game.state.start("Preloader");
        }
    }
}