---
title: 新增系統管理員
---
@extends('_layouts.app')

@php
    $today = date('Y-m-d');
    $statusMap = [];
    $statusLabels = [];
    foreach ($page->systemAdminStatuses as $option) {
        $statusMap[$option['value']] = $option;
        $statusLabels[$option['value']] = $option['label'];
    }
    $sampleStatus = $statusMap['active'];
    $assignableNav = [];
    $navLabels = [];
    foreach ($page->appNav as $item) {
        $navLabels[$item['path']] = $item['label'];
        if (($item['path'] ?? '') !== '/admins') {
            $assignableNav[] = $item;
        }
    }
    $defaultNav = ['/', '/opportunities', '/products', '/training', '/marketing', '/support'];
@endphp

@section('body')
    <div class="page-body">
        <div class="content-wrapper" data-admin-guard>
            <div class="list-empty" data-admin-forbidden hidden>
                僅總管理者可管理系統管理員帳號。
            </div>

            <div class="self-stretch flex flex-col gap-5" data-admin-allowed>
                <div class="page-toolbar">
                    <div class="inline-flex flex-col items-start gap-1 min-w-0">
                        <div class="inline-flex items-center gap-3 min-w-0">
                            <h1 class="text-ch4 text-gray5 truncate" data-admin-heading>新增系統管理員</h1>
                            <span class="status-pill status-{{ $sampleStatus['value'] }}" data-admin-status-pill>{{ $sampleStatus['label'] }}</span>
                        </div>
                        <p class="text-[12px] font-medium tracking-[0.04em] text-gray3">編號將於儲存時自動產生</p>
                    </div>
                    <a href="{{ site_href($page, '/admins') }}" class="btn-secondary">返回列表</a>
                </div>

                <form
                    class="self-stretch"
                    data-admin-create-form
                    data-list-url="{{ site_href($page, '/admins') }}"
                    novalidate
                >
                    <input type="hidden" name="created_at" value="{{ $today }}">

                    <div class="review-layout">
                        <div class="review-main">

                            <section class="card-panel gap-4">
                                <div class="self-stretch inline-flex items-center gap-3">
                                    <span class="section-accent" aria-hidden="true"></span>
                                    <h2 class="text-ch5 text-gray5">帳號資料</h2>
                                </div>

                                <div class="self-stretch grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="form-field">
                                        <span class="form-label">建立日期</span>
                                        <input type="text" class="form-input is-readonly" value="{{ $today }}" readonly tabindex="-1">
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
                                        <span class="form-label">
                                            <span class="text-red">*</span>
                                            <span>登入密碼</span>
                                        </span>
                                        <input type="password" name="password" class="form-input" placeholder="請輸入登入密碼" autocomplete="new-password" required>
                                    </label>

                                    <label class="form-field">
                                        <span class="form-label">
                                            <span class="text-red">*</span>
                                            <span>確認密碼</span>
                                        </span>
                                        <input type="password" name="password_confirmation" class="form-input" placeholder="請再輸入一次密碼" autocomplete="new-password" required>
                                    </label>
                                </div>
                            </section>

                            <section class="card-panel gap-4">
                                <div class="self-stretch inline-flex items-center gap-3">
                                    <span class="section-accent" aria-hidden="true"></span>
                                    <h2 class="text-ch5 text-gray5">左側選單權限</h2>
                                </div>
                                <p class="text-cb3 text-gray3">勾選此帳號登入後可見的左側選單。「系統管理」僅總管理者可見，不開放勾選。</p>
                                <div class="self-stretch grid grid-cols-1 md:grid-cols-2 gap-2" data-nav-permission-options>
                                    @foreach ($assignableNav as $item)
                                        <label class="source-option {{ in_array($item['path'], $defaultNav, true) ? 'is-selected' : '' }}">
                                            <input
                                                type="checkbox"
                                                name="nav[]"
                                                value="{{ $item['path'] }}"
                                                class="sr-only"
                                                data-nav-permission
                                                @if (in_array($item['path'], $defaultNav, true)) checked @endif
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
                                    <h2 class="text-ch5 text-gray5">建立帳號</h2>
                                </div>
                                <div class="form-field self-stretch">
                                    <span class="form-label">
                                        <span class="text-red">*</span>
                                        <span>啟用狀態</span>
                                    </span>
                                    <div class="form-select" data-form-select data-required>
                                        <input type="hidden" name="status" value="active" data-form-select-value required>
                                        <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                                            <span data-form-select-label>{{ $sampleStatus['label'] }}</span>
                                            <i data-lucide="chevron-down" class="w-4 h-4 text-gray4"></i>
                                        </button>
                                        <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                                            @foreach ($page->systemAdminStatuses as $option)
                                                <button
                                                    type="button"
                                                    class="form-select-option {{ $option['value'] === 'active' ? 'is-selected' : '' }}"
                                                    role="option"
                                                    data-form-select-option
                                                    data-value="{{ $option['value'] }}"
                                                    data-label="{{ $option['label'] }}"
                                                    @if ($option['value'] === 'active') aria-selected="true" @endif
                                                >
                                                    {{ $option['label'] }}
                                                </button>
                                            @endforeach
                                        </div>
                                    </div>
                                </div>
                                <p class="text-cb3 text-gray3">
                                    儲存後會自動產生管理員編號。切換預覽身分至「系統管理員」可查看此帳號的左側選單。
                                </p>
                                <div class="self-stretch inline-flex flex-col gap-2 pt-1">
                                    <button type="submit" class="btn-primary w-full h-11" data-requires="admin.manage">建立帳號</button>
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
            'admins' => $page->systemAdmins ?? [],
            'statuses' => $statusLabels,
            'navItems' => $assignableNav,
            'navLabels' => $navLabels,
            'editUrl' => site_href($page, '/admins/edit'),
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
    </script>
@endsection
