---
title: 技術支援中心
---
@extends('_layouts.app')

@php
    $typeLabels = [];
    foreach ($page->supportFaqTypes as $option) {
        $typeLabels[$option['value']] = $option['label'];
    }
    $moduleLabels = [];
    foreach ($page->supportFaqModules as $option) {
        $moduleLabels[$option['value']] = $option['label'];
    }
    $statusMap = [];
    foreach ($page->supportTicketStatuses as $option) {
        $statusMap[$option['value']] = $option;
    }
    $ticketTypeLabels = [];
    foreach ($page->supportTicketTypes as $option) {
        $ticketTypeLabels[$option['value']] = $option['label'];
    }
@endphp

@section('body')
    <div class="page-body">
        <div
            class="content-wrapper"
            data-support-center
            data-faq-page-size="5"
            data-ticket-page-size="5"
            data-download-page-size="5"
            data-manage="support.manage"
            data-list-url="{{ $page->baseUrl }}/support/"
            data-ticket-url="{{ $page->baseUrl }}/support/ticket/"
            data-faq-create-url="{{ $page->baseUrl }}/support/faq/"
            data-download-create-url="{{ $page->baseUrl }}/support/download/"
        >

            <div class="self-stretch flex justify-end">
                <a href="{{ $page->baseUrl }}/support/create/" class="btn-primary" data-requires="support.create">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    <span>建立技術工單</span>
                </a>
            </div>

            {{-- ========== 技術 FAQ：兩階層分類（問題類型／對應模組） ========== --}}
            <section class="list-card">
                <div class="self-stretch px-5 pt-5 pb-5 flex flex-col gap-4">
                    <div class="self-stretch flex flex-col gap-4">
                        <div class="self-stretch flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div class="inline-flex items-center gap-3">
                                <span class="section-accent" aria-hidden="true"></span>
                                <h2 class="text-ch5 text-gray5">技術 FAQ</h2>
                            </div>
                            <div class="flex flex-wrap items-center gap-2">
                                <button type="button" class="btn-secondary shrink-0" data-faq-manage-categories="type" data-requires="support.manage">
                                    <i data-lucide="layers" class="w-4 h-4"></i>
                                    <span>管理分類</span>
                                </button>
                                <button type="button" class="btn-secondary shrink-0" data-faq-sort data-requires="support.manage">
                                    <i data-lucide="list-ordered" class="w-4 h-4"></i>
                                    <span>排序 FAQ</span>
                                </button>
                                <a href="{{ $page->baseUrl }}/support/faq/" class="btn-primary shrink-0" data-requires="support.manage">
                                    <i data-lucide="plus" class="w-4 h-4"></i>
                                    <span>新增 FAQ</span>
                                </a>
                            </div>
                        </div>

                        <div class="self-stretch flex flex-col py-2 px-2 bg-bg border border-gray1 rounded-[8px] md:flex-row md:items-center md:justify-start gap-2">
                            <label class="search-field w-full px-3 py-2.5 bg-white rounded-[8px] outline outline-1 outline-offset-[-1px] outline-gray1 inline-flex items-center gap-2">
                                <i data-lucide="search" class="w-3.5 h-3.5 text-gray3 shrink-0"></i>
                                <span class="sr-only">搜尋關鍵字</span>
                                <input type="search" name="q" placeholder="搜尋關鍵字" class="w-full min-w-0 bg-transparent text-cb3 text-gray5 placeholder:text-gray3 outline-none" data-support-search>
                                <button type="button" class="search-clear" data-search-clear hidden aria-label="清除搜尋">
                                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                                </button>
                            </label>

                            <div class="form-select w-full md:w-56" data-form-select data-faq-filter="type">
                                <input type="hidden" value="" data-form-select-value>
                                <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                                    <span class="is-placeholder" data-form-select-label>問題類型</span>
                                    <i data-lucide="chevron-down" class="w-4 h-4 text-gray4"></i>
                                </button>
                                <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                                    <button type="button" class="form-select-option is-selected" role="option" data-form-select-option data-value="" data-label="問題類型">全部</button>
                                    @foreach ($page->supportFaqTypes as $option)
                                        <button type="button" class="form-select-option" role="option" data-form-select-option data-value="{{ $option['value'] }}" data-label="{{ $option['label'] }}">{{ $option['label'] }}</button>
                                    @endforeach
                                </div>
                            </div>

                            <div class="form-select w-full md:w-56" data-form-select data-faq-filter="module">
                                <input type="hidden" value="" data-form-select-value>
                                <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                                    <span class="is-placeholder" data-form-select-label>對應模組</span>
                                    <i data-lucide="chevron-down" class="w-4 h-4 text-gray4"></i>
                                </button>
                                <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                                    <button type="button" class="form-select-option is-selected" role="option" data-form-select-option data-value="" data-label="對應模組">全部</button>
                                    @foreach ($page->supportFaqModules as $option)
                                        <button type="button" class="form-select-option" role="option" data-form-select-option data-value="{{ $option['value'] }}" data-label="{{ $option['label'] }}">{{ $option['label'] }}</button>
                                    @endforeach
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="self-stretch flex flex-col">
                        <div class="self-stretch flex flex-col" data-faq-list></div>
                        <div class="px-1 py-10 text-center text-cb3 text-gray3" data-faq-empty hidden>
                            沒有符合條件的 FAQ
                        </div>
                    </div>

                    <div class="pagination-bar px-0 pt-4">
                        <p class="text-eb3 text-gray3 uppercase" data-faq-summary>Showing 1-5 of {{ count($page->supportFaqs) }} results</p>
                        <nav class="pagination-nav self-start md:self-auto" aria-label="FAQ 分頁" data-faq-pagination>
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
            </section>

            {{-- ========== 我的技術工單 ========== --}}
            <section class="list-card">
                <div class="self-stretch px-5 pt-5 pb-2 inline-flex items-center gap-3">
                    <span class="section-accent" aria-hidden="true"></span>
                    <h2 class="text-ch5 text-gray5">我的技術工單</h2>
                </div>

                <div class="list-card-body">
                    <div class="self-stretch overflow-x-auto">
                        <div class="min-w-[880px]">
                            <div class="list-head">
                                <div class="w-32 text-cb3 text-gray4">工單編號</div>
                                <div class="w-28 text-cb3 text-gray4">客戶</div>
                                <div class="flex-1 text-cb3 text-gray4">問題主旨</div>
                                <div class="w-28 text-cb3 text-gray4">更新</div>
                                <div class="w-24 text-cb3 text-gray4">處理人員</div>
                                <div class="w-24 text-cb3 text-gray4">狀態</div>
                                <div class="w-14 text-cb3 text-gray4 text-right pr-1">動作</div>
                            </div>

                            <div class="flex flex-col" data-ticket-rows>
                                @foreach ($page->supportTickets as $item)
                                    @php
                                        $status = $statusMap[$item['status']] ?? ['value' => $item['status'], 'label' => $item['status']];
                                    @endphp
                                    <div
                                        class="list-row list-row-link"
                                        data-ticket-row
                                        data-ticket-open
                                        data-ticket-id="{{ $item['id'] }}"
                                        data-status="{{ $item['status'] }}"
                                        data-search="{{ $item['id'] }} {{ $item['customer'] }} {{ $item['subject'] }} {{ $item['assignee'] }} {{ $status['label'] }}"
                                        role="button"
                                        tabindex="0"
                                        aria-label="檢視工單 {{ $item['id'] }}"
                                    >
                                        <div class="w-32 text-eb2 text-gray5 uppercase" data-ticket-id-text>{{ $item['id'] }}</div>
                                        <div class="w-28 text-cb3 text-gray5">{{ $item['customer'] }}</div>
                                        <div class="flex-1 pr-4 text-cb3 text-gray5">{{ $item['subject'] }}</div>
                                        <div class="w-28 text-cb3 text-gray4" data-ticket-updated>{{ $item['updated'] }}</div>
                                        <div class="w-24 text-cb3 text-gray5" data-ticket-assignee>{{ $item['assignee'] }}</div>
                                        <div class="w-24">
                                            <span class="status-pill status-{{ $status['value'] }}" data-ticket-status>{{ $status['label'] }}</span>
                                        </div>
                                        <div class="w-14 shrink-0 inline-flex items-center justify-end">
                                            <span class="icon-action pointer-events-none" aria-hidden="true">
                                                <i data-lucide="eye" class="w-4 h-4"></i>
                                            </span>
                                        </div>
                                    </div>
                                @endforeach
                                <div class="list-empty" data-ticket-empty hidden>
                                    沒有符合條件的工單
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="pagination-bar">
                        <p class="text-eb3 text-gray3 uppercase" data-ticket-summary>Showing 1-5 of {{ count($page->supportTickets) }} results</p>
                        <nav class="pagination-nav self-start md:self-auto" aria-label="工單分頁" data-ticket-pagination>
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
            </section>

            {{-- ========== 檔案下載：清單由 download-admin.js 依語系與 localStorage 渲染 ========== --}}
            <section class="list-card">
                <div class="self-stretch px-5 pt-5 pb-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div class="inline-flex items-center gap-3">
                        <span class="section-accent" aria-hidden="true"></span>
                        <h2 class="text-ch5 text-gray5">檔案下載</h2>
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                        <button type="button" class="btn-secondary shrink-0" data-download-sort data-requires="support.manage">
                            <i data-lucide="list-ordered" class="w-4 h-4"></i>
                            <span>排序檔案</span>
                        </button>
                        <a href="{{ $page->baseUrl }}/support/download/" class="btn-primary shrink-0" data-requires="support.manage">
                            <i data-lucide="plus" class="w-4 h-4"></i>
                            <span>新增檔案</span>
                        </a>
                    </div>
                </div>

                <div class="self-stretch px-5 pt-3 pb-5 flex flex-col gap-2">
                    <div class="self-stretch flex flex-col gap-2" data-download-list></div>
                    <div class="px-1 py-10 text-center text-cb3 text-gray3" data-download-empty hidden>
                        尚未提供可下載的檔案
                    </div>

                    <div class="pagination-bar px-0 pt-4">
                        <p class="text-eb3 text-gray3 uppercase" data-download-summary>Showing 1-5 of {{ count($page->supportDownloads) }} results</p>
                        <nav class="pagination-nav self-start md:self-auto" aria-label="檔案下載分頁" data-download-pagination>
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
            </section>
        </div>
    </div>

    <template data-ticket-row-template>
        <div
            class="list-row list-row-link"
            data-ticket-row
            data-ticket-open
            data-ticket-id=""
            data-status=""
            data-search=""
            role="button"
            tabindex="0"
            aria-label="檢視工單"
        >
            <div class="w-32 text-eb2 text-gray5 uppercase" data-ticket-id-text></div>
            <div class="w-28 text-cb3 text-gray5" data-ticket-customer></div>
            <div class="flex-1 pr-4 text-cb3 text-gray5" data-ticket-subject></div>
            <div class="w-28 text-cb3 text-gray4" data-ticket-updated></div>
            <div class="w-24 text-cb3 text-gray5" data-ticket-assignee></div>
            <div class="w-24">
                <span class="status-pill" data-ticket-status></span>
            </div>
            <div class="w-14 shrink-0 inline-flex items-center justify-end">
                <span class="icon-action pointer-events-none" aria-hidden="true">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                </span>
            </div>
        </div>
    </template>

    <div class="app-modal-host" data-ticket-modal hidden>
        <div class="app-modal-backdrop" data-ticket-modal-dismiss></div>
        <div class="app-modal-panel ticket-modal-panel" role="dialog" aria-modal="true" aria-labelledby="ticket-modal-title">
            <div class="ticket-modal-header">
                <div class="min-w-0 flex flex-col items-start gap-1.5">
                    <div class="inline-flex items-center gap-2">
                        <span class="text-eb2 text-gray4 uppercase" data-ticket-modal-id>—</span>
                        <span class="status-pill" data-ticket-modal-status-pill></span>
                    </div>
                    <h3 id="ticket-modal-title" class="text-ch5 text-gray5" data-ticket-modal-subject>—</h3>
                </div>
                <button type="button" class="icon-action shrink-0" data-ticket-modal-dismiss aria-label="關閉">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>

            <div class="ticket-modal-body">
                <section class="self-stretch flex flex-col gap-3">
                    <div class="inline-flex items-center gap-3">
                        <span class="section-accent" aria-hidden="true"></span>
                        <h4 class="text-cb1 text-gray5">工單資訊</h4>
                    </div>
                    <div class="review-result-card">
                        <div class="review-result-row">
                            <span class="w-24 shrink-0 text-cb3 text-gray3">客戶</span>
                            <span class="flex-1 min-w-0 text-cb3 text-gray5" data-ticket-modal-customer>—</span>
                        </div>
                        <div class="review-result-row">
                            <span class="w-24 shrink-0 text-cb3 text-gray3">產品 / 版本</span>
                            <span class="flex-1 min-w-0 text-cb3 text-gray5" data-ticket-modal-product>—</span>
                        </div>
                        <div class="review-result-row">
                            <span class="w-24 shrink-0 text-cb3 text-gray3">問題類型</span>
                            <span class="flex-1 min-w-0 text-cb3 text-gray5" data-ticket-modal-type>—</span>
                        </div>
                        <div class="review-result-row">
                            <span class="w-24 shrink-0 text-cb3 text-gray3">聯絡人</span>
                            <span class="flex-1 min-w-0 text-cb3 text-gray5" data-ticket-modal-contact>—</span>
                        </div>
                        <div class="review-result-row">
                            <span class="w-24 shrink-0 text-cb3 text-gray3">處理人員</span>
                            <span class="flex-1 min-w-0 text-cb3 text-gray5" data-ticket-modal-assignee>—</span>
                        </div>
                        <div class="review-result-row">
                            <span class="w-24 shrink-0 text-cb3 text-gray3">建立時間</span>
                            <span class="flex-1 min-w-0 text-cb3 text-gray5" data-ticket-modal-created>—</span>
                        </div>
                        <div class="review-result-row">
                            <span class="w-24 shrink-0 text-cb3 text-gray3">最後更新</span>
                            <span class="flex-1 min-w-0 text-cb3 text-gray5" data-ticket-modal-updated>—</span>
                        </div>
                    </div>
                </section>

                <section class="self-stretch flex flex-col gap-3">
                    <div class="inline-flex items-center gap-3">
                        <span class="section-accent" aria-hidden="true"></span>
                        <h4 class="text-cb1 text-gray5">詳細狀況描述</h4>
                    </div>
                    <p class="text-cb3 text-gray4 whitespace-pre-wrap" data-ticket-modal-description>—</p>
                </section>

                <section class="self-stretch flex flex-col gap-3" data-ticket-modal-attachment-section hidden>
                    <div class="inline-flex items-center gap-3">
                        <span class="section-accent" aria-hidden="true"></span>
                        <h4 class="text-cb1 text-gray5">附件</h4>
                    </div>
                    <div class="file-upload-item">
                        <div class="inline-flex items-center gap-3 min-w-0">
                            <span class="file-icon">
                                <i data-lucide="file-text" class="w-4 h-4 text-gray4"></i>
                            </span>
                            <span class="min-w-0 flex flex-col items-start gap-0.5">
                                <span class="text-cb3 text-gray5 truncate max-w-full" data-ticket-modal-attachment-name>—</span>
                                <span class="text-[11px] font-medium text-gray3" data-ticket-modal-attachment-meta></span>
                            </span>
                        </div>
                        <a
                            href="#"
                            class="px-3 py-2 text-[12px] btn-secondary shrink-0"
                            data-ticket-modal-attachment-link
                        >
                            查看／下載
                        </a>
                    </div>
                </section>

                <section class="self-stretch flex flex-col gap-3" data-ticket-modal-note-section>
                    <div class="inline-flex items-center gap-3">
                        <span class="section-accent" aria-hidden="true"></span>
                        <h4 class="text-cb1 text-gray5">處理說明</h4>
                    </div>
                    <p class="text-cb3 text-gray4 whitespace-pre-wrap" data-ticket-modal-note>—</p>
                </section>

                {{-- 管理者：處理並回覆建單人，內容不分語系 --}}
                <section class="self-stretch flex flex-col gap-4" data-ticket-manage hidden>
                    <div class="inline-flex items-center gap-3">
                        <span class="section-accent" aria-hidden="true"></span>
                        <h4 class="text-cb1 text-gray5">處理工單</h4>
                    </div>

                    <div class="self-stretch grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="self-stretch flex flex-col items-start gap-2">
                            <span class="form-label">
                                <span>狀態</span>
                            </span>
                            <div class="form-select self-stretch" data-form-select data-ticket-manage-status>
                                <input type="hidden" value="" data-form-select-value>
                                <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                                    <span data-form-select-label>未處理</span>
                                    <i data-lucide="chevron-down" class="w-4 h-4 text-gray4"></i>
                                </button>
                                <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                                    <div class="form-select-options" data-form-select-options>
                                        @foreach ($page->supportTicketStatuses as $statusOption)
                                            <button type="button" class="form-select-option" role="option" data-form-select-option data-value="{{ $statusOption['value'] }}" data-label="{{ $statusOption['label'] }}">{{ $statusOption['label'] }}</button>
                                        @endforeach
                                    </div>
                                </div>
                            </div>
                        </div>

                        <label class="form-field">
                            <span class="form-label">
                                <span>處理人員</span>
                            </span>
                            <input type="text" class="form-input" placeholder="請輸入處理人員" maxlength="20" data-ticket-manage-assignee>
                        </label>
                    </div>

                    <label class="form-field">
                        <span class="form-label">
                            <span>回覆建單人</span>
                        </span>
                        <textarea class="form-input min-h-[8rem]" rows="5" placeholder="請輸入回覆內容，建單人會在工單的「處理說明」看到這段文字" data-ticket-manage-note></textarea>
                    </label>
                </section>
            </div>

            <div class="ticket-modal-footer">
                <button type="button" class="btn-secondary" data-ticket-modal-dismiss>關閉</button>
                <button type="button" class="btn-primary" data-ticket-manage-save hidden>儲存處理結果</button>
            </div>
        </div>
    </div>

    <script type="application/json" id="support-center-data">
        {!! json_encode([
            'tickets' => $page->supportTickets,
            'statuses' => $statusMap,
            'types' => $typeLabels,
            'ticketTypes' => $ticketTypeLabels,
            'modules' => $moduleLabels,
            'typeOptions' => $page->supportFaqTypes,
            'moduleOptions' => $page->supportFaqModules,
            'faqs' => $page->supportFaqs,
            'downloads' => $page->supportDownloads,
            'locales' => $page->locales,
            'capability' => 'support.manage',
            'ticketUrl' => rtrim($page->baseUrl, '/') . '/support/ticket/',
            'createFaqUrl' => rtrim($page->baseUrl, '/') . '/support/faq/',
            'createDownloadUrl' => rtrim($page->baseUrl, '/') . '/support/download/',
            'listUrl' => rtrim($page->baseUrl, '/') . '/support/',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
    </script>
@endsection
