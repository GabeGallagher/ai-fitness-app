// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  /** Fill an empty database with sample days (core/db/dev-seed.ts). */
  devSeed: true,
  /**
   * Turn on Ionic's back-button handling in a desktop browser, so E2E tests can send
   * the `backbutton` event Capacitor sends on a phone. On the phone it's on anyway.
   */
  browserBackButton: false,
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
