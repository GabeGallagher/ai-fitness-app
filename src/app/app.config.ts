import { inject, provideAppInitializer, type ApplicationConfig } from '@angular/core';
import { PreloadAllModules, RouteReuseStrategy, provideRouter, withComponentInputBinding, withPreloading } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { seedDevData } from './core/db/dev-seed';
import { LogEntryRepository } from './core/db/log-entry.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
    // Development builds only. Not awaited: startup never waits on the database, and
    // the daily log's live query shows the sample days as soon as they're written.
    provideAppInitializer(() => {
      if (!environment.production) {
        seedDevData(inject(LogEntryRepository)).catch((err) => console.error('Dev seed failed', err));
      }
    }),
  ],
};
