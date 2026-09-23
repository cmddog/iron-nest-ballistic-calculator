import { computed, effect, signal, type Signal } from "@preact/signals-core";

interface FieldConfig {
  totalDigits: number;
  decimalPlaces: number;
  maxValue?: number;
}

const FIELDS: Record<string, FieldConfig> = {
  distance: { totalDigits: 4, decimalPlaces: 2 },
  bearing: { totalDigits: 5, decimalPlaces: 2, maxValue: 36000 },
};

const distanceValue = signal<number>(0);
const bearingValue = signal<number>(0);

const valueSignals: Record<string, Signal<number>> = {
  distance: distanceValue,
  bearing: bearingValue,
};

const resetArmed: Record<string, boolean> = {};
const resetCallbacks: Array<() => void> = [];

export const distance = computed(
  () => distanceValue.value / Math.pow(10, FIELDS.distance.decimalPlaces),
);
export const bearing = computed(
  () => bearingValue.value / Math.pow(10, FIELDS.bearing.decimalPlaces),
);

function maxDigits(config: FieldConfig): number {
  return Math.pow(10, config.totalDigits) - 1;
}

function formatValue(value: number, config: FieldConfig): string {
  const { totalDigits, decimalPlaces } = config;
  const padded = String(value).padStart(totalDigits, "0");
  const splitAt = totalDigits - decimalPlaces;
  return `${padded.slice(0, splitAt)}.${padded.slice(splitAt)}`;
}

function setupField(field: string) {
  const input = document.getElementById(field) as HTMLInputElement | null;
  const display = document.querySelector<HTMLElement>(
    `.value-display[data-field="${field}"]`,
  );
  const config = FIELDS[field];
  const value = valueSignals[field];

  if (!input || !display || !config || !value) {
    return;
  }

  resetArmed[field] = false;

  effect(() => {
    display.textContent = formatValue(value.value, config);
    display.classList.toggle("is-empty", value.value === 0);
  });

  input.addEventListener("focus", () => display.classList.add("is-focused"));
  input.addEventListener("blur", () => display.classList.remove("is-focused"));

  input.addEventListener("keydown", (event) => {
    if (event.key >= "0" && event.key <= "9") {
      event.preventDefault();
      if (resetArmed[field]) {
        resetArmed[field] = false;
        value.value = 0;
        display.classList.remove("is-armed-for-reset");
      }
      appendDigit(value, Number(event.key), config);
    } else if (event.key === "Backspace") {
      event.preventDefault();
      resetArmed[field] = false;
      display.classList.remove("is-armed-for-reset");
      if (event.ctrlKey || event.metaKey) {
        value.value = 0;
      } else {
        removeDigit(value);
      }
    } else if (event.key === "r" || event.key === "Delete") {
      value.value = 0;
    } else if (event.key === "Escape") {
      event.preventDefault();
      input.blur();
    }
  });

  input.addEventListener("input", () => {
    input.value = "";
  });
}

function appendDigit(
  value: Signal<number>,
  digit: number,
  config: FieldConfig,
) {
  let next = value.value * 10 + digit;
  if (next > maxDigits(config)) {
    return;
  }
  if (config.maxValue && next > config.maxValue) next = config.maxValue;
  value.value = next;
}

function removeDigit(value: Signal<number>) {
  value.value = Math.floor(value.value / 10);
}

export function registerResetCallback(callback: () => void) {
  resetCallbacks.push(callback);
}

export function armReset() {
  Object.keys(FIELDS).forEach((field) => {
    resetArmed[field] = true;
    const display = document.querySelector<HTMLElement>(
      `.value-display[data-field="${field}"]`,
    );
    if (display) {
      display.classList.add("is-armed-for-reset");
    }
  });
  
  resetCallbacks.forEach((callback) => callback());
}

export function setupInputs() {
  Object.keys(FIELDS).forEach(setupField);
}
