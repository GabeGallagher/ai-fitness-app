import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { MACRO_LABELS } from '../../../../core/nutrition/macros';
import type { MacroSummary } from '../day-summary';

@Component({
  selector: 'app-macro-bars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (m of macros(); track m.macro) {
      <div class="macro">
        <div class="row">
          <span>{{ labels[m.macro] }}</span>
          <span>{{ m.targetPercent }}%</span>
        </div>
        <div class="track">
          <div class="fill" [style.width.%]="m.fill * 100" [style.background]="'var(--ft-status-' + m.status + ')'"></div>
        </div>
        <div class="row">
          <span>{{ m.consumedG }}g</span>
          <span>{{ m.remaining.kind }} {{ m.remaining.amount }}g</span>
        </div>
      </div>
    }
  `,
  styles: `
    :host { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem; }
    .row { display: flex; justify-content: space-between; gap: 0.25rem; white-space: nowrap; }
    .track { height: 0.55rem; border-radius: 1rem; background: var(--ft-ring-track); margin: 0.45rem 0; overflow: hidden; }
    .fill { height: 100%; border-radius: 1rem; }
  `,
})
export class MacroBarsComponent {
  readonly macros = input.required<MacroSummary[]>();
  protected readonly labels = MACRO_LABELS;
}
