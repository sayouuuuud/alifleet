<?php
/**
 * Apply the product naming / description payload produced by
 * scripts/products/build-apply-payload.py.
 *
 * Run inside the WordPress container through wp-agent:
 *   sudo wp-agent stage /tmp/apply-payload.json
 *   sudo wp-agent stage /tmp/apply-products.php
 *   sudo wp-agent wp eval-file /tmp/alifleet-stage/apply-products.php dry      # report only
 *   sudo wp-agent wp eval-file /tmp/alifleet-stage/apply-products.php apply    # write
 *
 * What is written per product
 *   - post_title      Hebrew name (the storefront reads Hebrew from the WooCommerce name)
 *   - post_excerpt    Hebrew short blurb (storefront Hebrew description source #1)
 *   - post_content    Hebrew full description (fallback source #2)
 *   - ACF             name_he/ar/en, description_he/ar/en, part_category, brand, sku,
 *                     search_terms + oe_number (hidden, search only),
 *                     spec_1..8 (label/value × 3 languages), compat_model_1..10
 *   - images          when the payload lists files: featured = first, gallery =
 *                     the rest. Files come from /tmp/alifleet-stage/images/; an
 *                     attachment with the same file name is reused, never duplicated.
 * Slugs, prices, stock and WooCommerce categories are never touched.
 */

const ALIFLEET_IMAGES_DIR = '/tmp/alifleet-stage/images';

function alifleet_find_attachment_by_name( string $name ): int {
	global $wpdb;
	$like = '%' . $wpdb->esc_like( '/' . $name );
	$id   = $wpdb->get_var( $wpdb->prepare( "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_wp_attached_file' AND meta_value LIKE %s ORDER BY post_id ASC LIMIT 1", $like ) );
	return (int) $id;
}

function alifleet_sideload( string $path, int $post_id, string $alt ): int {
	require_once ABSPATH . 'wp-admin/includes/image.php';
	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	$tmp = wp_tempnam( basename( $path ) );
	if ( ! copy( $path, $tmp ) ) return 0;
	$id = media_handle_sideload( [ 'name' => basename( $path ), 'tmp_name' => $tmp ], $post_id, $alt );
	if ( is_wp_error( $id ) ) { @unlink( $tmp ); return 0; }
	return (int) $id;
}

/** Returns [featured_id, gallery_ids[], new_count, reused_count]; writes only when $write. */
function alifleet_sync_images( int $post_id, array $files, string $alt, bool $write ): array {
	$ids = []; $new = 0; $reused = 0;
	foreach ( $files as $file ) {
		$path = ALIFLEET_IMAGES_DIR . '/' . basename( $file );
		$id = alifleet_find_attachment_by_name( basename( $file ) );
		if ( $id ) { $reused++; }
		elseif ( ! file_exists( $path ) ) { continue; }
		else { $new++; if ( $write ) { $id = alifleet_sideload( $path, $post_id, $alt ); if ( ! $id ) continue; } else { $id = -1; } }
		if ( $write && $id > 0 ) update_post_meta( $id, '_wp_attachment_image_alt', $alt );
		$ids[] = $id;
	}
	if ( ! $ids ) return [ 0, [], 0, 0 ];
	$featured = array_shift( $ids );
	if ( $write ) {
		set_post_thumbnail( $post_id, $featured );
		update_post_meta( $post_id, '_product_image_gallery', implode( ',', $ids ) );
	}
	return [ $featured, $ids, $new, $reused ];
}

$mode    = $args[0] ?? 'dry';
$payload = '/tmp/alifleet-stage/apply-payload.json';
if ( ! file_exists( $payload ) ) {
	WP_CLI::error( "payload not found at $payload" );
}
$data = json_decode( file_get_contents( $payload ), true );
if ( ! is_array( $data ) || empty( $data['products'] ) ) {
	WP_CLI::error( 'payload is empty or invalid JSON' );
}
if ( ! function_exists( 'update_field' ) ) {
	WP_CLI::error( 'ACF is not active' );
}

$write   = ( 'apply' === $mode );
$changed = 0;
$same    = 0;
$missing = 0;
$errors  = 0;

