<?php
/**
 * ALI FLEET content importer (WP-CLI).
 *
 * Seeds every page, import vehicle, WooCommerce spare part and blog article
 * described in seed-data.json, including every ACF group and the media library
 * uploads.
 *
 * This schema runs on ACF free, so there are no repeaters: what used to be a
 * repeater is now a fixed number of numbered groups (hero_slide_1 …
 * hero_slide_5, gallery_image_1 … gallery_image_8). See
 * docs/ACF-FREE-CONVERSION-PLAN.md. Nothing here needs to know about that:
 * update_field() writes a whole group tree in one call, and an unused slot
 * arrives as an empty object in the seed and clears its sub fields.
 *
 * Usage (run from the WordPress root):
 *
 *   wp eval-file wordpress/scripts/alifleet-import.php \
 *       --seed=wordpress/scripts/seed-data.json \
 *       --images=/path/to/nextjs/public
 *
 * Options:
 *   --seed=<file>    Path to seed-data.json. Default: alongside this script.
 *   --images=<dir>   Directory that contains the /images/*.png referenced by
 *                    the seed. Usually your Next.js `public` folder.
 *   --dry-run        Report what would change without writing anything.
 *   --force-media    Re-upload images even if a matching attachment exists.
 *
 * The script is idempotent: it matches existing content by slug and updates it
 * instead of creating duplicates, so it is safe to re-run after editing the
 * seed file.
 *
 * Why this instead of a CSV import?
 *   The numbered groups (gallery_image_1…8, highlight_1…8, spec_1…8,
 *   compat_model_1…10, address_line_1…3, step_item_1…4) turn into hundreds of
 *   flattened CSV columns that are painful to keep aligned by hand. This script
 *   writes them natively through update_field(), and it also creates the
 *   WooCommerce products with correct prices and stock status.
 */

/*
 * NOTE: no `declare( strict_types = 1 )` here on purpose.
 *
 * `wp eval-file` strips the opening `<?php` and runs the rest through eval().
 * PHP forbids a strict_types declaration inside eval()'d code, so the file
 * would die with a fatal error before a single line executed:
 *
 *   PHP Fatal error: strict_types declaration must be the very first
 *   statement in the script
 *
 * All casts below are therefore written explicitly ( (int), (string), (float) )
 * so behaviour does not depend on the declaration being present.
 */

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	fwrite( STDERR, "This script must be run through WP-CLI: wp eval-file ...\n" );
	exit( 1 );
}

/* ---------------------------------------------------------------- options -- */

/*
 * Options are read positionally out of $args, and the leading dashes are
 * OPTIONAL:
 *
 *   wp eval-file import.php dry-run seed=/path/seed.json     <-- preferred
 *   wp eval-file import.php -- --dry-run --seed=/path/seed.json
 *
 * The dash-less form exists because `wp eval-file` hands anything that looks
 * like `--flag` to WP-CLI's own option parser first, which rejects it with
 * "Error: Parameter errors: unknown --seed parameter". The documented escape
 * hatch (WP_CLI_STRICT_ARGS_MODE=1) cannot be used here because the wp-agent
 * wrapper runs `docker exec` without forwarding environment variables.
 */
$assoc = [];
foreach ( $args ?? [] as $arg ) {
	if ( preg_match( '/^-{0,2}([a-z-]+)(?:=(.*))?$/', (string) $arg, $m ) ) {
		$assoc[ $m[1] ] = $m[2] ?? true;
	}
}

/*
 * __DIR__ is NOT the script's directory under `wp eval-file` (eval()'d code
 * inherits the directory of WP-CLI's EvalFile_Command.php), so fall back to the
 * working directory as well before giving up.
 */
$seed_path = '';
if ( isset( $assoc['seed'] ) ) {
	$seed_path = (string) $assoc['seed'];
} else {
	foreach ( [ __DIR__ . '/seed-data.json', getcwd() . '/seed-data.json' ] as $candidate ) {
		if ( is_readable( $candidate ) ) {
			$seed_path = $candidate;
			break;
		}
	}
	if ( '' === $seed_path ) {
		WP_CLI::error( 'Could not locate seed-data.json; pass it explicitly, e.g. seed=/tmp/alifleet-stage/seed-data.json' );
	}
}
/*
 * CRITICAL: these must live in $GLOBALS, not just in the top-level scope.
 *
 * `wp eval-file` eval()s this file from inside a method, so the "top level"
 * here is NOT the global scope. A plain `$dry_run = true;` would therefore be
 * invisible to the `global $dry_run;` statements inside the functions below --
 * they would read NULL, which is falsy, and every single safety check would
 * silently turn itself off. That is exactly how a --dry-run once written 27
 * posts to a live database.
 *
 * Writing into $GLOBALS explicitly and then binding the local name to it by
 * reference keeps both views of the variable pointing at one value, so this
 * file behaves identically under `wp eval-file`, `wp shell` and plain `php`.
 */
