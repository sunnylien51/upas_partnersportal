@php
    $breadcrumbKey = trim($page->getPath(), '/');
    $breadcrumbItems = $page->pageBreadcrumbs[$breadcrumbKey === '' ? '/' : $breadcrumbKey] ?? [];
@endphp

<header class="relative z-20 px-4 md:px-12 pt-8 pb-5">
    <div class="flex items-center gap-2 min-w-0 pr-[11.5rem] md:pr-[18.5rem]">
        <button id="sidebar-toggle" type="button" class="md:hidden p-2 -ml-1 text-gray5 shrink-0" aria-label="開啟選單" aria-controls="app-sidebar">
            <i data-lucide="menu" class="w-5 h-5"></i>
        </button>
        <img src="{{ $page->baseUrl }}/images/yellow-slash-motif.svg" alt="" class="w-3 h-6 shrink-0" aria-hidden="true" />
        <h1 class="text-ch5 text-gray5 truncate">{{ $page->title ?? $page->siteName }}</h1>
    </div>

    @if (count($breadcrumbItems))
        <nav class="breadcrumb mt-8 pr-[11.5rem] md:pr-[18.5rem]" aria-label="麵包屑">
            <i data-lucide="home" class="breadcrumb-home"></i>
            <a href="{{ $page->baseUrl }}/" class="breadcrumb-link">首頁</a>
            @foreach ($breadcrumbItems as $item)
                <span class="breadcrumb-sep">/</span>
                @if (!empty($item['path']))
                    <a
                        href="{{ $page->baseUrl }}{{ $item['path'] === '/' ? '/' : rtrim($item['path'], '/') . '/' }}"
                        class="breadcrumb-link"
                    >{{ $item['label'] }}</a>
                @else
                    <span
                        class="breadcrumb-text{{ !empty($item['current']) ? ' is-current' : '' }}{{ !empty($item['uppercase']) ? ' is-uppercase' : '' }}"
                        @if (!empty($item['attr'])) {{ $item['attr'] }} @endif
                    >{{ $item['label'] }}</span>
                @endif
            @endforeach
        </nav>
    @endif
</header>

<div class="app-user-fixed">
    <button type="button" class="size-12 bg-white rounded-2xl shadow-card border border-gray1 inline-flex items-center justify-center text-gray3 hover:text-gray5 transition-colors" aria-label="通知">
        <i data-lucide="bell" class="w-4 h-4"></i>
    </button>

    <button type="button" class="w-auto max-w-[14rem] md:w-56 pl-1.5 pr-3 py-1.5 bg-white rounded-2xl shadow-card border border-gray1 flex items-center gap-3 text-left">
        <span class="size-10 shrink-0 bg-brand2 rounded-xl flex items-center justify-center">
            <i data-lucide="user" class="w-4 h-4 text-white"></i>
        </span>
        <span class="flex-1 min-w-0 flex flex-col items-start gap-0.5">
            <span class="self-stretch text-[14px] font-medium text-gray5 line-clamp-1">{{ $page->partner['company'] }}</span>
            <span class="text-[10px] font-medium tracking-[0.06em] text-gray3" data-role-label>{{ $page->roles[$page->defaultPreviewRole]['label'] ?? $page->partner['role'] }}</span>
        </span>
        <i data-lucide="more-vertical" class="w-4 h-4 text-gray3 shrink-0"></i>
    </button>
</div>
