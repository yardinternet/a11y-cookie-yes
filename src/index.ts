/**
 * The frontend class for the CookieYes accessibility improvements
 *
 * @since 0.1.0
 */
import { transformTag, waitForElement, checkCanFocusTrap } from './helpers/a11y-helpers';
import * as focusTrap from 'focus-trap';

declare global {
  interface Window {
    _revisitCkyConsent: Function;
  }
}

export default class A11yCookieYes {
  private static instance: A11yCookieYes = new A11yCookieYes();
  private readonly options: {};

  private cookieBannerSelector: string = '.cky-consent-container';
  private cookieModalSelector: string = '.cky-modal';
  private cookieBanner: undefined | HTMLElement;
  private cookieModal: undefined | HTMLElement;

  private focusTrapBanner: undefined | typeof focusTrap;
  private focusTrapModal: undefined | typeof focusTrap;

  private focusTrapBannerOptions: undefined | object;
  private focusTrapModalOptions: undefined | object;
  private focusTrapOptions: object = {
    allowOutsideClick: true,
    clickOutsideDeactivates: true
  };

  // =====================================================================================
  // ================================== constructor ======================================
  // =====================================================================================
  constructor(options?: {}) {
    this.options = options || {};
    if (A11yCookieYes.instance) {
      return A11yCookieYes.instance;
    }

    // Variable declared here since spreadoperator doesnt up above.
    this.focusTrapBannerOptions = {
      ...this.focusTrapOptions,
      onDeactivate: () => {
        console.log('Focus trap on banner was deactivated');
        // By default cookieYes doesnt have a close button on the small banner.
        const closeButton: HTMLButtonElement | null =
          document.querySelector('.cky-banner-btn-close');
        if (!closeButton) return;

        //Check if its already closed maybe?
        closeButton.click();
      }
    };

    this.focusTrapModalOptions = {
      ...this.focusTrapOptions,
      checkCanFocusTrap,
      onDeactivate: () => {
        console.log('Focus trap on modal was deactivated');
        const closeButton: HTMLButtonElement | null = document.querySelector(
          '.cky-modal.cky-modal-open .cky-btn-close'
        );
        if (!closeButton) return;

        //Check if its already closed maybe?
        closeButton.click();
      }
    };

    //Code is executed from init function because constructor cannot be async.
    this.init();

    A11yCookieYes.instance = this;
  }
  public static getInstance(): A11yCookieYes {
    return A11yCookieYes.instance;
  }

  // =====================================================================================
  // ====================================== Init =========================================
  // =====================================================================================
  public async init() {
    this.cookieBanner = (await waitForElement(this.cookieBannerSelector)) as HTMLElement;
    this.cookieModal = (await waitForElement(this.cookieModalSelector)) as HTMLElement;

    //If the cookieBanner could not be found within 5 sec, dont execute rest of init();
    if (!this.cookieBanner) return false;

    this.focusTrapBanner = focusTrap.createFocusTrap(
      this.cookieBannerSelector,
      this.focusTrapBannerOptions
    );
    this.focusTrapModal = focusTrap.createFocusTrap(
      this.cookieModalSelector,
      this.focusTrapModalOptions
    );

    // Banner
    this.observeBanner();
    this.closeBannerOnEscapeUp();
    this.changeBannerTitleToH2();

    // Modal
    this.observeModal();
    this.observeAccordions();
    this.closeModalOnEscapeUp();
    this.changeModalTitleToH2();
    this.changeModalCloseBtnAriaLabel();

    // Page
    this.changeEmbedText();

    return this;
  }

  // =====================================================================================
  // ===================================== Banner ========================================
  // =====================================================================================

