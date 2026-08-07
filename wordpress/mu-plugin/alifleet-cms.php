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
 * 6. storeSettings — contact details and commerce settings for the frontend
 *
 * The frontend needs the shop's phone number, address, WhatsApp number and
 * currency. None of that is reachable over GraphQL out of the box:
 *
 *   - ACF options pages (`get_field(..., 'option')`) require ACF PRO. This
 *     install has the free edition, so `acf_get_options_pages()` does not
 *     exist and WPGraphQL never registers a `siteOptions` root field.
 *   - WooCommerce's own settings live in `wp_options` as plain rows
 *     (`woocommerce_store_address`, `woocommerce_currency`, ...) and
 *     WooGraphQL does not expose them either.
 *
 * So the values are read straight from `wp_options` and registered as one
 * `storeSettings` root field. ACF's `options_*` rows win when they are filled
 * in — that keeps the door open for ACF PRO later without a code change — and
 * WooCommerce's own settings are the fallback, which means the values the
 * store owner already maintains in WooCommerce → Settings show up on the site.
 *
 * Everything here is public shop-window information that already appears in
 * the WooCommerce checkout, so no capability check is needed. Nothing else
 * from wp_options is exposed.
 * ---------------------------------------------------------------------- */

/**
 * Reads one leaf out of an ACF options group stored in wp_options.
 *
 * ACF serialises a group field into a single `options_<group>` row, so this
 * avoids get_field() (which needs ACF PRO for options pages) entirely.
 */
function alifleet_acf_option( string $group, string $key ): string {
	$stored = get_option( 'options_' . $group );

	if ( is_array( $stored ) && isset( $stored[ $key ] ) && is_scalar( $stored[ $key ] ) ) {
		return trim( (string) $stored[ $key ] );
	}

	// ACF also writes each leaf as its own row for non-group field types.
	$leaf = get_option( 'options_' . $group . '_' . $key );

	return is_scalar( $leaf ) ? trim( (string) $leaf ) : '';
}

/** First non-empty value, so ACF overrides WooCommerce and WooCommerce overrides nothing. */
function alifleet_first_filled( string ...$values ): string {
	foreach ( $values as $value ) {
		if ( '' !== trim( $value ) ) {
			return trim( $value );
		}
	}

	return '';
}

/** Digits only — WhatsApp deep links reject spaces, dashes and a leading '+'. */
function alifleet_digits( string $value ): string {
	return preg_replace( '/\D+/', '', $value ) ?? '';
}

/** Reads a WooCommerce option, returning '' rather than false when unset. */
function alifleet_woo_option( string $name ): string {
	$value = get_option( $name, '' );

	return is_scalar( $value ) ? trim( (string) $value ) : '';
}

