---
title: 組織關係
---
@extends('_layouts.app')

@section('body')
    <div class="page-body" data-org-page>
        <div class="content-wrapper">

            <div class="page-toolbar">
                <h1 class="text-ch4 text-gray5 truncate">組織關係</h1>
                <div class="flex flex-wrap items-center gap-2">
                    <button type="button" class="btn-secondary" data-org-reset disabled>還原</button>
                    <button type="button" class="btn-primary" data-org-save disabled>儲存關係</button>
                    <a href="{{ site_href($page, '/profile') }}" class="btn-secondary">返回夥伴管理</a>
                </div>
            </div>

            <p class="text-cb3 text-gray3">
                在這裡看原廠業務的上下層。一位原廠業務只掛一位直屬主管；主管上面不再掛人。經銷不綁業務，商機由總管理者審核時指派承接業務。
            </p>

            <div class="org-layout">
                <section class="card-panel gap-4">
                    <div class="self-stretch inline-flex items-center gap-3">
                        <span class="section-accent" aria-hidden="true"></span>
                        <h2 class="text-ch5 text-gray5">未歸屬</h2>
                    </div>
                    <p class="text-cb3 text-gray3">尚未指定直屬主管的原廠業務會列在這裡。拖到右側的主管下面即可建立關係。</p>
                    <div class="self-stretch flex flex-col gap-4" data-org-pool></div>
                </section>

                <section class="card-panel gap-4">
                    <div class="self-stretch inline-flex items-center gap-3">
                        <span class="section-accent" aria-hidden="true"></span>
                        <h2 class="text-ch5 text-gray5">原廠組織</h2>
                    </div>
                    <p class="text-cb3 text-gray3">展開主管可看直屬業務。拖移業務可改掛主管。</p>
                    <div class="self-stretch flex flex-col gap-3" data-org-tree></div>
                </section>
            </div>
        </div>
    </div>
@endsection
