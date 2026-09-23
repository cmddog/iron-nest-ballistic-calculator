import { CHARGE_COUNT, selectedCharges } from "./charges.ts";
import { distance } from "./input.ts";
import { selectedShell } from "./shell-type.ts";

const elevationDisplay = createTween(
  document.getElementById("elevation-value")!,
  {
    duration: 1000,
    ease: cubicBezier(0.2, 0, 0.8, 1),
    format: (v) => v.toFixed(2).padStart(5, "0"),
  },
);

const ttaDisplay = createTween(document.getElementById("tta-value")!, {
  duration: 1000,
  ease: cubicBezier(0.2, 0, 0.8, 1),
  format: (v) => v.toFixed(2).padStart(5, "0"),
});

export function setupCalculations(): void {
  const form = document.getElementById("calculator") as HTMLFormElement;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    calculate();
    // calculateAndQueue();
  });

  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        calculate();
      }
    });
  });

  document.getElementById("btn-calculate")!.addEventListener("click", (e) => {
    e.preventDefault();
    calculate();
  });

  document
    .getElementById("btn-calculate-and-queue")!
    .addEventListener("click", (e) => {
      e.preventDefault();
      calculate();
    });
}

function calculate() {
  console.log("wah");
  const elevation = calcElevation(distance.value, selectedCharges.value);
  const tta = calcTimeToArrive(
    distance.value,
    selectedCharges.value,
    selectedShell.value?.shellSpeed,
  );
  if (!elevation || !tta) {
    return;
  }

  elevationDisplay.tweenTo(elevation);
  ttaDisplay.tweenTo(tta);
}

function calcElevation(distance: number, charges: number): number | undefined {
  if (distance <= 0 || distance > CHARGE_COUNT * 5 || charges > CHARGE_COUNT)
    return undefined;

  return (12 * distance) / charges;
}

function calcTimeToArrive(
  distance: number,
  charges: number,
  shellSpeed?: number,
): number | undefined {
  if (distance <= 0 || distance > CHARGE_COUNT * 5 || charges > CHARGE_COUNT)
    return undefined;

  if (!shellSpeed || shellSpeed <= 0) shellSpeed = 0.7;

  const u = (charges - 1) / 5;
  return distance / (shellSpeed * (0.3 + 0.7 * (3 * u ** 2 - 2 * u ** 3)));
}

// Cubic bezier easing — same as CSS cubic-bezier(x1,y1,x2,y2)
// "bottom left handle" = (x1,y1), "top right handle" = (x2,y2)
// ease-out (fast→slow): cubicBezier(0.2, 0, 0.8, 1)
// ease-in (slow→fast): cubicBezier(0.2, 0, 1, 0.8)
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const ax = 3 * x1 - 3 * x2 + 1,
    bx = 3 * x2 - 6 * x1,
    cx = 3 * x1;
  const ay = 3 * y1 - 3 * y2 + 1,
    by = 3 * y2 - 6 * y1,
    cy = 3 * y1;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;

  return (x: number): number => {
    if (x === 0 || x === 1) return x;
    let t = x;
    for (let i = 0; i < 8; i++) {
      // Newton's method
      const dx = sampleX(t) - x;
      if (Math.abs(dx) < 0.0001) break;
      t -= dx / ((3 * ax * t + 2 * bx) * t + cx);
    }
    return sampleY(t);
  };
}

interface TweenOptions {
  duration: number; // ms
  ease: (t: number) => number;
  format: (v: number) => string;
}

function createTween(el: HTMLElement, opts: TweenOptions) {
  let rafId: number | null = null;
  let current = 0;
  let target = 0;

  function tick(from: number, to: number, startTime: number, now: number) {
    const t = Math.min((now - startTime) / opts.duration, 1);
    current = from + (to - from) * opts.ease(t);
    el.textContent = opts.format(current);

    if (t < 1) {
      rafId = requestAnimationFrame((ts) => tick(from, to, startTime, ts));
    } else {
      current = to;
      rafId = null;
    }
  }

  return {
    tweenTo(value: number) {
      if (value === target) return; // same result — don't interrupt
      target = value;
      if (rafId !== null) cancelAnimationFrame(rafId);
      const from = current; // wherever it was when interrupted
      rafId = requestAnimationFrame((ts) => tick(from, value, ts, ts));
    },
  };
}
