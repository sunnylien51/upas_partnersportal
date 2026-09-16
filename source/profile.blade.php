---
title: 夥伴管理
---
@extends('_layouts.app')

@php
    $statusMap = [];
    $statusLabels = [];
    foreach ($page->partnerStatuses as $option) {
        $statusMap[$option['value']] = $option;
        $statusLabels[$option['value']] = $option['label'];
    }

    $levelLabels = [];
    foreach ($page->partnerLevels ?? [] as $option) {
        $levelLabels[$option['value']] = $option['label'];
    }

    $identityLabels = [];
    foreach ($page->partnerIdentityTypes ?? [] as $option) {
        $identityLabels[$option['value']] = $option['label'];
    }

    $identityFilters = $page->partnerIdentityFilters ?? [
        ['value' => 'oem', 'label' => '原廠業務', 'identities' => ['oem_manager', 'oem_sales']],
        ['value' => 'dealer_overseas', 'label' => '海外經銷商', 'identities' => ['dealer_overseas']],
        ['value' => 'dealer_tw', 'label' => '國內經銷商', 'identities' => ['dealer_tw']],
    ];

    $countryLabels = [];
    foreach ($page->registerCountries as $country) {
        $countryLabels[$country['value']] = $country['label'];
    }

    $partners = $page->partners ?? [];
    $statusCounts = [
        'all' => count($partners),
        'reviewing' => 0,
        'approved' => 0,
        'rejected' => 0,
    ];
    foreach ($partners as $item) {
        if (isset($statusCounts[$item['status']])) {
            $statusCounts[$item['status']] += 1;
        }
    }

    $partnerStats = [
        ['key' => 'all', 'label' => '全部夥伴', 'count' => $statusCounts['all'], 'tone' => 'default'],
        ['key' => 'reviewing', 'label' => '審核中', 'count' => $statusCounts['reviewing'], 'tone' => 'warning'],
        ['key' => 'approved', 'label' => '已核准', 'count' => $statusCounts['approved'], 'tone' => 'default'],
        ['key' => 'rejected', 'label' => '已退回', 'count' => $statusCounts['rejected'], 'tone' => 'danger'],
    ];

    $isDealerIdentity = function ($identity) {
        return in_array($identity, ['dealer_tw', 'dealer_overseas'], true);
    };

    $oemSalesListDisplay = function ($item) use ($isDealerIdentity, $partners) {
        $requested = trim((string) ($item['oem_sales'] ?? ''));
        $boundId = trim((string) ($item['oem_sales_id'] ?? ''));
        $status = $item['status'] ?? '';
        $identity = $item['identity'] ?? '';

        if ($status === 'approved' && $isDealerIdentity($identity) && $boundId !== '') {
            foreach ($partners as $candidate) {
                if (($candidate['id'] ?? '') === $boundId) {
                    return $candidate['name'] ?? ($requested !== '' ? $requested : $boundId);
                }
            }
            return $requested !== '' ? $requested : $boundId;
        }

        if ($requested !== '') {
            return '申請：' . $requested;
        }

        return '—';
    };
@endphp

