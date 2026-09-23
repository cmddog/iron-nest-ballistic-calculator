import { registerResetCallback } from "./input.ts";

const input = document.getElementById("label") as HTMLInputElement;
let resetArmed = false;

export function setupLabelField(): void {
  input.addEventListener("keydown", (e) => {
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      if (resetArmed) {
        resetArmed = false;
        input.classList.remove("is-armed-for-reset");
        input.value = "";
      }
    } else if (e.key === "Backspace") {
      resetArmed = false;
      input.classList.remove("is-armed-for-reset");
    }
  });

  registerResetCallback(() => {
    resetArmed = true;
    input.classList.add("is-armed-for-reset");
  });
}
