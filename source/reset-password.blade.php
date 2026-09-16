---
title: 重設密碼
---
@extends('_layouts.auth')

@section('body')
    <div class="self-stretch flex flex-col items-start gap-1">
        <h1 class="text-ch4 text-gray5">重設密碼</h1>
        <p class="text-cb3 text-gray4">請設定新密碼，完成後即可使用新密碼登入 Partners Portal</p>
    </div>

    <form
        class="self-stretch flex flex-col items-start gap-8"
        action="{{ $page->baseUrl }}/login/"
        method="get"
        data-reset-password-form
    >
        <div class="self-stretch flex flex-col items-start gap-3">
            <div class="form-field">
                <label for="reset-password" class="form-label">
                    <span class="text-red">*</span>
                    <span>新密碼</span>
                </label>
                <input
                    id="reset-password"
                    type="password"
                    name="password"
                    class="form-input"
                    placeholder="請輸入新密碼"
                    autocomplete="new-password"
                    required
                >
            </div>

            <div class="form-field">
                <label for="reset-password-confirm" class="form-label">
                    <span class="text-red">*</span>
                    <span>確認新密碼</span>
                </label>
                <input
                    id="reset-password-confirm"
                    type="password"
                    name="password_confirmation"
                    class="form-input"
                    placeholder="請再次輸入新密碼"
                    autocomplete="new-password"
                    required
                >
            </div>
        </div>

        <div class="self-stretch flex flex-col items-start gap-5">
            <button type="submit" class="btn-primary w-full h-11">確認重設</button>

            <a href="{{ $page->baseUrl }}/login/" class="btn-secondary w-full">返回登入</a>

            <p class="text-cb3 text-gray4">若連結已過期，請重新申請
                <a href="{{ $page->baseUrl }}/forgot-password/" class="auth-link">忘記密碼</a>。
            </p>
        </div>
    </form>
@endsection
