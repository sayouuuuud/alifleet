<?php
/**
 * Plugin Name:  ALI FLEET Headless CMS
 * Description:  Registers everything the Next.js frontend needs from WordPress:
 *               the import_car post type, the Site Settings options page, the
 *               page-slug ACF location rule, GraphQL exposure and CORS.
 * Version:      1.0.0
 * Author:       ALI FLEET
 *
 * Install as a must-use plugin so it can never be deactivated by accident:
 *   wp-content/mu-plugins/alifleet-cms.php
 *
 * Why a plugin instead of the ACF/CPT admin UI?
 *   - CPTs registered through a UI do not reliably carry the show_in_graphql
 *     settings, and a single stray click in the admin can silently break every
 *     query the frontend depends on.
 *   - This file is versioned with the frontend, so the schema and the code that
 *     consumes it always move together.
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// The Next.js origins allowed to call the GraphQL endpoint with credentials.
// Add your production domain here; localhost is kept for development.
if ( ! defined( 'ALIFLEET_ALLOWED_ORIGINS' ) ) {
	define(
		'ALIFLEET_ALLOWED_ORIGINS',
		[
			'https://alifleet.com',
			'https://www.alifleet.com',
			'http://localhost:3000',
		]
	);
}

/* -------------------------------------------------------------------------
 * 1. Custom post type: import_car
 * ---------------------------------------------------------------------- */

add_action(
	'init',
	static function (): void {
		register_post_type(
			'import_car',
			[
				'label'               => 'Import Vehicles',
				'labels'              => [
					'name'          => 'Import Vehicles',
					'singular_name' => 'Import Vehicle',
					'add_new_item'  => 'Add Import Vehicle',
					'edit_item'     => 'Edit Import Vehicle',
					'search_items'  => 'Search Import Vehicles',
					'not_found'     => 'No import vehicles found',
				],
				'public'              => true,
				'has_archive'         => false,
				'menu_icon'           => 'dashicons-car',
				'menu_position'       => 26,
				// 'editor' is intentionally omitted: all vehicle copy lives in ACF
				// fields so it can be translated into all three languages.
				'supports'            => [ 'title', 'thumbnail', 'revisions' ],
				'rewrite'             => [ 'slug' => 'import' ],
				'show_in_rest'        => true,
				'exclude_from_search' => false,

				// WPGraphQL. Without these three the type never appears in the
				// schema and every vehicle query fails.
				'show_in_graphql'     => true,
				'graphql_single_name' => 'importCar',
				'graphql_plural_name' => 'importCars',
			]
		);
	},
	5
);

/* -------------------------------------------------------------------------
 * 2. ACF options page: Site Settings
 *
 * ACF options pages store their values in wp_options, not wp_posts. That is
 * why site settings cannot be imported from a posts CSV and ship as JSON
 * instead — see docs/PLAN.md section 1.5.
 * ---------------------------------------------------------------------- */

add_action(
	'acf/init',
	static function (): void {
		if ( ! function_exists( 'acf_add_options_page' ) ) {
			return;
		}

		acf_add_options_page(
			[
				'page_title'       => 'Site Settings',
				'menu_title'       => 'Site Settings',
				'menu_slug'        => 'site-settings',
				'capability'       => 'manage_options',
				'redirect'         => false,
				'icon_url'         => 'dashicons-admin-settings',
				'position'         => 27,
				'update_button'    => 'Save Site Settings',
				'updated_message'  => 'Site settings saved. The frontend will pick them up on its next revalidation.',

				// Exposes the whole options page as `siteOptions` in GraphQL.
				'show_in_graphql'  => true,
				'graphql_field_name' => 'siteOptions',
			]
		);
	}
);

/* -------------------------------------------------------------------------
 * 3. Custom ACF location rule: Page Slug
 *
 * ACF's built-in "Page" rule matches a numeric post ID, which is not known
 * until the pages exist on a given environment. Matching on the slug keeps
 * alifleet-acf-schema.json portable between local, staging and production.
 * ---------------------------------------------------------------------- */

add_filter(
	'acf/location/rule_types',
	static function ( array $choices ): array {
		$choices['Page']['page_slug'] = 'Page Slug';
		return $choices;
	}
);

add_filter(
	'acf/location/rule_values/page_slug',
	static function ( array $choices ): array {
		foreach ( get_pages( [ 'sort_column' => 'post_title' ] ) as $page ) {
			$choices[ $page->post_name ] = sprintf( '%s (%s)', $page->post_title, $page->post_name );
		}

		// Keep the slugs the frontend expects selectable even before the pages
		// have been created, otherwise importing the schema on a fresh install
		// drops the rule value.
		foreach ( [ 'import', 'products', 'blog', 'cart', 'contact' ] as $slug ) {
			$choices[ $slug ] = $choices[ $slug ] ?? $slug;
		}

		return $choices;
	}
);

