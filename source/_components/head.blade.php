<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script>
(function () {
    var path = location.pathname || '/';
    var match = path.match(/^(.*\/build_production\/)/) || path.match(/^(\/upas_partnersportal\/)/);
    var root = match ? match[1] : '/';
    var base = document.createElement('base');
    base.href = location.origin + root;
    document.head.insertBefore(base, document.head.firstChild);
})();
</script>
<link rel="canonical" href="{{ $page->getUrl() }}">
<title>{{ $page->title ? $page->title . ' | ' . $page->siteName : $page->siteName }}</title>
<meta name="description" content="{{ $page->description ?? $page->siteDescription }}">

<link rel="icon" href="{{ site_asset($page, 'images/favicon.ico') }}" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="{{ site_asset($page, 'images/favicon-32.png') }}">
<link rel="apple-touch-icon" href="{{ site_asset($page, 'images/apple-touch-icon.png') }}">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Rajdhani:wght@600&display=swap" rel="stylesheet">

{!! vite_refresh() !!}
<link rel="stylesheet" href="{{ site_vite('source/_assets/css/main.css', $page) }}">
<script defer type="module" src="{{ site_vite('source/_assets/js/main.js', $page) }}"></script>

<script src="https://unpkg.com/lucide@latest"></script>
