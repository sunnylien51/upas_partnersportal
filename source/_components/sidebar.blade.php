<div id="sidebar-overlay" class="fixed inset-0 z-40 bg-gray5/40 hidden md:hidden"></div>

<aside id="app-sidebar" class="fixed md:sticky top-0 left-0 z-50 md:z-10 flex h-screen w-60 shrink-0 flex-col justify-between overflow-hidden bg-white border-r border-gray1 shadow-[0px_0px_60px_0px_rgba(0,0,0,0.02)] -translate-x-full md:translate-x-0 transition-transform duration-300 ease-in-out">
    <div class="flex-1 self-stretch px-4 py-10 flex flex-col items-center gap-10 min-h-0">
        <a href="{{ $page->baseUrl }}/" class="flex justify-center items-center">
            <img src="{{ $page->baseUrl }}/images/logo.svg" alt="{{ $page->siteName }}" width="116" height="44" class="w-[116px] h-11">
        </a>

        <nav class="self-stretch flex-1 flex flex-col items-start gap-1 overflow-y-auto" aria-label="主要選單">
            @foreach ($page->appNav as $item)
                <a href="{{ $page->baseUrl }}{{ $item['path'] === '/' ? '/' : rtrim($item['path'], '/') . '/' }}" class="sidebar-link {{ $page->isActive($item['path']) }}">
                    <i data-lucide="{{ $item['icon'] }}" class="w-4 h-4"></i>
                    <span>{{ $item['label'] }}</span>
                </a>
            @endforeach
        </nav>
    </div>

    <div class="self-stretch px-6 py-5 border-t border-gray1 inline-flex items-center gap-2">
        <i data-lucide="globe" class="w-4 h-4 text-gray4 shrink-0"></i>
        <div class="locale-switch text-eb3 uppercase" role="group" aria-label="語言">
            @foreach ($page->locales as $index => $locale)
                @if ($index > 0)
                    <span class="text-gray3"> / </span>
                @endif
                <button type="button" data-locale="{{ $locale }}" class="locale-btn {{ $index === 0 ? 'is-active' : '' }}">{{ $locale }}</button>
            @endforeach
        </div>
    </div>
</aside>