add_filter(
	'acf/location/rule_match/page_slug',
	/**
	 * @param bool                 $match   Current match state.
	 * @param array<string,mixed>  $rule    The location rule being evaluated.
	 * @param array<string,mixed>  $screen  Info about the current edit screen.
	 */
	static function ( bool $match, array $rule, array $screen ): bool {
		$post_id = (int) ( $screen['post_id'] ?? 0 );
		if ( $post_id <= 0 ) {
			return false;
		}

		$post = get_post( $post_id );
		if ( ! $post instanceof WP_Post ) {
			return false;
		}

		$is_equal = $post->post_name === $rule['value'];

		return '!=' === $rule['operator'] ? ! $is_equal : $is_equal;
	},
	10,
	3
);

/* -------------------------------------------------------------------------
 * 4. Expose the post excerpt and a stable slug for every content type
 * ---------------------------------------------------------------------- */

add_action(
	'init',
	static function (): void {
		// The blog needs excerpt support so post_excerpt is editable at all; the
		// per-language excerpts live in ACF (see group_blog_post_fields).
		add_post_type_support( 'post', 'excerpt' );
	}
);

/* -------------------------------------------------------------------------
 * 5. CORS for the headless frontend
 *
 * WordPress and Next.js live on different hostnames once the domain is
 * switched (alifleet.com vs cms.alifleet.com). Without an explicit
 * Access-Control-Allow-Origin that echoes the request origin — and
 * Allow-Credentials — every authenticated GraphQL call from the browser fails.
 * A wildcard '*' is not allowed together with credentials, so we echo instead.
 * ---------------------------------------------------------------------- */

add_filter(
	'graphql_response_headers_to_send',
	static function ( array $headers ): array {
		$origin = isset( $_SERVER['HTTP_ORIGIN'] )
			? sanitize_text_field( wp_unslash( $_SERVER['HTTP_ORIGIN'] ) )
			: '';

		if ( '' !== $origin && in_array( $origin, ALIFLEET_ALLOWED_ORIGINS, true ) ) {
			$headers['Access-Control-Allow-Origin']      = $origin;
			$headers['Access-Control-Allow-Credentials'] = 'true';
			$headers['Vary']                             = 'Origin';
		}

		$headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-JWT-Auth, X-JWT-Refresh';
		$headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS';

		return $headers;
	}
);

// Answer the browser's preflight before WordPress tries to render anything.
add_action(
	'init',
	static function (): void {
		if ( 'OPTIONS' !== ( $_SERVER['REQUEST_METHOD'] ?? '' ) ) {
			return;
		}
		if ( false === strpos( $_SERVER['REQUEST_URI'] ?? '', '/graphql' ) ) {
			return;
		}

		$origin = isset( $_SERVER['HTTP_ORIGIN'] )
			? sanitize_text_field( wp_unslash( $_SERVER['HTTP_ORIGIN'] ) )
			: '';

		if ( '' !== $origin && in_array( $origin, ALIFLEET_ALLOWED_ORIGINS, true ) ) {
			header( 'Access-Control-Allow-Origin: ' . $origin );
			header( 'Access-Control-Allow-Credentials: true' );
			header( 'Vary: Origin' );
		}
		header( 'Access-Control-Allow-Headers: Content-Type, Authorization, X-JWT-Auth, X-JWT-Refresh' );
		header( 'Access-Control-Allow-Methods: POST, GET, OPTIONS' );
		header( 'Access-Control-Max-Age: 86400' );
		status_header( 204 );
		exit;
	},
	1
);

/* -------------------------------------------------------------------------
 * 6. Startup diagnostics
 *
 * Surfaces a dismissible admin notice when a dependency the frontend needs is
 * missing, instead of letting the site fail with an opaque GraphQL error.
 * ---------------------------------------------------------------------- */

add_action(
	'admin_notices',
	static function (): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$problems = [];

		if ( ! class_exists( 'WPGraphQL' ) ) {
			$problems[] = 'WPGraphQL is not active — the frontend cannot load any content.';
		}
		if ( ! class_exists( 'ACF' ) ) {
			$problems[] = 'Advanced Custom Fields is not active — all page content will be empty.';
		}
		if ( class_exists( 'WPGraphQL' ) && class_exists( 'ACF' ) && ! class_exists( 'WPGraphQL\ACF\ACF' ) && ! function_exists( 'wpgraphql_acf_init' ) ) {
			$problems[] = 'WPGraphQL for ACF is not active — ACF fields will not appear in the GraphQL schema.';
		}
		if ( ! defined( 'GRAPHQL_JWT_AUTH_SECRET_KEY' ) ) {
			$problems[] = 'GRAPHQL_JWT_AUTH_SECRET_KEY is not defined in wp-config.php — customer login and registration will fail.';
		}
		if ( ! class_exists( 'WooCommerce' ) ) {
			$problems[] = 'WooCommerce is not active — the spare parts catalogue and cart will be empty.';
		}

		if ( ! $problems ) {
			return;
		}

		echo '<div class="notice notice-error"><p><strong>ALI FLEET headless setup is incomplete:</strong></p><ul style="list-style:disc;padding-left:20px">';
		foreach ( $problems as $problem ) {
			echo '<li>' . esc_html( $problem ) . '</li>';
		}
		echo '</ul></div>';
	}
);
