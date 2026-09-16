<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="canonical" href="{{ $page->getUrl() }}">
<title>{{ $page->title ? $page->title . ' | ' . $page->siteName : $page->siteName }}</title>
<meta name="description" content="{{ $page->description ?? $page->siteDescription }}">

<link rel="icon" href="{{ $page->baseUrl }}/images/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="{{ $page->baseUrl }}/images/favicon-32.png">
<link rel="apple-touch-icon" href="{{ $page->baseUrl }}/images/apple-touch-icon.png">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Rajdhani:wght@600&display=swap" rel="stylesheet">

<script type="module" src="http://localhost:5173/@@vite/client"></script>
<link rel="stylesheet" href="http://localhost:5173/source/_assets/css/main.css">
<script defer type="module" src="http://localhost:5173/source/_assets/js/main.js"></script>

<script src="https://unpkg.com/lucide@latest"></script>
