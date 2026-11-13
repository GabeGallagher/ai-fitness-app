import { Component, inject, viewChild } from '@angular/core';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular';

import { setUpAndroidBackButton } from './core/platform/android-back-button';

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet],
  template: `
    <ion-app>
      <ion-router-outlet />
    </ion-app>
  `,
})
export class AppComponent {
  private readonly outlet = viewChild.required(IonRouterOutlet);

  constructor() {
    setUpAndroidBackButton(inject(Platform), () => this.outlet());
  }
}
