---
title: 新增商機
---
@extends('_layouts.app')

@php
    $statusLabels = [];
    foreach ($page->opportunityStatuses as $statusOption) {
        $statusLabels[$statusOption['value']] = $statusOption['label'];
    }
@endphp

@section('body')
    <div class="page-body">
        <div class="content-wrapper">

            <div class="page-toolbar">
                <h1 class="text-ch4 text-gray5 truncate" data-page-heading>新增商機</h1>
                <a href="{{ $page->baseUrl }}/opportunities/" class="btn-secondary">返回列表</a>
            </div>

            <form
                class="self-stretch"
                data-opportunity-form
                data-cancel-url="{{ $page->baseUrl }}/opportunities/"
                data-list-url="{{ $page->baseUrl }}/opportunities/"
                data-create-url="{{ $page->baseUrl }}/opportunities/create/"
                data-review-url="{{ $page->baseUrl }}/opportunities/review/"
                data-renew-url="{{ $page->baseUrl }}/opportunities/renew/"
                data-partner-company="{{ $page->partner['company'] }}"
                data-partner-contact="{{ $page->partner['contact'] }}"
                novalidate
            >
                <div class="review-layout">

                    {{-- ========== 左側：表單內容 ========== --}}
                    <div class="review-main">

                        {{-- 商機來源 + 原廠負責資訊 --}}
                        <div class="self-stretch flex flex-col md:flex-row items-stretch gap-5">
                            <section class="card-panel flex-1 gap-4">
                                <div class="self-stretch inline-flex items-center gap-3">
                                    <span class="section-accent" aria-hidden="true"></span>
                                    <h2 class="text-ch5 text-gray5">商機來源</h2>
                                </div>

                                <div class="self-stretch flex flex-col items-start gap-1">
                                    <div class="inline-flex items-center gap-1">
                                        <span class="text-cb2 text-red">*</span>
                                        <span class="text-cb2 text-gray5">商機來源</span>
                                    </div>
                                    <div class="self-stretch inline-flex items-start gap-4" data-source-group>
                                        @foreach ($page->opportunitySources as $index => $source)
                                            <label class="source-option flex-1 {{ $index === 0 ? 'is-selected' : '' }}">
                                                <input
                                                    type="radio"
                                                    name="source"
                                                    value="{{ $source['value'] }}"
                                                    class="sr-only"
                                                    {{ $index === 0 ? 'checked' : '' }}
                                                    data-source-input
                                                >
                                                <span class="source-radio" aria-hidden="true"></span>
                                                <span class="source-option-label">{{ $source['label'] }}</span>
                                            </label>
                                        @endforeach
                                    </div>
                                </div>
                            </section>

                            <section class="card-panel flex-1 gap-4">
                                <div class="self-stretch inline-flex items-center gap-3">
                                    <span class="section-accent" aria-hidden="true"></span>
                                    <h2 class="text-ch5 text-gray5">原廠負責資訊</h2>
                                </div>

                                <label class="form-field">
                                    <span class="form-label">
                                        <span class="text-red">*</span>
                                        <span>原廠所屬業務</span>
                                    </span>
                                    <input type="text" name="oem_sales" class="form-input" placeholder="請輸入業務姓名" required>
                                </label>
                            </section>
                        </div>

                        {{-- 報備者資料 --}}
                        <section class="card-panel gap-5">
                            <div class="self-stretch inline-flex justify-between items-center gap-3">
                                <div class="inline-flex items-center gap-3">
                                    <span class="section-accent" aria-hidden="true"></span>
                                    <h2 class="text-ch5 text-gray5">報備者資料</h2>
                                </div>
                                <p class="text-cb3 text-gray3">登入後由會員資料自動帶入</p>
                            </div>

                            <div class="self-stretch flex flex-col items-start gap-4">
                                <label class="form-field">
                                    <span class="form-label">
                                        <span class="text-red">*</span>
                                        <span>報備者經銷商／業務</span>
                                    </span>
                                    <input
                                        type="text"
                                        name="reporter_dealer"
                                        class="form-input is-readonly"
                                        value="{{ $page->partner['company'] }}／{{ $page->partner['contact'] }}"
                                        readonly
                                        tabindex="-1"
                                    >
                                </label>
                                <label class="form-field">
                                    <span class="form-label">
                                        <span class="text-red">*</span>
                                        <span>報備者聯絡電話</span>
                                    </span>
                                    <input
                                        type="text"
                                        name="reporter_phone"
                                        class="form-input is-readonly"
                                        value="{{ $page->partner['phone'] }}"
                                        readonly
                                        tabindex="-1"
                                    >
                                </label>
                            </div>
                        </section>

                        {{-- 客戶資料 --}}
                        <section class="card-panel gap-5">
                            <div class="self-stretch inline-flex items-center gap-3">
                                <span class="section-accent" aria-hidden="true"></span>
                                <h2 class="text-ch5 text-gray5">客戶資料</h2>
                            </div>

                            <div class="self-stretch grid grid-cols-1 md:grid-cols-2 gap-4">
                                @foreach ($page->opportunityCustomerFields as $field)
                                    <label class="form-field">
                                        <span class="form-label">
                                            <span class="text-red">*</span>
                                            <span>{{ $field['label'] }}</span>
                                        </span>
                                        <input
                                            type="{{ $field['type'] }}"
                                            name="{{ $field['name'] }}"
                                            class="form-input"
                                            placeholder="{{ $field['placeholder'] }}"
                                            required
                                        >
                                    </label>
                                @endforeach

                                <div class="form-field md:col-span-2">
                                    <span class="form-label">
                                        <span class="text-red">*</span>
                                        <span>客戶關係</span>
                                    </span>
                                    <div class="form-select" data-form-select data-required>
                                        <input type="hidden" name="customer_relation" value="" data-form-select-value>
                                        <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                                            <span class="is-placeholder" data-form-select-label>第一次接洽 / 多次接洽(未成交) / 其他</span>
                                            <i data-lucide="chevron-down" class="w-4 h-4 text-gray4 shrink-0"></i>
                                        </button>
                                        <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                                            @foreach ($page->opportunityCustomerRelations as $relation)
                                                <button type="button" class="form-select-option" role="option" data-form-select-option data-value="{{ $relation['value'] }}" data-label="{{ $relation['label'] }}">
                                                    {{ $relation['label'] }}
                                                </button>
                                            @endforeach
                                        </div>
                                    </div>
                                </div>

                                @foreach ($page->opportunityKeyManFields as $field)
                                    <label class="form-field {{ $field['name'] === 'keyman_email' ? 'md:col-span-2' : '' }}">
                                        <span class="form-label">
                                            <span class="text-red">*</span>
                                            <span>{{ $field['label'] }}</span>
                                        </span>
                                        <input
                                            type="{{ $field['type'] }}"
                                            name="{{ $field['name'] }}"
                                            class="form-input"
                                            placeholder="{{ $field['placeholder'] }}"
                                            required
                                        >
                                    </label>
                                @endforeach
                            </div>
                        </section>

                        {{-- 專案細節 --}}
                        <div class="self-stretch flex flex-col items-start gap-4">
                            <section class="card-panel gap-4">
                                <div class="self-stretch inline-flex items-center gap-3">
                                    <span class="section-accent" aria-hidden="true"></span>
                                    <h2 class="text-ch5 text-gray5">專案細節</h2>
                                </div>

                                <div class="self-stretch inline-flex items-center gap-1">
                                    <span class="text-cb2 text-red">*</span>
                                    <span class="text-cb2 text-gray5">專案產品／U數</span>
                                </div>

                                <div class="self-stretch flex flex-col items-start gap-3" data-product-rows>
                                    @foreach ($page->opportunityDefaultProducts as $row)
                                        @include('_components.opportunity-product-row', [
                                            'selectedProduct' => $row['product'],
                                            'selectedUnits' => $row['units'],
                                            'showPlaceholder' => false,
                                        ])
                                    @endforeach
                                </div>

                                <button type="button" class="btn-dashed" data-add-product>
                                    <i data-lucide="plus" class="w-4 h-4"></i>
                                    <span>新增其他展品</span>
                                </button>
                            </section>

                            <section class="card-panel gap-5">
                                <div class="self-stretch flex flex-col md:flex-row items-stretch gap-6">
                                    <div class="flex-1 flex flex-col items-start gap-4">
                                        @foreach ($page->opportunityDates as $dateField)
                                            <label class="form-field">
                                                <span class="form-label">
                                                    <span class="text-red">*</span>
                                                    <span>{{ $dateField['label'] }}</span>
                                                </span>
                                                <span class="form-date-wrap">
                                                    <input type="date" name="{{ $dateField['name'] }}" class="form-input form-date" required>
                                                    <i data-lucide="calendar" class="form-date-icon"></i>
                                                </span>
                                            </label>
                                        @endforeach
                                    </div>

                                    <label class="flex-1 self-stretch flex flex-col items-start gap-1">
                                        <span class="form-label">
                                            <span>競爭品牌／方案</span>
                                        </span>
                                        <textarea
                                            name="competitors"
                                            class="form-input form-textarea"
                                            placeholder="若有競品請填寫（選填）"
                                        ></textarea>
                                    </label>
                                </div>
                            </section>

                            <section class="card-panel gap-4">
                                <div class="self-stretch inline-flex items-center gap-3">
                                    <span class="section-accent" aria-hidden="true"></span>
                                    <h2 class="text-ch5 text-gray5">檔案上傳</h2>
                                </div>
                                <p class="text-cb3 text-gray3">選填。可上傳需求規格、簡報或其他佐證檔案（PDF、Word、Excel、圖片，單檔 2MB 內）。</p>

                                <div class="file-upload" data-file-upload>
                                    <input type="file" class="sr-only" data-file-input accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif">
                                    <input type="hidden" name="attachment_name" value="" data-file-name>
                                    <input type="hidden" name="attachment_size" value="" data-file-size>
                                    <input type="hidden" name="attachment_type" value="" data-file-type>

                                    <button type="button" class="file-upload-dropzone" data-file-trigger>
                                        <span class="file-icon">
                                            <i data-lucide="upload" class="w-4 h-4 text-gray4"></i>
                                        </span>
                                        <span class="min-w-0 flex flex-col items-start gap-0.5">
                                            <span class="text-cb3 text-gray5">點擊或拖曳檔案到此處上傳</span>
                                            <span class="text-[11px] font-medium text-gray3">支援 PDF、DOC、XLS、PNG、JPG</span>
                                        </span>
                                    </button>

                                    <div class="file-upload-item" data-file-item hidden>
                                        <div class="inline-flex items-center gap-3 min-w-0">
                                            <span class="file-icon">
                                                <i data-lucide="file-text" class="w-4 h-4 text-gray4"></i>
                                            </span>
                                            <span class="min-w-0 flex flex-col items-start gap-0.5">
                                                <span class="text-cb3 text-gray5 truncate max-w-full" data-file-item-name>—</span>
                                                <span class="text-[11px] font-medium text-gray3" data-file-item-meta>—</span>
                                            </span>
                                        </div>
                                        <button type="button" class="icon-action" data-file-remove aria-label="移除檔案">
                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>

                    {{-- ========== 右側：操作／送出後狀態說明 ========== --}}
                    <aside class="review-aside">
                        <div class="review-panel">
                            <div class="self-stretch inline-flex items-center gap-3">
                                <span class="section-accent" aria-hidden="true"></span>
                                <h2 class="text-ch5 text-gray5" data-create-aside-title>送出與暫存</h2>
                            </div>

                            <p class="text-cb3 text-gray3" data-create-aside-hint>
                                確認送出後即進入「審核中」，便無法再修改。送出前請確認資料完整，或可先儲存暫存檔。
                            </p>

                            <div class="self-stretch h-px bg-gray1" data-create-review-divider hidden aria-hidden="true"></div>

                            <div class="self-stretch flex flex-col gap-3" data-create-review-result hidden>
                                @include('_components.review-result-summary', [
                                    'title' => '審核結果',
                                    'resultBind' => 'data-create-review-result-label',
                                    'statusBind' => 'data-create-review-status-label',
                                    'salesBind' => 'data-create-review-sales-label',
                                    'noteBind' => 'data-create-review-note',
                                ])
                                <p class="text-cb3 text-brand2" data-create-review-resubmit-hint hidden>
                                    此商機已退回補件，請修正後再次確認送出。
                                </p>
                            </div>

                            {{-- 總管理者：在補件頁就地修改審核，不跳轉審核頁 --}}
                            <div class="self-stretch flex flex-col gap-4" data-create-review-edit hidden>
                                <p class="text-cb3 text-gray3">修改後送出，會依新的審核結果更新案件狀態。</p>

                                <div class="form-field" data-create-review-result-field>
                                    <span class="form-label">
                                        <span class="text-red">*</span>
                                        <span>審核結果</span>
                                    </span>
                                    <div class="form-select" data-form-select data-required data-create-review-result-select>
                                        <input type="hidden" name="create_review_result" value="" data-form-select-value>
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

                                <div class="form-field" data-create-review-sales-field>
                                    <span class="form-label">
                                        <span class="text-red">*</span>
                                        <span>原廠業務</span>
                                    </span>
                                    <div class="form-select" data-form-select data-required data-create-review-sales-select>
                                        <input type="hidden" name="create_assigned_sales" value="" data-form-select-value>
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

                                <label class="form-field" data-create-review-note-field>
                                    <span class="form-label"><span>審核備註</span></span>
                                    <textarea
                                        name="create_review_note"
                                        class="form-input form-textarea"
                                        placeholder="選填，例如選擇「其他」時補充說明"
                                        data-create-review-note-input
                                    ></textarea>
                                </label>
                            </div>

                            <div class="self-stretch flex flex-col gap-3 pt-1">
                                <button type="submit" class="btn-primary w-full h-11" data-create-submit-label>確認送出</button>
                                <button type="button" class="btn-secondary w-full h-11" data-create-edit-review hidden>修改審核</button>
                                <button type="button" class="btn-primary w-full h-11" data-create-update-review hidden>更新審核結果</button>
                                <button type="button" class="btn-secondary w-full h-11" data-create-cancel-edit-review hidden>取消修改</button>
                                <button type="button" class="btn-secondary w-full h-11" data-save-draft>儲存暫存檔</button>
                                <a href="{{ $page->baseUrl }}/opportunities/" class="btn-secondary w-full h-11" data-create-cancel>取消</a>
                            </div>
                        </div>
                    </aside>
                </div>
            </form>
        </div>
    </div>

    <template data-product-row-template>
        @include('_components.opportunity-product-row', [
            'selectedProduct' => '',
            'selectedUnits' => '0-499',
            'showPlaceholder' => true,
        ])
    </template>

    <script type="application/json" id="opportunity-catalog-data">
        {!! json_encode($page->opportunityCatalog ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
    </script>
    <script type="application/json" id="opportunity-status-labels">
        {!! json_encode($statusLabels, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
    </script>
@endsection
