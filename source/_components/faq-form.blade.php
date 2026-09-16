@php
    $capability = $capability ?? 'support.manage';
    $listPath = '/support/';
    $createPath = '/support/faq/';
    $copy = $copy ?? [];
@endphp

<div class="page-toolbar" data-faq-form-toolbar>
    <h1 class="text-ch4 text-gray5 truncate" data-page-heading>{{ $copy['headingNew'] ?? '新增 FAQ' }}</h1>
    <a href="{{ $page->baseUrl }}{{ $listPath }}" class="btn-secondary">返回列表</a>
</div>

<div class="list-card" data-faq-forbidden hidden>
    <div class="px-6 py-16 text-center">
        <p class="text-cb3 text-gray5">目前身分權限無法管理此資料</p>
        <p class="mt-2 text-cb3 text-gray3">請切換為總管理者後再試。</p>
        <a href="{{ $page->baseUrl }}{{ $listPath }}" class="btn-secondary mt-5 inline-flex">返回列表</a>
    </div>
</div>

<div class="list-card" data-faq-missing hidden>
    <div class="px-6 py-16 text-center">
        <p class="text-cb3 text-gray5">找不到這筆資料</p>
        <p class="mt-2 text-cb3 text-gray3">可能已刪除，或連結已失效。</p>
        <a href="{{ $page->baseUrl }}{{ $listPath }}" class="btn-secondary mt-5 inline-flex">返回列表</a>
    </div>
</div>

<form
    class="self-stretch"
    data-faq-form
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
                    <h2 class="text-ch5 text-gray5">{{ $copy['sectionTitle'] ?? 'FAQ 資料' }}</h2>
                </div>

                <div class="self-stretch grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="self-stretch flex flex-col items-start gap-2">
                        <span class="form-label">
                            <span class="text-red">*</span>
                            <span>問題類型</span>
                        </span>
                        <div class="self-stretch inline-flex items-center gap-2">
                            <div class="form-select flex-1 min-w-0" data-form-select data-required>
                                <input type="hidden" name="type" value="" data-form-select-value required>
                                <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                                    <span class="is-placeholder" data-form-select-label>請選擇問題類型</span>
                                    <i data-lucide="chevron-down" class="w-4 h-4 text-gray4"></i>
                                </button>
                                <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                                    <div class="form-select-options" data-form-select-options>
                                        @foreach ($page->supportFaqTypes as $option)
                                            <button type="button" class="form-select-option" role="option" data-form-select-option data-value="{{ $option['value'] }}" data-label="{{ $option['label'] }}">{{ $option['label'] }}</button>
                                        @endforeach
                                    </div>
                                </div>
                            </div>
                            <button type="button" class="btn-dashed shrink-0" data-faq-manage-categories="type">
                                <i data-lucide="layers" class="w-4 h-4"></i>
                                <span>管理分類</span>
                            </button>
                        </div>
                    </div>

                    <div class="self-stretch flex flex-col items-start gap-2">
                        <span class="form-label">
                            <span class="text-red">*</span>
                            <span>對應模組</span>
                        </span>
                        <div class="self-stretch inline-flex items-center gap-2">
                            <div class="form-select flex-1 min-w-0" data-form-select data-required>
                                <input type="hidden" name="module" value="" data-form-select-value required>
                                <button type="button" class="form-select-trigger" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                                    <span class="is-placeholder" data-form-select-label>請選擇對應模組</span>
                                    <i data-lucide="chevron-down" class="w-4 h-4 text-gray4"></i>
                                </button>
                                <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                                    <div class="form-select-options" data-form-select-options>
                                        @foreach ($page->supportFaqModules as $option)
                                            <button type="button" class="form-select-option" role="option" data-form-select-option data-value="{{ $option['value'] }}" data-label="{{ $option['label'] }}">{{ $option['label'] }}</button>
                                        @endforeach
                                    </div>
                                </div>
                            </div>
                            <button type="button" class="btn-dashed shrink-0" data-faq-manage-categories="module">
                                <i data-lucide="layers" class="w-4 h-4"></i>
                                <span>管理分類</span>
                            </button>
                        </div>
                    </div>

                    <label class="form-field md:col-span-2">
                        <span class="form-label">
                            <span class="text-red">*</span>
                            <span>問題</span>
                            <span class="locale-chip" data-locale-name>{{ $page->locales[0] ?? 'TW' }}</span>
                        </span>
                        <input type="text" name="question" class="form-input" placeholder="請輸入問題" required>
                        <span class="text-cb3 text-gray3" data-locale-fallback-hint hidden>留空則沿用 {{ $page->locales[0] ?? 'TW' }} 的內容。</span>
                    </label>
                </div>
            </section>

            <section class="card-panel gap-5">
                <div class="self-stretch inline-flex items-center gap-3">
                    <span class="section-accent" aria-hidden="true"></span>
                    <h2 class="text-ch5 text-gray5">說明內容</h2>
                    <span class="locale-chip" data-locale-name>{{ $page->locales[0] ?? 'TW' }}</span>
                </div>
                <p class="text-cb3 text-gray3" data-locale-fallback-hint hidden>留空則沿用 {{ $page->locales[0] ?? 'TW' }} 的內容。</p>
                <label class="form-field">
                    <span class="sr-only">說明內容</span>
                    <textarea name="answer" class="form-input min-h-[18rem]" rows="14" placeholder="請輸入說明內容，可使用 HTML" required></textarea>
                </label>
            </section>
        </div>

        <aside class="review-aside">
            <section class="card-panel gap-4">
                <h2 class="text-ch5 text-gray5" data-faq-aside-title>{{ $copy['asideNew'] ?? '發布 FAQ' }}</h2>
                <p class="text-cb3 text-gray3">{{ $copy['asideHelp'] ?? '發布後會出現在技術支援中心。此為示意流程，資料存在此瀏覽器。' }}</p>
                <button type="submit" class="btn-primary w-full">
                    <span data-faq-submit-label>{{ $copy['submitNew'] ?? '發布 FAQ' }}</span>
                </button>
                <a href="{{ $page->baseUrl }}{{ $listPath }}" class="btn-secondary w-full text-center">取消</a>
            </section>
        </aside>
    </div>
</form>

<script type="application/json" id="support-faq-data">
    {!! json_encode([
        'capability' => $capability,
        'createUrl' => $page->baseUrl . $createPath,
        'listUrl' => $page->baseUrl . $listPath,
        'locales' => $page->locales,
        'types' => $page->supportFaqTypes,
        'modules' => $page->supportFaqModules,
        'faqs' => $page->supportFaqs,
        'copy' => $copy,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
</script>