$GLOBALS['images_dir']     = isset( $assoc['images'] ) ? rtrim( (string) $assoc['images'], '/' ) : '';
$GLOBALS['dry_run']        = ! empty( $assoc['dry-run'] );
$GLOBALS['force_media']    = ! empty( $assoc['force-media'] );
$GLOBALS['set_front_page'] = ! empty( $assoc['set-front-page'] );

$images_dir     = &$GLOBALS['images_dir'];
$dry_run        = &$GLOBALS['dry_run'];
$force_media    = &$GLOBALS['force_media'];
$set_front_page = &$GLOBALS['set_front_page'];

if ( ! is_readable( $seed_path ) ) {
	WP_CLI::error( "Cannot read seed file: {$seed_path}" );
}

$seed = json_decode( (string) file_get_contents( $seed_path ), true );
if ( ! is_array( $seed ) ) {
	WP_CLI::error( 'seed-data.json is not valid JSON: ' . json_last_error_msg() );
}

/* ------------------------------------------------------------ preflight --- */

if ( ! function_exists( 'update_field' ) ) {
	WP_CLI::error( 'Advanced Custom Fields is not active — activate it before importing.' );
}
if ( ! post_type_exists( 'import_car' ) ) {
	WP_CLI::error( 'The import_car post type is missing. Install wordpress/mu-plugin/alifleet-cms.php first.' );
}
$has_woo = class_exists( 'WooCommerce' );
if ( ! $has_woo ) {
	WP_CLI::warning( 'WooCommerce is not active — spare parts will be skipped.' );
}
if ( '' === $images_dir ) {
	WP_CLI::warning( 'No --images directory given; media will be skipped and image fields left empty.' );
} elseif ( ! is_dir( $images_dir ) ) {
	WP_CLI::error( "--images is not a directory: {$images_dir}" );
}

if ( $dry_run ) {
	WP_CLI::log( 'DRY RUN — no changes will be written.' );
}

require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/media.php';
require_once ABSPATH . 'wp-admin/includes/image.php';

// Same $GLOBALS binding as above: the counters are incremented from inside
// functions via `global $stats`, and read back at the very end of this file.
$GLOBALS['stats'] = [ 'created' => 0, 'updated' => 0, 'media' => 0, 'skipped' => 0 ];
$stats            = &$GLOBALS['stats'];

/* ------------------------------------------------------------------ media -- */

/**
 * Resolves an image path from the seed ("/images/part-brake.png") to an
 * attachment ID, uploading it on first use and reusing it afterwards.
 *
 * @return int Attachment ID, or 0 when the file is unavailable.
 */
function alifleet_attachment_id( string $rel ): int {
	global $images_dir, $dry_run, $force_media, $stats;
	static $cache = [];

	$rel = trim( $rel );
	if ( '' === $rel || '' === $images_dir ) {
		return 0;
	}
	if ( isset( $cache[ $rel ] ) ) {
		return $cache[ $rel ];
	}

	$file = $images_dir . '/' . ltrim( $rel, '/' );
	if ( ! is_readable( $file ) ) {
		WP_CLI::warning( "Image not found, leaving field empty: {$rel}" );
		return $cache[ $rel ] = 0;
	}

	$slug = sanitize_title( pathinfo( $file, PATHINFO_FILENAME ) );

	if ( ! $force_media ) {
		// _alifleet_source keeps the lookup exact, so re-runs never duplicate
		// media even when WordPress has renamed the uploaded file.
		$found = get_posts(
			[
				'post_type'        => 'attachment',
				'post_status'      => 'inherit',
				'posts_per_page'   => 1,
				'fields'           => 'ids',
				'meta_key'         => '_alifleet_source',
				'meta_value'       => $rel,
				'suppress_filters' => false,
			]
		);
		if ( $found ) {
			return $cache[ $rel ] = (int) $found[0];
		}

		$by_slug = get_page_by_path( $slug, OBJECT, 'attachment' );
		if ( $by_slug instanceof WP_Post ) {
			update_post_meta( $by_slug->ID, '_alifleet_source', $rel );
			return $cache[ $rel ] = (int) $by_slug->ID;
		}
	}

	if ( $dry_run ) {
		WP_CLI::log( "  would upload {$rel}" );
		return $cache[ $rel ] = 0;
	}

	// Copy into a temp file so media_handle_sideload does not move the original
	// out of the Next.js public folder.
	$tmp = wp_tempnam( basename( $file ) );
	if ( ! $tmp || ! copy( $file, $tmp ) ) {
		WP_CLI::warning( "Could not stage {$rel} for upload." );
		return $cache[ $rel ] = 0;
	}

	$id = media_handle_sideload(
		[ 'name' => basename( $file ), 'tmp_name' => $tmp ],
		0,
		null,
		[ 'post_name' => $slug ]
	);

	if ( is_wp_error( $id ) ) {
		@unlink( $tmp );
		WP_CLI::warning( "Upload failed for {$rel}: " . $id->get_error_message() );
		return $cache[ $rel ] = 0;
	}

	update_post_meta( (int) $id, '_alifleet_source', $rel );
	$stats['media']++;
	WP_CLI::log( "  uploaded {$rel} -> attachment {$id}" );

	return $cache[ $rel ] = (int) $id;
}

