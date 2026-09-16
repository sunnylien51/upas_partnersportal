---
title: 用戶資料
---
@extends('_layouts.app')

@section('body')
    <div class="page-body">
        <div class="content-wrapper">

            <div class="page-toolbar">
                <h1 class="text-ch4 text-gray5 truncate">用戶資料</h1>
            </div>

            <form class="self-stretch" data-account-form novalidate>
                <div class="review-layout">
                    <div class="review-main">

                        <section class="card-panel gap-4">
                            <div class="self-stretch inline-flex items-center gap-3">
                                <span class="section-accent" aria-hidden="true"></span>
                                <h2 class="text-ch5 text-gray5">帳號資料</h2>
                            </div>

                            <div class="self-stretch grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label class="form-field">
                                    <span class="form-label">
                                        <span class="text-red">*</span>
                                        <span>姓名</span>
                                    </span>
                                    <input type="text" name="name" class="form-input" placeholder="請輸入姓名" value="{{ $page->partner['contact'] }}" autocomplete="name" required>
                                </label>

                                <label class="form-field">
                                    <span class="form-label">
                                        <span class="text-red">*</span>
                                        <span>公司 E-mail</span>
                                    </span>
                                    <input type="email" name="email" class="form-input" placeholder="請輸入 E-mail" value="{{ $page->partner['email'] }}" autocomplete="email" required>
                                </label>

                                <label class="form-field">
                                    <span class="form-label">
                                        <span class="text-red">*</span>
                                        <span>聯絡電話</span>
                                    </span>
                                    <input type="tel" name="phone" class="form-input" placeholder="請輸入電話號碼" value="{{ $page->partner['phone'] }}" autocomplete="tel" required>
                                </label>

                                <label class="form-field">
                                    <span class="form-label">
                                        <span class="text-red">*</span>
                                        <span>職稱 / 部門</span>
                                    </span>
                                    <input type="text" name="job_title" class="form-input" placeholder="請輸入職稱與部門" value="{{ $page->partner['job_title'] }}" autocomplete="organization-title" required>
                                </label>

                                <label class="form-field">
                                    <span class="form-label">公司名稱</span>
                                    <input type="text" class="form-input is-readonly" value="{{ $page->partner['company'] }}" readonly tabindex="-1">
                                </label>

                                <label class="form-field">
                                    <span class="form-label">身分權限</span>
                                    <input type="text" class="form-input is-readonly" value="{{ $page->roles[$page->defaultPreviewRole]['label'] ?? $page->partner['role'] }}" data-role-label readonly tabindex="-1">
                                </label>
                            </div>
                        </section>

                        <section class="card-panel gap-4">
                            <div class="self-stretch inline-flex items-center gap-3">
                                <span class="section-accent" aria-hidden="true"></span>
                                <h2 class="text-ch5 text-gray5">變更密碼</h2>
                            </div>

                            <div class="self-stretch grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label class="form-field md:col-span-2">
                                    <span class="form-label">目前密碼</span>
                                    <input type="password" name="current_password" class="form-input" placeholder="請輸入目前密碼" autocomplete="current-password">
                                </label>

                                <label class="form-field">
                                    <span class="form-label">新密碼</span>
                                    <input type="password" name="password" class="form-input" placeholder="請輸入新密碼" autocomplete="new-password">
                                </label>

                                <label class="form-field">
                                    <span class="form-label">確認新密碼</span>
                                    <input type="password" name="password_confirmation" class="form-input" placeholder="請再次輸入新密碼" autocomplete="new-password">
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
                                可更新登入帳號的聯絡資料。若要變更密碼，請同時填寫目前密碼與新密碼。
                            </p>
                            <div class="self-stretch inline-flex flex-col gap-2 pt-1">
                                <button type="submit" class="btn-primary w-full h-11">儲存變更</button>
                            </div>
                        </div>
                    </aside>
                </div>
            </form>
        </div>
    </div>
@endsection
