const scss = require('rollup-plugin-scss');
/**
 * @type {import('dts-cli').DtsConfig}
 */
module.exports = {
	rollup(config, options) {
		config.plugins.push(
			scss({
				fileName: 'a11y-cookie-yes.css',
				outputStyle: 'compressed',
			})
		);
		return config;
	},
};