/**
 * Recursively converts every image path in an ACF value tree into an
 * attachment ID. ACF image fields store IDs; a raw path would render nothing.
 *
 * @param mixed $value Field value, possibly nested.
 * @return mixed
 */
function alifleet_resolve_images( $value, string $field_name = '' ) {
	$IMAGE_FIELDS = [ 'image', 'featured_image', 'part_image', 'author_avatar' ];

	if ( is_array( $value ) ) {
		$out = [];
		foreach ( $value as $key => $item ) {
			$out[ $key ] = alifleet_resolve_images( $item, is_string( $key ) ? $key : $field_name );
		}
		return $out;
	}

	if ( is_string( $value ) && in_array( $field_name, $IMAGE_FIELDS, true ) ) {
		if ( preg_match( '#\.(png|jpe?g|webp|avif|gif|svg)$#i', $value ) ) {
			return alifleet_attachment_id( $value );
		}
	}

	return $value;
}

/* ------------------------------------------------------------------ posts -- */

/**
 * Creates or updates a post by slug and returns its ID.
 *
 * @param array<string,mixed> $data Extra wp_insert_post arguments.
 */
function alifleet_upsert_post( string $slug, string $type, string $title, array $data = [] ): int {
	global $dry_run, $stats;

	$existing = get_posts(
		[
			'post_type'        => $type,
			'name'             => $slug,
			'post_status'      => 'any',
			'posts_per_page'   => 1,
			'fields'           => 'ids',
			'suppress_filters' => false,
		]
	);
	$id = $existing ? (int) $existing[0] : 0;

	if ( $dry_run ) {
		WP_CLI::log( sprintf( '  would %s %s "%s"', $id ? 'update' : 'create', $type, $slug ) );
		return $id;
	}

	$args = array_merge(
		[
			'post_type'   => $type,
			'post_name'   => $slug,
			'post_title'  => $title,
			'post_status' => 'publish',
		],
		$data
	);

	if ( $id ) {
		$args['ID'] = $id;
		// Never clobber copy an editor has since written by hand.
		unset( $args['post_content'] );
		$result = wp_update_post( $args, true );
		$stats['updated']++;
	} else {
		$result = wp_insert_post( $args, true );
		$stats['created']++;
	}

	if ( is_wp_error( $result ) ) {
		WP_CLI::warning( "Failed to save {$type} {$slug}: " . $result->get_error_message() );
		return 0;
	}

	return (int) $result;
}

/**
 * Writes an ACF group tree onto a post.
 *
 * @param array<string,mixed> $acf Top-level field name => value.
 */
function alifleet_write_acf( int $post_id, array $acf ): void {
	global $dry_run;
	if ( ! $post_id || $dry_run ) {
		return;
	}
	foreach ( $acf as $name => $value ) {
		// A list of rows means the seed still holds a PRO-era repeater. ACF free
		// would write it as one opaque meta value that no field ever reads, so say
		// so loudly instead of importing silent nothing.
		if ( is_array( $value ) && ! empty( $value ) && array_is_list( $value ) ) {
			WP_CLI::warning(
				"  \"{$name}\" is a list of rows, but this schema has no repeaters — spread it over the numbered groups (docs/ACF-FREE-CONVERSION-PLAN.md). Skipped."
			);
			continue;
		}
		update_field( $name, alifleet_resolve_images( $value, $name ), $post_id );
	}
}

/* ------------------------------------------------------------- 1. pages ---- */

WP_CLI::log( '' );
WP_CLI::log( 'Pages' );

