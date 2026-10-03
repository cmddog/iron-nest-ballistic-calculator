import { registerResetCallback } from "./input.ts";
import { computed, signal } from "@preact/signals-core";

const input = document.getElementById("label") as HTMLInputElement;
let resetArmed = false;

const labelValue = signal("");

export const label = computed(() => labelValue.value);

export function setupLabelField(): void {
  input.value = "";

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" || e.key === " ") {
      resetArmed = false;
      input.classList.remove("is-armed-for-reset");
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      if (resetArmed) {
        resetArmed = false;
        input.classList.remove("is-armed-for-reset");
        input.value = "";
      }
    }
  });

  input.addEventListener("input", () => {
    labelValue.value = input.value;
  });

  registerResetCallback(() => {
    resetArmed = true;
    input.classList.add("is-armed-for-reset");
  });
}
