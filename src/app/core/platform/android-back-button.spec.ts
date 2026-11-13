import { LEAVE_APP_PRIORITY, setUpAndroidBackButton } from './android-back-button';

type Handler = (processNextHandler: () => void) => void;

/** Captures the handler registered with Ionic's back-button chain. */
function setUp(canGoBack: boolean) {
  let registered: { priority: number; handler: Handler } | undefined;
  const platform = {
    backButton: {
      subscribeWithPriority: (priority: number, handler: Handler) => {
        registered = { priority, handler };
        return { unsubscribe: () => undefined };
      },
    },
  };
  const leaveApp = vi.fn();
  const processNextHandler = vi.fn();
  setUpAndroidBackButton(platform as never, () => ({ canGoBack: () => canGoBack }), leaveApp);
  return { registered: registered!, leaveApp, processNextHandler };
}

describe('setUpAndroidBackButton', () => {
  it("runs after overlays (100) and menus (99) close, before Ionic's page stack (0)", () => {
    const { registered } = setUp(true);
    expect(registered.priority).toBe(LEAVE_APP_PRIORITY);
    expect(LEAVE_APP_PRIORITY).toBeGreaterThan(0);
    expect(LEAVE_APP_PRIORITY).toBeLessThan(99);
  });

  it('goes back one screen when there is one to go back to', () => {
    const { registered, leaveApp, processNextHandler } = setUp(true);
    registered.handler(processNextHandler);
    expect(processNextHandler).toHaveBeenCalledOnce();
    expect(leaveApp).not.toHaveBeenCalled();
  });

  it('leaves the app on a screen with nowhere to go back to', () => {
    const { registered, leaveApp, processNextHandler } = setUp(false);
    registered.handler(processNextHandler);
    expect(leaveApp).toHaveBeenCalledOnce();
    expect(processNextHandler).not.toHaveBeenCalled();
  });
});
