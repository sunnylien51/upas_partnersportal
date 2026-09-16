---
title: 技術工單詳情
---
@extends('_layouts.app')

@section('body')
    <div
        class="page-body"
        data-support-ticket-page
        data-list-url="{{ $page->baseUrl }}/support/"
    >
        <div class="content-wrapper">
            <p class="text-cb3 text-gray3">正在開啟工單…</p>
        </div>
    </div>
@endsection
