---
title: 經銷商註冊
cardMaxWidth: 800px
---
@extends('_layouts.auth')

@section('body')
    <div class="self-stretch flex flex-col items-start gap-1">
        <h1 class="text-ch4 text-gray5">經銷商註冊</h1>
        <p class="text-cb3 text-gray4">送出後將自動產生會員編號，並進入審核；身分權限由原廠於後台指定。</p>
    </div>

    <form
        class="self-stretch flex flex-col items-start gap-8"
        data-partner-register-form
        data-login-url="{{ $page->baseUrl }}/login/"
        novalidate
    >
        <div class="form-field gap-1">
            <label for="register-oem-sales" class="form-label">
                <span class="text-red">*</span>
                <span>原廠業務姓名</span>
            </label>
            <input
                id="register-oem-sales"
                type="text"
                name="oem_sales"
                class="form-input"
                placeholder="填寫目前所屬業務窗口姓名"
                autocomplete="off"
                required
            >
            <p class="text-cb3 text-gray3">僅供審核參考，正式綁定需待後台核准後指定。</p>
        </div>

        <div class="self-stretch flex flex-col items-start gap-4">
            <div class="inline-flex items-center gap-3">
                <span class="section-accent" aria-hidden="true"></span>
                <h2 class="text-ch5 text-gray5">公司資料</h2>
            </div>

            <div class="self-stretch flex flex-col items-start gap-3">
                <div class="form-field">
                    <label for="register-company" class="form-label">
                        <span class="text-red">*</span>
                        <span>公司名稱</span>
                    </label>
                    <input
                        id="register-company"
                        type="text"
                        name="company"
                        class="form-input"
                        placeholder="請輸入公司名稱"
                        autocomplete="organization"
                        required
                    >
                </div>

                <div class="form-field">
                    <label for="register-tax-id" class="form-label">
                        <span class="text-red">*</span>
                        <span>統一編號 Tax ID</span>
                    </label>
                    <input
                        id="register-tax-id"
                        type="text"
                        name="tax_id"
                        class="form-input"
                        placeholder="請輸入統一編號"
                        autocomplete="off"
                        required
                    >
                </div>

                <div class="form-field">
                    <span class="form-label">
                        <span class="text-red">*</span>
                        <span>所在國家 / 地區</span>
                    </span>
                    <div class="form-select" data-form-select data-searchable data-required>
                        <input type="hidden" name="country" value="tw" data-form-select-value>
                        <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                            <span data-form-select-label>台灣</span>
                            <i data-lucide="chevron-down" class="w-4 h-4 text-gray4 shrink-0"></i>
                        </button>
                        <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                            <div class="form-select-options" data-form-select-options>
                                @foreach ($page->registerCountries as $country)
                                    <button
                                        type="button"
                                        class="form-select-option {{ $country['value'] === 'tw' ? 'is-selected' : '' }}"
                                        role="option"
                                        data-form-select-option
                                        data-value="{{ $country['value'] }}"
                                        data-label="{{ $country['label'] }}"
                                        data-code="{{ $country['code'] ?? strtoupper($country['value']) }}"
                                        @if ($country['value'] === 'tw') aria-selected="true" @endif
                                    >
                                        {{ $country['label'] }}
                                    </button>
                                @endforeach
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="self-stretch flex flex-col items-start gap-4">
            <div class="inline-flex items-center gap-3">
                <span class="section-accent" aria-hidden="true"></span>
                <h2 class="text-ch5 text-gray5">申請人與登入資料</h2>
            </div>

            <div class="self-stretch grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                <div class="form-field">
                    <label for="register-name" class="form-label">
                        <span class="text-red">*</span>
                        <span>姓名</span>
                    </label>
                    <input
                        id="register-name"
                        type="text"
                        name="name"
                        class="form-input"
                        placeholder="請輸入姓名"
                        autocomplete="name"
                        required
                    >
                </div>

                <div class="form-field">
                    <label for="register-email" class="form-label">
                        <span class="text-red">*</span>
                        <span>公司 E-mail</span>
                    </label>
                    <input
                        id="register-email"
                        type="email"
                        name="email"
                        class="form-input"
                        placeholder="請輸入 E-mail"
                        autocomplete="email"
                        required
                    >
                </div>

                <div class="form-field">
                    <label for="register-phone" class="form-label">
                        <span class="text-red">*</span>
                        <span>聯絡電話</span>
                    </label>
                    <input
                        id="register-phone"
                        type="tel"
                        name="phone"
                        class="form-input"
                        placeholder="請輸入電話號碼"
                        autocomplete="tel"
                        required
                    >
                </div>

                <div class="form-field">
                    <label for="register-title" class="form-label">
                        <span class="text-red">*</span>
                        <span>職稱 / 部門</span>
                    </label>
                    <input
                        id="register-title"
                        type="text"
                        name="job_title"
                        class="form-input"
                        placeholder="請輸入職稱與部門"
                        autocomplete="organization-title"
                        required
                    >
                </div>

                <div class="form-field">
                    <label for="register-password" class="form-label">
                        <span class="text-red">*</span>
                        <span>設定密碼</span>
                    </label>
                    <input
                        id="register-password"
                        type="password"
                        name="password"
                        class="form-input"
                        placeholder="請輸入密碼"
                        autocomplete="new-password"
                        required
                    >
                </div>

                <div class="form-field">
                    <label for="register-password-confirm" class="form-label">
                        <span class="text-red">*</span>
                        <span>確認密碼</span>
                    </label>
                    <input
                        id="register-password-confirm"
                        type="password"
                        name="password_confirmation"
                        class="form-input"
                        placeholder="請再次輸入密碼"
                        autocomplete="new-password"
                        required
                    >
                </div>
            </div>
        </div>

        <div class="auth-agree">
            <label class="inline-flex items-center gap-2 min-w-0 cursor-pointer">
                <input type="checkbox" name="privacy" value="1" class="auth-checkbox" required>
                <span class="text-cb3 text-gray3">我已閱讀並同意</span>
            </label>
            <a href="#" class="auth-link shrink-0">個資法</a>
        </div>

        <div class="self-stretch flex flex-col items-center gap-5" data-partner-register-actions>
            <button type="submit" class="btn-primary w-full h-11">送出註冊申請</button>
        </div>

        <div class="self-stretch flex flex-col items-start gap-4" data-partner-register-success hidden>
            <div class="self-stretch rounded-[12px] border border-gray1 bg-bg2 px-4 py-4 flex flex-col gap-2">
                <p class="text-cb3 text-gray5">申請已送出，狀態為審核中。</p>
                <p class="text-cb3 text-gray4">
                    會員編號
                    <span class="font-en font-semibold uppercase tracking-[0.06em] text-gray5" data-partner-register-id>—</span>
                </p>
                <p class="text-cb3 text-gray3">請等待原廠審核。審核通過後即可使用登入帳號。</p>
            </div>
            <a href="{{ $page->baseUrl }}/login/" class="btn-primary w-full h-11">返回登入</a>
        </div>

        <div class="self-stretch inline-flex justify-center items-center gap-1" data-partner-register-login-link>
            <span class="text-cb3 text-gray4">已有帳號？</span>
            <a href="{{ $page->baseUrl }}/login/" class="auth-link underline">返回登入</a>
        </div>
    </form>
@endsection

@push('scripts')
@php
    $registerCountryLabels = [];
    foreach ($page->registerCountries ?? [] as $country) {
        $registerCountryLabels[$country['value']] = $country['label'];
    }
    $registerStatusLabels = [];
    foreach ($page->partnerStatuses ?? [] as $status) {
        $registerStatusLabels[$status['value']] = $status['label'];
    }
    $registerLevelLabels = [];
    foreach ($page->partnerLevels ?? [] as $level) {
        $registerLevelLabels[$level['value']] = $level['label'];
    }
    $registerIdentityLabels = [];
    foreach ($page->partnerIdentityTypes ?? [] as $identity) {
        $registerIdentityLabels[$identity['value']] = $identity['label'];
    }
@endphp
<script type="application/json" id="partner-catalog-data">
    {!! json_encode([
        'partners' => $page->partners ?? [],
        'countries' => $registerCountryLabels,
        'statuses' => $registerStatusLabels,
        'levels' => $registerLevelLabels,
        'identities' => $registerIdentityLabels,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
</script>
<script>
document.addEventListener('DOMContentLoaded', function () {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});
</script>
@endpush
