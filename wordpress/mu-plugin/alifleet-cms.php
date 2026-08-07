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
 * 6b. pageImages — editable image URLs for every static page section
 *
 * ACF image fields return an attachment ID (integer). We resolve each one to
 * its full `src` URL here so the Next.js frontend never has to do a second
 * REST call for every image.  Every field gracefully returns an empty string
 * when the attachment hasn't been uploaded yet, so the frontend can fall back
 * to its local /images/ placeholders.
 * ---------------------------------------------------------------------- */

/**
 * Safely resolves an ACF image field (attachment ID or URL string or array)
 * to a plain https URL, returning '' when nothing has been set.
 *
 * @param mixed $value  Whatever ACF / WPGraphQL stored.
 * @param string $size  Image size name, default 'large'.
 */
function alifleet_img_url( $value, string $size = 'large' ): string {
	if ( empty( $value ) ) {
		return '';
	}

	// WPGraphQL for ACF returns an array with 'url' key for image fields.
	if ( is_array( $value ) ) {
		return isset( $value['url'] ) ? (string) $value['url'] : '';
	}

	// Plain URL string (rare but possible).
	if ( is_string( $value ) && str_starts_with( $value, 'http' ) ) {
		return $value;
	}

	// Attachment ID (integer or numeric string).
	$id = (int) $value;
	if ( $id > 0 ) {
		$src = wp_get_attachment_image_url( $id, $size );
		return is_string( $src ) ? $src : '';
	}

	return '';
}

/**
 * Reads a sub-field value from an ACF group attached to a WordPress page.
 * Uses `get_field()` which is available with free ACF and WPGraphQL for ACF.
 *
 * @param int    $page_id   WordPress post ID of the target page.
 * @param string $group     ACF group field name (e.g. 'hero_section').
 * @param string $sub_field ACF sub-field name (e.g. 'hero_slide_1').
 * @param string $leaf      Optional deeper nested field name.
 */
function alifleet_page_field( int $page_id, string $group, string $sub_field, string $leaf = '' ) {
	if ( ! function_exists( 'get_field' ) ) {
		return null;
	}

	$group_value = get_field( $group, $page_id );

	if ( ! is_array( $group_value ) || ! isset( $group_value[ $sub_field ] ) ) {
		return null;
	}

	$value = $group_value[ $sub_field ];

	if ( '' !== $leaf ) {
		return is_array( $value ) && isset( $value[ $leaf ] ) ? $value[ $leaf ] : null;
	}

	return $value;
}

