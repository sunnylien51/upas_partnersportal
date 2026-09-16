<?php

$raw = file_get_contents('https://raw.githubusercontent.com/umpirsky/country-list/master/data/zh_TW/country.json');

if ($raw === false) {
    fwrite(STDERR, "fetch failed\n");
    exit(1);
}

$map = json_decode($raw, true);

if (!is_array($map)) {
    fwrite(STDERR, "json failed\n");
    exit(1);
}

$list = [];

foreach ($map as $code => $label) {
    $list[] = [
        'value' => strtolower($code),
        'label' => $label,
        'code' => strtoupper($code),
    ];
}

usort($list, function ($a, $b) {
    if ($a['value'] === 'tw') {
        return -1;
    }
    if ($b['value'] === 'tw') {
        return 1;
    }

    return strcmp($a['label'], $b['label']);
});

if (!is_dir(__DIR__ . '/../data')) {
    mkdir(__DIR__ . '/../data', 0777, true);
}

$export = var_export($list, true);
file_put_contents(__DIR__ . '/../data/countries.php', "<?php\n\nreturn {$export};\n");

echo 'countries: ' . count($list) . PHP_EOL;
