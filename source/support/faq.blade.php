---
title: 新增 FAQ
---
@extends('_layouts.app')

@section('body')
    <div class="page-body">
        <div class="content-wrapper">
            @include('_components.faq-form', [
                'capability' => 'support.manage',
                'copy' => [
                    'headingNew' => '新增 FAQ',
                    'headingEdit' => '編輯 FAQ',
                    'sectionTitle' => 'FAQ 資料',
                    'asideNew' => '發布 FAQ',
                    'asideEdit' => '儲存變更',
                    'asideHelp' => '發布後會出現在技術支援中心。此為示意流程，資料存在此瀏覽器。',
                    'submitNew' => '發布 FAQ',
                    'submitEdit' => '儲存變更',
                    'savedNew' => '已發布 FAQ',
                    'savedEdit' => '已儲存 FAQ',
                ],
            ])
        </div>
    </div>
@endsection