add_action(
	'graphql_register_types',
	static function (): void {

		/* ---- Object type ---- */
		register_graphql_object_type(
			'AliFleetPageImages',
			[
				'description' => 'Editable image URLs for every static page section, resolved from ACF.',
				'fields'      => [
					// ── Home page ──────────────────────────────────────────────
					'heroAvatarImage' => [ 'type' => 'String', 'description' => 'Hero avatar strip image.' ],
					'heroSlide1'      => [ 'type' => 'String', 'description' => 'Hero carousel slide 1.' ],
					'heroSlide2'      => [ 'type' => 'String', 'description' => 'Hero carousel slide 2.' ],
					'heroSlide3'      => [ 'type' => 'String', 'description' => 'Hero carousel slide 3.' ],
					'heroSlide4'      => [ 'type' => 'String', 'description' => 'Hero carousel slide 4.' ],
					'heroSlide5'      => [ 'type' => 'String', 'description' => 'Hero carousel slide 5.' ],
					'fleetVehicle1'   => [ 'type' => 'String', 'description' => 'Fleet showcase panel 1.' ],
					'fleetVehicle2'   => [ 'type' => 'String', 'description' => 'Fleet showcase panel 2.' ],
					'fleetVehicle3'   => [ 'type' => 'String', 'description' => 'Fleet showcase panel 3.' ],
					'serviceScene1'   => [ 'type' => 'String', 'description' => 'Services scene 1 background.' ],
					'serviceScene2'   => [ 'type' => 'String', 'description' => 'Services scene 2 background.' ],
					'serviceScene3'   => [ 'type' => 'String', 'description' => 'Services scene 3 background.' ],
					// ── Import page ────────────────────────────────────────────
					'importHero'      => [ 'type' => 'String', 'description' => 'Import page hero background.' ],
					// ── Products page ──────────────────────────────────────────
					'productsHero'    => [ 'type' => 'String', 'description' => 'Spare parts page hero background.' ],
					// ── Blog page ──────────────────────────────────────────────
					'blogHero'        => [ 'type' => 'String', 'description' => 'Blog archive hero background.' ],
				],
			]
		);

		/* ---- Root field ---- */
		register_graphql_field(
			'RootQuery',
			'pageImages',
			[
				'type'        => 'AliFleetPageImages',
				'description' => 'Editable image URLs for static page sections, read from ACF page fields.',
				'resolve'     => static function (): array {

					/**
					 * Helper: find a WordPress page by slug and return its ID.
					 * Returns 0 when no published page is found.
					 */
					$page_id_for = static function ( string $slug ): int {
						$pages = get_posts( [
							'name'           => $slug,
							'post_type'      => 'page',
							'post_status'    => 'publish',
							'posts_per_page' => 1,
							'fields'         => 'ids',
						] );
						return ! empty( $pages ) ? (int) $pages[0] : 0;
					};

					$home_id     = $page_id_for( 'home' ) ?: (int) get_option( 'page_on_front', 0 );
					$import_id   = $page_id_for( 'import' ) ?: $page_id_for( 'car-import' );
					$products_id = $page_id_for( 'products' ) ?: $page_id_for( 'spare-parts' );
					$blog_id     = $page_id_for( 'blog' ) ?: (int) get_option( 'page_for_posts', 0 );

					$img = static fn ( int $pid, string $group, string $sub, string $leaf = '' ): string =>
						alifleet_img_url( alifleet_page_field( $pid, $group, $sub, $leaf ) );

					return [
						// Home / hero slides
						'heroAvatarImage' => $img( $home_id, 'hero_section', 'hero_avatar_image' ),
						'heroSlide1'      => $img( $home_id, 'hero_section', 'hero_slide_1', 'slide_image' ),
						'heroSlide2'      => $img( $home_id, 'hero_section', 'hero_slide_2', 'slide_image' ),
						'heroSlide3'      => $img( $home_id, 'hero_section', 'hero_slide_3', 'slide_image' ),
						'heroSlide4'      => $img( $home_id, 'hero_section', 'hero_slide_4', 'slide_image' ),
						'heroSlide5'      => $img( $home_id, 'hero_section', 'hero_slide_5', 'slide_image' ),
						// Fleet showcase panels
						'fleetVehicle1'   => $img( $home_id, 'fleet_showcase_section', 'fleet_vehicle_1', 'image' ),
						'fleetVehicle2'   => $img( $home_id, 'fleet_showcase_section', 'fleet_vehicle_2', 'image' ),
						'fleetVehicle3'   => $img( $home_id, 'fleet_showcase_section', 'fleet_vehicle_3', 'image' ),
						// Services scenes
						'serviceScene1'   => $img( $home_id, 'services_section', 'scene_01', 'bg_image' ),
						'serviceScene2'   => $img( $home_id, 'services_section', 'scene_02', 'bg_image' ),
						'serviceScene3'   => $img( $home_id, 'services_section', 'scene_03', 'bg_image' ),
						// Other pages
						'importHero'      => $img( $import_id,   'import_hero',    'hero_background_image' ),
						'productsHero'    => $img( $products_id, 'products_hero',  'hero_background_image' ),
						'blogHero'        => $img( $blog_id,     'blog_hero',      'hero_background_image' ),
					];
				},
			]
		);
	},
	30  // priority 30 so this runs after storeSettings (priority 10 default)
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

/* -------------------------------------------------------------------------
 * 8. Multi-item cart handoff
 *
 * The Next.js frontend keeps its own cart, so the whole basket has to be
 * transferred in one navigation when the customer checks out.
 *
 * WooCommerce core cannot do this: `?add-to-cart=` is handled by
 * WC_Form_Handler::add_to_cart_action() which reads a single product id and
 * ignores anything after it, so a comma-separated list silently transfers only
 * the first line — or nothing at all. Core's own multi-item feature
 * (`/checkout-link/?products=`) only exists in WooCommerce 10.0+, which we
 * cannot assume of a store that has been running for years.
 *
 * So the frontend calls this endpoint instead:
 *
 *     /?alifleet-cart=<productId>:<qty>,<productId>:<qty>
 *
 * It rebuilds the cart server-side and redirects to the real checkout page.
 * ---------------------------------------------------------------------- */

/* -------------------------------------------------------------------------
 * 7b. Checkout & Cart page styling
 *
 * Overrides the Astra theme + WooCommerce defaults on the cart, checkout,
 * order-received, and account pages so they match the Next.js front-end's
 * design tokens exactly:
 *
 *   --background : oklch(0.985 0.002 240)  ≈ #f5f6fa  (page bg)
 *   --foreground : oklch(0.2   0.02  255)  ≈ #1a1d2e  (text)
 *   --card       : #ffffff                            (surface)
 *   --accent     : oklch(0.68  0.13  235)  ≈ #3a82c4  (teal-blue CTA)
 *   --primary    : oklch(0.32  0.06  250)  ≈ #2d3a6b  (navy)
 *   --muted      : oklch(0.955 0.006 240)  ≈ #f0f1f5  (secondary bg)
 *   --border     : rgba(45,58,107,0.10)               (hairline)
 *   --radius     : 10px
 *
 * Loaded only on WooCommerce pages to avoid touching the rest of the site.
 * ---------------------------------------------------------------------- */

add_action(
	'wp_enqueue_scripts',
	static function (): void {
		if ( ! function_exists( 'is_woocommerce' ) ) {
			return;
		}
		if ( ! is_cart() && ! is_checkout() && ! is_wc_endpoint_url() && ! is_account_page() ) {
			return;
		}

		/* Inline stylesheet — no extra HTTP request. */
		$css = "
/* ============================================================
   ALI FLEET — WooCommerce checkout skin
   Matches the Next.js headless front-end design tokens.
   ============================================================ */

/* ---------- Page canvas ------------------------------------ */
body.woocommerce-page,
body.woocommerce-checkout,
body.woocommerce-cart {
	background-color: #f5f6fa !important;
	color: #1a1d2e !important;
	font-family: 'Rubik', 'Cairo', sans-serif !important;
}

/* Hide Astra's page title banner (redundant on checkout) */
body.woocommerce-checkout .ast-container .entry-header,
body.woocommerce-cart    .ast-container .entry-header {
	display: none !important;
}

/* Constrain and centre the content column */
body.woocommerce-page .entry-content,
body.woocommerce-page .woocommerce {
	max-width: 1100px !important;
	margin-right: auto !important;
	margin-left: auto !important;
	padding: 48px 24px 80px !important;
}

/* ---------- Section headings ------------------------------- */
body.woocommerce-page h3,
body.woocommerce-page .woocommerce-billing-fields h3,
body.woocommerce-page .woocommerce-shipping-fields h3,
body.woocommerce-page .woocommerce-additional-fields h3,
body.woocommerce-page #order_review_heading {
	font-size: 1rem !important;
	font-weight: 700 !important;
	letter-spacing: 0.06em !important;
	text-transform: uppercase !important;
	color: #2d3a6b !important;
	border-bottom: 2px solid rgba(45,58,107,0.10) !important;
	padding-bottom: 10px !important;
	margin-bottom: 20px !important;
}

/* ---------- Two-column layout ------------------------------ */
.woocommerce-checkout #customer_details,
.woocommerce-checkout #order_review_heading,
.woocommerce-checkout #order_review {
	background: #ffffff !important;
	border: 1px solid rgba(45,58,107,0.10) !important;
	border-radius: 14px !important;
	padding: 28px 28px 32px !important;
	box-shadow: 0 1px 4px rgba(45,58,107,0.06) !important;
}

.woocommerce-checkout .col2-set {
	display: grid !important;
	grid-template-columns: 1fr 1fr !important;
	gap: 24px !important;
	width: 100% !important;
	float: none !important;
}

.woocommerce-checkout .col2-set .col-1,
.woocommerce-checkout .col2-set .col-2 {
	float: none !important;
	width: 100% !important;
}

@media (max-width: 760px) {
	.woocommerce-checkout .col2-set {
		grid-template-columns: 1fr !important;
	}
}

/* ---------- Form fields ------------------------------------ */
.woocommerce-Input,
.woocommerce-page input[type='text'],
.woocommerce-page input[type='email'],
.woocommerce-page input[type='tel'],
.woocommerce-page input[type='number'],
.woocommerce-page input[type='password'],
.woocommerce-page select,
.woocommerce-page textarea {
	background: #f0f1f5 !important;
	border: 1px solid rgba(45,58,107,0.14) !important;
	border-radius: 10px !important;
	padding: 11px 14px !important;
	font-size: 0.9375rem !important;
	color: #1a1d2e !important;
	width: 100% !important;
	box-sizing: border-box !important;
	transition: border-color 0.18s, box-shadow 0.18s !important;
	outline: none !important;
	box-shadow: none !important;
}

.woocommerce-page input:focus,
.woocommerce-page select:focus,
.woocommerce-page textarea:focus {
	border-color: #3a82c4 !important;
	box-shadow: 0 0 0 3px rgba(58,130,196,0.14) !important;
}

.woocommerce-page label {
	font-size: 0.8125rem !important;
	font-weight: 600 !important;
	color: #2d3a6b !important;
	margin-bottom: 5px !important;
	display: block !important;
}

/* form-row spacing */
.woocommerce-page .form-row {
	margin-bottom: 16px !important;
}
.woocommerce-page .form-row-first,
.woocommerce-page .form-row-last {
	width: calc(50% - 8px) !important;
	float: right !important;
}
.woocommerce-page .form-row-first { margin-left: 16px !important; }
.woocommerce-page .form-row-last  { margin-left: 0    !important; }
.woocommerce-page .form-row-wide  { width: 100% !important; float: none !important; }

/* ---------- Notices ---------------------------------------- */
.woocommerce-info,
.woocommerce-message {
	background: rgba(58,130,196,0.08) !important;
	border-top: 3px solid #3a82c4 !important;
	border-radius: 10px !important;
	color: #1a1d2e !important;
	padding: 14px 18px !important;
	margin-bottom: 20px !important;
	font-size: 0.875rem !important;
}
.woocommerce-error {
	background: rgba(220,38,38,0.07) !important;
	border-top: 3px solid #dc2626 !important;
	border-radius: 10px !important;
	padding: 14px 18px !important;
	margin-bottom: 20px !important;
}

/* Collapsible login/coupon toggles */
.woocommerce-checkout .woocommerce-info .showlogin,
.woocommerce-checkout .woocommerce-info .showcoupon {
	color: #3a82c4 !important;
	text-decoration: underline !important;
	font-weight: 600 !important;
}

/* ---------- Order summary table ---------------------------- */
.woocommerce-checkout-review-order-table {
	width: 100% !important;
	border-collapse: collapse !important;
	font-size: 0.9rem !important;
}
.woocommerce-checkout-review-order-table th,
.woocommerce-checkout-review-order-table td {
	padding: 12px 8px !important;
	border-bottom: 1px solid rgba(45,58,107,0.08) !important;
	vertical-align: top !important;
}
.woocommerce-checkout-review-order-table thead th {
	font-size: 0.75rem !important;
	font-weight: 700 !important;
	letter-spacing: 0.05em !important;
	text-transform: uppercase !important;
	color: #2d3a6b !important;
	background: transparent !important;
}
.woocommerce-checkout-review-order-table .cart-subtotal td,
.woocommerce-checkout-review-order-table .order-total td {
	font-weight: 700 !important;
}
.woocommerce-checkout-review-order-table .order-total td bdi {
	color: #2d3a6b !important;
	font-size: 1.125rem !important;
}

/* Product thumbnail in order summary */
.woocommerce-checkout-review-order-table img {
	border-radius: 8px !important;
	width: 52px !important;
	height: 52px !important;
	object-fit: cover !important;
}

/* ---------- Payment methods -------------------------------- */
#payment {
	background: #ffffff !important;
	border: 1px solid rgba(45,58,107,0.10) !important;
	border-radius: 14px !important;
	padding: 24px 28px !important;
	margin-top: 24px !important;
	box-shadow: 0 1px 4px rgba(45,58,107,0.06) !important;
}
#payment ul.payment_methods {
	list-style: none !important;
	padding: 0 !important;
	margin: 0 0 20px !important;
	border-bottom: 1px solid rgba(45,58,107,0.08) !important;
}
#payment ul.payment_methods li {
	padding: 12px 4px !important;
	border-bottom: 1px solid rgba(45,58,107,0.06) !important;
}
#payment ul.payment_methods li label {
	font-weight: 600 !important;
	font-size: 0.9375rem !important;
	color: #1a1d2e !important;
	cursor: pointer !important;
}
#payment .payment_box {
	background: #f0f1f5 !important;
	border-radius: 8px !important;
	padding: 12px 14px !important;
	margin-top: 8px !important;
	font-size: 0.875rem !important;
	color: #2d3a6b !important;
}

