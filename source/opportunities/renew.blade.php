---
title: 商機續期申請
---
@extends('_layouts.app')

@php
    $catalog = $page->opportunityCatalog ?? [];
    $sample = $catalog['N260728001'] ?? reset($catalog);
    $statusOptions = [];
    foreach ($page->opportunityStatuses as $statusOption) {
        $statusOptions[$statusOption['value']] = $statusOption['label'];
    }
    $renewalDays = 90;
    $renewalDaysLabel = '90 天';
@endphp

@section('body')
    <div
        class="page-body"
        data-renew-page
        data-list-url="{{ $page->baseUrl }}/opportunities/"
    >
        <div class="content-wrapper">

            <div class="page-toolbar">
                <h1 class="text-ch4 text-gray5 truncate">商機續期申請</h1>
                <a href="{{ $page->baseUrl }}/opportunities/" class="btn-secondary">返回列表</a>
            </div>

            <section class="card-panel gap-3" data-renew-summary>
                <div class="self-stretch flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div class="min-w-0 flex flex-col gap-2">
                        <p class="text-eb2 text-gray3 uppercase" data-renew-id>{{ $sample['id'] }}</p>
                        <div class="inline-flex items-center gap-3 min-w-0">
                            <h2 class="text-ch5 text-gray5 truncate" data-renew-title>{{ $sample['title'] ?? ($sample['customer_company'] ?? '') }}</h2>
                            <span class="status-pill status-{{ $sample['status'] }}" data-renew-status-pill>{{ $sample['statusLabel'] ?? '' }}</span>
                        </div>
                    </div>
                    <div class="shrink-0 inline-flex items-baseline gap-2">
                        <span class="text-cb3 text-gray3">原保護期限</span>
                        <span class="text-cb3 text-brand2" data-renew-old-protection>{{ $sample['protection'] ?? '—' }}</span>
                    </div>
                </div>
            </section>

            <div class="form-stepper" data-renew-stepper aria-label="續期步驟">
                <div class="form-step is-active" data-renew-step="1">
                    <span class="form-step-index">1</span>
                    <span>填寫續期申請</span>
                </div>
                <span class="form-step-line" aria-hidden="true"></span>
                <div class="form-step" data-renew-step="2">
                    <span class="form-step-index">2</span>
                    <span>確認送出</span>
                </div>
            </div>

            <form class="self-stretch flex flex-col gap-5" data-renew-form novalidate>
                <section class="card-panel gap-4" data-renew-step-panel="1">
                    <div class="self-stretch inline-flex items-center gap-3">
                        <span class="section-accent" aria-hidden="true"></span>
                        <h2 class="text-ch5 text-gray5">填寫續期申請</h2>
                    </div>

                    <div class="self-stretch grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label class="form-field" data-renew-days-field>
                            <span class="form-label">
                                <span class="text-red">*</span>
                                <span>申請延長期限</span>
                            </span>
                            <input type="hidden" name="renew_days" value="{{ $renewalDays }}" data-renew-days>
                            <input
                                type="text"
                                class="form-input is-readonly"
                                value="{{ $renewalDaysLabel }}"
                                data-renew-days-label
                                readonly
                                tabindex="-1"
                            >
                        </label>

                        <label class="form-field">
                            <span class="form-label">
                                <span class="text-red">*</span>
                                <span>新保護期限</span>
                            </span>
                            <input
                                type="text"
                                name="new_protection"
                                class="form-input is-readonly"
                                value=""
                                data-renew-new-protection
                                readonly
                                tabindex="-1"
                            >
                        </label>
                    </div>

                    <label class="form-field">
                        <span class="form-label">
                            <span class="text-red">*</span>
                            <span>續期原因</span>
                        </span>
                        <textarea
                            name="renew_reason"
                            class="form-input min-h-[8rem] resize-none"
                            placeholder="請輸入原因。"
                            data-renew-reason
                            required
                        ></textarea>
                    </label>

                    <div class="form-field">
                        <span class="form-label"><span>上傳附件</span></span>
                        <p class="text-cb3 text-gray3">選填。可上傳 PDF、JPG，單檔 2MB 內。</p>
                        <div class="file-upload" data-file-upload>
                            <input type="file" class="sr-only" data-file-input accept=".pdf,.png,.jpg,.jpeg">
                            <input type="hidden" name="attachment_name" value="" data-file-name>
                            <input type="hidden" name="attachment_size" value="" data-file-size>
                            <input type="hidden" name="attachment_type" value="" data-file-type>

                            <button type="button" class="file-upload-dropzone" data-file-trigger>
                                <span class="file-icon">
                                    <i data-lucide="upload" class="w-4 h-4 text-gray4"></i>
                                </span>
                                <span class="min-w-0 flex flex-col items-start gap-0.5">
                                    <span class="text-cb3 text-gray5">點擊或拖曳檔案到此處上傳</span>
                                    <span class="text-[11px] font-medium text-gray3">支援 PDF、JPG，單檔 2MB 內</span>
                                </span>
                            </button>

                            <div class="file-upload-item" data-file-item hidden>
                                <div class="inline-flex items-center gap-3 min-w-0">
                                    <span class="file-icon">
                                        <i data-lucide="file-text" class="w-4 h-4 text-gray4"></i>
                                    </span>
                                    <span class="min-w-0 flex flex-col items-start gap-0.5">
                                        <span class="text-cb3 text-gray5 truncate max-w-full" data-file-item-name>—</span>
                                        <span class="text-cb3 text-gray3" data-file-item-meta>—</span>
                                    </span>
                                </div>
                                <button type="button" class="icon-action" data-file-remove aria-label="移除檔案">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="card-panel gap-4" data-renew-step-panel="2" hidden>
                    <div class="self-stretch inline-flex items-center gap-3">
                        <span class="section-accent" aria-hidden="true"></span>
                        <h2 class="text-ch5 text-gray5">確認送出</h2>
                    </div>
                    <p class="text-cb3 text-gray3">請確認以下續期內容。送出後將進入「審核中」，管理者核准後才會延長保護期。</p>
                    <div class="review-result-card">
                        <div class="review-result-row">
                            <span class="text-cb3 text-gray3 shrink-0">延長期限</span>
                            <span class="text-cb3 text-gray5 min-w-0 flex-1" data-renew-confirm-days>—</span>
                        </div>
                        <div class="review-result-row">
                            <span class="text-cb3 text-gray3 shrink-0">新保護期</span>
                            <span class="text-cb3 text-gray5 min-w-0 flex-1" data-renew-confirm-protection>—</span>
                        </div>
                        <div class="review-result-row">
                            <span class="text-cb3 text-gray3 shrink-0">續期原因</span>
                            <span class="text-cb3 text-gray5 min-w-0 flex-1 whitespace-pre-wrap" data-renew-confirm-reason>—</span>
                        </div>
                        <div class="review-result-row">
                            <span class="text-cb3 text-gray3 shrink-0">上傳附件</span>
                            <span class="text-cb3 text-gray5 min-w-0 flex-1" data-renew-confirm-file>—</span>
                        </div>
                    </div>
                </section>

                <div class="self-stretch inline-flex flex-wrap justify-end items-center gap-2">
                    <button type="button" class="btn-secondary" data-renew-back hidden>上一步</button>
                    <a href="{{ $page->baseUrl }}/opportunities/" class="btn-secondary" data-renew-cancel>取消</a>
                    <button type="button" class="btn-primary" data-renew-next>下一步</button>
                    <button type="submit" class="btn-primary" data-renew-submit hidden>送出續期審核</button>
                </div>
            </form>
        </div>
    </div>

    <script type="application/json" id="opportunity-catalog-data">
        {!! json_encode($catalog, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
    </script>
    <script type="application/json" id="opportunity-status-labels">
        {!! json_encode($statusOptions, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
    </script>
@endsection
