<!DOCTYPE html>
<html lang="{{ $page->language ?? 'zh-Hant' }}">
<head>
    @include('_components.head')
    @stack('head')
</head>
<body class="bg-bg text-gray5 font-sans antialiased selection:bg-brand2/60 selection:text-gray5 min-h-screen overflow-x-hidden">
    <div class="flex min-h-screen">
        @include('_components.sidebar')

        <div class="flex-1 min-w-0 flex flex-col">
            @include('_components.app-header')

            <main class="flex-1 flex flex-col min-h-0">
                @yield('body')
            </main>
        </div>
    </div>

    @stack('scripts')

    <script type="application/json" id="app-roles-config">
        {!! json_encode([
            'defaultRole' => $page->defaultPreviewRole,
            'roles' => $page->roles,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
    </script>
</body>
</html>
