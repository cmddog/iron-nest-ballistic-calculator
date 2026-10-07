import { effect, signal } from "@preact/signals-core";
import { html, render } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import {classMap} from "lit-html/directives/class-map.js";

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
const dimmedIds = signal<Set<number>>(new Set());

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

export function toggleDimTarget(id: number) {
  const next = new Set(dimmedIds.value);
  next.has(id) ? next.delete(id) : next.add(id);
  dimmedIds.value = next;
}

function sortTargets() {
  if (targets.value.length < 2) return;
  const sorted = [...targets.value].sort((a, b) => a.bearing - b.bearing);

  let maxGap = -1;
  let cutIndex = 0;
  sorted.forEach((t, i) => {
    const nextIndex = (i + 1) % sorted.length;
    const gap = ((sorted[nextIndex].bearing - t.bearing) % 360 + 360) % 360;
    if (gap > maxGap) {
      maxGap = gap;
      cutIndex = nextIndex;
    }
  })

  targets.value = cutIndex === 0
      ? sorted
      : [...sorted.slice(cutIndex), ...sorted.slice(0, cutIndex)];
}

const cardView = (t: Target, index: number, total: number) => html`
  <div class="bounding-box-outer">
    <p>> ${t.label?.trim() || "Target #" + t.id}</p>
    <article class=${classMap({ "bounding-box": true, "queue-card": true, "is-dimmed": dimmedIds.value.has(t.id) })}>
      <div class="t-content-inner">
        <header>
          <div class="queue-shell-wrap">
            <svg class="queue-shell" viewBox="0 0 60 20">
              <path
                fill="none"
                stroke="currentColor"
                stroke-width="1"
                d="M 35 0 H 60 Q 57 10, 60 20 H 35 C 8 20, 9 16, 0 10 C 9 4, 8 0, 35 0 Z"
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

        <div class="t-body-numbers">
          <div>
            <span>${t.elevation.toFixed(2).padStart(5, "0")}°</span>
            <span>[ELVN]</span>
          </div>
          <div>
            <span>${t.bearing.toFixed(1).padStart(5, "0")}°</span>
            <span>[BRNG]</span>
          </div>
          <div>
            <span>${t.tta.toFixed(2).padStart(5, "0")}s</span>
            <span>[ETA]</span>
          </div>
        </div>
      </div>

      <div class="card-actions">
        <button ?disabled=${index === 0} @click=${() => moveTarget(t.id, -1)} aria-label="Move target up" ">
          <svg viewBox="0 0 7 4" shape-rendering="crispEdges">
            <rect fill="currentColor" x="0" y="3" width="1" height="1" />
            <rect fill="currentColor" x="1" y="2" width="1" height="1" />
            <rect fill="currentColor" x="2" y="1" width="1" height="1" />
            <rect fill="currentColor" x="3" y="0" width="1" height="1" />
            <rect fill="currentColor" x="4" y="1" width="1" height="1" />
            <rect fill="currentColor" x="5" y="2" width="1" height="1" />
            <rect fill="currentColor" x="6" y="3" width="1" height="1" />
          </svg>
        </button>
        <button
          ?disabled=${index === total - 1}
          @click=${() => moveTarget(t.id, 1)}
        >
          <svg viewBox="0 0 7 4" shape-rendering="crispEdges" aria-label="Move target down">
            <rect fill="currentColor" x="0" y="0" width="1" height="1" />
            <rect fill="currentColor" x="1" y="1" width="1" height="1" />
            <rect fill="currentColor" x="2" y="2" width="1" height="1" />
            <rect fill="currentColor" x="3" y="3" width="1" height="1" />
            <rect fill="currentColor" x="4" y="2" width="1" height="1" />
            <rect fill="currentColor" x="5" y="1" width="1" height="1" />
            <rect fill="currentColor" x="6" y="0" width="1" height="1" />
          </svg>
        </button>
        <button @click=${() => removeTarget(t.id)}>
          <svg viewBox="0 0 9 9" shape-rendering="crispEdges" aria-label="Delete Target">
            <rect fill="currentColor" x="2" y="0" width="5" height="1" />
            <rect fill="currentColor" x="0" y="1" width="9" height="1" />
            <rect fill="currentColor" x="1" y="2" width="1" height="6" />
            <rect fill="currentColor" x="7" y="2" width="1" height="6" />
            <rect fill="currentColor" x="3" y="3" width="1" height="4" />
            <rect fill="currentColor" x="5" y="3" width="1" height="4" />
            <rect fill="currentColor" x="2" y="8" width="5" height="1" />
          </svg>
        </button>
        <button @click=${() => toggleDimTarget(t.id)} aria-label="Mark target as done">
          <svg viewBox="0 0 7 5" shape-rendering="crispEdges">
            <rect x="0" y="2" width="1" height="1"/>
            <rect x="1" y="3" width="1" height="1"/>
            <rect x="2" y="4" width="1" height="1"/>
            <rect x="3" y="3" width="1" height="1"/>
            <rect x="4" y="2" width="1" height="1"/>
            <rect x="5" y="1" width="1" height="1"/>
            <rect x="6" y="0" width="1" height="1"/>
          </svg>
        </button>
      </div>
    </article>
  </div>
`;

const queueView = () => {
  const list = targets.value;
  if (list.length === 0)
    return html` <span id="no-queue">No targets queued</span> `;

  return html`
    <section class="target-queue">
      <div class="hr"></div>
      <div class="queue-button-rail">
        <div class="queue-buttons">
          <button class="bounding-box sort-button" @click=${() => sortTargets()} aria-label="Sort targets">
            <svg viewBox="0 0 9 9" shape-rendering="crispEdges">
              <rect fill="currentColor" x="2" y="0" width="1" height="8" />
              <rect fill="currentColor" x="1" y="1" width="3" height="1" />
              <rect fill="currentColor" x="0" y="2" width="1" height="1" />
              <rect fill="currentColor" x="4" y="2" width="1" height="1" />
              <rect fill="currentColor" x="6" y="1" width="1" height="8" />
              <rect fill="currentColor" x="5" y="7" width="3" height="1" />
              <rect fill="currentColor" x="4" y="6" width="1" height="1" />
              <rect fill="currentColor" x="8" y="6" width="1" height="1" />
            </svg>
          </button>
          <button class="bounding-box delete-button" @click=${() => targets.value = []} aria-label="Delete all targets">
            <svg viewBox="0 0 9 9" shape-rendering="crispEdges">
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
      </div>
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
