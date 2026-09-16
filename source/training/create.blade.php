---
title: 新增文章
---
@extends('_layouts.app')

@section('body')
    <div class="page-body">
        <div class="content-wrapper">
            @include('_components.training-article-form', [
                'capability' => 'training.manage',
                'courses' => $page->trainingCourses,
                'copy' => [
                    'headingNew' => '新增文章',
                    'headingEdit' => '編輯文章',
                    'sectionTitle' => '文章資料',
                    'asideNew' => '發布文章',
                    'asideEdit' => '儲存變更',
                    'asideHelp' => '發布後會出現在教育訓練中心對應分類。此為示意流程，資料存在此瀏覽器。',
                    'submitNew' => '發布文章',
                    'submitEdit' => '儲存變更',
                    'savedNew' => '已發布文章',
                    'savedEdit' => '已儲存文章',
                ],
            ])
        </div>
    </div>
@endsection