  /**
   * A11y: close banner on escape key
   */
  private closeBannerOnEscapeUp(): void {
    document.addEventListener('keyup', (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        this.focusTrapBanner?.deactivate();
      }
    });
  }

  /**
   * A11y: trap focus in banner when the accept all button is focused
   */
  private observeBanner(): void {
    // Check if cookiebanner is currently visible
    if ((this.cookieBanner as HTMLElement).classList.contains('cky-hide')) {
      this.focusTrapBanner?.deactivate();
      return;
    }

    this.focusTrapBanner?.activate();

    //Check if the banner stays visible
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.attributeName === 'class' &&
          (mutation.target as HTMLElement).classList.contains('cky-hide')
        ) {
          this.focusTrapBanner?.deactivate();
        }
      });
    });

    observer.observe(this.cookieBanner as HTMLElement, { attributes: true });
  }

  /**
   * A11y: transform modal title to h2
   */
  private changeBannerTitleToH2(): void {
    const title: HTMLParagraphElement | null = document.querySelector('.cky-title');
    if (!title) return;

    transformTag(title, 'h2');
  }

  // ====================================================================================
  // ===================================== Modal ========================================
  // ====================================================================================

  /**
   * A11y: Observes the cookie modal for changes
   */
  private observeModal(): void {
    if (!this.cookieModal) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation: any) => {
        if (mutation.attributeName === 'class') {
          // If the modal opens
          if (
            mutation.attributeName == 'class' &&
            mutation.target.classList.contains('cky-modal-open')
          ) {
            setTimeout(() => {
              this.focusTrapModal.activate();
            }, 200);
          }

          // If the modal closes
          if (
            mutation.attributeName == 'class' &&
            !mutation.target.classList.contains('cky-modal-open')
          ) {
            this.focusTrapModal?.deactivate();
          }
        }
      });
    });

    observer.observe(this.cookieModal, {
      attributes: true
    });
  }

  /**
   * A11y: observe accordions for changes to update aria-expanded
   */
  private observeAccordions(): void {
    const accordions: NodeListOf<HTMLElement> = document.querySelectorAll('.cky-accordion');

    accordions?.forEach((wrapper): void => {
      const button = wrapper.querySelector('.cky-accordion-btn');

      button?.setAttribute('aria-expanded', 'false');

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes') {
            button?.setAttribute(
              'aria-expanded',
              wrapper?.classList.contains('cky-accordion-active') ? 'true' : 'false'
            );
          }
        });
      });

      observer.observe(wrapper, {
        attributes: true
      });
    });
  }

  /**
   * A11y: close modal on escape key
   *
   * @param {KeyboardEvent} e
   */
  private closeModalOnEscapeUp(): void {
    document.addEventListener('keyup', (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        this.focusTrapModal?.deactivate();
      }
    });
  }

  /**
   * A11y: transform modal title to h2
   */
  private changeModalTitleToH2(): void {
    const title: HTMLSpanElement | null = document.querySelector('.cky-preference-title');
    if (!title) return;
    transformTag(title, 'h2');
  }

  /**
   * A11y: Change aria-label close button in modal
   */
  private changeModalCloseBtnAriaLabel(): void {
    const closeButton: HTMLButtonElement | null = document.querySelector('.cky-btn-close');
    if (!closeButton) return;

    closeButton.setAttribute('aria-label', 'Sluit');
  }

  // ====================================================================================
  // ===================================== Embed ========================================
  // ====================================================================================

  /**
   * Make the accept text which appears when the user has not accepted cookies accessible
   * like a button. Changing the <p> to a <button> will lose the event listener.
   */
  private changeEmbedText(): void {
    const acceptText: NodeListOf<Element> = document.querySelectorAll(
      '[data-cky-tag="placeholder-title"]'
    );

    acceptText?.forEach((text: Element) => {
      const button = transformTag(text, 'button') as HTMLButtonElement;
      if (!button) return;

      button.addEventListener('click', (): void => {
        window._revisitCkyConsent();
      });

      button.addEventListener('keyup', (e: KeyboardEvent): void => {
        if (e.key === 'Enter') {
          window._revisitCkyConsent();
        }
      });
    });
  }
}
