{{-- 認證流程共用殼：品牌 + 卡片槽 + 頁尾 --}}
@php
    $cardMaxWidth = $cardMaxWidth ?? '500px';
@endphp
<div class="auth-page">
    <div class="auth-brand">
        <a href="{{ $page->baseUrl }}/login/" class="inline-flex">
            <img
                src="{{ $page->baseUrl }}/images/logo.svg"
                alt="{{ $page->siteName }}"
                width="116"
                height="44"
                class="w-[116px] h-11"
            >
        </a>
    </div>

    <div
        class="w-full p-6 md:p-10 bg-white rounded-[8px] shadow-card flex flex-col justify-start items-start gap-8"
        style="max-width: {{ $cardMaxWidth }}"
    >
        {{ $slot }}
    </div>

    <footer class="auth-footer">
        <p class="text-[12px] text-gray3">© {{ date('Y') }} UPAS 商案管理系統 版權所有</p>
    </footer>
</div>
