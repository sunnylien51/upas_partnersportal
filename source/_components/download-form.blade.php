@php
    $capability = $capability ?? 'support.manage';
    $listPath = '/support/';
    $createPath = '/support/download/';
    $copy = $copy ?? [];
@endphp

<div class="page-toolbar" data-download-form-toolbar>
    <h1 class="text-ch4 text-gray5 truncate" data-page-heading>{{ $copy['headingNew'] ?? '新增檔案' }}</h1>
    <a href="{{ $page->baseUrl }}{{ $listPath }}" class="btn-secondary">返回列表</a>
</div>

<div class="list-card" data-download-forbidden hidden>
    <div class="px-6 py-16 text-center">
        <p class="text-cb3 text-gray5">目前身分權限無法管理此資料</p>
        <p class="mt-2 text-cb3 text-gray3">請切換為總管理者後再試。</p>
        <a href="{{ $page->baseUrl }}{{ $listPath }}" class="btn-secondary mt-5 inline-flex">返回列表</a>
    </div>
</div>

<div class="list-card" data-download-missing hidden>
    <div class="px-6 py-16 text-center">
        <p class="text-cb3 text-gray5">找不到這筆資料</p>
        <p class="mt-2 text-cb3 text-gray3">可能已刪除，或連結已失效。</p>
        <a href="{{ $page->baseUrl }}{{ $listPath }}" class="btn-secondary mt-5 inline-flex">返回列表</a>
    </div>
</div>

<form
    class="self-stretch"
    data-download-form
    data-manage="{{ $capability }}"
    data-list-url="{{ $page->baseUrl }}{{ $listPath }}"
    data-create-url="{{ $page->baseUrl }}{{ $createPath }}"
    novalidate
>
    <input type="hidden" name="id" value="">

    <div class="locale-editor-bar">
        <div class="locale-tabs shrink-0" role="tablist" aria-label="編輯語系" data-form-locale-tabs>
            @foreach ($page->locales as $locale)
                <button type="button" class="locale-tab" role="tab" data-form-locale="{{ $locale }}" aria-selected="false">
                    <span>{{ $locale }}</span>
                    <span class="locale-tab-dot" data-locale-incomplete hidden aria-hidden="true"></span>
                </button>
            @endforeach
        </div>
    </div>

    <div class="review-layout">
        <div class="review-main">
            <section class="card-panel gap-5">
                <div class="self-stretch inline-flex items-center gap-3">
                    <span class="section-accent" aria-hidden="true"></span>
                    <h2 class="text-ch5 text-gray5">{{ $copy['sectionTitle'] ?? '檔案資料' }}</h2>
                </div>

                <label class="form-field">
                    <span class="form-label">
                        <span class="text-red">*</span>
                        <span>檔案標題</span>
                        <span class="locale-chip" data-locale-name>{{ $page->locales[0] ?? 'TW' }}</span>
                    </span>
                    <input type="text" name="title" class="form-input" placeholder="請輸入夥伴會看到的檔案標題" required>
                    <span class="text-cb3 text-gray3" data-locale-fallback-hint hidden>留空則沿用 {{ $page->locales[0] ?? 'TW' }} 的內容。</span>
                </label>
            </section>

            <section class="card-panel gap-5">
                <div class="self-stretch inline-flex items-center gap-3">
                    <span class="section-accent" aria-hidden="true"></span>
                    <h2 class="text-ch5 text-gray5">附件</h2>
                    <span class="locale-chip" data-locale-name>{{ $page->locales[0] ?? 'TW' }}</span>
                </div>
                <p class="text-cb3 text-gray3" data-locale-fallback-hint hidden>
                    此語系可放各自的檔案或連結；留空則沿用 {{ $page->locales[0] ?? 'TW' }} 的附件。
                </p>

                <div class="self-stretch flex flex-col items-start gap-1">
                    <div class="inline-flex items-center gap-1">
                        <span class="text-cb2 text-red">*</span>
                        <span class="text-cb2 text-gray5">附件類型</span>
                    </div>
                    <div class="self-stretch inline-flex items-start gap-4" data-source-group>
                        <label class="source-option flex-1 is-selected">
                            <input type="radio" name="attachment" value="download" class="sr-only" checked data-source-input>
                            <span class="source-radio" aria-hidden="true"></span>
                            <span class="source-option-label">檔案下載</span>
                        </label>
                        <label class="source-option flex-1">
                            <input type="radio" name="attachment" value="link" class="sr-only" data-source-input>
                            <span class="source-radio" aria-hidden="true"></span>
                            <span class="source-option-label">外部連結</span>
                        </label>
                    </div>
                </div>

                <div class="self-stretch flex flex-col gap-3" data-attachment-file>
                    <p class="text-cb3 text-gray3">單檔 2MB 內，支援 PDF、DOC、XLS、PNG、JPG。</p>
                    <div class="file-upload" data-file-upload>
                        <input type="file" class="sr-only" data-file-input accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.png,.jpg,.jpeg,.gif">
                        <input type="hidden" name="attachment_name" value="" data-file-name>
                        <input type="hidden" name="attachment_size" value="" data-file-size>
                        <input type="hidden" name="attachment_type" value="" data-file-type>

                        <button type="button" class="file-upload-dropzone" data-file-trigger>
                            <span class="file-icon">
                                <i data-lucide="upload" class="w-4 h-4 text-gray4"></i>
                            </span>
                            <span class="min-w-0 flex flex-col items-start gap-0.5">
                                <span class="text-cb3 text-gray5">點擊或拖曳檔案到此處上傳</span>
                                <span class="text-[11px] font-medium text-gray3">此為示意上傳，不會送到伺服器</span>
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
                </div>

                <label class="form-field" data-attachment-link hidden>
                    <span class="form-label">
                        <span class="text-red">*</span>
                        <span>連結網址</span>
                    </span>
                    <input type="url" name="attachment_url" class="form-input" placeholder="https://">
                </label>
            </section>
        </div>

        <aside class="review-aside">
            <section class="card-panel gap-4">
                <h2 class="text-ch5 text-gray5" data-download-aside-title>{{ $copy['asideNew'] ?? '新增檔案' }}</h2>
                <p class="text-cb3 text-gray3">{{ $copy['asideHelp'] ?? '儲存後會出現在技術支援中心的「檔案下載」。此為示意流程，資料存在此瀏覽器。' }}</p>
                <button type="submit" class="btn-primary w-full">
                    <span data-download-submit-label>{{ $copy['submitNew'] ?? '新增檔案' }}</span>
                </button>
                <a href="{{ $page->baseUrl }}{{ $listPath }}" class="btn-secondary w-full text-center">取消</a>
            </section>
        </aside>
    </div>
</form>

<script type="application/json" id="support-download-data">
    {!! json_encode([
        'capability' => $capability,
        'createDownloadUrl' => $page->baseUrl . $createPath,
        'listUrl' => $page->baseUrl . $listPath,
        'locales' => $page->locales,
        'downloads' => $page->supportDownloads,
        'copy' => $copy,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
</script>
