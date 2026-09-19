import {computed, effect, signal} from '@preact/signals-core';
import {distance} from './input.ts';

// Number of charge buttons (hardcoded 1..6 for now).
const CHARGE_COUNT = 6;

// Each additional 5km of distance disables one more of the lowest charges.
// >5km disables charge 1, >10km disables charge 2, etc.
const KM_PER_DISABLE = 5;

// --- State -----------------------------------------------------------------

// The user's explicit pick, as a 0-based index. `null` means "auto", i.e. let
// the selection follow the lowest still-enabled charge.
const userChoice = signal<number | null>(null);

// --- Derived state ---------------------------------------------------------

// How many of the lowest charges are disabled at the current distance.
// floor(distance / 5), never disabling all of them.
const disabledCount = computed(() =>
    Math.min(
        Math.floor(distance.value / KM_PER_DISABLE),
        CHARGE_COUNT - 1,
    ),
);

// The lowest charge index that is still selectable.
const lowestEnabled = disabledCount; // same number: indices 0..disabledCount-1 are off

// The effective selection: the user's pick if it is still valid, otherwise the
// lowest enabled charge. This is what makes the selection "snap up" for free
// when a growing distance disables the previously selected button.
const selectedCharge = computed(() => {
    const choice = userChoice.value;
    if (choice !== null && choice >= lowestEnabled.value && choice < CHARGE_COUNT) {
        return choice;
    }
    return lowestEnabled.value;
});

export {selectedCharge};

// --- Wiring ----------------------------------------------------------------

export function setupCharges() {
    const buttons = Array.from(
        document.querySelectorAll<HTMLButtonElement>('.charge-button'),
    );

    if (buttons.length === 0) {
        return;
    }

    buttons.forEach((button, index) => {
        // Buttons live inside a <form>; without this a click submits/reloads.
        button.type = 'button';

        button.addEventListener('click', () => {
            // Ignore clicks on disabled charges.
            if (index < disabledCount.value) {
                return;
            }
            userChoice.value = index;
        });
    });

    // The single "change detection" effect: whenever distance or the selection
    // changes, repaint every button's disabled/selected state.
    effect(() => {
        const disabled = disabledCount.value;
        const selected = selectedCharge.value;

        buttons.forEach((button, index) => {
            const isDisabled = index < disabled;
            button.classList.toggle('is-disabled', isDisabled);
            button.classList.toggle('is-selected', index === selected);
            button.disabled = isDisabled;
        });
    });
}
