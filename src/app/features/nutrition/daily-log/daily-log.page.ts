import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import {
  GestureController,
  IonButton,
  IonContent,
  IonDatetime,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPopover,
  IonToolbar,
  NavController,
  type DatetimeChangeEventDetail,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  add,
  attachOutline,
  calendarOutline,
  chevronBack,
  chevronForward,
  ellipsisVertical,
  footstepsOutline,
  menuOutline,
  scanOutline,
  waterOutline,
} from 'ionicons/icons';

import { MEAL_LABELS, MEAL_SLOTS, type MealSlot } from '../../../core/db/app-db';
import { AppleRingComponent } from './components/apple-ring.component';
import { MacroBarsComponent } from './components/macro-bars.component';
import { MacroPieComponent } from './components/macro-pie.component';
import { WeekStripComponent } from './components/week-strip.component';
import { DailyLogStore } from './daily-log.store';

/** Minimum horizontal travel, in px, for a swipe to change the day. */
const SWIPE_MIN_PX = 60;

/** Links in the hamburger menu. Names are placeholders (daily-log spec, Navigation). */
const MENU_LINKS = [
  { label: 'Diet Dashboard', url: '/nutrition/daily-log' },
  { label: 'Meals', url: '/meals' },
  { label: 'Exercise', url: '/exercise' },
  { label: 'Weight', url: '/weight' },
];

/** Placeholders until the Daily tracking feature is built: 0, or an icon for Notes. */
const TRACKING_ITEMS: { key: string; label: string; icon: string | null; showValue: boolean }[] = [
  { key: 'exercise', label: 'Exercise', icon: null, showValue: true },
  { key: 'steps', label: 'Steps', icon: 'footsteps-outline', showValue: true },
  { key: 'water', label: 'Water', icon: 'water-outline', showValue: true },
  { key: 'notes', label: 'Notes', icon: 'attach-outline', showValue: false },
];

@Component({
  selector: 'app-daily-log-page',
  templateUrl: 'daily-log.page.html',
  styleUrl: 'daily-log.page.scss',
  imports: [
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonContent,
    IonButton,
    IonIcon,
    IonPopover,
    IonDatetime,
    IonList,
    IonItem,
    IonLabel,
    AppleRingComponent,
    MacroBarsComponent,
    MacroPieComponent,
    WeekStripComponent,
  ],
  providers: [DailyLogStore],
})
export class DailyLogPage {
  protected readonly store = inject(DailyLogStore);
  private readonly nav = inject(NavController);
  private readonly gestures = inject(GestureController);
  private readonly destroyRef = inject(DestroyRef);

  private readonly content = viewChild.required(IonContent, { read: ElementRef });

  protected readonly menuLinks = MENU_LINKS;
  protected readonly trackingItems = TRACKING_ITEMS;
  protected readonly mealSlots = MEAL_SLOTS;
  protected readonly mealLabels = MEAL_LABELS;

  constructor() {
    addIcons({
      add,
      attachOutline,
      calendarOutline,
      chevronBack,
      chevronForward,
      ellipsisVertical,
      footstepsOutline,
      menuOutline,
      scanOutline,
      waterOutline,
    });

    afterNextRender(() => this.setUpSwipe());

    const onVisible = () => {
      if (document.visibilityState === 'visible') this.store.refreshToday();
    };
    document.addEventListener('visibilitychange', onVisible);
    this.destroyRef.onDestroy(() => document.removeEventListener('visibilitychange', onVisible));
  }

  protected go(url: string): void {
    this.nav.navigateForward(url);
  }

  protected openMeal(slot: MealSlot): void {
    this.go(`/nutrition/meal/${slot}`);
  }

  protected pickDay(detail: DatetimeChangeEventDetail, popover: IonPopover): void {
    const value = Array.isArray(detail.value) ? detail.value[0] : detail.value;
    if (value) {
      this.store.selectDay(value.slice(0, 10));
    }
    popover.dismiss();
  }

  /** Swipe like turning a page: left goes to the next day, right to the previous one. */
  private setUpSwipe(): void {
    const gesture = this.gestures.create({
      el: this.content().nativeElement,
      gestureName: 'day-swipe',
      direction: 'x',
      threshold: 15,
      onEnd: ({ deltaX, deltaY }) => {
        if (Math.abs(deltaX) < SWIPE_MIN_PX || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return;
        if (deltaX < 0) this.store.nextDay();
        else this.store.previousDay();
      },
    });
    gesture.enable();
    this.destroyRef.onDestroy(() => gesture.destroy());
  }
}
