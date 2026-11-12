import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { LocalDate } from '../../../../core/dates/local-date';
import type { DayType } from '../../targets/day-targets.service';
import type { WeekStripDay } from '../daily-log.store';

const DOT_COLOR: Record<DayType, string> = {
  'high-intensity': 'var(--ft-day-high)',
  normal: 'var(--ft-day-normal)',
  rest: 'var(--ft-day-rest)',
};

/**
 * Seven days centered on the selected day. Bar = calories consumed, dot = that
 * day's budget, dotted line = the midway value (daily-log spec, Week strip).
 */
@Component({
  selector: 'app-week-strip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="plot">
      <div class="midline"></div>
      @for (d of days(); track d.day) {
        <button class="col" type="button" (click)="selectDay.emit(d.day)" [attr.aria-label]="'Show ' + d.day" tabindex="-1">
          @if (d.status) {
            <span class="bar" [style.height.%]="d.barHeight * 100" [style.background]="'var(--ft-status-' + d.status + ')'"></span>
          }
          <span class="dot" [style.bottom.%]="d.dotHeight * 100" [style.background]="dotColor[d.dayType]"></span>
        </button>
      }
    </div>
    <div class="labels">
      @for (d of days(); track d.day) {
        <button type="button" class="label" [class.selected]="d.selected" (click)="selectDay.emit(d.day)">
          <span>{{ d.weekday }}</span>
          <span>{{ d.dayOfMonth }}</span>
        </button>
      }
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; }
    .plot { position: relative; flex: 1; min-height: 8rem; display: grid; grid-template-columns: repeat(7, 1fr); margin: 0.5rem 0 0.4rem; }
    .midline { position: absolute; left: 0; right: 0; top: 50%; border-top: 2px dashed var(--ft-ring-track); }
    .col { position: relative; background: none; border: 0; padding: 0; }
    .bar { position: absolute; bottom: 0; left: 50%; width: 1.4rem; transform: translateX(-50%); border-radius: 0.35rem 0.35rem 0 0; }
    .dot { position: absolute; left: 50%; width: 0.6rem; height: 0.6rem; border-radius: 50%; transform: translate(-50%, 50%); }
    .labels { display: grid; grid-template-columns: repeat(7, 1fr); }
    .label { display: flex; flex-direction: column; align-items: center; background: none; border: 0; color: var(--ft-muted-strong); font-size: 0.9rem; padding: 0 0 0.7rem; position: relative; }
    .label.selected { color: var(--ion-text-color); font-weight: 600; }
    .label.selected::after { content: ''; position: absolute; bottom: 0; border: 0.45rem solid transparent; border-bottom-color: var(--ft-accent); border-top: 0; }
  `,
})
export class WeekStripComponent {
  readonly days = input.required<WeekStripDay[]>();
  readonly selectDay = output<LocalDate>();
  protected readonly dotColor = DOT_COLOR;
}
