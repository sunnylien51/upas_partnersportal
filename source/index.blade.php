---
title: 概覽
---
@extends('_layouts.app')

@section('body')
    <div class="flex-1 flex flex-col px-4 md:px-12">
        <div class="py-6 md:py-9 inline-flex items-center gap-3">
            <span class="w-3 h-6 bg-brand shrink-0" aria-hidden="true"></span>
            <p class="text-ch4 text-gray5">您好~{{ $page->partner['company'] }}</p>
        </div>

        <div class="flex-1 flex flex-col pt-4 md:pt-6 pb-10 md:pb-16 gap-5">
            <p class="text-cb3 text-gray4">您可使用以下 {{ count($page->overviewModules) }} 個功能區塊</p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                @foreach ($page->overviewModules as $module)
                    <a href="{{ $page->baseUrl }}{{ rtrim($module['path'], '/') }}/" class="feature-card group">
                        <div class="self-stretch pb-3 border-b border-gray1 inline-flex items-center gap-3">
                            <span class="w-[3px] h-5 bg-brand2 shrink-0" aria-hidden="true"></span>
                            <h2 class="text-ch5 text-gray5">{{ $module['label'] }}</h2>
                        </div>

                        <p class="self-stretch flex-1 text-cb3 text-gray4 whitespace-pre-line">{{ $module['description'] }}</p>

                        <span class="enter-btn">
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
