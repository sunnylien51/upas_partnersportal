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
        $url = (string) vite($asset);

        if (preg_match('#^https?://#i', $url) === 1) {
            return $url;
        }

        return ltrim($url, '/');
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
