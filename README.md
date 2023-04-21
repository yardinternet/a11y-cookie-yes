# Accessible CookieYes

Easily manage and re-use the CookieYes accessibility improvements in Yard projects.

## ✅ Getting started

### Step 1: Install @yardinternet/a11y-cookie-yes

The recommended installation method is NPM. Install the latest version by the following command:

```bash
npm install --save @yardinternet/a11y-cookie-yes
```

### Step 2: Initialize A11yCookieYes

```JS
import A11yCookieYes from '@yardinternet/a11y-cookie-yes';

document.addEventListener( 'DOMContentLoaded', function () {
    new A11yCookieYes().init();
} );
```

## ⚙️ Changing options

TBA.

## 👷‍♀️ Package development

1. Run `npm link` inside this project.
2. Run `npm link @yardinternet/a11y-cookie-yes` inside the project or theme. This will create a symbolic link to the project folder.
3. Run `npm run start` inside this project AND the equivalent script inside the project or theme.

## 🚀 How to publish

1. Change the version of `package.json` to the desired version and commit this change.
2. Go to [releases of the package](https://github.com/yardinternet/a11y-cookie-consent/releases) and click on "Draft a new release"
3. Click "Choose a tag", type the corresponding version and press Enter. Add a title and description for the release.
4. Click "Publish release"

The Github Workflow `release-package.yml` will run whenever a release is created in this repository. If the tests pass, then the package will be published to Github packages.