@section('body')
    <div class="page-body">
        <div
            class="content-wrapper"
            data-partner-list
            data-page-size="8"
            data-edit-url="{{ $page->baseUrl }}/profile/edit/"
        >

            <div class="self-stretch flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div class="flex flex-col md:flex-row md:items-center gap-2 min-w-0">
                    <label class="search-field search-bar w-full md:w-56">
                        <i data-lucide="search" class="w-3.5 h-3.5 text-gray3 shrink-0"></i>
                        <span class="sr-only">搜尋編號、公司或聯絡人</span>
                        <input type="search" name="q" placeholder="搜尋編號、公司或聯絡人" class="w-full min-w-0 bg-transparent text-cb3 text-gray5 placeholder:text-gray3 outline-none" data-partner-search>
                        <button type="button" class="search-clear" data-search-clear hidden aria-label="清除搜尋">
                            <i data-lucide="x" class="w-3.5 h-3.5"></i>
                        </button>
                    </label>

                    <div class="form-select w-full md:w-44" data-form-select data-partner-filter="status">
                        <input type="hidden" value="" data-form-select-value>
                        <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                            <span class="is-placeholder" data-form-select-label>申請狀態</span>
                            <i data-lucide="chevron-down" class="w-4 h-4 text-gray4"></i>
                        </button>
                        <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                            <button type="button" class="form-select-option is-selected" role="option" data-form-select-option data-value="" data-label="申請狀態">全部</button>
                            @foreach ($page->partnerStatuses as $option)
                                <button type="button" class="form-select-option" role="option" data-form-select-option data-value="{{ $option['value'] }}" data-label="{{ $option['label'] }}">{{ $option['label'] }}</button>
                            @endforeach
                        </div>
                    </div>

                    <div class="form-select w-full md:w-44" data-form-select data-partner-filter="identity">
                        <input type="hidden" value="" data-form-select-value>
                        <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                            <span class="is-placeholder" data-form-select-label>身分權限</span>
                            <i data-lucide="chevron-down" class="w-4 h-4 text-gray4"></i>
                        </button>
                        <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                            <button type="button" class="form-select-option is-selected" role="option" data-form-select-option data-value="" data-label="身分權限">全部</button>
                            @foreach ($identityFilters as $option)
                                <button type="button" class="form-select-option" role="option" data-form-select-option data-value="{{ $option['value'] }}" data-label="{{ $option['label'] }}">{{ $option['label'] }}</button>
                            @endforeach
                        </div>
                    </div>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                    <a href="{{ $page->baseUrl }}/profile/create/" class="btn-primary" data-requires="profile.manage">新增帳號</a>
                    <button type="button" class="btn-secondary" data-requires="profile.manage" data-partner-export>匯出 Excel</button>
                </div>
            </div>

            <div class="self-stretch px-6 py-4 bg-white rounded-2xl shadow-card flex flex-col md:flex-row md:items-stretch gap-4 md:gap-7">
                @foreach ($partnerStats as $index => $stat)
                    @if ($index > 0)
                        <div class="hidden md:block w-px self-stretch bg-gray1 shrink-0" aria-hidden="true"></div>
                        <div class="md:hidden h-px w-full bg-gray1" aria-hidden="true"></div>
                    @endif
                    <div class="flex-1 flex flex-col items-start gap-2" data-partner-stat="{{ $stat['key'] }}">
                        <p class="text-cb3 text-gray4">{{ $stat['label'] }}</p>
                        <div class="self-stretch inline-flex justify-end items-baseline gap-1">
                            <span class="font-en font-semibold text-[48px] leading-none tracking-[3px] @if ($stat['tone'] === 'warning') text-brand2 @elseif ($stat['tone'] === 'danger') text-red @else text-gray5 @endif" data-partner-stat-count>{{ $stat['count'] }}</span>
                            <span class="text-cb3 @if ($stat['tone'] === 'warning') text-brand2 @elseif ($stat['tone'] === 'danger') text-red @else text-gray5 @endif">家</span>
                        </div>
                    </div>
                @endforeach
            </div>

            <div class="list-card">
                <div class="list-card-body">
                    <div class="self-stretch overflow-x-auto">
                        <div class="min-w-[980px]">
                            <div class="list-head">
                                <div class="flex-[1.3] min-w-[12rem] text-cb3 text-gray4">公司資料</div>
                                <div class="w-36 text-cb3 text-gray4">身分權限</div>
                                <div class="w-28 text-cb3 text-gray4">原廠業務</div>
                                <div class="flex-1 min-w-[10rem] text-cb3 text-gray4">申請人</div>
                                <div class="flex-[1.2] min-w-[12rem] text-cb3 text-gray4">聯絡方式</div>
                                <div class="w-20 text-cb3 text-gray4">狀態</div>
                                <div class="w-20 shrink-0"></div>
                            </div>

                            <div class="flex flex-col">
                                @foreach ($partners as $item)
                                    @php
                                        $status = $statusMap[$item['status']] ?? ['value' => $item['status'], 'label' => $item['status']];
                                        $countryLabel = $countryLabels[$item['country']] ?? $item['country'];
                                        $identity = $item['identity'] ?? '';
                                        $level = $item['level'] ?? '';
                                        $levelLabel = ($item['status'] === 'approved' && $isDealerIdentity($identity) && $level)
                                            ? ($levelLabels[$level] ?? $level)
                                            : '';
                                        $identityLabel = $identityLabels[$identity] ?? '';
                                        $identityDisplay = $identityLabel !== ''
                                            ? ($levelLabel !== '' ? $identityLabel . '/' . $levelLabel : $identityLabel)
                                            : '—';
                                        $oemSalesDisplay = $oemSalesListDisplay($item);
                                    @endphp
                                    <div
                                        class="list-row list-row-link py-3"
                                        data-partner-row
                                        data-partner-id="{{ $item['id'] }}"
                                        data-edit-href="{{ $page->baseUrl }}/profile/edit/?id={{ urlencode($item['id']) }}"
                                        data-status="{{ $item['status'] }}"
                                        data-country="{{ $item['country'] }}"
                                        data-identity="{{ $identity }}"
                                        data-level="{{ $level }}"
                                        data-applied-at="{{ $item['applied_at'] ?? '' }}"
                                        data-search="{{ $item['id'] }} {{ $item['company'] }} {{ $item['tax_id'] }} {{ $countryLabel }} {{ $item['oem_sales'] }} {{ $item['name'] }} {{ $item['email'] }} {{ $item['phone'] }} {{ $item['job_title'] }} {{ $identityDisplay }}"
                                    >
                                        <div class="flex-[1.3] min-w-[12rem] pr-4">
                                            <p class="text-cb3 text-gray5" data-partner-company>{{ $item['company'] }}</p>
                                            <p class="text-[12px] font-en font-medium uppercase tracking-[0.06em] text-gray3" data-partner-member-id>{{ $item['id'] }}</p>
                                        </div>
                                        <div class="w-36 shrink-0 text-cb3 text-gray5" data-partner-identity>{{ $identityDisplay }}</div>
                                        <div class="w-28 shrink-0 text-cb3 text-gray5" data-partner-oem-sales>{{ $oemSalesDisplay }}</div>
                                        <div class="flex-1 min-w-[10rem] pr-4">
                                            <p class="text-cb3 text-gray5" data-partner-name>{{ $item['name'] }}</p>
                                            <p class="text-[12px] font-medium tracking-[0.04em] text-gray3" data-partner-title>{{ $item['job_title'] }}</p>
                                        </div>
                                        <div class="flex-[1.2] min-w-[12rem] pr-4">
                                            <p class="text-eb2 text-gray5 break-all" data-partner-email>{{ $item['email'] }}</p>
                                            <p class="text-[12px] font-medium tracking-[0.04em] text-gray3" data-partner-phone>{{ $item['phone'] }}</p>
                                        </div>
                                        <div class="w-20 shrink-0">
                                            <span class="status-pill status-{{ $status['value'] }}" data-partner-status>{{ $status['label'] }}</span>
                                        </div>
                                        <div class="w-20 shrink-0 inline-flex items-center justify-end" data-partner-actions>
                                            <a
                                                href="{{ $page->baseUrl }}/profile/edit/?id={{ urlencode($item['id']) }}"
                                                class="icon-action"
                                                data-requires="profile.manage"
                                                aria-label="編輯 {{ $item['company'] }}"
                                                title="編輯"
                                            >
                                                <i data-lucide="square-pen" class="w-4 h-4"></i>
                                            </a>
                                            <button
                                                type="button"
                                                class="icon-action"
                                                data-partner-delete
                                                data-requires="profile.manage"
                                                aria-label="刪除 {{ $item['company'] }}"
                                                title="刪除"
                                            >
                                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                                            </button>
                                        </div>
                                    </div>
                                @endforeach
                                <div
                                    class="list-row list-row-link py-3"
                                    data-partner-row-template
                                    hidden
                                    data-partner-id=""
                                    data-edit-href=""
                                    data-status=""
                                    data-country=""
                                    data-identity=""
                                    data-level=""
                                    data-search=""
                                >
                                    <div class="flex-[1.3] min-w-[12rem] pr-4">
                                        <p class="text-cb3 text-gray5" data-partner-company>—</p>
                                        <p class="text-[12px] font-en font-medium uppercase tracking-[0.06em] text-gray3" data-partner-member-id>—</p>
                                    </div>
                                    <div class="w-36 shrink-0 text-cb3 text-gray5" data-partner-identity>—</div>
                                    <div class="w-28 shrink-0 text-cb3 text-gray5" data-partner-oem-sales>—</div>
                                    <div class="flex-1 min-w-[10rem] pr-4">
                                        <p class="text-cb3 text-gray5" data-partner-name>—</p>
                                        <p class="text-[12px] font-medium tracking-[0.04em] text-gray3" data-partner-title>—</p>
                                    </div>
                                    <div class="flex-[1.2] min-w-[12rem] pr-4">
                                        <p class="text-eb2 text-gray5 break-all" data-partner-email>—</p>
                                        <p class="text-[12px] font-medium tracking-[0.04em] text-gray3" data-partner-phone>—</p>
                                    </div>
                                    <div class="w-20 shrink-0">
                                        <span class="status-pill" data-partner-status>—</span>
                                    </div>
                                    <div class="w-20 shrink-0 inline-flex items-center justify-end" data-partner-actions>
                                        <a href="#" class="icon-action" data-requires="profile.manage" data-partner-edit-link aria-label="編輯" title="編輯">
                                            <i data-lucide="square-pen" class="w-4 h-4"></i>
                                        </a>
                                        <button type="button" class="icon-action" data-partner-delete data-requires="profile.manage" aria-label="刪除" title="刪除">
                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="list-empty" data-partner-empty hidden>
                                    沒有符合條件的夥伴
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="pagination-bar">
                        <p class="text-eb3 text-gray3 uppercase" data-partner-summary>Showing 1-8 of {{ count($partners) }} results</p>
                        <nav class="pagination-nav self-start md:self-auto" aria-label="夥伴分頁" data-partner-pagination>
                            <button type="button" class="pagination-btn" aria-label="上一頁" disabled>
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

    <div
        class="app-modal-host"
        data-partner-preview
        hidden
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-preview-title"
    >
        <div class="app-modal-backdrop" data-partner-preview-dismiss></div>
        <div class="app-modal-panel ticket-modal-panel partner-preview-panel">
            <div class="ticket-modal-header">
                <div class="min-w-0 flex flex-col gap-1">
                    <div class="inline-flex items-center gap-3 min-w-0">
                        <h2 id="partner-preview-title" class="text-ch5 text-gray5 truncate min-w-0" data-partner-preview-company>—</h2>
                        <span class="status-pill shrink-0" data-partner-preview-status>—</span>
                    </div>
                    <p class="text-[12px] font-en font-medium uppercase tracking-[0.06em] text-gray3" data-partner-preview-id>—</p>
                </div>
                <button type="button" class="icon-action shrink-0" data-partner-preview-dismiss aria-label="關閉預覽">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>

            <div class="ticket-modal-body">
                <div class="self-stretch grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex flex-col">
                        <p class="text-cb4 text-brand2">身分權限</p>
                        <p class="text-cb3 text-gray5" data-partner-preview-identity>—</p>
                    </div>
                    <div class="flex flex-col">
                        <p class="text-cb4 text-brand2">申請日期</p>
                        <p class="text-cb3 text-gray5" data-partner-preview-applied>—</p>
                    </div>
                    <div class="flex flex-col">
                        <p class="text-cb4 text-brand2">統一編號</p>
                        <p class="text-cb3 text-gray5" data-partner-preview-tax-id>—</p>
                    </div>
                    <div class="flex flex-col">
                        <p class="text-cb4 text-brand2">國家 / 地區</p>
                        <p class="text-cb3 text-gray5" data-partner-preview-country>—</p>
                    </div>
                    <div class="flex flex-col">
                        <p class="text-cb4 text-brand2">原廠業務</p>
                        <p class="text-cb3 text-gray5" data-partner-preview-oem-sales>—</p>
                    </div>
                    <div class="flex flex-col">
                        <p class="text-cb4 text-brand2">申請人</p>
                        <p class="text-cb3 text-gray5" data-partner-preview-name>—</p>
                    </div>
                    <div class="flex flex-col">
                        <p class="text-cb4 text-brand2">職稱 / 部門</p>
                        <p class="text-cb3 text-gray5" data-partner-preview-title>—</p>
                    </div>
                    <div class="flex flex-col">
                        <p class="text-cb4 text-brand2">E-mail</p>
                        <p class="text-eb2 text-gray5 break-all" data-partner-preview-email>—</p>
                    </div>
                    <div class="flex flex-col md:col-span-2">
                        <p class="text-cb4 text-brand2">聯絡電話</p>
                        <p class="text-cb3 text-gray5" data-partner-preview-phone>—</p>
                    </div>
                </div>
            </div>

            <div class="ticket-modal-footer">
                <button type="button" class="btn-secondary" data-partner-preview-dismiss>關閉</button>
                <a href="#" class="btn-primary" data-partner-preview-edit data-requires="profile.manage">前往編輯</a>
            </div>
        </div>
    </div>

    <script type="application/json" id="partner-catalog-data">
        {!! json_encode([
            'partners' => $partners,
            'countries' => $countryLabels,
            'statuses' => $statusLabels,
            'levels' => $levelLabels,
            'identities' => $identityLabels,
            'identityFilters' => $identityFilters,
            'editUrl' => rtrim($page->baseUrl, '/') . '/profile/edit/',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
    </script>
@endsection
