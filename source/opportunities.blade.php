---
title: 商機中心
---
@extends('_layouts.app')

@php
    $statusLabels = [];
    $statusIcons = [];
    foreach ($page->opportunityStatuses as $statusOption) {
        $statusLabels[$statusOption['value']] = $statusOption['label'];
        $statusIcons[$statusOption['value']] = $statusOption['icon'];
    }
    $dealerLabels = $page->opportunityDealerLabels ?? [
        'oem' => '原廠業務',
        'tw' => '台灣經銷商',
        'overseas' => '海外經銷商',
    ];
    $salesNameById = [];
    foreach ($page->partners ?? [] as $partner) {
        if (!empty($partner['id'])) {
            $salesNameById[$partner['id']] = $partner['name'] ?? '';
        }
    }
    // 承接業務以商機 oem_sales_id 為準（與 opportunity-flow.js opportunitySalesName 一致）
    $salesNameByOpportunity = [];
    $salesFilterNames = [];
    foreach ($page->opportunities ?? [] as $oppItem) {
        $salesId = trim((string) ($oppItem['oem_sales_id'] ?? ''));
        if ($salesId !== '') {
            $name = trim((string) ($salesNameById[$salesId] ?? $salesId));
        } else {
            $name = ($oppItem['status'] ?? '') === 'draft' ? '' : '待指派';
        }
        $salesNameByOpportunity[$oppItem['id']] = $name;
        if ($name !== '') {
            $salesFilterNames[$name] = $name;
        }
    }
    $salesFilterNames = array_values($salesFilterNames);
    sort($salesFilterNames, SORT_NATURAL);
@endphp

