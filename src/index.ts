/**
 * @file The frontend class for the CookieYes accessibility improvements
 * @module a11y-cookie-yes
 * @description trapping focus, transforming tags, changing aria-labels and more.
 *
 * @requires focus-trap
 * @requires a11y-cookie-yes/src/helpers/a11y-helpers
 * @author WybeBosch
 */

import { transformTag, waitForElement, checkCanFocusTrap } from './helpers/a11y-helpers';
import { GoogleConsentMode } from './google-consent-mode/index';

import * as focusTrap from 'focus-trap';
import './styles.scss';

interface DefaultOptionsType {
	googleConsentMode?: boolean;
}
// =====================================================================================
// ================================ Class definitions ===================================
// =====================================================================================
export default class A11yCookieYes {
	private static instance: A11yCookieYes = new A11yCookieYes();
	private options: DefaultOptionsType = {
		googleConsentMode: false,
	};

	private REVISIT_BTN_WRAPPER_CSS: string = '.cky-btn-revisit-wrapper';

	private EMBED_BLOCKER_NEW_CLASS_CSS: string = '.cky-banner-element';
	private EMBED_BLOCKER_BUTTON_CSS: string = '[data-cky-tag="placeholder-title"]';
	private COOKIE_YES_HIDDEN_CSS: string = '.cky-hide';
	private BANNER_TITLE_ID: string = 'yard-cky-title';
	private BANNER_TITLE_CSS: string = '.cky-title';
	private BANNER_BTN_CLOSE_CSS: string = '.cky-banner-btn-close';

	private MODAL_OPEN_CSS: string = '.cky-modal-open';
	private MODAL_BTN_CLOSE_CSS: string = '.cky-modal .cky-btn-close';
	private MODAL_BTN_CLOSE_ARIA_LABEL: string = 'Sluit';
	private MODAL_TITLE_CSS: string = '.cky-preference-title';
	private MODAL_ACCORDION_CSS: string = '.cky-accordion';
	private MODAL_ACCORDION_BTN_CSS: string = '.cky-accordion-btn';
	private MODAL_ACCORDION_OPEN_CSS: string = '.cky-accordion-active';
	private MODAL_CHECKBOXES_CSS: string = '.cky-switch input[type="checkbox"]';

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
	constructor(options?: DefaultOptionsType) {
		// Support for both `new A11yCookieYes({option = true})` and `A11yCookieYes.getInstance()` syntax
		if (!A11yCookieYes.instance) {
			A11yCookieYes.instance = this;
			this.options = { ...this.options, ...options };
			this.init();
		} else {
			A11yCookieYes.instance.options = { ...A11yCookieYes.instance.options, ...options };
		}
		return A11yCookieYes.instance;
	}

	public static getInstance(): A11yCookieYes {
		return A11yCookieYes.instance || new A11yCookieYes();
	}

	// =====================================================================================
	// ====================================== Init =========================================
	// =====================================================================================
	public async init() {
		this.cookieBanner = (await waitForElement(this.COOKIE_BANNER_CSS)) as HTMLElement;
		this.cookieModal = (await waitForElement(this.COOKIE_MODAL_CSS)) as HTMLElement;

		if (this.options.googleConsentMode === true) {
			new GoogleConsentMode();
		}

		// If the cookieBanner could not be found within 5 sec, dont execute rest of init();
		if (!this.cookieBanner || !this.cookieModal) return false;

		this.initFocusTrapOptions();
		this.focusTrapBanner = focusTrap.createFocusTrap(
			this.cookieBanner,
			this.focusTrapBannerOptions
		);

		this.focusTrapModal = focusTrap.createFocusTrap(this.cookieModal, this.focusTrapModalOptions);

		// Revisit button
		this.moveRevisitButtonToFooter();
		this.emptyRevisitButtonAltText();

		// Banner
		this.observeBanner();
		this.changeBanner();
		this.changeBannerTitleToH2();

		// Modal
		this.observeModal();
		this.observeAccordions();
		this.changeModalTitleToH2();
		this.changeModalCloseBtnAriaLabel();
		this.changeModelButtonsToH3();
		this.addCheckboxRoleSwitch();
		this.changeCheckboxAriaLabel();

		// Page
		this.changeEmbedText();

		return this;
	}

	// =====================================================================================
	// ================================= Focus trap ========================================
	// =====================================================================================

