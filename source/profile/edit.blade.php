---
title: 編輯夥伴資料
---
@extends('_layouts.app')

@php
    $partners = $page->partners ?? [];
    $sample = $partners[0] ?? [
        'id' => '',
        'identity' => '',
        'level' => '',
        'oem_sales' => '',
        'oem_sales_id' => '',
        'manager_id' => '',
        'company' => '',
        'tax_id' => '',
        'country' => 'tw',
        'name' => '',
        'email' => '',
        'phone' => '',
        'job_title' => '',
        'status' => 'reviewing',
        'applied_at' => '',
    ];
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
    $countryLabels = [];
    foreach ($page->registerCountries as $country) {
        $countryLabels[$country['value']] = $country['label'];
    }
    $sampleStatus = $statusMap[$sample['status']] ?? ['value' => $sample['status'], 'label' => $sample['status']];
    $sampleCountry = $countryLabels[$sample['country']] ?? $sample['country'];
    $sampleIdentity = $sample['identity'] ?? '';
    $sampleLevel = $sample['level'] ?? '';
    $sampleLevelLabel = $levelLabels[$sampleLevel] ?? '請選擇會員等級';

    $oemSalesOptions = [];
    $oemManagerOptions = [];
    foreach ($partners as $item) {
        if (($item['status'] ?? '') !== 'approved') {
            continue;
        }
        if (($item['identity'] ?? '') === 'oem_sales') {
            $oemSalesOptions[] = $item;
        }
        if (($item['identity'] ?? '') === 'oem_manager') {
            $oemManagerOptions[] = $item;
        }
    }

    $boundSales = null;
    foreach ($oemSalesOptions as $item) {
        if (($item['id'] ?? '') === ($sample['oem_sales_id'] ?? '')) {
            $boundSales = $item;
            break;
        }
    }
    $boundManager = null;
    foreach ($oemManagerOptions as $item) {
        if (($item['id'] ?? '') === ($sample['manager_id'] ?? '')) {
            $boundManager = $item;
            break;
        }
    }
@endphp

