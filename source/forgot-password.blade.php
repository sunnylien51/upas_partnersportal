---
title: 忘記密碼
---
@extends('_layouts.auth')

@section('body')
    <div class="self-stretch flex flex-col items-start gap-1">
        <h1 class="text-ch4 text-gray5">忘記密碼</h1>
        <p class="text-cb3 text-gray4">輸入帳號 Email，我們將寄送重設密碼連結至您的信箱</p>
    </div>

    <form
        class="self-stretch flex flex-col items-start gap-8"
        action="{{ $page->baseUrl }}/forgot-password/sent/"
        method="get"
    >
        <div class="self-stretch flex flex-col items-start gap-3">
            <div class="form-field">
                <label for="forgot-email" class="form-label">
                    <span class="text-red">*</span>
                    <span>帳號 Email</span>
                </label>
                <input
                    id="forgot-email"
                    type="email"
                    name="email"
                    class="form-input"
                    placeholder="請輸入 Email"
                    autocomplete="email"
                    required
                >
            </div>
        </div>

        <div class="self-stretch flex flex-col items-start gap-5">
            <button type="submit" class="btn-primary w-full h-11">寄送重設連結</button>

            <a href="{{ $page->baseUrl }}/login/" class="btn-secondary w-full">返回登入</a>

            <p class="text-cb3 text-gray4">若收不到信件，請檢查垃圾郵件匣，或聯絡 UPAS 系統管理者。</p>
        </div>
    </form>
@endsection