$page_ids = [];
foreach ( $seed['pages'] ?? [] as $page ) {
	$slug = (string) $page['slug'];
	$id   = alifleet_upsert_post( $slug, 'page', (string) $page['title'] );
	if ( ! $id ) {
		continue;
	}
	$page_ids[ $slug ] = $id;
	alifleet_write_acf( $id, (array) ( $page['acf'] ?? [] ) );
	WP_CLI::log( "  {$slug} -> {$id}" );

	if ( ! empty( $page['isFrontPage'] ) ) {
		// group_home_page is located on page_type == front_page, so the home page
		// only shows its fields once WordPress is actually serving it as the front
		// page.
		//
		// Repointing the front page is destructive on a site that already serves
		// real content from another page, so it is opt-in: pass `set-front-page`
		// to actually move it. Without the flag we only report what would change.
		$current_front = (int) get_option( 'page_on_front' );

		if ( $current_front === $id ) {
			WP_CLI::log( '  already the front page' );
		} elseif ( ! $set_front_page ) {
			$existing = $current_front ? get_post( $current_front ) : null;
			$label    = $existing ? "#{$current_front} \"{$existing->post_title}\"" : 'none';
			WP_CLI::warning( "  front page left untouched (currently {$label}); pass set-front-page to change it" );
		} elseif ( ! $dry_run ) {
			update_option( 'show_on_front', 'page' );
			update_option( 'page_on_front', $id );
			WP_CLI::log( "  set as front page (was {$current_front})" );
		} else {
			WP_CLI::log( "  would set as front page (was {$current_front})" );
		}
	}
}

// Point the posts archive at the Blog page so /blog resolves.
if ( isset( $page_ids['blog'] ) && ! $dry_run ) {
	update_option( 'page_for_posts', $page_ids['blog'] );
}

/* ---------------------------------------------------- 2. site settings ----- */

WP_CLI::log( '' );
WP_CLI::log( 'Site settings' );

if ( ! empty( $seed['siteSettings'] ) && ! $dry_run ) {
	foreach ( (array) $seed['siteSettings'] as $name => $value ) {
		// 'option' is the ACF post_id that targets an options page.
		update_field( $name, alifleet_resolve_images( $value, (string) $name ), 'option' );
		WP_CLI::log( "  {$name}" );
	}
} elseif ( $dry_run ) {
	WP_CLI::log( '  would write ' . count( (array) $seed['siteSettings'] ) . ' option groups' );
}

/* ------------------------------------------------- 3. import vehicles ------ */

WP_CLI::log( '' );
WP_CLI::log( 'Import vehicles' );

foreach ( $seed['importCars'] ?? [] as $car ) {
	$id = alifleet_upsert_post( (string) $car['slug'], 'import_car', (string) $car['title'] );
	if ( ! $id ) {
		continue;
	}
	alifleet_write_acf( $id, (array) ( $car['acf'] ?? [] ) );

	if ( ! empty( $car['featuredImage'] ) && ! $dry_run ) {
		$thumb = alifleet_attachment_id( (string) $car['featuredImage'] );
		if ( $thumb ) {
			set_post_thumbnail( $id, $thumb );
		}
	}
	WP_CLI::log( "  {$car['slug']} -> {$id}" );
}

/* ------------------------------------- 4. spare parts (WooCommerce) -------- */

WP_CLI::log( '' );
WP_CLI::log( 'Spare parts' );

