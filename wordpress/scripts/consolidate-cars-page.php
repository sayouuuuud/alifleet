<?php
/**
 * ALI FLEET — consolidate the vehicle page onto the /cars route.
 *
 * Run with:
 *   sudo wp-agent stage /tmp/consolidate-cars-page.php
 *   sudo wp-agent wp eval-file /tmp/alifleet-stage/consolidate-cars-page.php
 *
 * The frontend route was renamed from /import to /cars when the page grew a
 * "for sale" half. Two things on the WordPress side still described the old
 * shape:
 *
 *   1. The editable page still lived at the `import` slug, so an editor looking
 *      for "the cars page" found a page named after only half of it.
 *   2. `group_import_page` carried two location rules — `page_slug == import`
 *      OR `page_slug == cars`. That duplicate only existed to survive the
 *      rename. Once the page is at `cars` the second rule is the live one, and
 *      the first is dead weight that would silently re-attach the whole group
 *      to any future page someone happens to call "import".
 *
 * Idempotent: safe to run again.
 */

if ( ! function_exists( 'acf_get_field_group' ) ) {
	echo "acf missing\n";
	exit( 1 );
}

/* ------------------------------------------------------------ 1) the page */

$page = get_page_by_path( 'cars' );

if ( ! $page ) {
	$page = get_page_by_path( 'import' ) ?: get_page_by_path( 'car-import' );

	if ( ! $page ) {
		// Nothing to rename — create the page the group is meant to hang off,
		// otherwise the field group has no home and the hero copy stays
		// uneditable.
		$id = wp_insert_post(
			[
				'post_type'   => 'page',
				'post_status' => 'publish',
				'post_title'  => 'Cars',
				'post_name'   => 'cars',
			],
			true
		);
		if ( is_wp_error( $id ) ) {
			echo 'page create failed: ' . $id->get_error_message() . "\n";
			exit( 1 );
		}
		echo "page: created #$id (cars)\n";
	} else {
		$from   = $page->post_name;
		$result = wp_update_post(
			[
				'ID'         => $page->ID,
				'post_name'  => 'cars',
				'post_title' => 'Cars',
			],
			true
		);
		if ( is_wp_error( $result ) ) {
			echo 'page rename failed: ' . $result->get_error_message() . "\n";
			exit( 1 );
		}
		echo "page: #{$page->ID} '{$from}' -> 'cars'\n";
	}
} else {
	echo "page: #{$page->ID} already at 'cars'\n";
}

/* --------------------------------------------------- 2) the field group */

$group = acf_get_field_group( 'group_import_page' );

if ( ! $group ) {
	echo "group_import_page not found\n";
	exit( 1 );
}

$group['title']    = 'Cars Page Fields';
$group['location'] = [
	[
		[
			'param'    => 'page_slug',
			'operator' => '==',
			'value'    => 'cars',
		],
	],
];

acf_update_field_group( $group );

$after = acf_get_field_group( 'group_import_page' );
echo 'group: ' . $after['title'] . ' | rule groups=' . count( $after['location'] ) . "\n";
foreach ( $after['location'] as $or ) {
	foreach ( $or as $rule ) {
		echo '  - ' . $rule['param'] . ' ' . $rule['operator'] . ' ' . $rule['value'] . "\n";
	}
}

/* ------------------------------------------------------------- 3) caches */

wp_cache_flush();
echo "done\n";
