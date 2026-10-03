import { computed, signal } from "@preact/signals-core";
import { registerResetCallback } from "./input.ts";

export interface Shell {
  label: string;
  shellSpeed: number;
  timesUsed: number;
}

function makeShell(label: string, overrides?: Partial<Shell>): Shell {
  return { label, shellSpeed: 0.7, timesUsed: 0, ...overrides };
}

export function increaseUseCount() {
  const shell = selectedShell.value
  if (!shell) return
  const shells = SHELL_TYPES.value
  const toUpdateIndex = shells.findIndex(s => s.label == shell.label);
  if (toUpdateIndex === -1) return;
  const toUpdate = shells[toUpdateIndex];
  const updated = [...shells];
  updated[toUpdateIndex] = { ...toUpdate, timesUsed: toUpdate.timesUsed + 1 };
  SHELL_TYPES.value = updated;
  localStorage.setItem('shells', JSON.stringify(SHELL_TYPES.value))
}

let SHELL_TYPES = signal<Shell[]>([
  makeShell("EMPT"),
  makeShell("AP"),
  makeShell("APHE"),
  makeShell("ATMC"),
  makeShell("CLMN"),
  makeShell("CYAN"),
  makeShell("DRIL"),
  makeShell("EQKE"),
  makeShell("FLCH"),
  makeShell("HCHE"),
  makeShell("HE"),
  makeShell("INCN"),
  makeShell("LE"),
  makeShell("PLCM"),
  makeShell("PHGN"),
  makeShell("PRPG"),
  makeShell("SMK"),
  makeShell("STAR"),
  makeShell("TEAR"),
  makeShell("THRM"),
  makeShell("WP"),
]);

const shellTypesByUse = computed(() =>
  [...SHELL_TYPES.value].sort((a, b) => b.timesUsed - a.timesUsed),
);

const input = document.getElementById("shell-type") as HTMLInputElement;
const prediction = document.getElementById(
  "shell-type-prediction",
) as HTMLSpanElement;
let lastInputValue = "";
let resetArmed = false;

const predictionLabel = signal("");

export const selectedShell = computed(() =>
  SHELL_TYPES.value.find((shell) => shell.label == predictionLabel.value),
);

function inputOnEnter(): void {
  input.value = lastInputValue;
  forceCaretToEnd();
}

function forceCaretToEnd(): void {
  const len = input.value.length;
  input.setSelectionRange(len, len);
}

function makePrediction(): void {
  const label = shellTypesByUse.value.filter((shell) =>
    shell.label.startsWith(input.value),
  )[0].label;
  prediction.textContent = label;
  predictionLabel.value = label;
}

export function setupShellField(): void {
  const loadedShells = localStorage.getItem('shells');
  if (loadedShells) SHELL_TYPES.value = JSON.parse(loadedShells) as Shell[];

  input.addEventListener("focus", inputOnEnter);
  input.addEventListener("focus", forceCaretToEnd);

  input.addEventListener("keydown", (e) => {
    if (e.key.length === 1) {
      if (resetArmed) {
        resetArmed = false;
        input.classList.remove("is-armed-for-reset");
        input.value = "";
        lastInputValue = "";
      }
      if (
        !shellTypesByUse.value.some((shell) =>
          shell.label.startsWith((input.value + e.key).toUpperCase()),
        )
      ) {
        e.preventDefault();
      }
    } else if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      forceCaretToEnd();
    } else if (e.key === "Backspace") {
      resetArmed = false;
      input.classList.remove("is-armed-for-reset");
    }
  });

  document.addEventListener("selectionchange", () => {
    if (document.activeElement === input) {
      const len = input.value.length;
      if (input.selectionEnd !== len) {
        forceCaretToEnd();
      }
    }
  });

  input.value = "";
  makePrediction();

  input.addEventListener("input", makePrediction);
  input.addEventListener("focus", makePrediction);
  input.addEventListener("blur", () => {
    lastInputValue = input.value;
    input.value = prediction.textContent;
  });

  registerResetCallback(() => {
    resetArmed = true;
    input.classList.add("is-armed-for-reset");
  });
}
