import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { MACROS, MACRO_LABELS, type Macro, type MacroGrams, type MacroSplit } from '../../../../core/nutrition/macros';

interface Slice {
  macro: Macro;
  percent: number;
  path: string;
  labelX: number;
  labelY: number;
  anchor: 'start' | 'end';
}

const RADIUS = 40;
const LABEL_RADIUS = 54;

function point(angle: number, r: number): [number, number] {
  return [r * Math.cos(angle), r * Math.sin(angle)];
}

/** Pie slices clockwise from the top, with a percent label just outside each one. */
function slices(split: MacroSplit): Slice[] {
  const result: Slice[] = [];
  let start = -Math.PI / 2;
  for (const macro of MACROS) {
    const percent = split[macro];
    if (percent <= 0) continue;
    const sweep = (percent / 100) * 2 * Math.PI;
    const end = start + sweep;
    const [x1, y1] = point(start, RADIUS);
    const [x2, y2] = point(end, RADIUS);
    const largeArc = sweep > Math.PI ? 1 : 0;
    const path =
      percent >= 100
        ? `M0 ${-RADIUS} A${RADIUS} ${RADIUS} 0 1 1 0 ${RADIUS} A${RADIUS} ${RADIUS} 0 1 1 0 ${-RADIUS} Z`
        : `M0 0 L${x1} ${y1} A${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const [lx, ly] = point(start + sweep / 2, LABEL_RADIUS);
    result.push({ macro, percent, path, labelX: lx, labelY: ly, anchor: lx >= 0 ? 'start' : 'end' });
    start = end;
  }
  return result;
}

@Component({
  selector: 'app-macro-pie',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="-80 -56 160 112" role="img" aria-label="Consumed macro split">
      @if (split()) {
        @for (slice of slices(); track slice.macro) {
          <path [attr.d]="slice.path" [style.fill]="'var(--ft-macro-' + slice.macro + ')'" />
          <text
            [attr.x]="slice.labelX"
            [attr.y]="slice.labelY"
            [attr.text-anchor]="slice.anchor"
            dominant-baseline="middle"
            [style.fill]="'var(--ft-macro-' + slice.macro + ')'"
          >{{ slice.percent }}%</text>
        }
      } @else {
        <circle r="40" class="empty" />
      }
    </svg>
    <dl>
      @for (macro of macros; track macro) {
        <div>
          <dt [style.color]="'var(--ft-macro-' + macro + ')'">{{ labels[macro] }}</dt>
          <dd>{{ grams()[macro] }}g</dd>
        </div>
      }
    </dl>
  `,
  styles: `
    :host { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); align-items: center; gap: 0.5rem; }
    svg { width: 100%; }
    path { stroke: #000; stroke-width: 0.8; }
    text { font-size: 10px; }
    .empty { fill: var(--ft-ring-track); }
    dl { margin: 0; font-size: 1.05rem; }
    dl div { display: flex; gap: 0.5rem; margin: 0.3rem 0; }
    dd { margin: 0; }
  `,
})
export class MacroPieComponent {
  /** The consumed split, or null when nothing is logged. */
  readonly split = input.required<MacroSplit | null>();
  /** Grams consumed. */
  readonly grams = input.required<MacroGrams>();

  protected readonly macros = MACROS;
  protected readonly labels = MACRO_LABELS;
  protected readonly slices = computed(() => {
    const split = this.split();
    return split ? slices(split) : [];
  });
}
