---
title: 產品資訊中心
---
@extends('_layouts.app')

@section('body')
    <div class="flex-1 flex flex-col px-4 md:px-12">
        <div class="content-wrapper" data-resource-catalog data-page-size="8">

            {{-- ========== 分類分頁 + 搜尋：新產品公告 / EOL / EOS / 版本更新 ========== --}}
            <div class="self-stretch flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div class="inline-flex items-center gap-2 flex-wrap" role="tablist" aria-label="公告分類">
                    @foreach ($page->productTabs as $index => $tab)
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

                <label class="search-field w-full md:w-56 shrink-0 px-3 py-2.5 bg-white rounded-[10px] border border-gray1 inline-flex items-center gap-2">
                    <i data-lucide="search" class="w-3.5 h-3.5 text-gray3 shrink-0"></i>
                    <span class="sr-only">搜尋公告主題</span>
                    <input type="search" placeholder="搜尋公告主題" class="w-full min-w-0 bg-transparent text-cb3 text-gray5 placeholder:text-gray3 outline-none" data-catalog-search>
                    <button type="button" class="search-clear" data-search-clear hidden aria-label="清除搜尋">
                        <i data-lucide="x" class="w-3.5 h-3.5"></i>
                    </button>
                </label>
            </div>

            {{-- ========== 公告列表卡：表頭 + 列資料 + 分頁 ========== --}}
            <div class="self-stretch bg-white rounded-2xl shadow-card flex flex-col">
                <div class="self-stretch px-3 pt-3 pb-6 flex flex-col">
                    <div class="self-stretch overflow-x-auto">
                        <div class="min-w-[640px]">

                            {{-- 表頭 --}}
                            <div class="px-4 py-3 bg-bg rounded-t-[10px] inline-flex w-full items-center">
                                <div class="w-32 text-cb3 text-gray4">發布日期</div>
                                <div class="w-28 text-cb3 text-gray4">分類</div>
                                <div class="flex-1 text-cb3 text-gray4">公告主題</div>
                                <div class="w-24 text-cb3 text-gray4">附件</div>
                            </div>

                            {{-- 資料列（資料：config productAnnouncements） --}}
                            <div class="flex flex-col">
                                @foreach ($page->productAnnouncements as $item)
                                    @php
                                        $category = $page->productCategories[$item['category']] ?? ['label' => $item['category'], 'class' => 'text-brand2'];
                                        $isDownload = ($item['attachment'] ?? '') === 'download';
                                    @endphp
                                    <div
                                        class="px-4 py-3 bg-white border-b border-gray1 inline-flex w-full items-center"
                                        data-catalog-row
                                        data-category="{{ $item['category'] }}"
                                        data-search="{{ $item['title'] }} {{ $category['label'] }}"
                                        @if ($item['category'] !== 'new') hidden @endif
                                    >
                                        <div class="w-32 text-eb3 text-gray5 uppercase">{{ $item['date'] }}</div>
                                        <div class="w-28">
                                            <span class="text-cb3 {{ $category['class'] }}">{{ $category['label'] }}</span>
                                        </div>
                                        <div class="flex-1 pr-4 text-cb3 text-gray5">{{ $item['title'] }}</div>
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
                                    </div>
                                @endforeach
                                <div class="px-4 py-10 text-center text-cb3 text-gray3" data-catalog-empty hidden>
                                    沒有符合條件的公告
                                </div>
                            </div>
                        </div>
                    </div>

                    {{-- 分頁 --}}
                    <div class="self-stretch px-4 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <p class="text-eb3 text-gray3 uppercase" data-catalog-summary>{{ $page->productPagination['summary'] }}</p>

                        <nav class="bg-white rounded-md border border-gray1 inline-flex items-center overflow-hidden self-start sm:self-auto" aria-label="分頁" data-catalog-pagination>
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
@endsection
