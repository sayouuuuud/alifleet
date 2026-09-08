<?php
/**
 * Plugin Name: ALI FLEET Headless Admin Redirect & SSL Enforcer
 * Description: Enforces full HTTPS, upgrades mixed content via CSP and output filtering, secures cookies, and redirects public frontend views to /wp-admin/.
 * Version:     1.1.0
 * Author:      ALI FLEET
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Absolute HTTPS override and Reverse Proxy detection for public domains.
 */
$public_hosts = [ 'a-f.site', 'www.a-f.site', 'cms.alifleet.com' ];
$is_public_host = isset( $_SERVER['HTTP_HOST'] ) && in_array( $_SERVER['HTTP_HOST'], $public_hosts, true );

if ( $is_public_host ) {
	$is_original_https = (
		( isset( $_SERVER['HTTP_X_FORWARDED_PROTO'] ) && 'https' === strtolower( (string) $_SERVER['HTTP_X_FORWARDED_PROTO'] ) ) ||
		( isset( $_SERVER['HTTP_CF_VISITOR'] ) && false !== strpos( (string) $_SERVER['HTTP_CF_VISITOR'], 'https' ) ) ||
		( isset( $_SERVER['HTTP_X_FORWARDED_SSL'] ) && 'on' === strtolower( (string) $_SERVER['HTTP_X_FORWARDED_SSL'] ) ) ||
		( isset( $_SERVER['HTTPS'] ) && ( 'on' === strtolower( (string) $_SERVER['HTTPS'] ) || '1' === (string) $_SERVER['HTTPS'] ) ) ||
		( isset( $_SERVER['SERVER_PORT'] ) && 443 === (int) $_SERVER['SERVER_PORT'] )
	);

	// If accessed directly over HTTP, redirect immediately with 301 to HTTPS
	if ( ! $is_original_https && 'cli' !== php_sapi_name() ) {
		header( 'Location: https://' . $_SERVER['HTTP_HOST'] . ( $_SERVER['REQUEST_URI'] ?? '/' ), true, 301 );
		exit;
	}

	$_SERVER['HTTPS'] = 'on';
	$_SERVER['SERVER_PORT'] = 443;
}

/**
 * Send HSTS and Content-Security-Policy headers across ALL request types:
 * Frontend, Admin, Login, and API.
 */
