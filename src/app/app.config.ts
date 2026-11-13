import { inject, provideAppInitializer, type ApplicationConfig } from '@angular/core';
import { PreloadAllModules, RouteReuseStrategy, provideRouter, withComponentInputBinding, withPreloading } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { seedDevData } from './core/db/dev-seed';
import { LogEntryRepository } from './core/db/log-entry.repository';
import { installE2eHooks } from './core/e2e/e2e-hooks';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    // Only ever force it on: Ionic's default already turns it on in the Android app.
    provideIonicAngular(environment.browserBackButton ? { hardwareBackButton: true } : {}),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
    // Development builds only (not production or e2e). Not awaited: startup never waits
    // on the database, and the daily log's live query shows the sample days as soon as
    // they're written.
    provideAppInitializer(() => {
      if (environment.devSeed) {
        seedDevData(inject(LogEntryRepository)).catch((err) => console.error('Dev seed failed', err));
      }
    }),
    // Does nothing except in the e2e build, which swaps in the real hook (ADR-005).
    provideAppInitializer(() => installE2eHooks(inject(LogEntryRepository))),
  ],
};
