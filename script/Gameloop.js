class Gameloop {
  constructor(display) {
    this.frame = this.frame.bind(this);
    this.lastTime = 0;
    this.ctx = display.getContext('2d');
    this.callback = function () { };
    this.ctx.font = "14px serif";
  }

  start(callback) {
    this.callback = callback;
    requestAnimationFrame(this.frame);
  };

  frame(time) {
    var seconds = (time - this.lastTime) / 1000;
    this.lastTime = time;
    this.callback(seconds);
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText(Math.round(1 / seconds) + ' fps', 10, 26);
    // this.ctx.fillStyle = '#fff';
    // this.ctx.strokeText(Math.round(1 / seconds) + ' fps', 10, 26);
    requestAnimationFrame(this.frame);
  };
}