add_action(
	'graphql_register_types',
	static function (): void {
		register_graphql_object_type(
			'AliFleetStoreSettings',
			[
				'description' => __( 'Contact details and commerce settings for the ALI FLEET headless frontend.', 'alifleet' ),
				'fields'      => [
					'phone'          => [ 'type' => 'String', 'description' => 'Display phone number.' ],
					'whatsapp'       => [ 'type' => 'String', 'description' => 'WhatsApp number, digits only, ready for wa.me links.' ],
					'email'          => [ 'type' => 'String', 'description' => 'Public contact email address.' ],
					'addressLines'   => [ 'type' => [ 'list_of' => 'String' ], 'description' => 'Street address, split into display lines.' ],
					'hours'          => [ 'type' => 'String', 'description' => 'Opening hours, as one display string.' ],
					'instagram'      => [ 'type' => 'String' ],
					'facebook'       => [ 'type' => 'String' ],
					'linkedin'       => [ 'type' => 'String' ],
					'currencyCode'   => [ 'type' => 'String', 'description' => 'ISO code from WooCommerce, e.g. ILS.' ],
					'currencySymbol' => [ 'type' => 'String', 'description' => 'Symbol matching currencyCode, e.g. ₪.' ],
					'storeUrl'       => [ 'type' => 'String', 'description' => 'Storefront origin that owns the cart and checkout.' ],
					'cartPath'       => [ 'type' => 'String', 'description' => 'Path of the WooCommerce cart page, e.g. /cart/.' ],
				],
			]
		);

		register_graphql_field(
			'RootQuery',
			'storeSettings',
			[
				'type'        => 'AliFleetStoreSettings',
				'description' => __( 'Contact details and commerce settings, read from ACF options with WooCommerce as the fallback.', 'alifleet' ),
				'resolve'     => static function (): array {
					$woo_active = class_exists( 'WooCommerce' );

					$address_lines = array_values(
						array_filter(
							[
								alifleet_first_filled(
									alifleet_acf_option( 'company_info', 'address_line_1' ),
									alifleet_woo_option( 'woocommerce_store_address' )
								),
								alifleet_first_filled(
									alifleet_acf_option( 'company_info', 'address_line_2' ),
									alifleet_woo_option( 'woocommerce_store_address_2' )
								),
								alifleet_first_filled(
									alifleet_acf_option( 'company_info', 'address_line_3' ),
									trim(
										alifleet_woo_option( 'woocommerce_store_city' ) . ' ' .
										alifleet_woo_option( 'woocommerce_store_postcode' )
									)
								),
							],
							static fn ( string $line ): bool => '' !== $line
						)
					);

					$phone = alifleet_first_filled(
						alifleet_acf_option( 'company_info', 'phone' ),
						alifleet_acf_option( 'company_info', 'phone_number' )
					);

					$whatsapp = alifleet_first_filled(
						alifleet_acf_option( 'company_info', 'whatsapp' ),
						alifleet_acf_option( 'company_info', 'whatsapp_number' ),
						$phone
					);

					$currency_code = alifleet_first_filled(
						alifleet_acf_option( 'commerce_settings', 'currency_code' ),
						alifleet_woo_option( 'woocommerce_currency' )
					);

					$currency_symbol = alifleet_acf_option( 'commerce_settings', 'currency_symbol' );
					if ( '' === $currency_symbol && $woo_active && function_exists( 'get_woocommerce_currency_symbol' ) ) {
						$currency_symbol = html_entity_decode(
							get_woocommerce_currency_symbol( $currency_code ),
							ENT_QUOTES,
							'UTF-8'
						);
					}

					// The cart page slug is whatever WooCommerce is configured to use;
					// hard-coding '/cart/' breaks a renamed or translated cart page.
					$cart_path = '/cart/';
					if ( $woo_active && function_exists( 'wc_get_page_permalink' ) ) {
						$permalink = wc_get_page_permalink( 'cart' );
						if ( is_string( $permalink ) && '' !== $permalink ) {
							$path      = wp_parse_url( $permalink, PHP_URL_PATH );
							$cart_path = is_string( $path ) && '' !== $path ? $path : $cart_path;
						}
					}

					return [
						'phone'          => $phone,
						'whatsapp'       => alifleet_digits( $whatsapp ),
						'email'          => alifleet_first_filled(
							alifleet_acf_option( 'company_info', 'email' ),
							(string) get_option( 'admin_email', '' )
						),
						'addressLines'   => $address_lines,
						'hours'          => alifleet_first_filled(
							alifleet_acf_option( 'company_info', 'hours' ),
							alifleet_acf_option( 'company_info', 'opening_hours' )
						),
						'instagram'      => alifleet_acf_option( 'company_info', 'instagram' ),
						'facebook'       => alifleet_acf_option( 'company_info', 'facebook' ),
						'linkedin'       => alifleet_acf_option( 'company_info', 'linkedin' ),
						'currencyCode'   => $currency_code,
						'currencySymbol' => $currency_symbol,
						'storeUrl'       => untrailingslashit( (string) get_option( 'home', '' ) ),
						'cartPath'       => $cart_path,
					];
				},
			]
		);
	}
);

/* -------------------------------------------------------------------------
 * 7. Startup diagnostics
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
