import Phaser from "phaser";

class Highscore extends Phaser.Scene {
  constructor() {
    super({
      key: "Highscore"
    });
  }
  
  private padding:number = 0;
  private topPadding:number = 0;
  private playerText?: Phaser.GameObjects.BitmapText| undefined; 
  private score:number = 0; 


  preload(){
    this.load.image("block", "assets/block.png");
    this.load.image("rub", "assets/rub.png");
    this.load.image("end", "assets/end.png");

    this.load.bitmapFont(
      "arcadeFont",
      "assets/arcade.png",
      "assets/arcade.xml"
    );

    this.load.image("star", "assets/star4.png");
  }

  create() {
    this.padding = 25;
    this.topPadding = 200;

    this.add
      .bitmapText(this.padding, this.topPadding, "arcadeFont", "RANK  SCORE   NAME")
      .setTint(0xffffff);

    this.add
      .bitmapText(
        this.padding + 32 * 6,
        50 + this.topPadding,
        "arcadeFont",
        "50000"
      )
      .setTint(0x0261c7);

    this.playerText = this.add
      .bitmapText(32 * 14 + this.padding, 50 + this.topPadding, "arcadeFont", "")
      .setTint(0x000000);

    this.input.keyboard.enabled = false;

    this.scene.launch("InputPanel");

    let panel = this.scene.get("InputPanel");

    panel.events.on("updateName", this.updateName, this);
    panel.events.on("submitName", this.submitName, this);
  }

  submitName() {
    this.scene.stop("InputPanel");

    this.add
      .bitmapText(
        this.padding,
        50 + this.topPadding,
        "arcadeFont",
        "1ST   50000   " + this.playerText?.text
      )
      .setTint(0xff0000);

    this.add
      .bitmapText(
        this.padding,
        100 + this.topPadding,
        "arcadeFont",
        "2ND   40000   ANT"
      )
      .setTint(0xffffff);
  }

  updateName(name: string) {
    this.playerText?.setText(name);
  }
}

export default Highscore;
