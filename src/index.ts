/**
 * @file The frontend class for the CookieYes accessibility improvements
 * @since 1.0.0
 * @module a11y-cookie-yes
 * @description trapping focus, transforming tags, changing aria-labels and more.
 *
 * @requires focus-trap
 * @requires a11y-cookie-yes/src/helpers/a11y-helpers
 * @author WybeBosch
 * @liscense MIT
 */
import { transformTag, waitForElement, checkCanFocusTrap } from './helpers/a11y-helpers';
import * as focusTrap from 'focus-trap';
import './styles.scss';

// =====================================================================================
// ================================ Class definitions ===================================
// =====================================================================================
export default class A11yCookieYes {
	private static instance: A11yCookieYes = new A11yCookieYes();
	private readonly options: {};

	private REVISIT_BTN_WRAPPER_CSS: string = '.cky-btn-revisit-wrapper';

	private EMBED_BLOCKER_NEW_CLASS_CSS: string = '.cky-banner-element';
	private EMBED_BLOCKER_BUTTON_CSS: string = '[data-cky-tag="placeholder-title"]';
	private COOKIE_YES_HIDDEN_CSS: string = '.cky-hide';
	private BANNER_TITLE_CSS: string = '.cky-title';
	private BANNER_BTN_CLOSE_CSS: string = '.cky-banner-btn-close';

	private MODAL_OPEN_CSS: string = '.cky-modal-open';
	private MODAL_BTN_CLOSE_CSS: string = '.cky-modal .cky-btn-close';
	private MODAL_BTN_CLOSE_ARIA_LABEL: string = 'Sluit';
	private MODAL_TITLE_CSS: string = '.cky-preference-title';
	private MODAL_ACCORDION_CSS: string = '.cky-accordion';
	private MODAL_ACCORDION_BTN_CSS: string = '.cky-accordion-btn';
	private MODAL_ACCORDION_OPEN_CSS: string = '.cky-accordion-active';

	private COOKIE_BANNER_CSS: string = '.cky-consent-container';
	private COOKIE_MODAL_CSS: string = '.cky-modal';
	private cookieModal: undefined | HTMLElement;
	private cookieBanner: undefined | HTMLElement;

	private focusTrapBanner: undefined | typeof focusTrap;
	private focusTrapModal: undefined | typeof focusTrap;

	private focusTrapBannerOptions: undefined | object;
	private focusTrapModalOptions: undefined | object;
	private focusTrapOptions: object = {
		allowOutsideClick: true,
		clickOutsideDeactivates: true,
		checkCanFocusTrap,
	};

	// =====================================================================================
	// ================================== Constructor ======================================
	// =====================================================================================
	constructor(options?: {}) {
		this.options = options || {};
		if (A11yCookieYes.instance) {
			return A11yCookieYes.instance;
		}

		// trapOptions declared here since spreadoperator cant be used in class properties
		this.focusTrapBannerOptions = {
			...this.focusTrapOptions,
			// By default CookieYes has the banner close button removed from the DOM, unless you enable the setting.
			onDeactivate: () => this.closeCookieYes(this.BANNER_BTN_CLOSE_CSS),
		};

		this.focusTrapModalOptions = {
			...this.focusTrapOptions,
			onDeactivate: () => this.closeCookieYes(this.MODAL_BTN_CLOSE_CSS),
		};

		// Code is executed from init function because constructor cannot be async.
		this.init();

		A11yCookieYes.instance = this;
	}

	public static getInstance(): A11yCookieYes {
		return A11yCookieYes.instance;
	}

	private closeCookieYes = (elementSelector: string) => {
		const closeButton: HTMLButtonElement | null = document.querySelector(elementSelector);
		if (!closeButton || closeButton.closest(this.COOKIE_YES_HIDDEN_CSS)) return;
		closeButton.click();
	};

	// =====================================================================================
	// ====================================== Init =========================================
	// =====================================================================================
	public async init() {
		this.cookieBanner = (await waitForElement(this.COOKIE_BANNER_CSS)) as HTMLElement;
		this.cookieModal = (await waitForElement(this.COOKIE_MODAL_CSS)) as HTMLElement;

		// If the cookieBanner could not be found within 5 sec, dont execute rest of init();
		if (!this.cookieBanner || !this.cookieModal) return false;

		this.focusTrapBanner = focusTrap.createFocusTrap(
			this.cookieBanner,
			this.focusTrapBannerOptions
		);

		this.focusTrapModal = focusTrap.createFocusTrap(this.cookieModal, this.focusTrapModalOptions);

		// Revisit button
		this.moveRevisitButtonToFooter();

		// Banner
		this.observeBanner();
		this.changeBannerTitleToH2();

		// Modal
		this.observeModal();
		this.observeAccordions();
		this.changeModalTitleToH2();
		this.changeModalCloseBtnAriaLabel();
		this.changeModelButtonsToH3();

		// Page
		this.changeEmbedText();

		return this;
	}

	// =====================================================================================
	// ============================ Revisit content button =================================
	// =====================================================================================

	/**
	 * A11y: Move the revisit button to the footer
	 */
	private moveRevisitButtonToFooter(): void {
		const revisitButton = document.querySelector(this.REVISIT_BTN_WRAPPER_CSS);
		const footer = document.querySelector('footer');

		if (revisitButton && footer) {
			footer.appendChild(revisitButton);
		}
	}