if ( ! $has_woo ) {
	WP_CLI::log( '  skipped (WooCommerce inactive)' );
	$stats['skipped'] += count( $seed['spareParts'] ?? [] );
} else {
	foreach ( $seed['spareParts'] ?? [] as $part ) {
		$slug = (string) $part['slug'];
		$woo  = (array) ( $part['woo'] ?? [] );

		$id = alifleet_upsert_post( $slug, 'product', (string) $part['title'] );
		if ( ! $id || $dry_run ) {
			continue;
		}

		// Price and stock are written through the WooCommerce CRUD API, never as
		// raw meta, so Woo recalculates its lookup tables and the storefront and
		// the cart agree on what a part costs.
		$product = wc_get_product( $id );
		if ( ! $product ) {
			WP_CLI::warning( "  could not load product {$slug}" );
			continue;
		}

		$product->set_name( (string) $part['title'] );
		$product->set_slug( $slug );
		$product->set_status( 'publish' );
		$product->set_catalog_visibility( 'visible' );

		if ( isset( $woo['sku'] ) ) {
			// A duplicate SKU throws; keep the import going and warn instead.
			try {
				$product->set_sku( (string) $woo['sku'] );
			} catch ( Throwable $e ) {
				WP_CLI::warning( "  SKU {$woo['sku']} rejected for {$slug}: " . $e->getMessage() );
			}
		}
		if ( isset( $woo['regularPrice'] ) ) {
			$product->set_regular_price( (string) $woo['regularPrice'] );
		}
		if ( isset( $woo['stockStatus'] ) ) {
			$product->set_stock_status( (string) $woo['stockStatus'] );
		}
		if ( isset( $woo['featured'] ) ) {
			$product->set_featured( (bool) $woo['featured'] );
		}

		// Short description carries the Arabic copy so the WooCommerce-rendered
		// cart and checkout are readable to the primary audience.
		$desc = $part['acf']['description_ar'] ?? '';
		if ( is_string( $desc ) && '' !== $desc ) {
			$product->set_short_description( $desc );
		}

		if ( ! empty( $woo['image'] ) ) {
			$thumb = alifleet_attachment_id( (string) $woo['image'] );
			if ( $thumb ) {
				$product->set_image_id( $thumb );
				if ( ! empty( $woo['imageAlt']['ar'] ) ) {
					update_post_meta( $thumb, '_wp_attachment_image_alt', (string) $woo['imageAlt']['ar'] );
				}
			}
		}

		$product->save();

		if ( ! empty( $woo['category'] ) ) {
			$cat  = (string) $woo['category'];
			$term = get_term_by( 'slug', $cat, 'product_cat' );
			if ( ! $term ) {
				$made = wp_insert_term( ucfirst( $cat ), 'product_cat', [ 'slug' => $cat ] );
				$term_id = is_wp_error( $made ) ? 0 : (int) $made['term_id'];
			} else {
				$term_id = (int) $term->term_id;
			}
			if ( $term_id ) {
				wp_set_object_terms( $id, [ $term_id ], 'product_cat' );
			}
		}

		alifleet_write_acf( $id, (array) ( $part['acf'] ?? [] ) );
		WP_CLI::log( "  {$slug} -> {$id} ({$woo['sku']})" );
	}
}

/* --------------------------------------------------- 5. blog articles ------ */

WP_CLI::log( '' );
WP_CLI::log( 'Blog articles' );

foreach ( $seed['blogPosts'] ?? [] as $post ) {
	$slug = (string) $post['slug'];
	$data = [];

	if ( ! empty( $post['publishedAt'] ) ) {
		$date = $post['publishedAt'] . ' 09:00:00';
		$data['post_date']     = $date;
		$data['post_date_gmt'] = get_gmt_from_date( $date );
	}
	if ( ! empty( $post['acf']['post_excerpt_ar'] ) ) {
		$data['post_excerpt'] = (string) $post['acf']['post_excerpt_ar'];
	}

	$id = alifleet_upsert_post( $slug, 'post', (string) $post['title'], $data );
	if ( ! $id ) {
		continue;
	}
	alifleet_write_acf( $id, (array) ( $post['acf'] ?? [] ) );

	if ( ! empty( $post['featuredImage'] ) && ! $dry_run ) {
		$thumb = alifleet_attachment_id( (string) $post['featuredImage'] );
		if ( $thumb ) {
			set_post_thumbnail( $id, $thumb );
		}
	}

	// Mirror the ACF category into a real WordPress category so the archive and
	// any WordPress-side filtering keep working.
	$cat = $post['acf']['blog_category'] ?? '';
	if ( is_string( $cat ) && '' !== $cat && ! $dry_run ) {
		$term = get_term_by( 'slug', $cat, 'category' );
		if ( ! $term ) {
			$made    = wp_insert_term( ucfirst( $cat ), 'category', [ 'slug' => $cat ] );
			$term_id = is_wp_error( $made ) ? 0 : (int) $made['term_id'];
		} else {
			$term_id = (int) $term->term_id;
		}
		if ( $term_id ) {
			wp_set_object_terms( $id, [ $term_id ], 'category' );
		}
	}

	WP_CLI::log( "  {$slug} -> {$id}" );
}

/* ----------------------------------------------------------------- done ---- */

if ( ! $dry_run ) {
	// ACF caches field values aggressively; a flush keeps the very next GraphQL
	// request from serving the pre-import state.
	wp_cache_flush();
	if ( function_exists( 'flush_rewrite_rules' ) ) {
		flush_rewrite_rules( false );
	}
}

WP_CLI::log( '' );
WP_CLI::success(
	sprintf(
		'created %d, updated %d, media uploaded %d, skipped %d',
		$stats['created'],
		$stats['updated'],
		$stats['media'],
		$stats['skipped']
	)
);

if ( $dry_run ) {
	WP_CLI::log( 'Re-run without --dry-run to apply these changes.' );
}
