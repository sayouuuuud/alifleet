<?php
/**
 * Pushes the `group_import_page` field group from the repo schema onto the live
 * site, so the WordPress editor and `wordpress/acf/alifleet-acf-schema.json`
 * never drift apart.
 *
 * Run with the schema JSON staged next to this file:
 *   wp eval-file sync-cars-page-group.php
 *
 * Idempotent: re-running it re-imports the same definition. Field *values*
 * (what an editor has typed into the page) live in postmeta and are untouched —
 * only the field definitions are replaced.
 */

if (!function_exists('acf_import_field_group')) {
    echo "ACF is not active\n";
    return;
}

$schema_path = __DIR__ . '/alifleet-acf-schema.json';
if (!file_exists($schema_path)) {
    echo "missing schema at {$schema_path}\n";
    return;
}

$schema = json_decode(file_get_contents($schema_path), true);
if (!is_array($schema)) {
    echo "schema is not valid JSON\n";
    return;
}

$incoming = null;
foreach ($schema as $group) {
    if (($group['key'] ?? '') === 'group_import_page') {
        $incoming = $group;
        break;
    }
}

if (!$incoming) {
    echo "group_import_page not found in schema\n";
    return;
}

/*
 * `acf_import_field_group()` matches on the group key and updates the existing
 * post in place when one exists, so the group keeps its ID and any page still
 * bound to it stays bound. Passing the ID explicitly avoids ACF inserting a
 * duplicate post when the group currently resolves from a JSON file (local
 * groups report ID 0, which is what created the duplicate we just cleaned up).
 */
$existing = acf_get_field_group('group_import_page');
if ($existing && !empty($existing['ID'])) {
    $incoming['ID'] = $existing['ID'];
}

$result = acf_import_field_group($incoming);

if (!$result) {
    echo "import failed\n";
    return;
}

echo 'imported group #' . ($result['ID'] ?? 0) . ' "' . $result['title'] . '"' . "\n";

$fields = acf_get_fields($result);
echo 'top-level fields: ' . implode(', ', array_map(
    static fn($f) => $f['name'],
    $fields
)) . "\n";

foreach ($result['location'] as $or) {
    foreach ($or as $rule) {
        echo '  rule: ' . $rule['param'] . ' ' . $rule['operator'] . ' ' . $rule['value'] . "\n";
    }
}

echo 'show_in_graphql=' . var_export($result['show_in_graphql'] ?? null, true)
    . ' graphql_field_name=' . var_export($result['graphql_field_name'] ?? null, true) . "\n";

// The JSON store is what ACF reads first on this install, so keep it current.
$json_dir = get_stylesheet_directory() . '/acf-json';
if (is_dir($json_dir) && is_writable($json_dir)) {
    $json = $result;
    unset($json['ID']);
    file_put_contents(
        $json_dir . '/group_import_page.json',
        json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
    );
    echo "rewrote acf-json/group_import_page.json\n";
}

echo "ok\n";