	// =====================================================================================
	// ===================================== Banner ========================================
	// =====================================================================================

	/**
	 * A11y: trap focus in banner when the accept all button is focused
	 */
	private observeBanner(): void {
		// Check if cookiebanner is currently visible
		if (this.cookieBanner?.classList.contains(this.COOKIE_YES_HIDDEN_CSS.substring(1))) {
			this.focusTrapBanner?.deactivate();
			return;
		}

		this.focusTrapBanner?.activate();

		// Check if the banner stays visible
		const observer = new MutationObserver((mutations: MutationRecord[]) => {
			mutations.forEach((mutation: MutationRecord) => {
				const bannerIsHidden = (mutation.target as HTMLElement).classList.contains(
					this.COOKIE_YES_HIDDEN_CSS.substring(1)
				);
				mutation.attributeName === 'class' && bannerIsHidden
					? this.focusTrapBanner?.deactivate()
					: this.focusTrapBanner?.activate();
			});
		});

		observer.observe(this.cookieBanner as HTMLElement, { attributes: true });
	}

	/**
	 * A11y: transform modal title to h2
	 */
	private changeBannerTitleToH2(): void {
		const title: HTMLParagraphElement | null = document.querySelector(this.BANNER_TITLE_CSS);
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

		const observer = new MutationObserver((mutations: MutationRecord[]) => {
			mutations.forEach((mutation: MutationRecord) => {
				const targetElement = mutation.target as HTMLElement;
				if (mutation.attributeName === 'class') {
					// If the modal opens
					if (
						mutation.attributeName == 'class' &&
						targetElement.classList.contains(this.MODAL_OPEN_CSS.substring(1))
					) {
						setTimeout(() => {
							this.focusTrapModal.activate();
						}, 200);
					}

					// If the modal closes
					if (
						mutation.attributeName == 'class' &&
						!targetElement.classList.contains(this.MODAL_OPEN_CSS.substring(1))
					) {
						this.focusTrapModal?.deactivate();
					}
				}
			});
		});

		observer.observe(this.cookieModal, {
			attributes: true,
		});
	}

	/**
	 * A11y: observe accordions for changes to update aria-expanded
	 */
	private observeAccordions(): void {
		const accordions: NodeListOf<HTMLElement> = document.querySelectorAll(this.MODAL_ACCORDION_CSS);

		accordions?.forEach((wrapper: HTMLElement): void => {
			const button: HTMLButtonElement | null = wrapper.querySelector(this.MODAL_ACCORDION_BTN_CSS);

			button?.setAttribute('aria-expanded', 'false');

			const observer = new MutationObserver((mutations: MutationRecord[]) => {
				mutations.forEach((mutation: MutationRecord) => {
					const newAriaState = wrapper?.classList
						.contains(this.MODAL_ACCORDION_OPEN_CSS.substring(1))
						.toString();
					if (mutation.type === 'attributes') {
						button?.setAttribute('aria-expanded', newAriaState);
					}
				});
			});

			observer.observe(wrapper, {
				attributes: true,
			});
		});
	}

	/**
	 * A11y: transform modal title to h2
	 */
	private changeModalTitleToH2(): void {
		const title: HTMLSpanElement | null = document.querySelector(this.MODAL_TITLE_CSS);
		if (!title) return;
		transformTag(title, 'h2');
	}

	/**
	 * A11y: Change aria-label close button in modal
	 */
	private changeModalCloseBtnAriaLabel(): void {
		const closeButton: HTMLButtonElement | null = document.querySelector(this.MODAL_BTN_CLOSE_CSS);
		if (!closeButton) return;

		closeButton.setAttribute('aria-label', this.MODAL_BTN_CLOSE_ARIA_LABEL);
	}

	/**
	 * A11y: Makes the buttons in the modal h3 elements
	 */
	private changeModelButtonsToH3(): void {
		const buttons = document.querySelectorAll(this.MODAL_ACCORDION_BTN_CSS);
		buttons?.forEach((button: Element) => {
			if(!button.parentElement) return;

			const h3Element = document.createElement('h3');
			h3Element.classList.add('cky-preference-title');
			button.parentElement.insertBefore(h3Element, button);
			h3Element.appendChild(button);
		  
		});
	  }
	  
	// ====================================================================================
	// ====================================== Page ========================================
	// ====================================================================================

	/**
	 * Make the accept text which appears when the user has not accepted cookies accessible
	 * like a button. Changing the <p> to a <button> will lose the event listener.
	 */
	private changeEmbedText(): void {
		const acceptText: NodeListOf<Element> = document.querySelectorAll(
			this.EMBED_BLOCKER_BUTTON_CSS
		);

		acceptText?.forEach((text: Element) => {
			const button = transformTag(text, 'button') as HTMLButtonElement;
			if (!button) return;

			// This special classnames is detected by cookie-yes and will trigger a reopening of the modal when clicked
			// @see https://www.cookieyes.com/documentation/change-cookie-consent-using-cookieyes/
			button.classList.add(this.EMBED_BLOCKER_NEW_CLASS_CSS.substring(1));
		});
	}
}
