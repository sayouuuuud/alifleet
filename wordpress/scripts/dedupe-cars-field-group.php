<?php
/**
 * ALI FLEET — collapse duplicate `group_import_page` field groups down to one.
 *
 * Run with:
 *   sudo wp-agent stage /tmp/dedupe-cars-field-group.php
 *   sudo wp-agent wp eval-file /tmp/alifleet-stage/dedupe-cars-field-group.php
 *
 * ACF stores a field group as a post whose `post_name` is the group key. When a
 * group is loaded from `acf-json` its in-memory `ID` is 0, so calling
 * `acf_update_field_group()` on it inserts a *second* post with the same key
 * instead of updating the first. The result is two published `acf-field-group`
 * posts for `group_import_page`, and the page edit screen renders the same
 * fields twice.
 *
 * The JSON file in the theme is the source of truth for the group's shape, so
 * the fix is to keep exactly one post and trash the rest. The lowest ID is the
 * original, so that is the keeper — it is the one the field posts (and any
 * hand-edits made through the UI) already hang off.
 *
 * Idempotent: safe to run again once only one group remains.
 */

if ( ! function_exists( 'acf_get_field_group' ) ) {
	echo "acf missing\n";
	exit( 1 );
}

$key = 'group_import_page';

$posts = get_posts(
	[
		'post_type'        => 'acf-field-group',
		'post_status'      => 'any',
		'posts_per_page'   => -1,
		'name'             => $key,
		'orderby'          => 'ID',
		'order'            => 'ASC',
		'suppress_filters' => false,
	]
);

if ( count( $posts ) <= 1 ) {
	echo 'nothing to do — ' . count( $posts ) . " group post(s) for {$key}\n";
} else {
	$keep = array_shift( $posts );
	echo "keeping #{$keep->ID} ({$keep->post_title})\n";

	foreach ( $posts as $dupe ) {
		// Move the duplicate's fields onto the keeper first. A duplicate created
		// by acf_update_field_group() normally carries its own copies of every
		// field; re-parenting rather than deleting them keeps any value that was
		// saved against them reachable instead of orphaning it.
		$children = get_posts(
			[
				'post_type'      => 'acf-field',
				'post_status'    => 'any',
				'posts_per_page' => -1,
				'post_parent'    => $dupe->ID,
			]
		);

		foreach ( $children as $child ) {
			// Only move a field across if the keeper does not already have one
			// with the same key, otherwise we would recreate the duplication a
			// level down.
			$existing = get_posts(
				[
					'post_type'      => 'acf-field',
					'post_status'    => 'any',
					'posts_per_page' => 1,
					'post_parent'    => $keep->ID,
					'name'           => $child->post_name,
					'fields'         => 'ids',
				]
			);

			if ( $existing ) {
				wp_delete_post( $child->ID, true );
				continue;
			}

			wp_update_post(
				[
					'ID'          => $child->ID,
					'post_parent' => $keep->ID,
				]
			);
		}

		wp_delete_post( $dupe->ID, true );
		echo "removed #{$dupe->ID} ({$dupe->post_title})\n";
	}
}

/* ------------------------------------------------------------- verify */

acf_reset_local(); // Drop the cached JSON/DB merge so the check below is real.
wp_cache_flush();

$page = get_page_by_path( 'cars' );

if ( ! $page ) {
	echo "no cars page\n";
	exit( 1 );
}

$attached = acf_get_field_groups(
	[
		'post_id'   => $page->ID,
		'post_type' => 'page',
	]
);

$mine = array_values(
	array_filter( $attached, static fn ( array $g ): bool => $g['key'] === $key )
);

echo 'attached to /cars: ' . count( $mine ) . " copy(ies) of {$key}\n";
foreach ( $mine as $g ) {
	echo '  ' . $g['title'] . ' | fields=' . count( acf_get_fields( $g ) ) . "\n";
}

echo count( $mine ) === 1 ? "ok\n" : "STILL DUPLICATED\n";