@section('body')
    <div class="page-body">
        <div class="content-wrapper">

            {{-- ========== 工具列：搜尋、狀態下拉｜匯出、新增商機 ========== --}}
            <div class="self-stretch flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                {{-- 左側：搜尋 + 狀態、承接業務下拉 --}}
                <div class="flex flex-wrap items-center gap-2 min-w-0">
                    <label class="search-field search-bar w-56">
                        <i data-lucide="search" class="w-3.5 h-3.5 text-gray3 shrink-0"></i>
                        <span class="sr-only">搜尋案件/客戶</span>
                        <input type="search" name="q" placeholder="搜尋案件/客戶" class="w-full min-w-0 bg-transparent text-cb3 text-gray5 placeholder:text-gray3 outline-none" data-search-input>
                        <button type="button" class="search-clear" data-search-clear hidden aria-label="清除搜尋">
                            <i data-lucide="x" class="w-3.5 h-3.5"></i>
                        </button>
                    </label>

                    <div class="form-select w-44 shrink-0" data-form-select data-opp-status-filter>
                        <input type="hidden" value="" data-form-select-value>
                        <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                            <span class="is-placeholder" data-form-select-label>狀態</span>
                            <i data-lucide="chevron-down" class="w-4 h-4 text-gray4"></i>
                        </button>
                        <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                            <button type="button" class="form-select-option is-selected" role="option" data-form-select-option data-value="" data-label="狀態">全部</button>
                            @foreach ($page->opportunityStatuses as $option)
                                <button type="button" class="form-select-option" role="option" data-form-select-option data-value="{{ $option['value'] }}" data-label="{{ $option['label'] }}">{{ $option['label'] }}</button>
                            @endforeach
                        </div>
                    </div>

                    <div class="form-select w-44 shrink-0" data-form-select data-opp-sales-filter>
                        <input type="hidden" value="" data-form-select-value>
                        <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                            <span class="is-placeholder" data-form-select-label>承接業務</span>
                            <i data-lucide="chevron-down" class="w-4 h-4 text-gray4"></i>
                        </button>
                        <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                            <button type="button" class="form-select-option is-selected" role="option" data-form-select-option data-value="" data-label="承接業務">全部</button>
                            @foreach ($salesFilterNames as $name)
                                <button type="button" class="form-select-option" role="option" data-form-select-option data-value="{{ $name }}" data-label="{{ $name }}">{{ $name }}</button>
                            @endforeach
                        </div>
                    </div>
                </div>

                {{-- 右側：匯出 Excel、新增商機（僅總管理者） --}}
                <div class="flex flex-wrap items-center gap-2">
                    <button type="button" class="btn-secondary" data-requires="opportunity.export" data-opportunity-export>匯出 Excel</button>
                    <a href="{{ site_href($page, '/opportunities/create') }}" class="btn-primary" data-requires="opportunity.create">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        <span>新增商機</span>
                    </a>
                </div>
            </div>

            {{-- ========== 統計卡：進行中 / 審核中 / 即將到期（依可見範圍重算） ========== --}}
            <div class="self-stretch px-6 py-4 bg-white rounded-2xl shadow-card grid grid-cols-2 md:flex md:flex-row md:items-stretch md:gap-7">
                @foreach ($page->opportunityStats as $index => $stat)
                    @php
                        $statKeys = ['active', 'reviewing', 'draft', 'expiring'];
                        $statKey = $statKeys[$index] ?? 'active';
                        $mobileFrame = [
                            0 => 'pr-4 pb-4 border-r border-b border-gray1',
                            1 => 'pl-4 pb-4 border-b border-gray1',
                            2 => 'pr-4 pt-4 border-r border-gray1',
                            3 => 'pl-4 pt-4',
                        ][$index] ?? '';
                    @endphp
                    @if ($index > 0)
                        <div class="hidden md:block w-px self-stretch bg-gray1 shrink-0" aria-hidden="true"></div>
                    @endif
                    <div class="flex-1 flex flex-col items-start gap-2 md:border-0 md:p-0 {{ $mobileFrame }}" data-opp-stat="{{ $statKey }}">
                        <p class="text-cb3 text-gray4">{{ $stat['label'] }}</p>
                        <div class="self-stretch inline-flex justify-end items-baseline gap-1">
                            <span class="font-en font-semibold text-[48px] leading-none tracking-[3px] @if ($stat['tone'] === 'warning') text-brand2 @elseif ($stat['tone'] === 'danger') text-red @else text-gray5 @endif" data-opp-stat-count>{{ $stat['count'] }}</span>
                            <span class="text-cb3 @if ($stat['tone'] === 'warning') text-brand2 @elseif ($stat['tone'] === 'danger') text-red @else text-gray5 @endif">筆</span>
                        </div>
                    </div>
                @endforeach
            </div>

            {{-- ========== 商機列表卡：表頭 + 列資料 + 分頁 ========== --}}
            <div class="list-card">
                <div class="list-card-body">
                    <div class="self-stretch overflow-x-auto">
                        <div class="min-w-[920px]">

                            {{-- 表頭 --}}
                            <div class="list-head">
                                <div class="w-36 text-cb3 text-gray4">編號</div>
                                <div class="flex-1 text-cb3 text-gray4">客戶</div>
                                <div class="w-32 text-cb3 text-gray4">身份</div>
                                <div class="w-28 text-cb3 text-gray4">承接業務</div>
                                <div class="w-40 text-cb3 text-gray4">狀態</div>
                                <div class="w-28 text-cb3 text-gray4">保護期</div>
                                <div class="w-32 text-cb3 text-gray4 text-right pr-1">動作</div>
                            </div>

                            {{-- 資料列（資料：config opportunities；狀態選項：config opportunityStatuses） --}}
                            <div class="flex flex-col">
                                @foreach ($page->opportunities as $item)
                                    @php
                                        $currentStatus = $page->opportunityStatuses[0];
                                        foreach ($page->opportunityStatuses as $statusOption) {
                                            if ($statusOption['value'] === $item['status']) {
                                                $currentStatus = $statusOption;
                                                break;
                                            }
                                        }
                                        $salesName = $salesNameByOpportunity[$item['id']] ?? '';
                                    @endphp
                                    <div
                                        class="list-row py-2"
                                        data-opp-row
                                        data-opp-id="{{ $item['id'] }}"
                                        data-dealer="{{ $item['dealer'] }}"
                                        data-amount="{{ $item['amountValue'] }}"
                                        data-status="{{ $item['status'] }}"
                                        data-created-by="{{ $item['created_by'] ?? '' }}"
                                        data-oem-sales-id="{{ $item['oem_sales_id'] ?? '' }}"
                                        data-sales-name="{{ $salesName }}"
                                        data-search="{{ $item['id'] }} {{ $item['customer'] }} {{ $dealerLabels[$item['dealer']] ?? '' }} {{ $salesName }}"
                                    >
                                        <div class="w-36 text-eb2 text-gray5 uppercase">{{ $item['id'] }}</div>
                                        <div class="flex-1 text-cb3 text-gray5" data-opp-customer>{{ $item['customer'] }}</div>
                                        <div class="w-32 shrink-0 text-cb3 text-gray5" data-opp-dealer>{{ $dealerLabels[$item['dealer']] ?? '—' }}</div>
                                        <div class="w-28 shrink-0 text-cb3 text-gray5 truncate" data-opp-sales>{{ $salesName !== '' ? $salesName : '—' }}</div>

                                        {{-- 狀態：同一元件；一般使用者加 is-readonly（見 main.js） --}}
                                        <div class="w-40 shrink-0 flex items-center">
                                            <div class="status-select" data-status-select>
                                                <button type="button" class="status-trigger status-{{ $currentStatus['value'] }}" data-status-trigger aria-haspopup="listbox" aria-expanded="false">
                                                    <span class="status-trigger-main">
                                                        <i data-lucide="{{ $currentStatus['icon'] }}" class="status-trigger-icon" data-status-icon></i>
                                                        <span class="truncate" data-status-label>{{ $currentStatus['label'] }}</span>
                                                    </span>
                                                    <i data-lucide="chevron-down" class="status-trigger-caret"></i>
                                                </button>

                                                <div class="status-menu" data-status-menu hidden role="listbox">
                                                    @foreach ($page->opportunityStatuses as $status)
                                                        <button
                                                            type="button"
                                                            role="option"
                                                            class="status-option status-{{ $status['value'] }} {{ $status['value'] === $currentStatus['value'] ? 'is-selected' : '' }}"
                                                            data-status-option
                                                            data-value="{{ $status['value'] }}"
                                                            data-label="{{ $status['label'] }}"
                                                            data-icon="{{ $status['icon'] }}"
                                                            aria-selected="{{ $status['value'] === $currentStatus['value'] ? 'true' : 'false' }}"
                                                        >
                                                            <span class="status-option-main">
                                                                <i data-lucide="{{ $status['icon'] }}" class="status-option-icon"></i>
                                                                <span>{{ $status['label'] }}</span>
                                                            </span>
                                                            <i data-lucide="check" class="status-option-check"></i>
                                                        </button>
                                                    @endforeach
                                                </div>
                                            </div>
                                        </div>

                                        <div class="w-28 shrink-0 text-eb2 text-gray5 uppercase" data-opp-protection>{{ $item['protection'] }}</div>

                                        {{-- 編輯｜更多（審核中也用編輯進入詳情／審核頁） --}}
                                        <div class="w-32 shrink-0 inline-flex items-center justify-end gap-1" data-opp-actions>
                                            <a
                                                href="{{ $item['status'] === 'draft'
                                                    ? site_href($page, '/opportunities/create') . '?draft=' . urlencode($item['id'])
                                                    : ($item['status'] === 'rejected'
                                                        ? site_href($page, '/opportunities/create') . '?id=' . urlencode($item['id'])
                                                        : site_href($page, '/opportunities/review') . '?id=' . urlencode($item['id'])) }}"
                                                class="icon-action"
                                                data-opp-edit-action
                                                @if ($item['status'] === 'draft') data-requires="opportunity.create" @endif
                                                aria-label="{{ $item['status'] === 'draft' ? '繼續編輯' : ($item['status'] === 'rejected' ? '補件編輯' : '編輯') }} {{ $item['id'] }}"
                                                title="{{ $item['status'] === 'draft' ? '繼續編輯暫存檔' : ($item['status'] === 'rejected' ? '補件編輯' : ($item['status'] === 'reviewing' ? '檢視／審核商機' : '編輯商機')) }}"
                                            >
                                                <i data-lucide="square-pen" class="w-4 h-4"></i>
                                            </a>

                                            <div class="row-more" data-row-more>
                                                <button
                                                    type="button"
                                                    class="icon-action"
                                                    data-row-more-trigger
                                                    aria-haspopup="menu"
                                                    aria-expanded="false"
                                                    aria-label="更多 {{ $item['id'] }}"
                                                >
                                                    <i data-lucide="more-vertical" class="w-4 h-4"></i>
                                                </button>
                                                <div class="row-more-menu" data-row-more-menu hidden role="menu">
                                                    {{-- 選項由 main.js 依狀態產生 --}}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                @endforeach
                                <div class="list-empty" data-filter-empty hidden>
                                    沒有符合條件的商機
                                </div>
                            </div>
                        </div>
                    </div>

                    {{-- 分頁（目前為示意 UI，資料：config opportunityPagination） --}}
                    <div class="pagination-bar">
                        <p class="text-eb3 text-gray3 uppercase">{{ $page->opportunityPagination['summary'] }}</p>

                        <nav class="pagination-nav self-start md:self-auto" aria-label="分頁">
                            <button type="button" class="pagination-btn" aria-label="上一頁">
                                <i data-lucide="chevron-left" class="w-4 h-4 text-gray4"></i>
                            </button>
                            @foreach ($page->opportunityPagination['pages'] as $pageNum)
                                @if ($pageNum === '...')
                                    <span class="pagination-btn text-gray3 pointer-events-none">...</span>
                                @else
                                    <button type="button" class="pagination-btn {{ (int) $pageNum === (int) $page->opportunityPagination['current'] ? 'is-active' : 'text-gray3' }}">{{ $pageNum }}</button>
                                @endif
                            @endforeach
                            <button type="button" class="pagination-btn border-r-0" aria-label="下一頁">
                                <i data-lucide="chevron-right" class="w-4 h-4 text-gray4"></i>
                            </button>
                        </nav>
                    </div>
                </div>
            </div>

        </div>
    </div>

    <script type="application/json" id="opportunity-catalog-data">
        {!! json_encode($page->opportunityCatalog ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
    </script>
    <script type="application/json" id="opportunity-list-meta">
        {!! json_encode([
            'reviewUrl' => site_href($page, '/opportunities/review'),
            'createUrl' => site_href($page, '/opportunities/create'),
            'renewUrl' => site_href($page, '/opportunities/renew'),
            'partner' => $page->partner,
            'statusLabels' => $statusLabels,
            'statusIcons' => $statusIcons,
            'dealerLabels' => $dealerLabels,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
    </script>
@endsection