/* ---------- CTA — Place Order button ----------------------- */
#place_order,
.woocommerce #respond input#submit,
.woocommerce a.button,
.woocommerce button.button,
.woocommerce input.button {
	background: #2d3a6b !important;
	color: #ffffff !important;
	border: none !important;
	border-radius: 999px !important;
	padding: 14px 32px !important;
	font-size: 1rem !important;
	font-weight: 700 !important;
	letter-spacing: 0.02em !important;
	cursor: pointer !important;
	width: 100% !important;
	transition: background 0.18s, transform 0.12s !important;
	box-shadow: 0 2px 8px rgba(45,58,107,0.22) !important;
}

#place_order:hover,
.woocommerce a.button:hover,
.woocommerce button.button:hover,
.woocommerce input.button:hover {
	background: #3a82c4 !important;
	transform: translateY(-1px) !important;
}

#place_order:active {
	transform: translateY(0) !important;
}

/* Secondary / outline buttons (back to cart, coupon apply) */
.woocommerce a.button.alt,
.woocommerce button.button.alt,
.woocommerce .woocommerce-button.button:not(#place_order),
.woocommerce .return-to-shop .button {
	background: transparent !important;
	color: #2d3a6b !important;
	border: 1.5px solid rgba(45,58,107,0.25) !important;
	box-shadow: none !important;
}
.woocommerce a.button.alt:hover,
.woocommerce button.button.alt:hover {
	background: rgba(45,58,107,0.06) !important;
	border-color: #2d3a6b !important;
}

/* ---------- Coupon form ------------------------------------ */
.woocommerce-form-coupon {
	background: #f0f1f5 !important;
	border-radius: 12px !important;
	padding: 18px 20px !important;
	margin-bottom: 24px !important;
}

/* ---------- Cart table ------------------------------------- */
.woocommerce-cart-form .shop_table {
	width: 100% !important;
	border-collapse: collapse !important;
	background: #ffffff !important;
	border-radius: 14px !important;
	overflow: hidden !important;
	box-shadow: 0 1px 4px rgba(45,58,107,0.06) !important;
}
.woocommerce-cart-form .shop_table th {
	background: #f0f1f5 !important;
	font-size: 0.75rem !important;
	font-weight: 700 !important;
	text-transform: uppercase !important;
	letter-spacing: 0.05em !important;
	color: #2d3a6b !important;
	padding: 14px 16px !important;
	border-bottom: 1px solid rgba(45,58,107,0.10) !important;
}
.woocommerce-cart-form .shop_table td {
	padding: 16px !important;
	vertical-align: middle !important;
	border-bottom: 1px solid rgba(45,58,107,0.07) !important;
	color: #1a1d2e !important;
}
.woocommerce-cart-form .shop_table img {
	border-radius: 8px !important;
	width: 64px !important;
	height: 64px !important;
	object-fit: cover !important;
}

/* Cart totals */
.cart_totals {
	background: #ffffff !important;
	border: 1px solid rgba(45,58,107,0.10) !important;
	border-radius: 14px !important;
	padding: 24px 28px !important;
	box-shadow: 0 1px 4px rgba(45,58,107,0.06) !important;
}
.cart_totals h2 {
	font-size: 1rem !important;
	font-weight: 700 !important;
	color: #2d3a6b !important;
	text-transform: uppercase !important;
	letter-spacing: 0.06em !important;
	margin-bottom: 16px !important;
}

/* ---------- Order received / thank-you --------------------- */
.woocommerce-order-received .woocommerce-thankyou-order-details,
.woocommerce-order-received .woocommerce-order-details {
	background: #ffffff !important;
	border: 1px solid rgba(45,58,107,0.10) !important;
	border-radius: 14px !important;
	padding: 28px !important;
	box-shadow: 0 1px 4px rgba(45,58,107,0.06) !important;
}

/* ---------- Shipping fields -------------------------------- */
#ship-to-different-address label {
	font-size: 0.9375rem !important;
	font-weight: 600 !important;
	color: #1a1d2e !important;
	cursor: pointer !important;
}

