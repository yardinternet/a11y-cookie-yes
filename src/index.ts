/**
 * The frontend class for the CookieYes accessibility improvements
 *
 * @since 0.1.0
 */
export default class A11yCookieYes {
  /**
   * The current options.
   */
  private readonly options: {};

  /**
   * The A11yCookieYes constructor.
   *
   * @param options - Optional. An object with options.
   */
  constructor(options?: {}) {
    this.options = options || {};
  }

  /**
   * Initializes the instance.
   *
   * @return `this`
   */
  init() {
    console.log('A11yCookieYes init');

    return this;
  }
}
