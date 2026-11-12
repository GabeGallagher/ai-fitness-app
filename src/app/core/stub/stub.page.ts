import { Component, computed, input } from '@angular/core';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

/**
 * A placeholder page with a title and a way back, for links to screens that
 * aren't built yet. Route `data.title` and the optional `:subject` param bind to inputs.
 */
@Component({
  selector: 'app-stub-page',
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/nutrition/daily-log" />
        </ion-buttons>
        <ion-title>{{ heading() }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>This screen isn't built yet.</p>
    </ion-content>
  `,
})
export class StubPage {
  readonly title = input('Not built yet');
  readonly subject = input<string>();

  protected readonly heading = computed(() => {
    const subject = this.subject();
    return subject ? subject.charAt(0).toUpperCase() + subject.slice(1) : this.title();
  });
}
