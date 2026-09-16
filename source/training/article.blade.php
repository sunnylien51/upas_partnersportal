---
title: 教育訓練中心
---
@extends('_layouts.app')

@section('body')
    <div class="page-body">
        <div
            class="content-wrapper"
            data-training-center
            data-manage="training.manage"
            data-create-url="{{ $page->baseUrl }}/training/create/"
            data-article-url="{{ $page->baseUrl }}/training/article/"
            data-list-url="{{ $page->baseUrl }}/training/"
        >
            <div class="self-stretch inline-flex flex-wrap items-center justify-end gap-2">
                <button type="button" class="btn-secondary shrink-0" data-manage-categories data-requires="training.manage">
                    <i data-lucide="layers" class="w-4 h-4"></i>
                    <span>管理分類</span>
                </button>
                <a href="{{ $page->baseUrl }}/training/create/" class="btn-primary shrink-0" data-requires="training.manage">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    <span>新增文章</span>
                </a>
                <a href="{{ $page->baseUrl }}/training/" class="btn-secondary shrink-0">返回總覽</a>
            </div>

            <div class="self-stretch flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                <aside class="w-full lg:w-64 shrink-0 lg:sticky lg:top-6">
                    <button
                        type="button"
                        class="w-full px-4 py-3 bg-white rounded-2xl shadow-[0px_0px_40px_0px_rgba(0,0,0,0.04)] inline-flex items-center gap-2.5 text-left text-cb2 text-gray5 lg:hidden"
                        data-training-mobile-toggle
                        aria-expanded="false"
                        aria-controls="training-tree-panel"
                    >
                        <i data-lucide="list-tree" class="w-4 h-4 text-gray4 shrink-0"></i>
                        <span class="flex-1 min-w-0 truncate" data-training-mobile-label>文章目錄</span>
                        <i data-lucide="chevron-down" class="w-4 h-4 text-gray3 shrink-0"></i>
                    </button>

                    <nav id="training-tree-panel" class="training-tree-panel" data-training-tree-panel aria-label="文章目錄">
                        <ul class="training-tree" data-training-tree></ul>
                    </nav>
                </aside>

                <div class="flex-1 min-w-0 w-full" data-training-article>
                    <div class="bg-white rounded-2xl shadow-card overflow-hidden flex flex-col min-w-0" data-training-panels></div>
                </div>
            </div>
        </div>
    </div>

    <script type="application/json" id="training-catalog-data">
        {!! json_encode([
            'capability' => 'training.manage',
            'createUrl' => $page->baseUrl . '/training/create/',
            'articleUrl' => $page->baseUrl . '/training/article/',
            'listUrl' => $page->baseUrl . '/training/',
            'locales' => $page->locales,
            'courses' => $page->trainingCourses,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
    </script>
@endsection
