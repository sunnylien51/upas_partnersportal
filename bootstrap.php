<?php

use Illuminate\Container\Container;
use TightenCo\Jigsaw\Events\EventBus;
use TightenCo\Jigsaw\Jigsaw;

/** @var Container $container */
/** @var EventBus $events */

if (! function_exists('site_href')) {
    function site_href($page, string $path = '/'): string
    {
        $target = trim($path, '/');

        if ($target === '') {
            return './';
        }

        return $target . '/';
    }
}

if (! function_exists('site_asset')) {
    function site_asset($page, string $path): string
    {
        return ltrim($path, '/');
    }
}

if (! function_exists('site_vite')) {
    function site_vite(string $asset, $page): string
    {
        $url = (string) vite($asset, '/static');

        if (preg_match('#^https?://#i', $url) === 1) {
            return $url;
        }

        return ltrim($url, '/');
    }
}

if (! function_exists('oem_staff_options')) {
    /** 商機承接業務選項：已核准的原廠內部人員，value 為帳號編號 */
    function oem_staff_options($page): array
    {
        $options = [];
        foreach ($page->partners ?? [] as $partner) {
            $identity = $partner['identity'] ?? '';
            if (($partner['status'] ?? '') !== 'approved' || ! in_array($identity, ['oem_manager', 'oem_sales'], true)) {
                continue;
            }
            $options[] = ['value' => $partner['id'], 'label' => $partner['name'] ?? $partner['id']];
        }

        return $options;
    }
}

$events->beforeBuild(function (Jigsaw $jigsaw) {
    if ($jigsaw->getEnvironment() !== 'production') {
        return;
    }

    $hotFile = $jigsaw->getSourcePath() . '/hot';
    if (is_file($hotFile)) {
        unlink($hotFile);
    }
});

$events->afterBuild(function (Jigsaw $jigsaw) {
    if ($jigsaw->getEnvironment() !== 'production') {
        return;
    }

    file_put_contents($jigsaw->getDestinationPath() . '/.nojekyll', '');
});