// Titles must stay unique after the run: refuse to write duplicates.
$titles = array_count_values( array_map( static fn( $p ) => trim( (string) $p['post_title'] ), $data['products'] ) );
$dupes  = array_filter( $titles, static fn( $n ) => $n > 1 );
if ( $dupes ) {
	WP_CLI::warning( count( $dupes ) . ' Hebrew titles are shared by more than one product (model still missing?):' );
	foreach ( array_slice( $dupes, 0, 10, true ) as $t => $n ) {
		WP_CLI::line( "   {$n}x  {$t}" );
	}
}

foreach ( $data['products'] as $item ) {
	$id   = (int) $item['id'];
	$post = get_post( $id );
	if ( ! $post || 'product' !== $post->post_type || 'trash' === $post->post_status ) {
		$missing++;
		WP_CLI::line( "skip  #$id (missing or trashed)" );
		continue;
	}

	$before = [
		'title'   => $post->post_title,
		'excerpt' => $post->post_excerpt,
		'name_en' => (string) get_field( 'name_en', $id ),
		'cat'     => (string) get_field( 'part_category', $id ),
	];
	$after = [
		'title'   => $item['post_title'],
		'excerpt' => $item['short_he'],
		'name_en' => $item['acf']['name_en'],
		'cat'     => $item['acf']['part_category'],
	];
	$diff = array_keys( array_filter( $after, static fn( $v, $k ) => $v !== $before[ $k ], ARRAY_FILTER_USE_BOTH ) );

	WP_CLI::line( sprintf( '%s  #%d %s | %s -> %s | cat %s -> %s%s',
		$write ? 'write' : 'plan ', $id, $item['sku'],
		mb_substr( $before['title'], 0, 28 ), mb_substr( $after['title'], 0, 40 ),
		$before['cat'] ?: '-', $after['cat'], $diff ? '' : ' (no change)' ) );

	if ( ! $write ) {
		if ( ! empty( $item['images'] ) ) {
			[ , $gallery, $new, $reused ] = alifleet_sync_images( $id, $item['images'], $item['post_title'], false );
			WP_CLI::line( sprintf( '        images planned: %d (new %d, reused %d)', count( $gallery ) + 1, $new, $reused ) );
		}
		$diff ? $changed++ : $same++;
		continue;
	}

	$r = wp_update_post( [
		'ID'           => $id,
		'post_title'   => $item['post_title'],
		'post_excerpt' => $item['short_he'],
		'post_content' => $item['desc_he'],
	], true );
	if ( is_wp_error( $r ) ) {
		$errors++;
		WP_CLI::warning( "  #$id: " . $r->get_error_message() );
		continue;
	}

	foreach ( $item['acf'] as $field => $value ) {
		update_field( $field, $value, $id );
	}
	for ( $i = 1; $i <= 8; $i++ ) {
		$spec = $item['specs'][ $i - 1 ] ?? null;
		update_field( "spec_$i", $spec ? [
			'label_ar' => $spec['label_ar'], 'label_en' => $spec['label_en'], 'label_he' => $spec['label_he'],
			'value_ar' => $spec['value_ar'], 'value_en' => $spec['value_en'], 'value_he' => $spec['value_he'],
		] : [ 'label_ar' => '', 'label_en' => '', 'label_he' => '', 'value_ar' => '', 'value_en' => '', 'value_he' => '' ], $id );
	}
	for ( $i = 1; $i <= 10; $i++ ) {
		update_field( "compat_model_$i", [ 'model_name' => $item['compat'][ $i - 1 ] ?? '' ], $id );
	}
	if ( ! empty( $item['images'] ) ) {
		[ $feat, $gallery, $new, $reused ] = alifleet_sync_images( $id, $item['images'], $item['post_title'], true );
		WP_CLI::line( sprintf( '        images: featured #%d, gallery %d, new %d, reused %d', $feat, count( $gallery ), $new, $reused ) );
	}
	// WooCommerce caches product data; make sure the storefront and GraphQL see the new title.
	if ( function_exists( 'wc_delete_product_transients' ) ) {
		wc_delete_product_transients( $id );
	}
	clean_post_cache( $id );
	$diff ? $changed++ : $same++;
}

WP_CLI::success( sprintf( '%s: %d to change, %d unchanged, %d missing, %d errors',
	$write ? 'applied' : 'dry run', $changed, $same, $missing, $errors ) );
