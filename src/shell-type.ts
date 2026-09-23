import { computed } from "@preact/signals-core";
import { registerResetCallback } from "./input.ts";

interface Shell {
  label: string;
  shellSpeed: number;
  timesUsed: number;
}

function makeShell(label: string, overrides?: Partial<Shell>): Shell {
  return { label, shellSpeed: 0.7, timesUsed: 0, ...overrides };
}

const SHELL_TYPES = [
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
];

const shellTypesByUse = computed(() =>
  [...SHELL_TYPES].sort((a, b) => b.timesUsed - a.timesUsed),
);

const input = document.getElementById("shell-type") as HTMLInputElement;
const prediction = document.getElementById(
  "shell-type-prediction",
) as HTMLSpanElement;
let lastInputValue = "";
let resetArmed = false;

export const selectedShell = computed(() =>
  SHELL_TYPES.find((shell) => shell.label == prediction.textContent),
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
  prediction.textContent = shellTypesByUse.value.filter((shell) =>
    shell.label.startsWith(input.value),
  )[0].label;
}

export function setupShellField(): void {
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
