---
title: 系統管理
---
@extends('_layouts.app')

@php
    $statusMap = [];
    $statusLabels = [];
    foreach ($page->systemAdminStatuses as $option) {
        $statusMap[$option['value']] = $option;
        $statusLabels[$option['value']] = $option['label'];
    }

    $navLabels = [];
    $assignableNav = [];
    foreach ($page->appNav as $item) {
        $navLabels[$item['path']] = $item['label'];
        if (($item['path'] ?? '') !== '/admins') {
            $assignableNav[] = $item;
        }
    }

    $admins = $page->systemAdmins ?? [];
    $statusCounts = [
        'all' => count($admins),
        'active' => 0,
        'disabled' => 0,
    ];
    foreach ($admins as $item) {
        if (isset($statusCounts[$item['status']])) {
            $statusCounts[$item['status']] += 1;
        }
    }

    $adminStats = [
        ['key' => 'all', 'label' => '全部帳號', 'count' => $statusCounts['all'], 'tone' => 'default'],
        ['key' => 'active', 'label' => '啟用', 'count' => $statusCounts['active'], 'tone' => 'default'],
        ['key' => 'disabled', 'label' => '停用', 'count' => $statusCounts['disabled'], 'tone' => 'danger'],
    ];
@endphp

@section('body')
    <div class="page-body">
        <div class="content-wrapper" data-admin-guard>
            <div class="list-empty" data-admin-forbidden hidden>
                僅總管理者可管理帳號。
            </div>

            <div
                class="self-stretch flex flex-col gap-5"
                data-admin-allowed
                data-admin-list
                data-edit-url="{{ site_href($page, '/admins/edit') }}"
                data-home-url="{{ site_href($page, '/') }}"
            >
                <div class="self-stretch flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div class="flex flex-col md:flex-row md:items-center gap-2 min-w-0">
                        <label class="search-field search-bar w-full md:w-56">
                            <i data-lucide="search" class="w-3.5 h-3.5 text-gray3 shrink-0"></i>
                            <span class="sr-only">搜尋編號、使用者名稱或 E-mail</span>
                            <input type="search" name="q" placeholder="搜尋編號、使用者名稱或 E-mail" class="w-full min-w-0 bg-transparent text-cb3 text-gray5 placeholder:text-gray3 outline-none" data-admin-search>
                            <button type="button" class="search-clear" data-search-clear hidden aria-label="清除搜尋">
                                <i data-lucide="x" class="w-3.5 h-3.5"></i>
                            </button>
                        </label>

                        <div class="form-select w-full md:w-44" data-form-select data-admin-filter="status">
                            <input type="hidden" value="" data-form-select-value>
                            <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                                <span class="is-placeholder" data-form-select-label>帳號狀態</span>
                                <i data-lucide="chevron-down" class="w-4 h-4 text-gray4"></i>
                            </button>
                            <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                                <button type="button" class="form-select-option is-selected" role="option" data-form-select-option data-value="" data-label="帳號狀態">全部</button>
                                @foreach ($page->systemAdminStatuses as $option)
                                    <button type="button" class="form-select-option" role="option" data-form-select-option data-value="{{ $option['value'] }}" data-label="{{ $option['label'] }}">{{ $option['label'] }}</button>
                                @endforeach
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-2">
                        <a href="{{ site_href($page, '/admins/create') }}" class="btn-primary" data-requires="admin.manage">新增帳號</a>
                    </div>
                </div>

                <div class="self-stretch px-6 py-4 bg-white rounded-2xl shadow-card flex flex-col md:flex-row md:items-stretch gap-4 md:gap-7">
                    @foreach ($adminStats as $index => $stat)
                        @if ($index > 0)
                            <div class="hidden md:block w-px self-stretch bg-gray1 shrink-0" aria-hidden="true"></div>
                            <div class="md:hidden h-px w-full bg-gray1" aria-hidden="true"></div>
                        @endif
                        <div class="flex-1 flex flex-col items-start gap-2" data-admin-stat="{{ $stat['key'] }}">
                            <p class="text-cb3 text-gray4">{{ $stat['label'] }}</p>
                            <div class="self-stretch inline-flex justify-end items-baseline gap-1">
                                <span class="font-en font-semibold text-[48px] leading-none tracking-[3px] @if ($stat['tone'] === 'danger') text-red @else text-gray5 @endif" data-admin-stat-count>{{ $stat['count'] }}</span>
                                <span class="text-cb3 @if ($stat['tone'] === 'danger') text-red @else text-gray5 @endif">位</span>
                            </div>
                        </div>
                    @endforeach
                </div>

                <div class="list-card">
                    <div class="list-card-body">
                        <div class="self-stretch overflow-x-auto">
                            <div class="min-w-[1040px]">
                                <div class="list-head">
                                    <div class="flex-[1.1] min-w-[11rem] text-cb3 text-gray4">使用者名稱</div>
                                    <div class="flex-[1.2] min-w-[12rem] text-cb3 text-gray4">E-mail</div>
                                    <div class="w-28 shrink-0 text-cb3 text-gray4">帳號類型</div>
                                    <div class="flex-[1.6] min-w-[16rem] text-cb3 text-gray4">左側選單權限</div>
                                    <div class="w-20 text-cb3 text-gray4">狀態</div>
                                    <div class="w-24 shrink-0"></div>
                                </div>

                                <div class="flex flex-col">
                                    @foreach ($admins as $item)
                                        @php
                                            $status = $statusMap[$item['status']] ?? ['value' => $item['status'], 'label' => $item['status']];
                                            $navPaths = $item['nav'] ?? [];
                                        @endphp
                                        <div
                                            class="list-row list-row-link py-3"
                                            data-admin-row
                                            data-admin-id="{{ $item['id'] }}"
                                            data-edit-href="{{ site_href($page, '/admins/edit') }}?id={{ urlencode($item['id']) }}"
                                            data-status="{{ $item['status'] }}"
                                            data-search="{{ $item['id'] }} {{ $item['name'] }} {{ $item['email'] }}"
                                        >
                                            <div class="flex-[1.1] min-w-[11rem] pr-4">
                                                <p class="text-cb3 text-gray5" data-admin-name>{{ $item['name'] }}</p>
                                                <p class="text-[12px] font-en font-medium uppercase tracking-[0.06em] text-gray3" data-admin-member-id>{{ $item['id'] }}</p>
                                            </div>
                                            <div class="flex-[1.2] min-w-[12rem] pr-4">
                                                <p class="text-eb2 text-gray5 break-all" data-admin-email>{{ $item['email'] }}</p>
                                            </div>
                                            <div class="w-28 shrink-0 pr-4">
                                                <p class="text-cb3 text-gray5 whitespace-nowrap" data-admin-role>{{ ($item['role'] ?? 'staff') === 'admin' ? '總管理者' : '一般帳號' }}</p>
                                            </div>
                                            <div class="flex-[1.6] min-w-[16rem] pr-4">
                                                <div class="flex flex-wrap gap-1" data-admin-nav>
                                                    @if (($item['role'] ?? 'staff') === 'admin')
                                                        <span class="text-cb3 text-gray5">全部選單</span>
                                                    @else
                                                        @forelse ($navPaths as $path)
                                                            <span class="nav-permission-chip">{{ $navLabels[$path] ?? $path }}</span>
                                                        @empty
                                                            <span class="text-cb3 text-gray3">未指定</span>
                                                        @endforelse
                                                    @endif
                                                </div>
                                            </div>
                                            <div class="w-20 shrink-0">
                                                <span class="status-pill status-{{ $status['value'] }}" data-admin-status>{{ $status['label'] }}</span>
                                            </div>
                                            <div class="w-24 shrink-0 inline-flex items-center justify-end" data-admin-actions>
                                                <a
                                                    href="{{ site_href($page, '/admins/edit') }}?id={{ urlencode($item['id']) }}"
                                                    class="icon-action"
                                                    data-requires="admin.manage"
                                                    data-admin-edit-link
                                                    aria-label="編輯 {{ $item['name'] }}"
                                                    title="編輯"
                                                >
                                                    <i data-lucide="square-pen" class="w-4 h-4"></i>
                                                </a>
                                                <button
                                                    type="button"
                                                    class="icon-action"
                                                    data-admin-delete
                                                    data-requires="admin.manage"
                                                    aria-label="刪除 {{ $item['name'] }}"
                                                    title="刪除"
                                                >
                                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                                </button>
                                            </div>
                                        </div>
                                    @endforeach
                                    <div
                                        class="list-row list-row-link py-3"
                                        data-admin-row-template
                                        hidden
                                        data-admin-id=""
                                        data-edit-href=""
                                        data-status=""
                                        data-search=""
                                    >
                                        <div class="flex-[1.1] min-w-[11rem] pr-4">
                                            <p class="text-cb3 text-gray5" data-admin-name>—</p>
                                            <p class="text-[12px] font-en font-medium uppercase tracking-[0.06em] text-gray3" data-admin-member-id>—</p>
                                        </div>
                                        <div class="flex-[1.2] min-w-[12rem] pr-4">
                                            <p class="text-eb2 text-gray5 break-all" data-admin-email>—</p>
                                        </div>
                                        <div class="w-28 shrink-0 pr-4">
                                            <p class="text-cb3 text-gray5 whitespace-nowrap" data-admin-role>—</p>
                                        </div>
                                        <div class="flex-[1.6] min-w-[16rem] pr-4">
                                            <div class="flex flex-wrap gap-1" data-admin-nav></div>
                                        </div>
                                        <div class="w-20 shrink-0">
                                            <span class="status-pill" data-admin-status>—</span>
                                        </div>
                                        <div class="w-24 shrink-0 inline-flex items-center justify-end" data-admin-actions>
                                            <a href="#" class="icon-action" data-requires="admin.manage" data-admin-edit-link aria-label="編輯" title="編輯">
                                                <i data-lucide="square-pen" class="w-4 h-4"></i>
                                            </a>
                                            <button type="button" class="icon-action" data-admin-delete data-requires="admin.manage" aria-label="刪除" title="刪除">
                                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="list-empty" data-admin-empty hidden>
                                        沒有符合條件的帳號
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script type="application/json" id="admin-catalog-data">
        {!! json_encode([
            'admins' => $admins,
            'statuses' => $statusLabels,
            'navItems' => $assignableNav,
            'navLabels' => $navLabels,
            'editUrl' => site_href($page, '/admins/edit'),
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
    </script>
@endsection
