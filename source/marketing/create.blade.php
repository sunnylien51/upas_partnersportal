---
title: 新增資源
---
@extends('_layouts.app')

@php
    $categories = [];
    foreach ($page->marketingTabs as $tab) {
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
                'kind' => 'marketing',
                'capability' => 'marketing.manage',
                'categories' => $categories,
                'items' => $page->marketingResources,
                'copy' => [
                    'headingNew' => '新增資源',
                    'headingEdit' => '編輯資源',
                    'sectionTitle' => '資源資料',
                    'dateLabel' => '發布日期',
                    'titleLabel' => '資源名稱',
                    'titlePlaceholder' => '請輸入資源名稱',
                    'asideNew' => '發布資源',
                    'asideEdit' => '儲存變更',
                    'asideHelp' => '發布後會出現在行銷資源中心對應分類。此為示意流程，資料存在此瀏覽器。',
                    'submitNew' => '發布資源',
                    'submitEdit' => '儲存變更',
                    'savedNew' => '已發布資源',
                    'savedEdit' => '已儲存資源',
                ],
            ])
        </div>
    </div>
@endsection