/* ---------- Privacy policy text ---------------------------- */
.woocommerce-privacy-policy-text {
	font-size: 0.8125rem !important;
	color: rgba(26,29,46,0.55) !important;
	margin-top: 12px !important;
}
.woocommerce-privacy-policy-text a {
	color: #3a82c4 !important;
}

/* ---------- Select2 dropdowns ------------------------------ */
.select2-container .select2-selection--single {
	background: #f0f1f5 !important;
	border: 1px solid rgba(45,58,107,0.14) !important;
	border-radius: 10px !important;
	height: 44px !important;
}
.select2-container .select2-selection--single .select2-selection__rendered {
	line-height: 44px !important;
	padding-right: 14px !important;
	color: #1a1d2e !important;
	font-size: 0.9375rem !important;
}
.select2-container .select2-selection--single .select2-selection__arrow {
	height: 44px !important;
}
.select2-dropdown {
	border: 1px solid rgba(45,58,107,0.14) !important;
	border-radius: 10px !important;
	overflow: hidden !important;
	box-shadow: 0 4px 20px rgba(45,58,107,0.12) !important;
}
.select2-results__option--highlighted {
	background: #2d3a6b !important;
}
";

		wp_register_style( 'alifleet-checkout', false );
		wp_enqueue_style( 'alifleet-checkout' );
		wp_add_inline_style( 'alifleet-checkout', $css );
	},
	20
);

