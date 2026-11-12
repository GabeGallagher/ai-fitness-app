import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { Remaining, Status } from '../day-summary';

/**
 * Apple outline, starting at the top notch and running clockwise, so a dash of
 * length N (with pathLength 100) fills N% of the ring from the top, like the mockup.
 */
const APPLE_PATH =
  'M100 50 C122 30 176 34 180 88 C184 140 150 188 124 182 C112 179 108 174 100 174 ' +
  'C92 174 88 179 76 182 C50 188 16 140 20 88 C24 34 78 30 100 50 Z';

const STEM_PATH = 'M98 46 C96 30 104 16 114 10 C114 24 108 38 100 47 Z';

@Component({
  selector: 'app-apple-ring',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 200 200" role="img" [attr.aria-label]="ariaLabel()">
      <path class="track" [attr.d]="apple" />
      @if (fill() > 0) {
        <path
          class="progress"
          [attr.d]="apple"
          pathLength="100"
          [attr.stroke-dasharray]="fill() * 100 + ' 100'"
          [style.stroke]="'var(--ft-status-' + status() + ')'"
        />
      }
      <path class="stem" [attr.d]="stem" />
    </svg>
    <div class="center">
      <div class="consumed" [style.color]="'var(--ft-status-' + status() + ')'">{{ consumed() | number: '1.0-0' }}</div>
      <div class="kind">{{ remaining().kind === 'left' ? 'Left' : 'Over' }}</div>
      <div class="amount">{{ remaining().amount | number: '1.0-0' }}</div>
    </div>
  `,
  styles: `
    :host { position: relative; display: block; width: 100%; aspect-ratio: 1; }
    svg { width: 100%; height: 100%; overflow: visible; }
    path { fill: none; stroke-width: 13; stroke-linecap: round; }
    .track { stroke: var(--ft-ring-track); }
    .stem { fill: var(--ft-status-over); stroke: none; }
    .center { position: absolute; inset: 22% 0 14%; display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.1; }
    .consumed { font-size: 1.7rem; }
    .kind { color: var(--ft-muted); margin-top: 0.4rem; }
    .amount { font-size: 1.7rem; color: var(--ft-muted-strong); }
  `,
})
export class AppleRingComponent {
  readonly fill = input.required<number>();
  readonly status = input.required<Status>();
  readonly consumed = input.required<number>();
  readonly remaining = input.required<Remaining>();

  protected readonly apple = APPLE_PATH;
  protected readonly stem = STEM_PATH;

  protected readonly ariaLabel = computed(
    () => `${this.consumed()} calories consumed, ${this.remaining().amount} ${this.remaining().kind}`,
  );
}
