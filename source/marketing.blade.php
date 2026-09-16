---
title: 行銷資源中心
---
@extends('_layouts.app')

@php
    $categories = [];
    foreach ($page->marketingTabs as $tab) {
        $categories[] = [
            'value' => $tab['value'],
            'label' => $tab['labels'] ?? $tab['label'],
        ];
    }
@endphp

@section('body')
    <div class="page-body">
        <div
            class="content-wrapper"
            data-resource-catalog
            data-catalog-kind="marketing"
            data-page-size="8"
            data-manage="marketing.manage"
            data-create-url="{{ $page->baseUrl }}/marketing/create/"
        >

            <div class="self-stretch flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div class="inline-flex items-center gap-2 flex-wrap" role="tablist" aria-label="資源分類" data-catalog-tabs>
                    @foreach ($page->marketingTabs as $index => $tab)
                        <button
                            type="button"
                            class="tab {{ $index === 0 ? 'is-active' : '' }}"
                            role="tab"
                            aria-selected="{{ $index === 0 ? 'true' : 'false' }}"
                            data-catalog-tab="{{ $tab['value'] }}"
                        >
                            {{ $tab['label'] }}
                        </button>
                    @endforeach
                </div>

                <div class="flex flex-wrap items-center gap-2 w-full md:w-auto md:justify-end">
                    <button type="button" class="btn-secondary shrink-0 self-start" data-manage-categories data-requires="marketing.manage">
                        <i data-lucide="layers" class="w-4 h-4"></i>
                        <span>管理分類</span>
                    </button>
                    <a href="{{ $page->baseUrl }}/marketing/create/" class="btn-primary shrink-0 self-start" data-requires="marketing.manage">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        <span>新增資源</span>
                    </a>
                </div>
            </div>

            <div class="list-card">
                <div class="list-card-body">
                    <div class="self-stretch overflow-x-auto">
                        <div class="min-w-[800px]">
                            <div class="list-head">
                                <div class="w-32 text-cb3 text-gray4">發布日期</div>
                                <div class="w-36 text-cb3 text-gray4">分類</div>
                                <div class="flex-1 text-cb3 text-gray4">資源名稱</div>
                                <div class="w-20 text-cb3 text-gray4">格式</div>
                                <div class="w-24 text-cb3 text-gray4">附件</div>
                                <div class="w-20 shrink-0" data-requires="marketing.manage"></div>
                            </div>

                            <div class="flex flex-col" data-catalog-rows>
                                @foreach ($page->marketingResources as $item)
                                    @php
                                        $category = $page->marketingCategories[$item['category']] ?? ['label' => $item['category']];
                                        $isDownload = ($item['attachment'] ?? '') === 'download';
                                    @endphp
                                    <div
                                        class="list-row"
                                        data-catalog-row
                                        data-catalog-id="{{ $item['id'] }}"
                                        data-category="{{ $item['category'] }}"
                                        data-search="{{ $item['title'] }} {{ $category['label'] }} {{ $item['format'] }}"
                                        @if ($item['category'] !== 'doc') hidden @endif
                                    >
                                        <div class="w-32 text-eb3 text-gray5 uppercase" data-catalog-date>{{ $item['date'] }}</div>
                                        <div class="w-36">
                                            <span class="text-cb3 text-brand2" data-catalog-category>{{ $category['label'] }}</span>
                                        </div>
                                        <div class="flex-1 pr-4 text-cb3 text-gray5" data-catalog-title>{{ $item['title'] }}</div>
                                        <div class="w-20 text-eb3 text-gray4 uppercase" data-catalog-format>{{ $item['format'] }}</div>
                                        <div class="w-24">
                                            <button type="button" class="w-full px-3 py-2 text-[12px] btn-secondary" data-resource-action="{{ $isDownload ? 'download' : 'link' }}">
                                                @if ($isDownload)
                                                    <i data-lucide="download" class="w-3.5 h-3.5"></i>
                                                    <span>下載</span>
                                                @else
                                                    <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                                                    <span>連結</span>
                                                @endif
                                            </button>
                                        </div>
                                        <div class="w-20 shrink-0 inline-flex items-center justify-end" data-catalog-actions data-requires="marketing.manage">
                                            <a
                                                href="{{ $page->baseUrl }}/marketing/create/?id={{ urlencode($item['id']) }}"
                                                class="icon-action"
                                                data-catalog-edit
                                                aria-label="編輯 {{ $item['title'] }}"
                                                title="編輯"
                                            >
                                                <i data-lucide="square-pen" class="w-4 h-4"></i>
                                            </a>
                                            <button
                                                type="button"
                                                class="icon-action"
                                                data-catalog-delete
                                                aria-label="刪除 {{ $item['title'] }}"
                                                title="刪除"
                                            >
                                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                                            </button>
                                        </div>
                                    </div>
                                @endforeach
                                <div class="list-empty" data-catalog-empty hidden>
                                    沒有符合條件的資源
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="pagination-bar">
                        <p class="text-eb3 text-gray3 uppercase" data-catalog-summary>Showing 1-8 of 8 results</p>
                        <nav class="pagination-nav self-start md:self-auto" aria-label="分頁" data-catalog-pagination>
                            <button type="button" class="pagination-btn" aria-label="上一頁">
                                <i data-lucide="chevron-left" class="w-4 h-4 text-gray4"></i>
                            </button>
                            <button type="button" class="pagination-btn is-active">1</button>
                            <button type="button" class="pagination-btn border-r-0" aria-label="下一頁">
                                <i data-lucide="chevron-right" class="w-4 h-4 text-gray4"></i>
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <template data-catalog-row-template>
        <div class="list-row" data-catalog-row data-catalog-id="" data-category="" data-search="">
            <div class="w-32 text-eb3 text-gray5 uppercase" data-catalog-date></div>
            <div class="w-36">
                <span class="text-cb3 text-brand2" data-catalog-category></span>
            </div>
            <div class="flex-1 pr-4 text-cb3 text-gray5" data-catalog-title></div>
            <div class="w-20 text-eb3 text-gray4 uppercase" data-catalog-format></div>
            <div class="w-24">
                <button type="button" class="w-full px-3 py-2 text-[12px] btn-secondary" data-resource-action="download">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i>
                    <span>下載</span>
                </button>
            </div>
            <div class="w-20 shrink-0 inline-flex items-center justify-end" data-catalog-actions data-requires="marketing.manage">
                <a href="#" class="icon-action" data-catalog-edit aria-label="編輯" title="編輯">
                    <i data-lucide="square-pen" class="w-4 h-4"></i>
                </a>
                <button type="button" class="icon-action" data-catalog-delete aria-label="刪除" title="刪除">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    </template>

    <script type="application/json" id="marketing-catalog-data">
        {!! json_encode([
            'kind' => 'marketing',
            'capability' => 'marketing.manage',
            'createUrl' => rtrim($page->baseUrl, '/') . '/marketing/create/',
            'listUrl' => rtrim($page->baseUrl, '/') . '/marketing/',
            'categories' => $categories,
            'items' => $page->marketingResources,
            'formats' => $page->marketingFormats ?? ['PDF', 'PPTX', 'XLSX', 'ZIP'],
            'locales' => $page->locales,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
    </script>
@endsection
