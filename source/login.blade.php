---
title: 經銷商登入
---
@extends('_layouts.auth')

@section('body')
    <div class="self-stretch flex flex-col items-start gap-1">
        <h1 class="text-ch4 text-gray5">經銷商登入</h1>
        <p class="text-cb3 text-gray4">登入後可使用案件管理、行銷與技術資源等經銷商專屬功能</p>
    </div>

    <form
        class="self-stretch flex flex-col items-start gap-8"
        action="{{ $page->baseUrl }}/"
        method="get"
    >
        <div class="self-stretch flex flex-col items-start gap-3">
            <div class="form-field">
                <label for="login-email" class="form-label">
                    <span class="text-red">*</span>
                    <span>帳號 Email</span>
                </label>
                <input
                    id="login-email"
                    type="email"
                    name="email"
                    class="form-input"
                    placeholder="請輸入 Email"
                    autocomplete="username"
                    required
                >
            </div>

            <div class="form-field">
                <label for="login-password" class="form-label">
                    <span class="text-red">*</span>
                    <span>密碼</span>
                </label>
                <input
                    id="login-password"
                    type="password"
                    name="password"
                    class="form-input"
                    placeholder="請輸入密碼"
                    autocomplete="current-password"
                    required
                >
            </div>

            <div class="self-stretch inline-flex justify-between items-center gap-3">
                <label class="inline-flex items-center gap-2 text-cb3 text-gray4 cursor-pointer select-none">
                    <input type="checkbox" name="remember" value="1" class="auth-checkbox">
                    <span>保持登入</span>
                </label>
                <a href="{{ $page->baseUrl }}/forgot-password/" class="auth-link">忘記密碼？</a>
            </div>
        </div>

        <div class="self-stretch flex flex-col items-start gap-5">
            <button type="submit" class="btn-primary w-full h-11">登入</button>

            <div class="auth-divider" role="separator">
                <span>尚未有帳號</span>
            </div>

            <a href="{{ $page->baseUrl }}/register/" class="btn-secondary w-full">申請經銷商帳號</a>

            <p class="text-cb3 text-gray4">帳號尚未啟用或被鎖定，請聯絡 UPAS 系統管理者。</p>
        </div>
    </form>
@endsection
