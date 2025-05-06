# Accessible CookieYes

Easily manage and reuse CookieYes accessibility improvements in Yard projects.

## ✅ Getting started

### Step 1: Install @yardinternet/a11y-cookie-yes

The recommended installation method is NPM. Install the latest version by running the following command:

```bash
npm install --save @yardinternet/a11y-cookie-yes
```

### Step 2: Initialize A11yCookieYes

```JS
import A11yCookieYes from '@yardinternet/a11y-cookie-yes';

document.addEventListener( 'DOMContentLoaded', function () {
   A11yCookieYes.getInstance();
} );
```

## Step 3 (optional): Import CSS files

The package itself fixes a lot of styling issues with CookieYes, which is why it's recommended to import it as well. Optionally, you can pass extra native CSS variables to overwrite the default styling.

```scss
@import '~@yardinternet/a11y-cookie-yes/dist/a11y-cookie-yes';

[data-cky-tag='video-placeholder'],
.cky-btn-revisit-wrapper,
.cky-consent-container,
.cky-modal {
 --a11y-cookie-yes-primary-color: #{theme-color( 'primary' )};
}
```

Depending on your primary color, you might need to add a border if your footer has the primary color.

```scss
.cky-btn-revisit-wrapper {
 border: 1px solid color-yiq( theme-color( 'primary' ) );
}
```

## Step 4 (optional): Add embedBlocker a11y script

Depending on your project setup, you might need to add the embedBlocker script.
We usually define ours in `app/Actions/Gutenberg.php`.

```php
 /**
  * Change YouTube block embed URL to:
  * 1. Include youtube-nocookie
  * 2. Add disablekb=1 to disable YouTube keyboard shortcuts for a11y
  * 3. Add ?keyboard=0 to disable Vimeo keyboard shortcuts for a11y
  */
 public function changeEmbedURL(string $blockContent, array $block): string
 {
  if ("core/embed" !== $block['blockName']) {
   return $blockContent;
  }

  $blockContent = str_replace('youtube.com', 'youtube-nocookie.com', $blockContent);
  $blockContent = str_replace('?feature=oembed', '?feature=oembed&disablekb=1', $blockContent); // YouTube
  $blockContent = str_replace('dnt=1', 'dnt=1&keyboard=0', $blockContent); // Vimeo

  return $blockContent;
 }
```

And then call it in our `app/filters.php`

```php
// Embeds
Hook::filter('render_block', 'App\Actions\Gutenberg@changeEmbedURL', 10, 3);
```

## ⚙️ Changing options

List of current styling options that can be overwritten:

```scss
	--a11y-cookie-yes-primary-color: #{$ckDefaultColor};
	--a11y-cookie-yes-border-radius: 5px;
	--a11y-cookie-yes-btn-font-size: 1rem;
	--a11y-cookie-yes-btn-font-size-banner: 0.95rem;
	--a11y-cookie-yes-btn-primary-bg: var(--a11y-cookie-yes-primary-color);
	--a11y-cookie-yes-btn-primary-txt-color: #fff;
	--a11y-cookie-yes-btn-primary-border-color: var(--a11y-cookie-yes-primary-color);
	--a11y-cookie-yes-btn-secondary-bg: transparent;
	--a11y-cookie-yes-btn-secondary-txt-color: var(--a11y-cookie-yes-primary-color);
	--a11y-cookie-yes-btn-secondary-border-color: var(--a11y-cookie-yes-primary-color);
	--a11y-cookie-yes-blocked-embed-bg: #f2f2f2;
	--a11y-cookie-yes-vimeo-icon-font-family: 'Font Awesome 6 Brands';
	--a11y-cookie-yes-vimeo-icon-color: #01adef;
	--a11y-cookie-yes-vimeo-icon-size: 5rem;
	--a11y-cookie-yes-vimeo-icon-unicode: '\f27d';
```

## 👷‍♀️ Package development

1. Run `npm link` inside this project.
2. Run `npm link @yardinternet/a11y-cookie-yes` inside the project or theme. This will create a symbolic link to the project folder.
3. Run `npm run start` inside this project AND the equivalent script inside the project or theme.
Note: Its important for the DTS-CLI to only output 1 format type, otherwise the live reloading wont work properly.
We have chosen to use ESM, since its a smaller format than CSJ, but it does mean we don't support using this package with "require".

## 🚀 How to publish

1. Change the version of `package.json` to the desired version, run `npm update` and commit this change.
2. Go to [releases of the package](https://github.com/yardinternet/a11y-cookie-yes/releases) and click on "Draft a new release"
3. Click "Choose a tag", type the corresponding version and press Enter. Add a title and description for the release.
4. Click "Publish release"

The Github Workflow `release-package.yml` will run whenever a release is created in this repository. If the tests pass, then the package will be published to Github packages.
