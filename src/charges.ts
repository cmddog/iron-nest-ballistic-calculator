import { computed, effect, signal } from "@preact/signals-core";
import { distance } from "./input.ts";

export const CHARGE_COUNT = 6;

const KM_PER_DISABLE = 5;

// --- State ---

const userChoice = signal<number | null>(null);

const disabledCount = computed(() =>
  Math.max(0, Math.ceil(distance.value / KM_PER_DISABLE) - 1),
);

const lowestEnabled = disabledCount;

const selectedCharge = computed(() => {
  const choice = userChoice.value;
  if (choice !== null && choice >= lowestEnabled.value) {
    return choice;
  }
  return lowestEnabled.value;
});

export const selectedCharges = computed(() => selectedCharge.value + 1);

export function setupCharges() {
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>(".charge-button"),
  );

  if (buttons.length === 0) {
    return;
  }

  buttons.forEach((button, index) => {
    button.type = "button";

    button.addEventListener("click", () => {
      if (index < disabledCount.value) {
        return;
      }
      userChoice.value = index;
    });
  });

  effect(() => {
    const disabled = disabledCount.value;
    const selected = selectedCharge.value;

    buttons.forEach((button, index) => {
      const isDisabled = index < disabled;
      button.classList.toggle("is-disabled", isDisabled);
      button.classList.toggle("is-selected", index === selected);
      button.disabled = isDisabled || index === selected;
    });
  });
}