function alifleet_security_headers(): void {
	if ( headers_sent() ) {
		return;
	}
	header( 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload' );
	header( 'X-Content-Type-Options: nosniff' );
	header( 'Content-Security-Policy: upgrade-insecure-requests; frame-ancestors \'self\'', true );
}

if ( ! headers_sent() && $is_public_host ) {
	alifleet_security_headers();
}
add_action( 'init', 'alifleet_security_headers', 999 );
add_action( 'admin_init', 'alifleet_security_headers', 999 );
add_action( 'login_init', 'alifleet_security_headers', 999 );
add_action( 'send_headers', 'alifleet_security_headers', 999 );
add_action( 'template_redirect', 'alifleet_security_headers', 999 );

/**
 * Inject upgrade-insecure-requests via <meta> tag as a browser-level guarantee.
 */
function alifleet_upgrade_insecure_meta(): void {
	echo '<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">' . "\n";
}
add_action( 'wp_head', 'alifleet_upgrade_insecure_meta', 1 );
add_action( 'admin_head', 'alifleet_upgrade_insecure_meta', 1 );
add_action( 'login_head', 'alifleet_upgrade_insecure_meta', 1 );

/**
 * Force HTTPS for all core and plugin URL generators.
 */
function alifleet_force_https_urls( string $url ): string {
	global $is_public_host;
	if ( $is_public_host ) {
		$url = str_replace( 'http://', 'https://', $url );
	}
	return $url;
}

add_filter( 'site_url', 'alifleet_force_https_urls', 999 );
add_filter( 'admin_url', 'alifleet_force_https_urls', 999 );
add_filter( 'home_url', 'alifleet_force_https_urls', 999 );
add_filter( 'login_url', 'alifleet_force_https_urls', 999 );
add_filter( 'login_headerurl', 'alifleet_force_https_urls', 999 );
add_filter( 'plugins_url', 'alifleet_force_https_urls', 999 );
add_filter( 'content_url', 'alifleet_force_https_urls', 999 );
add_filter( 'includes_url', 'alifleet_force_https_urls', 999 );
add_filter( 'stylesheet_directory_uri', 'alifleet_force_https_urls', 999 );
add_filter( 'template_directory_uri', 'alifleet_force_https_urls', 999 );
add_filter( 'theme_file_uri', 'alifleet_force_https_urls', 999 );
add_filter( 'parent_theme_file_uri', 'alifleet_force_https_urls', 999 );
add_filter( 'script_loader_src', 'alifleet_force_https_urls', 999 );
add_filter( 'style_loader_src', 'alifleet_force_https_urls', 999 );
add_filter( 'wp_get_attachment_url', 'alifleet_force_https_urls', 999 );
add_filter( 'rest_url', 'alifleet_force_https_urls', 999 );

/**
 * Force HTTPS in responsive image srcset attributes.
 */
function alifleet_force_https_srcset( array $sources ): array {
	foreach ( $sources as &$source ) {
		if ( isset( $source['url'] ) ) {
			$source['url'] = str_replace( 'http://', 'https://', (string) $source['url'] );
		}
	}
	return $sources;
}
add_filter( 'wp_calculate_image_srcset', 'alifleet_force_https_srcset', 999 );

/**
 * Enforce secure cookies so session/auth tokens are only sent over HTTPS.
 */
add_filter( 'secure_auth_cookie', '__return_true', 999 );
add_filter( 'secure_logged_in_cookie', '__return_true', 999 );
add_filter( 'secure_signon_cookie', '__return_true', 999 );

/**
 * Output buffering to replace any remaining HTTP URLs in the final HTML,
 * including JSON-escaped URLs (e.g. in wp_localize_script).
 */
function alifleet_mixed_content_fix( $buffer ) {
	global $is_public_host;
	if ( $is_public_host && is_string( $buffer ) ) {
		$buffer = str_replace(
			[
				'http://a-f.site',
				'http://www.a-f.site',
				'http://cms.alifleet.com',
				'http:\/\/a-f.site',
				'http:\/\/www.a-f.site',
				'http:\/\/cms.alifleet.com',
				'http://0.gravatar.com',
				'http://1.gravatar.com',
				'http://2.gravatar.com',
				'http://secure.gravatar.com',
			],
			[
				'https://a-f.site',
				'https://www.a-f.site',
				'https://cms.alifleet.com',
				'https://a-f.site',
				'https:\/\/a-f.site',
				'https:\/\/www.a-f.site',
				'https:\/\/cms.alifleet.com',
				'https:\/\/a-f.site',
				'https://secure.gravatar.com',
				'https://secure.gravatar.com',
				'https://secure.gravatar.com',
				'https://secure.gravatar.com',
			],
			$buffer
		);
	}
	return $buffer;
}

// Start output buffering as early as possible on non-CLI requests
if ( 'cli' !== php_sapi_name() && ( ! defined( 'WP_CLI' ) || ! WP_CLI ) ) {
	ob_start( 'alifleet_mixed_content_fix' );
}

/**
 * A proxy header is only a routing signal, so accept it on the two WooCommerce
 * surfaces the Next.js server needs and only for a configured frontend origin.
 */
function alifleet_is_checkout_proxy_request( string $request_path ): bool {
	if ( ! isset( $_SERVER['HTTP_X_ALIFLEET_FRONTEND_ORIGIN'] ) ) {
		return false;
	}

	$origin = rtrim(
		esc_url_raw( wp_unslash( (string) $_SERVER['HTTP_X_ALIFLEET_FRONTEND_ORIGIN'] ) ),
		'/'
	);
	if ( '' === $origin ) {
		return false;
	}

	$allowed_origins = defined( 'ALIFLEET_ALLOWED_ORIGINS' ) && is_array( ALIFLEET_ALLOWED_ORIGINS )
		? ALIFLEET_ALLOWED_ORIGINS
		: [ 'https://alifleet.com', 'https://www.alifleet.com' ];
	$allowed_origins = array_map(
		static fn ( $allowed_origin ): string => rtrim( (string) $allowed_origin, '/' ),
		$allowed_origins
	);
	if ( ! in_array( $origin, $allowed_origins, true ) ) {
		return false;
	}

	$path = '/' . ltrim( $request_path, '/' );
	return in_array( rtrim( $path, '/' ), [ '/checkout', '/cart' ], true )
		|| 0 === strpos( $path, '/checkout/' )
		|| 0 === strpos( $path, '/cart/' );
}

/**
 * Redirect all public frontend views directly to WordPress Admin / Login.
 */
add_action(
	'template_redirect',
	static function (): void {
		// 1. Do not redirect admin, CLI, cron, or AJAX.
		if ( is_admin() || wp_doing_cron() || wp_doing_ajax() || ( defined( 'WP_CLI' ) && WP_CLI ) ) {
			return;
		}

		// 2. Do not redirect REST API requests.
		if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
			return;
		}

		$uri          = (string) ( $_SERVER['REQUEST_URI'] ?? '' );
		$request_path = (string) wp_parse_url( $uri, PHP_URL_PATH );

		// 3. Do not redirect GraphQL queries (essential for Next.js frontend).
		if ( false !== strpos( $uri, '/graphql' ) || isset( $_GET['graphql'] ) ) {
			return;
		}

		// 4. Do not redirect REST API endpoints or WooCommerce webhooks/APIs.
		if (
			false !== strpos( $uri, '/wp-json' ) ||
			isset( $_GET['rest_route'] ) ||
			isset( $_GET['wc-ajax'] ) ||
			false !== strpos( $uri, '/wc-api' ) ||
			false !== strpos( $uri, '/wc-auth' )
		) {
			return;
		}

		// 5. Allow the cart handoff and narrowly scoped Next.js proxy views.
		if ( isset( $_GET['alifleet-cart'] ) || alifleet_is_checkout_proxy_request( $request_path ) ) {
			return;
		}

		// 6. Do not redirect login or registration.
		if ( false !== strpos( $uri, 'wp-login.php' ) || false !== strpos( $uri, 'wp-register.php' ) ) {
			return;
		}

		// 7. Redirect every other public frontend view to WordPress Admin.
		if ( ! is_user_logged_in() ) {
			wp_safe_redirect( wp_login_url( admin_url() ), 302 );
		} else {
			wp_safe_redirect( admin_url(), 302 );
		}
		exit;
	},
	1
);
