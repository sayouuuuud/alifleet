<?php
/**
 * Expose the Cars page field group to WPGraphQL.
 *
 * WPGraphQL for ACF decides which GraphQL types a field group hangs off by
 * reading the group's location rules. It understands rules that name a type
 * (`post_type == page`, `page_type == front_page`) but it cannot resolve
 * `page_slug == cars`, because a slug is a row in the database, not a type. When
 * inference fails the group is dropped from the schema *without an error* — the
 * flags still read `show_in_graphql=1`, which is why this looked configured
 * while `Page.importPageFields` did not exist.
 *
 * The fix is to stop relying on inference: turn it off and name the type
 * outright. The group stays bound to the single `cars` page in the admin (the
 * location rules are untouched), but the schema now attaches it to `Page`.
 *
 * The group is loaded from an acf-json file, which takes priority over the
 * database copy, so the file is the real source of truth and has to be written
 * too — updating only the database would be silently overridden on next load.
 *
 * Idempotent: safe to run repeatedly.
 */

if (!function_exists('acf_get_field_group')) {
    echo "ACF is not active\n";
    return;
}

$key = 'group_import_page';
$group = acf_get_field_group($key);

if (!$group) {
    echo "missing field group {$key}\n";
    return;
}

$group['show_in_graphql'] = 1;
$group['graphql_field_name'] = 'importPageFields';
// Inference is what broke; disable it and state the type explicitly.
$group['map_graphql_types_from_location'] = 0;
$group['graphql_types'] = ['Page'];

/*
 * Preserve the database ID. Calling acf_update_field_group() on a group whose
 * ID is 0 (the shape acf_get_field_group() returns for a json-loaded group)
 * makes ACF insert a brand new post instead of updating, which is exactly how a
 * duplicate group appeared here before. Looking the post up by key and pinning
 * the ID keeps this an update.
 */
if (empty($group['ID'])) {
    $existing = get_posts([
        'post_type' => 'acf-field-group',
        'post_status' => 'any',
        'posts_per_page' => 1,
        'name' => $key,
        'fields' => 'ids',
    ]);

    if ($existing) {
        $group['ID'] = $existing[0];
    }
}

$saved = acf_update_field_group($group);
echo 'updated group #' . ($saved['ID'] ?? 0) . "\n";

// Mirror the change into the acf-json file, which wins over the database.
$dir = trailingslashit(get_stylesheet_directory()) . 'acf-json';
$file = $dir . '/' . $key . '.json';

if (is_readable($file) && is_writable($dir)) {
    $json = json_decode(file_get_contents($file), true);

    if (is_array($json)) {
        $json['show_in_graphql'] = 1;
        $json['graphql_field_name'] = 'importPageFields';
        $json['map_graphql_types_from_location'] = 0;
        $json['graphql_types'] = ['Page'];
        $json['title'] = 'Cars Page Fields';
        $json['location'] = [
            [['param' => 'page_slug', 'operator' => '==', 'value' => 'cars']],
        ];

        file_put_contents(
            $file,
            json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        );
        echo "rewrote {$key}.json\n";
    }
} else {
    echo "acf-json file not writable, skipped: {$file}\n";
}

// WPGraphQL caches the built schema; a stale cache would hide the new field.
if (function_exists('wp_cache_flush')) {
    wp_cache_flush();
}
delete_option('wpgraphql_cache');
if (class_exists('WPGraphQL')) {
    do_action('graphql_init');
}

echo "ok\n";
