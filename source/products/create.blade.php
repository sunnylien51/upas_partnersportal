---
title: 新增公告
---
@extends('_layouts.app')

@php
    $categories = [];
    foreach ($page->productTabs as $tab) {
        $categories[] = [
            'value' => $tab['value'],
            'label' => $tab['labels'] ?? $tab['label'],
        ];
    }
@endphp

@section('body')
    <div class="page-body">
        <div class="content-wrapper">
            @include('_components.catalog-resource-form', [
                'kind' => 'product',
                'capability' => 'product.manage',
                'categories' => $categories,
                'items' => $page->productAnnouncements,
                'copy' => [
                    'headingNew' => '新增公告',
                    'headingEdit' => '編輯公告',
                    'sectionTitle' => '公告資料',
                    'dateLabel' => '發布日期',
                    'titleLabel' => '公告主題',
                    'titlePlaceholder' => '請輸入公告主題',
                    'asideNew' => '發布公告',
                    'asideEdit' => '儲存變更',
                    'asideHelp' => '發布後會出現在產品資訊中心對應分類。此為示意流程，資料存在此瀏覽器。',
                    'submitNew' => '發布公告',
                    'submitEdit' => '儲存變更',
                    'savedNew' => '已發布公告',
                    'savedEdit' => '已儲存公告',
                ],
            ])
        </div>
    </div>
@endsection
