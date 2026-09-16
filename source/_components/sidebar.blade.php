<div id="sidebar-overlay" class="fixed inset-0 z-40 bg-gray5/40 hidden md:hidden"></div>

<aside id="app-sidebar" class="fixed md:sticky top-0 left-0 z-50 md:z-10 flex h-screen w-60 shrink-0 flex-col justify-between overflow-hidden bg-white border-r border-gray1 shadow-[0px_0px_60px_0px_rgba(0,0,0,0.02)] -translate-x-full md:translate-x-0 transition-transform duration-300 ease-in-out">
    <div class="flex-1 self-stretch px-4 py-10 flex flex-col items-center gap-10 min-h-0">
        <a href="{{ $page->baseUrl }}/" class="flex justify-center items-center">
            <img src="{{ $page->baseUrl }}/images/logo.svg" alt="{{ $page->siteName }}" width="116" height="44" class="w-[116px] h-11">
        </a>

        <nav class="self-stretch flex-1 flex flex-col items-start gap-1 overflow-y-auto" aria-label="主要選單">
            @foreach ($page->appNav as $item)
                <a
                    href="{{ $page->baseUrl }}{{ $item['path'] === '/' ? '/' : rtrim($item['path'], '/') . '/' }}"
                    class="sidebar-link {{ $page->isActive($item['path']) }}"
                    data-nav-path="{{ $item['path'] }}"
                >
                    <i data-lucide="{{ $item['icon'] }}" class="w-4 h-4"></i>
                    <span>{{ $item['label'] }}</span>
                </a>
            @endforeach
        </nav>
    </div>

    <div class="self-stretch flex flex-col items-stretch">
        {{-- 演示用：預覽身分權限切換（與下方語言列同為 px-6，靠左） --}}
        <div class="role-preview role-preview--sidebar self-stretch px-6 pb-4 text-left" data-role-preview>
            <div class="flex items-center justify-start gap-2 mb-2">
                <span class="text-[12px] font-medium tracking-[0.06em] text-gray4">預覽身分權限</span>
                <span class="role-preview-badge">演示用</span>
            </div>
            <div class="role-preview-switch role-preview-switch--sidebar justify-start" role="group" aria-label="預覽身分權限">
                <button type="button" class="role-preview-btn is-active" data-role-switch="admin" aria-pressed="true">總管</button>
                <button type="button" class="role-preview-btn" data-role-switch="oem_manager" aria-pressed="false">主管</button>
                <button type="button" class="role-preview-btn" data-role-switch="oem_sales" aria-pressed="false">業務</button>
                <button type="button" class="role-preview-btn" data-role-switch="dealer_tw" aria-pressed="false">國內</button>
                <button type="button" class="role-preview-btn" data-role-switch="dealer_overseas" aria-pressed="false">海外</button>
            </div>
        </div>

        <div class="self-stretch px-6 py-5 border-t border-gray1 inline-flex items-center justify-start gap-2">
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
    </div>
</aside>
