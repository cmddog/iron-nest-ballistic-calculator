import { effect, signal } from "@preact/signals-core";
import { html, nothing, render } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";

export interface Target {
  id: number;
  charges: number;
  distance: number;
  bearing: number;
  elevation: number;
  tta: number;
  shellType: string;
  label?: string;
}

let nextId = 0;
const targets = signal<Target[]>([]);

export function addTarget(t: Omit<Target, "id">) {
  targets.value = [...targets.value, { ...t, id: nextId++ }];
}

export function removeTarget(id: number) {
  targets.value = targets.value.filter((t) => t.id !== id);
}

export function moveTarget(id: number, delta: 1 | -1) {
  const list = [...targets.value];
  const from = list.findIndex((t) => t.id === id);
  const to = from + delta;
  if (from === -1 || to < 0 || to >= list.length) return;
  [list[from], list[to]] = [list[to], list[from]];
  targets.value = list;
}

const cardView = (t: Target, index: number, total: number) => html`
  <article class="bounding-box queue-card">
    <header>
      <div class="queue-shell-wrap">
        <svg class="queue-shell" viewBox="0 0 50 20">
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="1"
            d="M 18 0 H 50 Q 47 10 50 20 H 18 L 0 10 Z"
          />
        </svg>
        <span class="queue-shell-text">${t.shellType}</span>
      </div>

      ${Array.from(
        { length: Math.max(0, t.charges - 1) },
        () => html`
          <svg viewBox="0 0 15 20">
            <path
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              d="M 3 0 H 15 Q 12 10 15 20 H 3 Q 0 10 3 0"
            />
          </svg>
        `,
      )}

      <svg viewBox="0 0 15 20">
        <path
          fill="none"
          stroke="currentColor"
          stroke-width="1"
          d="M 3 0 H 15 V 20 H 3 Q 0 10 3 0"
        />
      </svg>
    </header>

    <div class="card-actions">
      <button ?disabled=${index === 0} @click=${() => moveTarget(t.id, -1)}>
        <svg viewBox="0 0 5 3">
          <rect fill="currentColor" x="0" y="2" width="1" height="1" />
          <rect fill="currentColor" x="1" y="1" width="1" height="1" />
          <rect fill="currentColor" x="2" y="0" width="1" height="1" />
          <rect fill="currentColor" x="3" y="1" width="1" height="1" />
          <rect fill="currentColor" x="4" y="2" width="1" height="1" />
        </svg>
      </button>
      <button
        ?disabled=${index === total - 1}
        @click=${() => moveTarget(t.id, 1)}
      >
        <svg viewBox="0 0 5 3">
          <rect fill="currentColor" x="0" y="0" width="1" height="1" />
          <rect fill="currentColor" x="1" y="1" width="1" height="1" />
          <rect fill="currentColor" x="2" y="2" width="1" height="1" />
          <rect fill="currentColor" x="3" y="1" width="1" height="1" />
          <rect fill="currentColor" x="4" y="0" width="1" height="1" />
        </svg>
      </button>
      <button @click=${() => removeTarget(t.id)}>
        <svg viewBox="0 0 9 9">
          <rect fill="currentColor" x="2" y="0" width="5" height="1" />
          <rect fill="currentColor" x="0" y="1" width="9" height="1" />
          <rect fill="currentColor" x="1" y="2" width="1" height="6" />
          <rect fill="currentColor" x="7" y="2" width="1" height="6" />
          <rect fill="currentColor" x="3" y="3" width="1" height="4" />
          <rect fill="currentColor" x="5" y="3" width="1" height="4" />
          <rect fill="currentColor" x="2" y="8" width="5" height="1" />
        </svg>
      </button>
    </div>
  </article>
`;

const queueView = () => {
  const list = targets.value;
  if (list.length === 0) return nothing;

  return html`
    <section class="target-queue">
      <div class="hr"></div>
      ${repeat(
        list,
        (t) => t.id,
        (t, i) => cardView(t, i, list.length),
      )}
    </section>
  `;
};

effect(() => {
  render(queueView(), document.getElementById("queue")!);
});
