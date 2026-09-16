<!DOCTYPE html>
<html lang="{{ $page->language ?? 'zh-Hant' }}">
<head>
    @include('_components.head')
    @stack('head')
</head>
<body class="bg-bg text-gray5 font-sans antialiased selection:bg-brand2/60 selection:text-gray5 min-h-screen overflow-x-hidden">
    @component('_components.auth-shell', [
        'page' => $page,
        'cardMaxWidth' => $page->cardMaxWidth ?? '500px',
    ])
        @yield('body')
    @endcomponent

    @stack('scripts')
</body>
</html>
