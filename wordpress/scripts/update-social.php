<?php
$updates = [
    'options_company_info_facebook'  => 'https://www.facebook.com/alifleetcar/',
    'options_company_info_instagram' => 'https://www.instagram.com/alifleet_/',
    'options_company_info_tiktok'    => 'https://www.tiktok.com/@alifleet_',
];

foreach ($updates as $key => $value) {
    $old = get_option($key);
    update_option($key, $value, false);
    printf("%-38s : %s → %s %s\n",
        $key,
        $old === false || $old === '' ? '(فاضي)' : $old,
        $value,
        get_option($key) === $value ? '✅' : '❌'
    );
}

echo "\n=== القراءة بمنطق الكود ===\n";
if (function_exists('alifleet_acf_option')) {
    foreach (['facebook','instagram','tiktok','linkedin'] as $k) {
        printf("%-10s: '%s'\n", $k, alifleet_acf_option('company_info', $k));
    }
}