add_action(
	'template_redirect',
	static function (): void {
		if ( ! isset( $_GET['alifleet-cart'] ) ) {
			return;
		}
		// WooCommerce loads its session on `wp_loaded`, so by `template_redirect`
		// WC()->cart is guaranteed to exist — unless Woo is switched off entirely.
		if ( ! function_exists( 'WC' ) || ! WC()->cart ) {
			return;
		}

		$raw   = sanitize_text_field( wp_unslash( $_GET['alifleet-cart'] ) );
		$added = 0;

		// Start from an empty cart: this endpoint represents the frontend basket
		// in full, so merging would duplicate lines when a customer returns.
		WC()->cart->empty_cart();

		foreach ( explode( ',', $raw ) as $entry ) {
			$parts      = explode( ':', trim( $entry ), 2 );
			$product_id = absint( $parts[0] ?? 0 );
			$quantity   = isset( $parts[1] ) ? absint( $parts[1] ) : 1;

			if ( ! $product_id || $quantity < 1 ) {
				continue;
			}

			$product = wc_get_product( $product_id );
			// Never trust an id from the query string: only real, purchasable,
			// in-stock products may enter the cart.
			if ( ! $product || ! $product->is_purchasable() || ! $product->is_in_stock() ) {
				continue;
			}

			// Cap the line at what the store can actually ship, so checkout does
			// not immediately reject the order it just accepted.
			if ( $product->managing_stock() && ! $product->backorders_allowed() ) {
				$stock = $product->get_stock_quantity();
				if ( is_numeric( $stock ) ) {
					$quantity = min( $quantity, max( 0, (int) $stock ) );
				}
			}
			if ( $quantity < 1 ) {
				continue;
			}

			if ( WC()->cart->add_to_cart( $product_id, $quantity ) ) {
				$added++;
			}
		}

		// With nothing valid to buy, the cart page explains the empty state far
		// better than an empty checkout form does.
		$destination = $added > 0 ? wc_get_checkout_url() : wc_get_cart_url();

		wp_safe_redirect( $destination );
		exit;
	},
	5
);
