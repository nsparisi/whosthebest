function MainMenu()
{
    var textures =
        {
            gameBackgound: "images/bg.jpg"
        }
    this.sprites = [];

    var self = this;
    this.initialize = function()
    {
        var gameBorder = new Sprite(
            canvasElement.width,
            canvasElement.height,
            'rgba(0,0,0,0.0)',
            "black",
            1);
        self.sprites.push(gameBorder);

        // background
        var gameBackground = new Texture(
            canvasElement.width,
            canvasElement.height,
            textures.gameBackgound)
        self.sprites.push(gameBackground);

        // Debug text 1
        self.menuText1 = new Text(
            100,
            100,
            "bold 20px Arial",
            'black'
            );
        self.menuText1.text = "Press Start 1";
        self.sprites.push(self.menuText1);

        // Debug text 1
        self.menuText2 = new Text(
            120,
            150,
            "bold 20px Arial",
            'black'
            );
        self.menuText2.text = "Press Start 2";
        self.sprites.push(self.menuText2);

        // Debug text 1
        self.menuText3 = new Text(
            150,
            200,
            "bold 20px Arial",
            'black'
            );
        self.menuText3.text = "Press Start 3";
        self.sprites.push(self.menuText3);
    }

    this.update = function()
    {
        canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
        self.sprites.forEach(
            function(sprite)
            {
                canvasContext.save();
                sprite.render();
                canvasContext.restore();
            });
    }
}