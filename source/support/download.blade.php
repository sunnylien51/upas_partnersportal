---
title: 新增檔案
---
@extends('_layouts.app')

@section('body')
    <div class="page-body">
        <div class="content-wrapper">
            @include('_components.download-form', [
                'capability' => 'support.manage',
                'copy' => [
                    'headingNew' => '新增檔案',
                    'headingEdit' => '編輯檔案',
                    'sectionTitle' => '檔案資料',
                    'asideNew' => '新增檔案',
                    'asideEdit' => '儲存變更',
                    'asideHelp' => '儲存後會出現在技術支援中心的「檔案下載」。此為示意流程，資料存在此瀏覽器。',
                    'submitNew' => '新增檔案',
                    'submitEdit' => '儲存變更',
                    'savedNew' => '已新增檔案',
                    'savedEdit' => '已儲存檔案',
                ],
            ])
        </div>
    </div>
@endsection
