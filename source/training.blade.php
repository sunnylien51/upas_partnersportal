---
title: 教育訓練中心
---
@extends('_layouts.app')

@section('body')
    <div class="flex-1 flex flex-col px-4 md:px-12">
        <div class="content-wrapper" data-training-center>
            @php
                $courses = $page->trainingCourses ?? [];
            @endphp

            <div class="self-stretch flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

                {{-- ========== 左側：二階層課程目錄 ========== --}}
                <aside class="w-full lg:w-64 shrink-0 lg:sticky lg:top-6">
                    <button
                        type="button"
                        class="training-mobile-toggle lg:hidden"
                        data-training-mobile-toggle
                        aria-expanded="false"
                        aria-controls="training-tree-panel"
                    >
                        <i data-lucide="list-tree" class="w-4 h-4 text-gray4 shrink-0"></i>
                        <span class="flex-1 min-w-0 truncate" data-training-mobile-label>{{ $courses[0]['articles'][0]['label'] ?? '課程目錄' }}</span>
                        <i data-lucide="chevron-down" class="w-4 h-4 text-gray3 shrink-0"></i>
                    </button>

                    <nav id="training-tree-panel" class="training-tree-panel" data-training-tree-panel aria-label="課程目錄">
                        <ul class="training-tree">
                            @foreach ($courses as $groupIndex => $group)
                                <li
                                    class="training-tree-group {{ $groupIndex === 0 ? 'is-open' : '' }}"
                                    data-training-group="{{ $group['id'] }}"
                                >
                                    <button
                                        type="button"
                                        class="training-tree-toggle"
                                        data-training-group-toggle
                                        aria-expanded="{{ $groupIndex === 0 ? 'true' : 'false' }}"
                                    >
                                        <span class="flex-1 min-w-0" data-training-group-label>{{ $group['label'] }}</span>
                                        <i data-lucide="chevron-down" class="training-tree-caret"></i>
                                    </button>

                                    <div class="training-tree-children">
                                        <div class="training-tree-children-clip">
                                            <ul class="training-tree-children-inner">
                                                @foreach ($group['articles'] as $articleIndex => $article)
                                                    <li class="training-tree-child">
                                                        <a
                                                            href="#{{ $article['id'] }}"
                                                            class="training-tree-link {{ $groupIndex === 0 && $articleIndex === 0 ? 'is-active' : '' }}"
                                                            data-training-link="{{ $article['id'] }}"
                                                            @if ($groupIndex === 0 && $articleIndex === 0) aria-current="page" @endif
                                                        >
                                                            {{ $article['label'] }}
                                                        </a>
                                                    </li>
                                                @endforeach
                                            </ul>
                                        </div>
                                    </div>
                                </li>
                            @endforeach
                        </ul>
                    </nav>
                </aside>

                {{-- ========== 右側：圖文內容 ========== --}}
                <div class="flex-1 min-w-0 w-full" data-training-article>
                    <div class="training-article">
                        @foreach ($courses as $groupIndex => $group)
                            @foreach ($group['articles'] as $articleIndex => $article)
                                @php
                                    $isDefault = $groupIndex === 0 && $articleIndex === 0;
                                @endphp
                                <article
                                    class="flex flex-col"
                                    data-training-panel="{{ $article['id'] }}"
                                    @if (!$isDefault) hidden @endif
                                >
                                    <img
                                        src="{{ $page->baseUrl }}/images/{{ $article['cover'] }}"
                                        alt="{{ $article['coverAlt'] }}"
                                        class="training-cover"
                                    >

                                    <div class="px-5 pt-6 pb-2 md:px-10 md:pt-9 md:pb-2 training-prose">
                                        <div class="flex flex-wrap items-center gap-2 mb-4">
                                            <span class="training-chip">{{ $article['level'] }}</span>
                                            <span class="training-chip">{{ $article['duration'] }}</span>
                                            <span class="text-eb3 text-gray3 uppercase">{{ $article['updated'] }}</span>
                                        </div>

                                        <h2 class="text-ch4 text-gray5 mt-0 mb-3">{{ $article['title'] }}</h2>
                                        <p class="text-cb2 text-gray4 mb-2">{{ $article['lead'] }}</p>

                                        @foreach ($article['blocks'] as $block)
                                            @if ($block['type'] === 'p')
                                                <p>{{ $block['text'] }}</p>
                                            @elseif ($block['type'] === 'h2')
                                                <h3>{{ $block['text'] }}</h3>
                                            @elseif ($block['type'] === 'ul')
                                                <ul>
                                                    @foreach ($block['items'] as $item)
                                                        <li>{{ $item }}</li>
                                                    @endforeach
                                                </ul>
                                            @elseif ($block['type'] === 'image')
                                                <figure class="training-figure">
                                                    <img src="{{ $page->baseUrl }}/images/{{ $block['src'] }}" alt="{{ $block['alt'] }}">
                                                    @if (!empty($block['caption']))
                                                        <figcaption>{{ $block['caption'] }}</figcaption>
                                                    @endif
                                                </figure>
                                            @elseif ($block['type'] === 'steps')
                                                <ol class="training-steps">
                                                    @foreach ($block['items'] as $stepIndex => $step)
                                                        <li class="training-step">
                                                            <span class="training-step-index">{{ str_pad($stepIndex + 1, 2, '0', STR_PAD_LEFT) }}</span>
                                                            <div class="min-w-0">
                                                                <h3>{{ $step['title'] }}</h3>
                                                                <p>{{ $step['text'] }}</p>
                                                            </div>
                                                        </li>
                                                    @endforeach
                                                </ol>
                                            @elseif ($block['type'] === 'callout')
                                                <div class="training-callout">
                                                    <span class="training-callout-bar" aria-hidden="true"></span>
                                                    <p class="text-cb3 text-gray4 mb-0">{{ $block['text'] }}</p>
                                                </div>
                                            @elseif ($block['type'] === 'quote')
                                                <blockquote class="training-quote">
                                                    <p>「{{ $block['text'] }}」</p>
                                                    <cite>{{ $block['cite'] }}</cite>
                                                </blockquote>
                                            @endif
                                        @endforeach
                                    </div>
                                </article>
                            @endforeach
                        @endforeach

                        <div class="px-5 pb-6 md:px-10 md:pb-9" data-training-pager-wrap>
                            <div class="training-pager">
                                <button type="button" class="training-pager-btn" data-training-prev hidden>
                                    <span class="text-cb3 text-gray3">上一篇</span>
                                    <span class="text-cb3 text-gray5" data-training-nav-label></span>
                                </button>
                                <button type="button" class="training-pager-btn md:items-end md:ml-auto" data-training-next hidden>
                                    <span class="text-cb3 text-gray3">下一篇</span>
                                    <span class="text-cb3 text-gray5" data-training-nav-label></span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
