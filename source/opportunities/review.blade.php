---
title: 商機審核
---
@extends('_layouts.app')

@php
    $catalog = $page->opportunityCatalog ?? [];
    $sample = $catalog['N260728004'] ?? reset($catalog);
    $sampleForm = $sample['form'] ?? [];
    $sampleFields = $sampleForm['fields'] ?? [];
    $statusOptions = [];
    foreach ($page->opportunityStatuses as $statusOption) {
        $statusOptions[$statusOption['value']] = $statusOption['label'];
    }

    $sourceLabels = [];
    foreach ($page->opportunitySources as $source) {
        $sourceLabels[$source['value']] = $source['label'];
    }
    $relationLabels = [];
    foreach ($page->opportunityCustomerRelations as $relation) {
        $relationLabels[$relation['value']] = $relation['label'];
    }

    $sourceValue = $sampleForm['source'] ?? 'self';
    $relationValue = $sampleForm['customer_relation'] ?? '';
@endphp

@section('body')
    <div
        class="page-body"
        data-review-page
        data-list-url="{{ $page->baseUrl }}/opportunities/"
        data-create-url="{{ $page->baseUrl }}/opportunities/create/"
        data-renew-url="{{ $page->baseUrl }}/opportunities/renew/"
        data-partner-company="{{ $page->partner['company'] }}"
        data-partner-contact="{{ $page->partner['contact'] }}"
        data-partner-phone="{{ $page->partner['phone'] }}"
    >
        <div class="content-wrapper">

            <div class="page-toolbar">
                <div class="inline-flex items-center gap-3 min-w-0">
                    <h1 class="text-ch4 text-gray5 truncate">
                        <span data-review-id>{{ $sample['id'] }}</span>
                        <span class="text-gray3 font-normal">·</span>
                        <span data-review-title>{{ $sample['customer_company'] ?? $sample['title'] }}</span>
                    </h1>
                    <span class="status-pill status-{{ $sample['status'] }}" data-review-status-pill>{{ $sample['statusLabel'] }}</span>
                </div>
                <a href="{{ $page->baseUrl }}/opportunities/" class="btn-secondary">返回列表</a>
            </div>

            <div class="review-layout">

                {{-- ========== 左側：與新增／編輯相同欄位（唯讀） ========== --}}
                <div class="review-main" data-review-detail>

                    <section class="card-panel gap-4" data-review-renewal hidden>
                        <div class="self-stretch inline-flex items-center gap-3">
                            <span class="section-accent" aria-hidden="true"></span>
                            <h2 class="text-ch5 text-gray5">續期申請內容</h2>
                        </div>
                        <div class="review-result-card">
                            <div class="review-result-row">
                                <span class="text-cb3 text-gray3 shrink-0">延長期限</span>
                                <span class="text-cb3 text-gray5 min-w-0 flex-1" data-review-renewal-days>—</span>
                            </div>
                            <div class="review-result-row">
                                <span class="text-cb3 text-gray3 shrink-0">原保護期限</span>
                                <span class="text-cb3 text-gray5 min-w-0 flex-1" data-review-renewal-old>—</span>
                            </div>
                            <div class="review-result-row">
                                <span class="text-cb3 text-gray3 shrink-0">申請後新保護期</span>
                                <span class="text-cb3 text-gray5 min-w-0 flex-1" data-review-renewal-new>—</span>
                            </div>
                            <div class="review-result-row">
                                <span class="text-cb3 text-gray3 shrink-0">續期原因</span>
                                <span class="text-cb3 text-gray5 min-w-0 flex-1 whitespace-pre-wrap" data-review-renewal-reason>—</span>
                            </div>
                            <div class="review-result-row">
                                <span class="text-cb3 text-gray3 shrink-0">上傳附件</span>
                                <span class="text-cb3 text-gray5 min-w-0 flex-1" data-review-renewal-file>—</span>
                            </div>
                        </div>
                    </section>

                    <div class="self-stretch flex flex-col md:flex-row items-stretch gap-5">
                        <section class="card-panel flex-1 gap-4">
                            <div class="self-stretch inline-flex items-center gap-3">
                                <span class="section-accent" aria-hidden="true"></span>
                                <h2 class="text-ch5 text-gray5">商機來源</h2>
                            </div>
                            <div class="form-field">
                                <span class="form-label"><span>商機來源</span></span>
                                <input
                                    type="text"
                                    class="form-input is-readonly"
                                    data-review-field="source"
                                    value="{{ $sourceLabels[$sourceValue] ?? $sourceValue }}"
                                    readonly
                                    tabindex="-1"
                                >
                            </div>
                        </section>

                        <section class="card-panel flex-1 gap-4">
                            <div class="self-stretch inline-flex items-center gap-3">
                                <span class="section-accent" aria-hidden="true"></span>
                                <h2 class="text-ch5 text-gray5">原廠負責資訊</h2>
                            </div>
                            <div class="form-field">
                                <span class="form-label"><span>原廠所屬業務</span></span>
                                <input
                                    type="text"
                                    class="form-input is-readonly"
                                    data-review-field="oem_sales"
                                    value="{{ $sampleFields['oem_sales'] ?? ($sampleForm['oem_sales'] ?? '—') }}"
                                    readonly
                                    tabindex="-1"
                                >
                            </div>
                        </section>
                    </div>

                    <section class="card-panel gap-5">
                        <div class="self-stretch inline-flex justify-between items-center gap-3">
                            <div class="inline-flex items-center gap-3">
                                <span class="section-accent" aria-hidden="true"></span>
                                <h2 class="text-ch5 text-gray5">報備者資料</h2>
                            </div>
                            <p class="text-cb3 text-gray3">登入後由會員資料自動帶入</p>
                        </div>
                        <div class="self-stretch grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="form-field">
                                <span class="form-label"><span>報備者經銷商／業務</span></span>
                                <input
                                    type="text"
                                    class="form-input is-readonly"
                                    data-review-field="reporter_dealer"
                                    value="{{ $page->partner['company'] }}／{{ $page->partner['contact'] }}"
                                    readonly
                                    tabindex="-1"
                                >
                            </div>
                            <div class="form-field">
                                <span class="form-label"><span>報備者聯絡電話</span></span>
                                <input
                                    type="text"
                                    class="form-input is-readonly"
                                    data-review-field="reporter_phone"
                                    value="{{ $page->partner['phone'] }}"
                                    readonly
                                    tabindex="-1"
                                >
                            </div>
                        </div>
                    </section>

                    <section class="card-panel gap-5">
                        <div class="self-stretch inline-flex items-center gap-3">
                            <span class="section-accent" aria-hidden="true"></span>
                            <h2 class="text-ch5 text-gray5">客戶資料</h2>
                        </div>
                        <div class="self-stretch grid grid-cols-1 md:grid-cols-2 gap-4">
                            @foreach ($page->opportunityCustomerFields as $field)
                                <div class="form-field">
                                    <span class="form-label"><span>{{ $field['label'] }}</span></span>
                                    <input
                                        type="text"
                                        class="form-input is-readonly"
                                        data-review-field="{{ $field['name'] }}"
                                        value="{{ $sampleFields[$field['name']] ?? ($field['name'] === 'customer_company' ? ($sample['customer_company'] ?? '—') : '—') }}"
                                        readonly
                                        tabindex="-1"
                                    >
                                </div>
                            @endforeach

                            <div class="form-field md:col-span-2">
                                <span class="form-label"><span>客戶關係</span></span>
                                <input
                                    type="text"
                                    class="form-input is-readonly"
                                    data-review-field="customer_relation"
                                    value="{{ $relationLabels[$relationValue] ?? ($relationValue !== '' ? $relationValue : '—') }}"
                                    readonly
                                    tabindex="-1"
                                >
                            </div>

                            @foreach ($page->opportunityKeyManFields as $field)
                                <div class="form-field {{ $field['name'] === 'keyman_email' ? 'md:col-span-2' : '' }}">
                                    <span class="form-label"><span>{{ $field['label'] }}</span></span>
                                    <input
                                        type="text"
                                        class="form-input is-readonly"
                                        data-review-field="{{ $field['name'] }}"
                                        value="{{ $sampleFields[$field['name']] ?? '—' }}"
                                        readonly
                                        tabindex="-1"
                                    >
                                </div>
                            @endforeach
                        </div>
                    </section>

                    <div class="self-stretch flex flex-col items-start gap-4">
                        <section class="card-panel gap-4">
                            <div class="self-stretch inline-flex items-center gap-3">
                                <span class="section-accent" aria-hidden="true"></span>
                                <h2 class="text-ch5 text-gray5">專案細節</h2>
                            </div>

                            <span class="text-cb2 text-gray5">專案產品／U數</span>
                            <div class="self-stretch flex flex-col items-start gap-3" data-review-product-rows>
                                @php
                                    $products = $sampleForm['products'] ?? [];
                                    $units = $sampleForm['units'] ?? [];
                                    if (!count($products)) {
                                        $products = [''];
                                        $units = ['—'];
                                    }
                                @endphp
                                @foreach ($products as $index => $product)
                                    <div class="self-stretch inline-flex items-center gap-3" data-review-product-row>
                                        <input type="text" class="form-input flex-1 min-w-0 is-readonly" data-review-product value="{{ $product !== '' ? $product : '—' }}" readonly tabindex="-1">
                                        <input type="text" class="form-input w-48 shrink-0 is-readonly" data-review-units value="{{ $units[$index] ?? '—' }}" readonly tabindex="-1">
                                    </div>
                                @endforeach
                            </div>
                        </section>

                        <section class="card-panel gap-5">
                            <div class="self-stretch flex flex-col md:flex-row items-stretch gap-6">
                                <div class="flex-1 flex flex-col items-start gap-4">
                                    @foreach ($page->opportunityDates as $dateField)
                                        <div class="form-field">
                                            <span class="form-label"><span>{{ $dateField['label'] }}</span></span>
                                            <input
                                                type="text"
                                                class="form-input is-readonly"
                                                data-review-field="{{ $dateField['name'] }}"
                                                value="{{ $sampleFields[$dateField['name']] ?? '—' }}"
                                                readonly
                                                tabindex="-1"
                                            >
                                        </div>
                                    @endforeach
                                </div>

                                <div class="flex-1 self-stretch flex flex-col items-start gap-1">
                                    <span class="form-label"><span>競爭品牌／方案</span></span>
                                    <textarea
                                        class="form-input form-textarea is-readonly"
                                        data-review-field="competitors"
                                        readonly
                                        tabindex="-1"
                                    >{{ $sampleForm['competitors'] ?? '' }}</textarea>
                                </div>
                            </div>
                        </section>

                        <section class="card-panel gap-4">
                            <div class="self-stretch inline-flex items-center gap-3">
                                <span class="section-accent" aria-hidden="true"></span>
                                <h2 class="text-ch5 text-gray5">檔案上傳</h2>
                            </div>

                            @php
                                $attachment = $sample['attachment'] ?? ($sampleForm['attachment'] ?? null);
                            @endphp

                            <div class="file-upload-item" data-review-attachment {{ empty($attachment) ? 'hidden' : '' }}>
                                <div class="inline-flex items-center gap-3 min-w-0">
                                    <span class="file-icon">
                                        <i data-lucide="file-text" class="w-4 h-4 text-gray4"></i>
                                    </span>
                                    <span class="min-w-0 flex flex-col items-start gap-0.5">
                                        <span class="text-cb3 text-gray5 truncate max-w-full" data-review-attachment-name>
                                            {{ $attachment['name'] ?? '—' }}
                                        </span>
                                        <span class="text-[11px] font-medium text-gray3" data-review-attachment-meta>
                                            {{ !empty($attachment['sizeLabel']) ? $attachment['sizeLabel'] : '已上傳檔案' }}
                                        </span>
                                    </span>
                                </div>
                                <a
                                    href="{{ $attachment['url'] ?? '#' }}"
                                    class="px-3 py-2 text-[12px] btn-secondary"
                                    data-review-attachment-link
                                >
                                    查看／下載
                                </a>
                            </div>
                            <p class="text-cb3 text-gray3" data-review-attachment-empty {{ empty($attachment) ? '' : 'hidden' }}>
                                未上傳檔案
                            </p>
                        </section>
                    </div>
                </div>

                {{-- ========== 右側：審核處理 ========== --}}
                <aside class="review-aside">
                    <form class="review-panel" data-review-form novalidate>
                        <div class="self-stretch inline-flex items-center gap-3">
                            <span class="section-accent" aria-hidden="true"></span>
                            <h2 class="text-ch5 text-gray5" data-review-aside-title>審核處理</h2>
                        </div>

                        <div class="self-stretch flex flex-col gap-3" data-review-summary hidden>
                            <div class="self-stretch h-px bg-gray1" aria-hidden="true"></div>
                            @include('_components.review-result-summary', [
                                'title' => '審核中',
                                'titleBind' => 'data-review-summary-title',
                                'resultBind' => 'data-review-done-result',
                                'statusBind' => 'data-review-done-status',
                                'salesBind' => 'data-review-done-sales',
                                'noteBind' => 'data-review-done-note',
                            ])
                        </div>

                        <p class="text-cb3 text-gray3" data-review-hint hidden>
                            僅總管理者可操作。選擇審核結果後會更新商機狀態；指派原廠業務後，該筆會出現在對應業務帳號。
                        </p>

                        <div class="form-field" data-review-result-field hidden>
                            <span class="form-label">
                                <span class="text-red">*</span>
                                <span>審核結果</span>
                            </span>
                            <div class="form-select" data-form-select data-required>
                                <input type="hidden" name="review_result" value="" data-form-select-value>
                                <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                                    <span class="is-placeholder" data-form-select-label>請選擇審核結果</span>
                                    <i data-lucide="chevron-down" class="w-4 h-4 text-gray4 shrink-0"></i>
                                </button>
                                <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                                    @foreach ($page->opportunityReviewResults as $result)
                                        <button
                                            type="button"
                                            class="form-select-option"
                                            role="option"
                                            data-form-select-option
                                            data-value="{{ $result['value'] }}"
                                            data-label="{{ $result['label'] }}"
                                            data-status="{{ $result['status'] ?? '' }}"
                                            data-status-label="{{ $result['statusLabel'] ?? '' }}"
                                            data-allow-resubmit="{{ !empty($result['allowResubmit']) ? '1' : '0' }}"
                                        >
                                            <span class="inline-flex flex-col items-start gap-0.5 min-w-0">
                                                <span>{{ $result['label'] }}</span>
                                                @if (!empty($result['statusLabel']))
                                                    <span class="text-[11px] font-normal text-gray3 tracking-normal">
                                                        → 狀態：{{ $result['statusLabel'] }}
                                                    </span>
                                                @endif
                                            </span>
                                        </button>
                                    @endforeach
                                </div>
                            </div>
                        </div>

                        <div class="form-field" data-review-sales-field hidden>
                            <span class="form-label">
                                <span class="text-red">*</span>
                                <span>原廠業務</span>
                            </span>
                            <div class="form-select" data-form-select data-required>
                                <input type="hidden" name="assigned_sales" value="" data-form-select-value>
                                <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                                    <span class="is-placeholder" data-form-select-label>請選擇派發業務</span>
                                    <i data-lucide="chevron-down" class="w-4 h-4 text-gray4 shrink-0"></i>
                                </button>
                                <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                                    @foreach ($page->opportunityOemSalesOptions as $sales)
                                        <button
                                            type="button"
                                            class="form-select-option"
                                            role="option"
                                            data-form-select-option
                                            data-value="{{ $sales['value'] }}"
                                            data-label="{{ $sales['label'] }}"
                                        >
                                            {{ $sales['label'] }}
                                        </button>
                                    @endforeach
                                </div>
                            </div>
                        </div>

                        <label class="form-field" data-review-note-field hidden>
                            <span class="form-label"><span>審核備註</span></span>
                            <textarea
                                name="review_note"
                                class="form-input form-textarea"
                                placeholder="選填，例如選擇「其他」時補充說明"
                                data-review-note
                            ></textarea>
                        </label>

                        <div class="self-stretch flex flex-col gap-3 pt-1" data-review-actions>
                            <button type="submit" class="btn-primary w-full h-11" data-review-submit hidden>送出審核結果</button>
                            <button type="button" class="btn-primary w-full h-11" data-review-edit-btn hidden>修改審核</button>
                            <button type="button" class="btn-secondary w-full h-11" data-review-cancel-edit hidden>取消修改</button>
                            <a href="{{ $page->baseUrl }}/opportunities/" class="btn-secondary w-full h-11" data-review-cancel>取消</a>
                            <a
                                href="#"
                                class="btn-secondary w-full h-11"
                                data-review-resubmit-link
                                hidden
                            >
                                前往補件編輯
                            </a>
                        </div>
                    </form>
                </aside>
            </div>
        </div>
    </div>

    <script type="application/json" id="opportunity-catalog-data">
        {!! json_encode($catalog, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
    </script>
    <script type="application/json" id="opportunity-status-labels">
        {!! json_encode($statusOptions, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
    </script>
    <script type="application/json" id="opportunity-source-labels">
        {!! json_encode($sourceLabels, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
    </script>
    <script type="application/json" id="opportunity-relation-labels">
        {!! json_encode($relationLabels, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
    </script>
@endsection
