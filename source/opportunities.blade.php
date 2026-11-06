---
title: 商機中心
---
@extends('_layouts.app')

@php
    $statusLabels = [];
    $statusIcons = [];
    $selectableStatuses = [];
    foreach ($page->opportunityStatuses as $statusOption) {
        $statusLabels[$statusOption['value']] = $statusOption['label'];
        $statusIcons[$statusOption['value']] = $statusOption['icon'];
        // 暫存只由「儲存暫存檔」產生，不放進狀態篩選與狀態變更選單
        if ($statusOption['value'] !== 'draft') {
            $selectableStatuses[] = $statusOption;
        }
    }
    $dealerLabels = $page->opportunityDealerLabels ?? [
        'oem' => '原廠業務',
        'tw' => '台灣經銷商',
        'overseas' => '海外經銷商',
    ];
    $salesNameById = [];
    $partnerById = [];
    foreach ($page->partners ?? [] as $partner) {
        if (empty($partner['id'])) {
            continue;
        }
        $salesNameById[$partner['id']] = $partner['name'] ?? '';
        $partnerById[$partner['id']] = $partner;
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
    $identityLabels = [];
    foreach ($page->partnerIdentityTypes ?? [] as $identityOption) {
        $identityLabels[$identityOption['value']] = $identityOption['label'];
    }
    $levelLabels = [];
    foreach ($page->partnerLevels ?? [] as $levelOption) {
        $levelLabels[$levelOption['value']] = $levelOption['label'];
    }
    $countryLabels = [];
    foreach ($page->registerCountries ?? [] as $country) {
        $countryLabels[$country['value']] = $country['label'];
    }
    $countryFilterOptions = [];
    foreach ($page->opportunities ?? [] as $oppItem) {
        $createdByForCountry = trim((string) ($oppItem['created_by'] ?? ''));
        $countryCode = trim((string) (($partnerById[$createdByForCountry]['country'] ?? '')));
        if ($countryCode !== '') {
            $countryFilterOptions[$countryCode] = $countryLabels[$countryCode] ?? $countryCode;
        }
    }
    asort($countryFilterOptions, SORT_NATURAL);
@endphp

@section('body')
    <div class="page-body">
        <div class="content-wrapper">

            <div class="self-stretch flex flex-col gap-2">
                <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div class="flex items-center gap-2">
                        <label class="search-field search-bar w-56 min-w-0">
                            <i data-lucide="search" class="w-3.5 h-3.5 text-gray3 shrink-0"></i>
                            <span class="sr-only">搜尋案件/客戶</span>
                            <input type="search" name="q" placeholder="搜尋案件/客戶" class="w-full min-w-0 bg-transparent text-cb3 text-gray5 placeholder:text-gray3 outline-none" data-search-input>
                            <button type="button" class="search-clear" data-search-clear hidden aria-label="清除搜尋">
                                <i data-lucide="x" class="w-3.5 h-3.5"></i>
                            </button>
                        </label>

                        <div class="relative" data-opp-filter>
                            <button type="button" class="btn-secondary" data-opp-filter-toggle aria-expanded="false" aria-haspopup="dialog">
                                <i data-lucide="list-filter" class="w-4 h-4"></i>
                                <span>篩選</span>
                            </button>
                            <div class="opp-filter-popover" data-opp-filter-panel hidden role="dialog" aria-label="篩選商機">
                                <label class="flex flex-col gap-1">
                                    <span class="text-[12px] font-medium tracking-[0.04em] text-gray4">狀態</span>
                                    <div class="form-select" data-form-select data-opp-status-filter>
                                        <input type="hidden" value="" data-form-select-value>
                                        <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                                            <span class="is-placeholder" data-form-select-label>全部</span>
                                            <i data-lucide="chevron-down" class="w-4 h-4 text-gray4"></i>
                                        </button>
                                        <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                                            <button type="button" class="form-select-option is-selected" role="option" data-form-select-option data-value="" data-label="全部">全部</button>
                                            @foreach ($selectableStatuses as $option)
                                                <button type="button" class="form-select-option" role="option" data-form-select-option data-value="{{ $option['value'] }}" data-label="{{ $option['label'] }}">{{ $option['label'] }}</button>
                                            @endforeach
                                        </div>
                                    </div>
                                </label>
                                <label class="flex flex-col gap-1">
                                    <span class="text-[12px] font-medium tracking-[0.04em] text-gray4">承接業務</span>
                                    <div class="form-select" data-form-select data-opp-sales-filter>
                                        <input type="hidden" value="" data-form-select-value>
                                        <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                                            <span class="is-placeholder" data-form-select-label>全部</span>
                                            <i data-lucide="chevron-down" class="w-4 h-4 text-gray4"></i>
                                        </button>
                                        <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                                            <button type="button" class="form-select-option is-selected" role="option" data-form-select-option data-value="" data-label="全部">全部</button>
                                            @foreach ($salesFilterNames as $name)
                                                <button type="button" class="form-select-option" role="option" data-form-select-option data-value="{{ $name }}" data-label="{{ $name }}">{{ $name }}</button>
                                            @endforeach
                                        </div>
                                    </div>
                                </label>
                                <label class="flex flex-col gap-1">
                                    <span class="text-[12px] font-medium tracking-[0.04em] text-gray4">身份</span>
                                    <div class="form-select" data-form-select data-opp-dealer-filter>
                                        <input type="hidden" value="" data-form-select-value>
                                        <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                                            <span class="is-placeholder" data-form-select-label>全部</span>
                                            <i data-lucide="chevron-down" class="w-4 h-4 text-gray4"></i>
                                        </button>
                                        <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                                            <button type="button" class="form-select-option is-selected" role="option" data-form-select-option data-value="" data-label="全部">全部</button>
                                            @foreach ($dealerLabels as $value => $label)
                                                <button type="button" class="form-select-option" role="option" data-form-select-option data-value="{{ $value }}" data-label="{{ $label }}">{{ $label }}</button>
                                            @endforeach
                                        </div>
                                    </div>
                                </label>
                                <label class="flex flex-col gap-1">
                                    <span class="text-[12px] font-medium tracking-[0.04em] text-gray4">國家</span>
                                    <div class="form-select" data-form-select data-opp-country-filter>
                                        <input type="hidden" value="" data-form-select-value>
                                        <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                                            <span class="is-placeholder" data-form-select-label>全部</span>
                                            <i data-lucide="chevron-down" class="w-4 h-4 text-gray4"></i>
                                        </button>
                                        <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                                            <button type="button" class="form-select-option is-selected" role="option" data-form-select-option data-value="" data-label="全部">全部</button>
                                            @foreach ($countryFilterOptions as $value => $label)
                                                <button type="button" class="form-select-option" role="option" data-form-select-option data-value="{{ $value }}" data-label="{{ $label }}">{{ $label }}</button>
                                            @endforeach
                                        </div>
                                    </div>
                                </label>
                                <div class="flex flex-col gap-1">
                                    <span class="text-[12px] font-medium tracking-[0.04em] text-gray4">建立日期</span>
                                    <div class="flex items-center gap-1">
                                        <label class="relative min-w-0 flex-1">
                                            <span class="sr-only">建立日期起日</span>
                                            <input type="date" class="form-input form-date opp-filter-date" data-opp-date-from aria-label="建立日期起日">
                                            <i data-lucide="calendar" class="form-date-icon"></i>
                                        </label>
                                        <span class="text-cb3 text-gray3 shrink-0" aria-hidden="true">–</span>
                                        <label class="relative min-w-0 flex-1">
                                            <span class="sr-only">建立日期迄日</span>
                                            <input type="date" class="form-input form-date opp-filter-date" data-opp-date-to aria-label="建立日期迄日">
                                            <i data-lucide="calendar" class="form-date-icon"></i>
                                        </label>
                                    </div>
                                </div>
                                <button type="button" class="btn-secondary self-end" data-opp-clear>清除條件</button>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-2">
                        <button type="button" class="btn-secondary" data-requires="opportunity.notify" data-notify-mailbox-open="opportunity">
                            <i data-lucide="mail" class="w-4 h-4"></i>
                            <span>指定收件信箱</span>
                        </button>
                        <button type="button" class="btn-secondary" data-requires="opportunity.export" data-opportunity-export>匯出 Excel</button>
                        <a href="{{ site_href($page, '/opportunities/create') }}" class="btn-primary" data-requires="opportunity.create">
                            <i data-lucide="plus" class="w-4 h-4"></i>
                            <span>新增商機</span>
                        </a>
                    </div>
                </div>
                <div class="flex flex-wrap items-center gap-2 empty:hidden" data-opp-filter-chips hidden></div>
            </div>

            {{-- ========== 統計卡：進行中 / 審核中 / 即將到期（依可見範圍重算） ========== --}}
            <div class="self-stretch px-6 py-4 bg-white rounded-2xl shadow-card grid grid-cols-2 md:flex md:flex-row md:items-stretch md:gap-7">
                @foreach ($page->opportunityStats as $index => $stat)
                    @php
                        $statKeys = ['active', 'reviewing', 'expiring', 'draft'];
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
                <div class="list-card-body gap-3">
                    <div class="opp-list-scroll self-stretch">
                        <div class="opp-list-fit">

                            {{-- 表頭 --}}
                            <div class="list-head opp-list-cols">
                                <div class="min-w-0 text-cb3 text-gray4">編號</div>
                                <div class="min-w-0 text-cb3 text-gray4">客戶</div>
                                <div class="min-w-0 text-cb3 text-gray4">報備者 / 身份</div>
                                <div class="min-w-0 text-cb3 text-gray4">承接業務</div>
                                <div class="min-w-0 text-cb3 text-gray4">狀態</div>
                                <div class="min-w-0 text-cb3 text-gray4">保護到期日</div>
                                <div class="min-w-0 text-cb3 text-gray4">建立時間</div>
                                <div class="min-w-0 text-cb3 text-gray4 text-right">動作</div>
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
                                        $createdBy = trim((string) ($item['created_by'] ?? ''));
                                        $reporterPartner = $partnerById[$createdBy] ?? null;
                                        if ($createdBy === 'admin') {
                                            $reporterName = '總管理者';
                                            $reporterCompany = '';
                                        } elseif ($reporterPartner) {
                                            $reporterName = trim((string) ($reporterPartner['name'] ?? ''));
                                            $reporterCompany = trim((string) ($reporterPartner['company'] ?? ''));
                                        } elseif ($createdBy !== '') {
                                            $reporterName = $createdBy;
                                            $reporterCompany = '';
                                        } else {
                                            $reporterName = '';
                                            $reporterCompany = '';
                                        }
                                        $reporterLabel = $reporterCompany !== '' && $reporterName !== ''
                                            ? $reporterCompany.'／'.$reporterName
                                            : ($reporterName !== '' ? $reporterName : $reporterCompany);
                                        $partnerIdentity = trim((string) ($reporterPartner['identity'] ?? ''));
                                        $identityName = $identityLabels[$partnerIdentity] ?? '';
                                        $partnerLevel = trim((string) ($reporterPartner['level'] ?? ''));
                                        $isDealerIdentity = in_array($partnerIdentity, ['dealer_tw', 'dealer_overseas'], true);
                                        $levelName = (($reporterPartner['status'] ?? '') === 'approved' && $isDealerIdentity && $partnerLevel !== '')
                                            ? ($levelLabels[$partnerLevel] ?? $partnerLevel)
                                            : '';
                                        $reporterIdentity = $identityName !== ''
                                            ? ($levelName !== '' ? $identityName.'/'.$levelName : $identityName)
                                            : '';
                                        $reporterLine = $reporterName !== '' && $reporterIdentity !== ''
                                            ? $reporterName.' / '.$reporterIdentity
                                            : ($reporterName !== '' ? $reporterName : $reporterIdentity);
                                        $countryCode = trim((string) ($reporterPartner['country'] ?? ''));
                                        $createdRaw = trim((string) ($item['created_at'] ?? ''));
                                        $createdFilterDate = '';
                                        if (preg_match('/^(\d{4})[\/-](\d{2})[\/-](\d{2})(?:[ T](\d{2}):(\d{2}))?/', $createdRaw, $createdMatch)) {
                                            $createdDate = $createdMatch[1].'/'.$createdMatch[2].'/'.$createdMatch[3];
                                            if (($createdMatch[4] ?? '') !== '') {
                                                $createdDate .= ' '.$createdMatch[4].':'.$createdMatch[5];
                                            }
                                            $createdFilterDate = $createdMatch[1].'-'.$createdMatch[2].'-'.$createdMatch[3];
                                        } else {
                                            $createdDate = $createdRaw;
                                        }
                                    @endphp
                                    <div
                                        class="list-row opp-list-cols py-2"
                                        data-opp-row
                                        data-opp-id="{{ $item['id'] }}"
                                        data-dealer="{{ $item['dealer'] }}"
                                        data-country="{{ $countryCode }}"
                                        data-opp-date="{{ $createdFilterDate }}"
                                        data-amount="{{ $item['amountValue'] }}"
                                        data-status="{{ $item['status'] }}"
                                        data-created-by="{{ $item['created_by'] ?? '' }}"
                                        data-oem-sales-id="{{ $item['oem_sales_id'] ?? '' }}"
                                        data-sales-name="{{ $salesName }}"
                                        data-search="{{ $item['id'] }} {{ $item['customer'] }} {{ $dealerLabels[$item['dealer']] ?? '' }} {{ $reporterLabel }} {{ $reporterIdentity }} {{ $salesName }}"
                                    >
                                        <div class="min-w-0 truncate text-eb2 text-gray5 uppercase">{{ $item['id'] }}</div>
                                        <div class="min-w-0 truncate text-cb3 text-gray5" data-opp-customer>{{ $item['customer'] }}</div>
                                        <div class="min-w-0" data-opp-reporter title="{{ $reporterLine }}">
                                            <p class="truncate text-cb3 text-gray5" data-opp-reporter-name>{{ $reporterName !== '' ? $reporterName : '—' }}</p>
                                            @if ($reporterIdentity !== '')
                                                <p class="truncate text-[12px] font-medium tracking-[0.04em] text-gray3" data-opp-reporter-identity>{{ $reporterIdentity }}</p>
                                            @else
                                                <p class="truncate text-[12px] font-medium tracking-[0.04em] text-gray3" data-opp-reporter-identity hidden></p>
                                            @endif
                                        </div>
                                        <div class="min-w-0 truncate text-cb3 text-gray5" data-opp-sales>{{ $salesName !== '' ? $salesName : '—' }}</div>

                                        <div class="min-w-0">
                                            <span class="status-pill status-{{ $currentStatus['value'] }}" data-opp-status>{{ $currentStatus['label'] }}</span>
                                        </div>

                                        <div class="min-w-0 whitespace-nowrap text-eb2 text-gray5 uppercase" data-opp-protection>{{ $item['protection'] }}</div>
                                        <div class="min-w-0 whitespace-nowrap text-eb2 text-gray5" data-opp-created>{{ $createdDate !== '' ? $createdDate : '—' }}</div>

                                        {{-- 編輯｜更多（審核中也用編輯進入詳情／審核頁） --}}
                                        <div class="min-w-0 inline-flex items-center justify-end gap-1" data-opp-actions>
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
                                                title="{{ $item['status'] === 'draft' ? '繼續編輯暫存檔' : ($item['status'] === 'rejected' ? '補件編輯' : ($item['status'] === 'reviewing' ? '檢視／審核商機' : ($item['status'] === 'renewing' ? '檢視／審核續期' : '編輯商機'))) }}"
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

    @include('_components.notify-mailbox-modal', [
        'notifyScope' => 'opportunity',
        'notifyPurpose' => '有新商機送出時，會寄信通知以下信箱。',
    ])

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
            'identityLabels' => $identityLabels,
            'levelLabels' => $levelLabels,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
    </script>
@endsection