@section('body')
    <div class="page-body">
        <div class="content-wrapper">

            <div class="page-toolbar" data-partner-edit-toolbar>
                <div class="inline-flex flex-col items-start gap-1 min-w-0">
                    <div class="inline-flex items-center gap-3 min-w-0">
                        <h1 class="text-ch4 text-gray5 truncate" data-partner-heading>{{ $sample['company'] }}</h1>
                        <span class="status-pill status-{{ $sampleStatus['value'] }}" data-partner-status-pill>{{ $sampleStatus['label'] }}</span>
                    </div>
                    <p class="text-[12px] font-en font-medium uppercase tracking-[0.06em] text-gray3" data-partner-member-id>{{ $sample['id'] }}</p>
                </div>
                <a href="{{ $page->baseUrl }}/profile/" class="btn-secondary">返回列表</a>
            </div>

            <div class="list-empty" data-partner-missing hidden>
                找不到這筆夥伴資料，請返回列表再試一次。
            </div>

            <form
                class="self-stretch"
                data-partner-edit-form
                data-list-url="{{ $page->baseUrl }}/profile/"
                novalidate
            >
                <input type="hidden" name="id" value="{{ $sample['id'] }}">
                <input type="hidden" name="applied_at" value="{{ $sample['applied_at'] }}">
                <input type="hidden" name="oem_sales" value="{{ $sample['oem_sales'] ?? '' }}">

                <div class="review-layout">
                    <div class="review-main">

                        <section class="card-panel gap-4">
                            <div class="self-stretch inline-flex items-center gap-3">
                                <span class="section-accent" aria-hidden="true"></span>
                                <h2 class="text-ch5 text-gray5">審核與身分權限</h2>
                            </div>

                            <div class="self-stretch grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="form-field">
                                    <span class="form-label">
                                        <span class="text-red">*</span>
                                        <span>狀態</span>
                                    </span>
                                    <div class="form-select" data-form-select data-required>
                                        <input type="hidden" name="status" value="{{ $sample['status'] }}" data-form-select-value required>
                                        <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                                            <span data-form-select-label>{{ $sampleStatus['label'] }}</span>
                                            <i data-lucide="chevron-down" class="w-4 h-4 text-gray4"></i>
                                        </button>
                                        <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                                            @foreach ($page->partnerStatuses as $option)
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

                                <div class="form-field">
                                    <span class="form-label">申請日期</span>
                                    <input type="text" class="form-input is-readonly" value="{{ $sample['applied_at'] }}" data-partner-applied readonly tabindex="-1">
                                </div>

                                <div class="form-field">
                                    <span class="form-label">會員編號</span>
                                    <input type="text" class="form-input is-readonly font-en uppercase" value="{{ $sample['id'] }}" data-partner-id-readonly readonly tabindex="-1">
                                </div>
                            </div>

                            <div class="form-field gap-2" data-partner-identity-group>
                                <span class="form-label">
                                    <span class="text-red" data-partner-identity-required hidden>*</span>
                                    <span>身分權限</span>
                                </span>
                                <p class="text-cb3 text-gray3">由內部指定；申請人註冊時看不到此欄。</p>
                                <div class="self-stretch grid grid-cols-1 md:grid-cols-2 gap-2" data-identity-options>
                                    @foreach ($page->partnerIdentityTypes ?? [] as $option)
                                        <label class="source-option {{ $sampleIdentity === $option['value'] ? 'is-selected' : '' }}">
                                            <input
                                                type="radio"
                                                name="identity"
                                                value="{{ $option['value'] }}"
                                                class="sr-only"
                                                data-identity-input
                                                {{ $sampleIdentity === $option['value'] ? 'checked' : '' }}
                                            >
                                            <span class="source-radio" aria-hidden="true"></span>
                                            <span class="source-option-label">{{ $option['label'] }}</span>
                                        </label>
                                    @endforeach
                                </div>
                            </div>

                            <div class="form-field" data-partner-level-field hidden>
                                <span class="form-label">
                                    <span class="text-red">*</span>
                                    <span>會員等級</span>
                                </span>
                                <div class="form-select" data-form-select data-partner-level-select>
                                    <input type="hidden" name="level" value="{{ $sampleLevel }}" data-form-select-value>
                                    <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                                        <span class="{{ $sampleLevel ? '' : 'is-placeholder' }}" data-form-select-label>{{ $sampleLevelLabel }}</span>
                                        <i data-lucide="chevron-down" class="w-4 h-4 text-gray4"></i>
                                    </button>
                                    <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                                        <button type="button" class="form-select-option {{ $sampleLevel === '' ? 'is-selected' : '' }}" role="option" data-form-select-option data-value="" data-label="請選擇會員等級">請選擇會員等級</button>
                                        @foreach ($page->partnerLevels ?? [] as $option)
                                            <button
                                                type="button"
                                                class="form-select-option {{ $option['value'] === $sampleLevel ? 'is-selected' : '' }}"
                                                role="option"
                                                data-form-select-option
                                                data-value="{{ $option['value'] }}"
                                                data-label="{{ $option['label'] }}"
                                                @if ($option['value'] === $sampleLevel) aria-selected="true" @endif
                                            >
                                                {{ $option['label'] }}
                                            </button>
                                        @endforeach
                                    </div>
                                </div>
                            </div>

                            <div class="form-field" data-partner-oem-sales-field hidden>
                                <span class="form-label">
                                    <span class="text-red">*</span>
                                    <span>綁定原廠業務</span>
                                </span>
                                <p class="text-cb3 text-gray3">一間經銷只綁一位業務；人事異動時在此更改。</p>
                                <p class="text-cb3 text-gray3" data-partner-oem-sales-requested {{ trim((string) ($sample['oem_sales'] ?? '')) === '' ? 'hidden' : '' }}>
                                    申請填寫：<span data-partner-oem-sales-requested-name>{{ $sample['oem_sales'] ?? '' }}</span>
                                </p>
                                <div class="form-select" data-form-select data-partner-oem-sales-select>
                                    <input type="hidden" name="oem_sales_id" value="{{ $sample['oem_sales_id'] ?? '' }}" data-form-select-value>
                                    <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                                        <span class="{{ ($sample['oem_sales_id'] ?? '') ? '' : 'is-placeholder' }}" data-form-select-label>
                                            {{ $boundSales ? ($boundSales['name'] . '（' . $boundSales['id'] . '）') : '請選擇原廠業務' }}
                                        </span>
                                        <i data-lucide="chevron-down" class="w-4 h-4 text-gray4"></i>
                                    </button>
                                    <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                                        <div class="form-select-options" data-form-select-options>
                                            <button type="button" class="form-select-option {{ ($sample['oem_sales_id'] ?? '') === '' ? 'is-selected' : '' }}" role="option" data-form-select-option data-value="" data-label="請選擇原廠業務">請選擇原廠業務</button>
                                            @foreach ($oemSalesOptions as $option)
                                                <button
                                                    type="button"
                                                    class="form-select-option {{ ($sample['oem_sales_id'] ?? '') === $option['id'] ? 'is-selected' : '' }}"
                                                    role="option"
                                                    data-form-select-option
                                                    data-value="{{ $option['id'] }}"
                                                    data-label="{{ $option['name'] }}（{{ $option['id'] }}）"
                                                    data-name="{{ $option['name'] }}"
                                                    @if (($sample['oem_sales_id'] ?? '') === $option['id']) aria-selected="true" @endif
                                                >
                                                    {{ $option['name'] }}（{{ $option['id'] }}）
                                                </button>
                                            @endforeach
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="form-field" data-partner-manager-field hidden>
                                <span class="form-label">
                                    <span class="text-red">*</span>
                                    <span>直屬主管</span>
                                </span>
                                <p class="text-cb3 text-gray3">一位主管可掛多名業務；沒有再下一層。</p>
                                <div class="form-select" data-form-select data-partner-manager-select>
                                    <input type="hidden" name="manager_id" value="{{ $sample['manager_id'] ?? '' }}" data-form-select-value>
                                    <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                                        <span class="{{ ($sample['manager_id'] ?? '') ? '' : 'is-placeholder' }}" data-form-select-label>
                                            {{ $boundManager ? ($boundManager['name'] . '（' . $boundManager['id'] . '）') : '請選擇直屬主管' }}
                                        </span>
                                        <i data-lucide="chevron-down" class="w-4 h-4 text-gray4"></i>
                                    </button>
                                    <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                                        <div class="form-select-options" data-form-select-options>
                                            <button type="button" class="form-select-option {{ ($sample['manager_id'] ?? '') === '' ? 'is-selected' : '' }}" role="option" data-form-select-option data-value="" data-label="請選擇直屬主管">請選擇直屬主管</button>
                                            @foreach ($oemManagerOptions as $option)
                                                <button
                                                    type="button"
                                                    class="form-select-option {{ ($sample['manager_id'] ?? '') === $option['id'] ? 'is-selected' : '' }}"
                                                    role="option"
                                                    data-form-select-option
                                                    data-value="{{ $option['id'] }}"
                                                    data-label="{{ $option['name'] }}（{{ $option['id'] }}）"
                                                    @if (($sample['manager_id'] ?? '') === $option['id']) aria-selected="true" @endif
                                                >
                                                    {{ $option['name'] }}（{{ $option['id'] }}）
                                                </button>
                                            @endforeach
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section class="card-panel gap-4">
                            <div class="self-stretch inline-flex items-center gap-3">
                                <span class="section-accent" aria-hidden="true"></span>
                                <h2 class="text-ch5 text-gray5">公司資料</h2>
                            </div>
                            <p class="text-cb3 text-gray3" data-partner-oem-company-note hidden>
                                若核准為原廠身分權限，以下僅保留申請時填寫內容，不視為新的經銷公司。
                            </p>

                            <div class="self-stretch flex flex-col items-start gap-3">
                                <label class="form-field">
                                    <span class="form-label">
                                        <span class="text-red">*</span>
                                        <span>公司名稱</span>
                                    </span>
                                    <input type="text" name="company" class="form-input" placeholder="請輸入公司名稱" value="{{ $sample['company'] }}" autocomplete="organization" required>
                                </label>

                                <label class="form-field">
                                    <span class="form-label">
                                        <span class="text-red">*</span>
                                        <span>統一編號 Tax ID</span>
                                    </span>
                                    <input type="text" name="tax_id" class="form-input" placeholder="請輸入統一編號" value="{{ $sample['tax_id'] }}" required>
                                    <span class="text-cb3 text-brand2" data-partner-tax-hint hidden>此統編已有其他帳號，僅提醒不阻擋儲存。</span>
                                </label>

                                <div class="form-field">
                                    <span class="form-label">
                                        <span class="text-red">*</span>
                                        <span>所在國家 / 地區</span>
                                    </span>
                                    <div class="form-select" data-form-select data-searchable data-required>
                                        <input type="hidden" name="country" value="{{ $sample['country'] }}" data-form-select-value required>
                                        <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                                            <span data-form-select-label>{{ $sampleCountry }}</span>
                                            <i data-lucide="chevron-down" class="w-4 h-4 text-gray4 shrink-0"></i>
                                        </button>
                                        <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                                            <div class="form-select-options" data-form-select-options>
                                                @foreach ($page->registerCountries as $country)
                                                    <button
                                                        type="button"
                                                        class="form-select-option {{ $country['value'] === $sample['country'] ? 'is-selected' : '' }}"
                                                        role="option"
                                                        data-form-select-option
                                                        data-value="{{ $country['value'] }}"
                                                        data-label="{{ $country['label'] }}"
                                                        data-code="{{ $country['code'] ?? strtoupper($country['value']) }}"
                                                        @if ($country['value'] === $sample['country']) aria-selected="true" @endif
                                                    >
                                                        {{ $country['label'] }}
                                                    </button>
                                                @endforeach
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section class="card-panel gap-4">
                            <div class="self-stretch inline-flex items-center gap-3">
                                <span class="section-accent" aria-hidden="true"></span>
                                <h2 class="text-ch5 text-gray5">申請人資料</h2>
                            </div>

                            <div class="self-stretch grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                                <label class="form-field">
                                    <span class="form-label">
                                        <span class="text-red">*</span>
                                        <span>姓名</span>
                                    </span>
                                    <input type="text" name="name" class="form-input" placeholder="請輸入姓名" value="{{ $sample['name'] }}" autocomplete="name" required>
                                </label>

                                <label class="form-field">
                                    <span class="form-label">
                                        <span class="text-red">*</span>
                                        <span>公司 E-mail</span>
                                    </span>
                                    <input type="email" name="email" class="form-input" placeholder="請輸入 E-mail" value="{{ $sample['email'] }}" autocomplete="email" required>
                                </label>

                                <label class="form-field">
                                    <span class="form-label">
                                        <span class="text-red">*</span>
                                        <span>聯絡電話</span>
                                    </span>
                                    <input type="tel" name="phone" class="form-input" placeholder="請輸入電話號碼" value="{{ $sample['phone'] }}" autocomplete="tel" required>
                                </label>

                                <label class="form-field">
                                    <span class="form-label">
                                        <span class="text-red">*</span>
                                        <span>職稱 / 部門</span>
                                    </span>
                                    <input type="text" name="job_title" class="form-input" placeholder="請輸入職稱與部門" value="{{ $sample['job_title'] }}" autocomplete="organization-title" required>
                                </label>
                            </div>
                        </section>
                    </div>

                    <aside class="review-aside">
                        <div class="review-panel">
                            <div class="self-stretch inline-flex items-center gap-3">
                                <span class="section-accent" aria-hidden="true"></span>
                                <h2 class="text-ch5 text-gray5">儲存變更</h2>
                            </div>
                            <p class="text-cb3 text-gray3">
                                身分權限、等級與綁定由內部指定，核准後仍可再改。狀態改為已核准時，請補齊對應必填欄位。
                            </p>
                            <div class="self-stretch inline-flex flex-col gap-2 pt-1">
                                <button type="submit" class="btn-primary w-full h-11" data-requires="profile.manage">儲存變更</button>
                                <a href="{{ $page->baseUrl }}/profile/" class="btn-secondary w-full h-11">取消</a>
                            </div>
                        </div>
                    </aside>
                </div>
            </form>
        </div>
    </div>

    <script type="application/json" id="partner-catalog-data">
        {!! json_encode([
            'partners' => $partners,
            'countries' => $countryLabels,
            'statuses' => $statusLabels,
            'levels' => $levelLabels,
            'identities' => $identityLabels,
            'oemSalesOptions' => array_map(function ($item) {
                return ['id' => $item['id'], 'name' => $item['name']];
            }, $oemSalesOptions),
            'oemManagerOptions' => array_map(function ($item) {
                return ['id' => $item['id'], 'name' => $item['name']];
            }, $oemManagerOptions),
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
    </script>
@endsection
