---
title: 教育訓練中心
---
@extends('_layouts.app')

@section('body')
    <div class="page-body">
        <div
            class="content-wrapper"
            data-training-overview
            data-manage="training.manage"
            data-create-url="{{ $page->baseUrl }}/training/create/"
            data-article-url="{{ $page->baseUrl }}/training/article/"
            data-list-url="{{ $page->baseUrl }}/training/"
        >
            <div class="self-stretch flex flex-wrap items-center justify-end gap-2">
                <button type="button" class="btn-secondary shrink-0" data-manage-categories data-requires="training.manage">
                    <i data-lucide="layers" class="w-4 h-4"></i>
                    <span>管理分類</span>
                </button>
                <a href="{{ $page->baseUrl }}/training/create/" class="btn-primary shrink-0" data-requires="training.manage">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    <span>新增文章</span>
                </a>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch" data-training-cards>
                {{-- 由 training-admin.js 依語系與 localStorage 渲染 --}}
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
