import * as THREE from 'three';

export class Clock {
  constructor() {
    if (typeof THREE.Timer === 'function') {
      this.timer = new THREE.Timer();
    } else {
      this.previousTime = performance.now();
      this.startTime = this.previousTime;
    }
    this.deltaTime = 0;
    this.elapsedTime = 0;
  }

  update() {
    if (this.timer) {
      this.timer.update();
      this.deltaTime = this.timer.getDelta();
      this.elapsedTime = this.timer.getElapsed();
    } else {
      const currentTime = performance.now();
      this.deltaTime = Math.min((currentTime - this.previousTime) * 0.001, 0.1);
      this.elapsedTime = (currentTime - this.startTime) * 0.001;
      this.previousTime = currentTime;
    }
  }
}
