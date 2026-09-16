---
title: 重設連結已寄出
---
@extends('_layouts.auth')

@section('body')
    <div class="self-stretch flex flex-col items-start gap-1">
        <h1 class="text-ch4 text-gray5">重設連結已寄出</h1>
        <p class="text-cb3 text-gray4">
            若該 Email 已註冊，重設密碼連結將寄送至您的信箱。請於時限內開啟信件並完成重設。
        </p>
    </div>

    <div class="self-stretch flex flex-col items-start gap-5">
        <div class="self-stretch p-4 rounded-[8px] bg-bg2 border border-gray1 flex flex-col items-start">
            <p class="text-cb3 text-gray4">已送出至</p>
            <p class="text-eb2 text-brand2 break-all" data-sent-email>您填寫的 Email</p>
        </div>

        <a href="{{ $page->baseUrl }}/login/" class="btn-primary w-full h-11">返回登入</a>

        <div class="auth-divider" role="separator">
            <span>尚未收到？</span>
        </div>

        <a href="{{ $page->baseUrl }}/forgot-password/" class="btn-secondary w-full">重新寄送</a>

        <p class="text-cb3 text-gray4">示意流程：正式環境會依實際寄信結果顯示。演示可直接前往
            <a href="{{ $page->baseUrl }}/reset-password/" class="auth-link">重設密碼</a>。
        </p>
    </div>
@endsection

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function () {
    var params = new URLSearchParams(window.location.search);
    var email = params.get('email');
    var target = document.querySelector('[data-sent-email]');
    if (email && target) {
        target.textContent = email;
    }
});
</script>
@endpush
