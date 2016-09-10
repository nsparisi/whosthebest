module Whosthebest.Graphics
{
    export class State_Game extends Phaser.State
    {
        textTitle: Phaser.Text;

        create()
        {
            // this.textTitle = this.add.text(
            //     this.game.width / 2, 
            //     5, 
            //     "Play Game", 
            //     {font: "40pt Arial", fill: "#000"});
            // this.textTitle.anchor.set(0.5, 0);
            
            canvasElement.hidden = false;
        }

        shutdown()
        {
            canvasElement.hidden = true;
            ServerTranslator.Instance.disconnectFromGame();
        }
    }
}