	private closeCookieYes = (elementSelector: string) => {
		const closeButton: HTMLButtonElement | null = document.querySelector(elementSelector);
		if (!closeButton || closeButton.closest(this.COOKIE_YES_HIDDEN_CSS)) return;
		closeButton.click();
	};

	private initFocusTrapOptions() {
		this.focusTrapBannerOptions = {
			...this.focusTrapOptions,
			onDeactivate: () => this.closeCookieYes(this.BANNER_BTN_CLOSE_CSS),
		};

		this.focusTrapModalOptions = {
			...this.focusTrapOptions,
			onDeactivate: () => this.closeCookieYes(this.MODAL_BTN_CLOSE_CSS),
		};
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

	/**
	 * A11y: Empty the alt text of <img> in the revisit button. The button already has an aria-label,
	 * so the alt text is redundant. It's also English and not translatable.
	 */
	private emptyRevisitButtonAltText(): void {
		const revisitButton = document.querySelector(this.REVISIT_BTN_WRAPPER_CSS);
		const img = revisitButton?.querySelector('img');
		if (!img) return;
		img.setAttribute('alt', '');
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
	 * A11y: Add dialog role and aria-labelledby to the banner
	 */
	private changeBanner(): void {
		this.cookieBanner?.setAttribute('role', 'dialog');
		this.cookieBanner?.setAttribute('aria-labelledby', this.BANNER_TITLE_ID);
	}

	/**
	 * A11y: transform modal title to h2 and remove unnecessary role and aria-level
	 */
	private changeBannerTitleToH2(): void {
		const title: HTMLParagraphElement | null = document.querySelector(this.BANNER_TITLE_CSS);
		if (!title) return;

		const transformedTitle = transformTag(title, 'h2') as HTMLHeadingElement;

		if (transformedTitle.hasAttribute('role')) {
			transformedTitle.removeAttribute('role');
		}

		if (transformedTitle.hasAttribute('aria-level')) {
			transformedTitle.removeAttribute('aria-level');
		}

		transformedTitle.id = this.BANNER_TITLE_ID;
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
			if (!button.parentElement) return;

			const h3Element = document.createElement('h3');
			h3Element.classList.add('cky-preference-title');
			button.parentElement.insertBefore(h3Element, button);
			h3Element.appendChild(button);
		});
	}

	/**
	 * A11y: Change the role of the checkboxes to switch
	 */
	private addCheckboxRoleSwitch(): void {
		const checkboxes: NodeListOf<HTMLInputElement> = document.querySelectorAll(
			this.MODAL_CHECKBOXES_CSS
		);

		checkboxes?.forEach((checkbox: HTMLInputElement) => {
			if (checkbox.hasAttribute('role')) {
				checkbox.removeAttribute('role');
			}

			checkbox.setAttribute('role', 'switch');
		});
	}

	/**
	 * A11y: Change the aria-label of the checkboxes to match the aria-label of the button
	 */
	private changeCheckboxAriaLabel(): void {
		const accordions: NodeListOf<HTMLElement> = document.querySelectorAll(this.MODAL_ACCORDION_CSS);

		accordions?.forEach((wrapper: HTMLElement): void => {
			const button: HTMLButtonElement | null = wrapper.querySelector(this.MODAL_ACCORDION_BTN_CSS);
			const checkbox: HTMLInputElement | null = wrapper.querySelector(this.MODAL_CHECKBOXES_CSS);

			if (!button || !checkbox) return;

			if (checkbox.hasAttribute('aria-label') && button.hasAttribute('aria-label')) {
				checkbox.setAttribute('aria-label', button.getAttribute('aria-label') as string);
			}

			const observer = new MutationObserver((mutations: MutationRecord[]) => {
				mutations.forEach((mutation: MutationRecord) => {
					if (mutation.type === 'attributes' && mutation.attributeName === 'aria-label') {
						if (checkbox.hasAttribute('aria-label') && button.hasAttribute('aria-label')) {
							const newLabel = button.getAttribute('aria-label') as string;
							if (checkbox.getAttribute('aria-label') !== newLabel) {
								checkbox.setAttribute('aria-label', newLabel);
							}
						}
					}
				});
			});

			observer.observe(checkbox, {
				attributeFilter: ['aria-label'],
			});
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
