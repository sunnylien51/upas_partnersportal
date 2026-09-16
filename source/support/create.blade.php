---
title: 建立技術工單
---
@extends('_layouts.app')

@section('body')
    <div class="page-body">
        <div class="content-wrapper">

            <div class="page-toolbar">
                <h1 class="text-ch4 text-gray5 truncate">建立技術工單</h1>
                <a href="{{ $page->baseUrl }}/support/" class="btn-secondary">返回列表</a>
            </div>

            <form
                class="self-stretch"
                data-support-ticket-form
                data-list-url="{{ $page->baseUrl }}/support/"
                novalidate
            >
                <div class="review-layout">
                    <div class="review-main">

                        <section class="card-panel gap-5">
                            <div class="self-stretch inline-flex items-center gap-3">
                                <span class="section-accent" aria-hidden="true"></span>
                                <h2 class="text-ch5 text-gray5">工單資料</h2>
                            </div>

                            <div class="self-stretch grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label class="form-field">
                                    <span class="form-label">
                                        <span class="text-red">*</span>
                                        <span>客戶</span>
                                    </span>
                                    <input type="text" name="customer" class="form-input" placeholder="XX 科技" required>
                                </label>

                                <div class="form-field">
                                    <div class="form-label">
                                        <span class="text-red">*</span>
                                        <span>產品 / 版本</span>
                                        <button
                                            type="button"
                                            class="ml-1 text-cb3 text-brand2 underline underline-offset-2 hover:text-brand"
                                            data-version-help-open
                                        >
                                            (怎麼看版本)
                                        </button>
                                    </div>
                                    <input type="text" name="product" class="form-input" placeholder="ARP / v3.5.2" required>
                                </div>

                                <label class="form-field md:col-span-2">
                                    <span class="form-label">
                                        <span class="text-red">*</span>
                                        <span>問題主旨</span>
                                    </span>
                                    <input type="text" name="subject" class="form-input" placeholder="請輸入簡短且可辨識的主旨" required>
                                </label>

                                <div class="form-field">
                                    <span class="form-label">
                                        <span class="text-red">*</span>
                                        <span>問題類型</span>
                                    </span>
                                    <div class="form-select" data-form-select data-required>
                                        <input type="hidden" name="type" value="" data-form-select-value required>
                                        <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                                            <span class="is-placeholder" data-form-select-label>請選擇問題類型</span>
                                            <i data-lucide="chevron-down" class="w-4 h-4 text-gray4"></i>
                                        </button>
                                        <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                                            @foreach ($page->supportTicketTypes as $option)
                                                <button type="button" class="form-select-option" role="option" data-form-select-option data-value="{{ $option['value'] }}" data-label="{{ $option['label'] }}">
                                                    {{ $option['label'] }}
                                                </button>
                                            @endforeach
                                        </div>
                                    </div>
                                </div>

                                <label class="form-field">
                                    <span class="form-label">
                                        <span class="text-red">*</span>
                                        <span>聯絡人</span>
                                    </span>
                                    <input type="text" name="contact" class="form-input" placeholder="王小明 ・ 02-8888-7777" required>
                                </label>
                            </div>
                        </section>

                        <section class="card-panel gap-5">
                            <div class="self-stretch inline-flex items-center gap-3">
                                <span class="section-accent" aria-hidden="true"></span>
                                <h2 class="text-ch5 text-gray5">問題描述</h2>
                            </div>

                            <label class="form-field">
                                <span class="form-label">
                                    <span class="text-red">*</span>
                                    <span>詳細狀況描述</span>
                                </span>
                                <textarea
                                    name="description"
                                    class="form-input min-h-[10rem] resize-none"
                                    placeholder="請說明發生時間、錯誤訊息、影響範圍與已嘗試步驟..."
                                    required
                                ></textarea>
                            </label>
                        </section>

                        <section class="card-panel gap-4">
                            <div class="self-stretch inline-flex items-center gap-3">
                                <span class="section-accent" aria-hidden="true"></span>
                                <h2 class="text-ch5 text-gray5">附件</h2>
                            </div>
                            <p class="text-cb3 text-gray3">選填。檔案大小限制 2MB。</p>

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

                    <aside class="review-aside">
                        <div class="review-panel">
                            <div class="self-stretch inline-flex items-center gap-3">
                                <span class="section-accent" aria-hidden="true"></span>
                                <h2 class="text-ch5 text-gray5">送出工單</h2>
                            </div>
                            <p class="text-cb3 text-gray3">
                                送出後狀態為「未處理」，原廠會指派處理人員。建立前建議先查閱 FAQ，相同問題可直接依說明排除。
                            </p>
                            <div class="self-stretch inline-flex flex-col gap-2 pt-1">
                                <button type="submit" class="btn-primary w-full">送出工單</button>
                                <a href="{{ $page->baseUrl }}/support/" class="btn-secondary w-full">取消</a>
                            </div>
                        </div>
                    </aside>
                </div>
            </form>
        </div>
    </div>

    <div class="app-modal-host" data-version-help-modal hidden>
        <div class="app-modal-backdrop" data-version-help-dismiss></div>
        <div
            class="app-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="version-help-title"
        >
            <div class="self-stretch inline-flex items-start justify-between gap-3">
                <h3 id="version-help-title" class="text-cb1 text-gray5">怎麼看版本？</h3>
                <button type="button" class="icon-action -mt-1 -mr-1" data-version-help-dismiss aria-label="關閉">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
            <div class="richtext">
                {!! $page->supportVersionHelpHtml !!}
            </div>
        </div>
    </div>

    <script type="application/json" id="support-ticket-catalog">
        {!! json_encode([
            'tickets' => $page->supportTickets ?? [],
            'partner' => $page->partner,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
    </script>
@endsection
