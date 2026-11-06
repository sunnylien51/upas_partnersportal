---
title: 編輯帳號
---
@extends('_layouts.app')

@php
    $admins = $page->systemAdmins ?? [];
    $sample = $admins[0] ?? [
        'id' => '',
        'name' => '',
        'email' => '',
        'status' => 'active',
        'created_at' => '',
        'nav' => [],
    ];
    $statusMap = [];
    $statusLabels = [];
    foreach ($page->systemAdminStatuses as $option) {
        $statusMap[$option['value']] = $option;
        $statusLabels[$option['value']] = $option['label'];
    }
    $sampleStatus = $statusMap[$sample['status']] ?? ['value' => $sample['status'], 'label' => $sample['status']];
    $assignableNav = [];
    $navLabels = [];
    foreach ($page->appNav as $item) {
        $navLabels[$item['path']] = $item['label'];
        if (($item['path'] ?? '') !== '/admins') {
            $assignableNav[] = $item;
        }
    }
@endphp

@section('body')
    <div class="page-body">
        <div class="content-wrapper" data-admin-guard>
            <div class="list-empty" data-admin-forbidden hidden>
                僅總管理者可管理帳號。
            </div>

            <div class="self-stretch flex flex-col gap-5" data-admin-allowed>
                <div class="page-toolbar" data-admin-edit-toolbar>
                    <div class="inline-flex flex-col items-start gap-1 min-w-0">
                        <div class="inline-flex items-center gap-3 min-w-0">
                            <h1 class="text-ch4 text-gray5 truncate" data-admin-heading>{{ $sample['name'] }}</h1>
                            <span class="status-pill status-{{ $sampleStatus['value'] }}" data-admin-status-pill>{{ $sampleStatus['label'] }}</span>
                        </div>
                        <p class="text-[12px] font-en font-medium uppercase tracking-[0.06em] text-gray3" data-admin-member-id>{{ $sample['id'] }}</p>
                    </div>
                    <a href="{{ site_href($page, '/admins') }}" class="btn-secondary">返回列表</a>
                </div>

                <div class="list-empty" data-admin-missing hidden>
                    找不到這筆帳號，請返回列表再試一次。
                </div>

                <form
                    class="self-stretch"
                    data-admin-edit-form
                    data-list-url="{{ site_href($page, '/admins') }}"
                    novalidate
                >
                    <input type="hidden" name="id" value="{{ $sample['id'] }}">
                    <input type="hidden" name="created_at" value="{{ $sample['created_at'] }}">

                    <div class="review-layout">
                        <div class="review-main">

                            <section class="card-panel gap-4">
                                <div class="self-stretch inline-flex items-center gap-3">
                                    <span class="section-accent" aria-hidden="true"></span>
                                    <h2 class="text-ch5 text-gray5">帳號資料</h2>
                                </div>

                                <div class="self-stretch flex flex-col items-start gap-1">
                                    <div class="inline-flex items-center gap-1">
                                        <span class="text-cb2 text-red">*</span>
                                        <span class="text-cb2 text-gray5">帳號類型</span>
                                    </div>
                                    <div class="self-stretch inline-flex items-start gap-4" data-account-role-group>
                                        <label class="source-option flex-1">
                                            <input type="radio" name="account_role" value="admin" class="sr-only" data-account-role>
                                            <span class="source-radio" aria-hidden="true"></span>
                                            <span class="source-option-label">總管理者</span>
                                        </label>
                                        <label class="source-option flex-1 is-selected">
                                            <input type="radio" name="account_role" value="staff" class="sr-only" data-account-role checked>
                                            <span class="source-radio" aria-hidden="true"></span>
                                            <span class="source-option-label">一般帳號</span>
                                        </label>
                                    </div>
                                </div>

                                <div class="self-stretch grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="form-field">
                                        <span class="form-label">建立日期</span>
                                        <input type="text" class="form-input is-readonly" value="{{ $sample['created_at'] }}" data-admin-created readonly tabindex="-1">
                                    </div>

                                    <div class="form-field">
                                        <span class="form-label">帳號編號</span>
                                        <input type="text" class="form-input is-readonly font-en uppercase" value="{{ $sample['id'] }}" data-admin-id-readonly readonly tabindex="-1">
                                    </div>

                                    <label class="form-field">
                                        <span class="form-label">
                                            <span class="text-red">*</span>
                                            <span>使用者名稱</span>
                                        </span>
                                        <input type="text" name="name" class="form-input" placeholder="請輸入使用者名稱" autocomplete="username" required>
                                    </label>

                                    <label class="form-field">
                                        <span class="form-label">
                                            <span class="text-red">*</span>
                                            <span>公司 E-mail</span>
                                        </span>
                                        <input type="email" name="email" class="form-input" placeholder="請輸入 E-mail" autocomplete="email" required>
                                    </label>

                                    <label class="form-field">
                                        <span class="form-label">重設密碼</span>
                                        <input type="password" name="password" class="form-input" placeholder="留空則不變更" autocomplete="new-password">
                                    </label>

                                    <label class="form-field">
                                        <span class="form-label">確認新密碼</span>
                                        <input type="password" name="password_confirmation" class="form-input" placeholder="請再輸入一次新密碼" autocomplete="new-password">
                                    </label>
                                </div>
                            </section>

                            <p class="text-cb3 text-gray3" data-super-admin-note hidden>總管理者固定可使用全部左側選單，包含系統管理。</p>

                            <section class="card-panel gap-4" data-nav-permission-section>
                                <div class="self-stretch inline-flex items-center gap-3">
                                    <span class="section-accent" aria-hidden="true"></span>
                                    <h2 class="text-ch5 text-gray5">左側選單權限</h2>
                                </div>
                                <p class="text-cb3 text-gray3">勾選此帳號登入後可見的左側選單。「系統管理」僅總管理者可見，不開放勾選。</p>
                                <div class="self-stretch grid grid-cols-1 md:grid-cols-2 gap-2" data-nav-permission-options>
                                    @foreach ($assignableNav as $item)
                                        <label class="source-option">
                                            <input
                                                type="checkbox"
                                                name="nav[]"
                                                value="{{ $item['path'] }}"
                                                class="sr-only"
                                                data-nav-permission
                                            >
                                            <span class="source-check" aria-hidden="true"></span>
                                            <span class="source-option-label">{{ $item['label'] }}</span>
                                        </label>
                                    @endforeach
                                </div>
                            </section>
                        </div>

                        <aside class="review-aside">
                            <div class="review-panel">
                                <div class="self-stretch inline-flex items-center gap-3">
                                    <span class="section-accent" aria-hidden="true"></span>
                                    <h2 class="text-ch5 text-gray5">儲存變更</h2>
                                </div>
                                <div class="form-field self-stretch">
                                    <span class="form-label">
                                        <span class="text-red">*</span>
                                        <span>啟用狀態</span>
                                    </span>
                                    <div class="form-select" data-form-select data-required>
                                        <input type="hidden" name="status" value="{{ $sample['status'] }}" data-form-select-value required>
                                        <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                                            <span data-form-select-label>{{ $sampleStatus['label'] }}</span>
                                            <i data-lucide="chevron-down" class="w-4 h-4 text-gray4"></i>
                                        </button>
                                        <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                                            @foreach ($page->systemAdminStatuses as $option)
                                                <button
                                                    type="button"
                                                    class="form-select-option {{ $option['value'] === $sample['status'] ? 'is-selected' : '' }}"
                                                    role="option"
                                                    data-form-select-option
                                                    data-value="{{ $option['value'] }}"
                                                    data-label="{{ $option['label'] }}"
                                                    @if ($option['value'] === $sample['status']) aria-selected="true" @endif
                                                >
                                                    {{ $option['label'] }}
                                                </button>
                                            @endforeach
                                        </div>
                                    </div>
                                </div>
                                <p class="text-cb3 text-gray3">
                                    總管理者固定看得到全部選單。一般帳號可再調整左側選單。
                                </p>
                                <div class="self-stretch inline-flex flex-col gap-2 pt-1">
                                    <button type="submit" class="btn-primary w-full h-11" data-requires="admin.manage">儲存</button>
                                    <a href="{{ site_href($page, '/admins') }}" class="btn-secondary w-full h-11">取消</a>
                                </div>
                            </div>
                        </aside>
                    </div>
                </form>
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
