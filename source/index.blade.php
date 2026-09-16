---
title: 概覽
---
@extends('_layouts.app')

@section('body')
    <div class="page-body">

        <div class="content-wrapper">
            <div class="flex flex-col items-start gap-1 pb-2">
                <p class="text-ch4 text-gray5">您好~{{ $page->partner['company'] }}</p>
                <p class="text-cb3 text-gray4">您可使用以下<span data-module-count>{{ count($page->overviewModules) }}</span>個功能區塊</p>
            </div>


            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                @foreach ($page->overviewModules as $module)
                    <a href="{{ $page->baseUrl }}{{ rtrim($module['path'], '/') }}/" class="group self-stretch min-h-[13rem] p-6 bg-white rounded-2xl shadow-card inline-flex flex-col items-end gap-3 overflow-hidden transition-[box-shadow] duration-300 hover:shadow-[0px_0px_40px_0px_rgba(0,0,0,0.08)]" data-nav-path="{{ $module['path'] }}" data-overview-module>
                        <div class="self-stretch pb-3 border-b border-gray1 inline-flex items-center gap-3">
                            <span class="section-accent" aria-hidden="true"></span>
                            <h2 class="text-ch5 text-gray5">{{ $module['label'] }}</h2>
                        </div>

                        <p class="self-stretch flex-1 text-cb3 text-gray4 whitespace-pre-line">{{ $module['description'] }}
                        </p>

                        <span class="pl-4 pr-3 py-1.5 bg-brand2 rounded-[20px] inline-flex items-center justify-center gap-1.5 text-white text-eb3 uppercase transition-colors group-hover:bg-brand2/90">
                            <span>Enter</span>
                            <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
                        </span>
                    </a>
                @endforeach
            </div>
        </div>

        <footer class="mt-auto py-7 border-t border-gray2 flex flex-col items-center gap-2">
            <p class="text-[12px] text-gray3">© {{ date('Y') }} UPAS 商案管理系統 版權所有</p>
        </footer>
    </div>
@endsection
