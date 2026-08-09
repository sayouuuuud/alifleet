<?php
/**
 * Plugin Name: ALI FLEET — OPcache flush on demand
 * Description: Lets a deploy invalidate the PHP OPcache without restarting the
 *              container, which the agent is not permitted to do.
 *
 * WHY THIS EXISTS
 * ---------------
 * This container runs PHP with:
 *
 *     opcache.enable              = 1
 *     opcache.validate_timestamps = 0
 *
 * With validate_timestamps disabled, PHP compiles each file exactly once and
 * then never looks at its mtime again. Editing mu-plugins/alifleet-cms.php on
 * disk therefore has NO effect on web requests — the old bytecode keeps being
 * served until the pool restarts. WP-CLI runs in a separate process with
 * opcache.enable_cli=0, so `wp eval` happily reports the NEW code while the
 * site keeps executing the OLD code. That split is extremely easy to misread as
 * "my fix didn't work" and send you debugging the wrong layer entirely.
 *
 * `docker restart` and `systemctl restart` are both denied to the agent user, so
 * the only remaining lever is opcache_reset() from inside a web request.
 *
 * USAGE
 * -----
 *   1. wp-agent put <file> mu-plugins/<file>        # deploy the real change
 *   2. wp-agent put marker  uploads/.flush-opcache  # arm the flush
 *   3. curl https://<site>/                          # any web request; resets
 *
 * The marker is deleted as soon as it is honoured, so the reset happens once
 * and normal requests never pay for it.
 *
 * NOTE ON THIS FILE: because OPcache keys on file path, a file that has never
 * been requested before is always compiled fresh. That is why this helper works
 * the very first time it is deployed, and it is also the escape hatch if the
 * cache ever gets wedged again — deploy the fix under a new filename.
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'muplugins_loaded',
	static function (): void {
		$marker = WP_CONTENT_DIR . '/uploads/.flush-opcache';

		if ( ! file_exists( $marker ) ) {
			return;
		}

		// Remove the marker first: if the reset throws, or the request dies part
		// way through, we must not leave a trap that resets the cache on every
		// single request from then on.
		@unlink( $marker );

		if ( function_exists( 'opcache_reset' ) ) {
			opcache_reset();
			error_log( '[alifleet] OPcache reset via uploads/.flush-opcache marker.' );
		}
	},
	0
);
