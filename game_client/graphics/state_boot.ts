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
        }
        
        update()
        {
            // some assets are not loading correctly.
            // who knows what's going on with phoenix's hot-reload.
            // see if waiting a second before loading game assets prevents this problem.
            if(this.game.time.totalElapsedSeconds() > 1)
            {
                this.game.state.start("Preloader");
            }
        }
    }
}