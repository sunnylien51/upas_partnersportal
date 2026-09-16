@props([
    'title' => '審核結果',
    'titleBind' => null,
    'resultBind' => 'data-review-done-result',
    'statusBind' => 'data-review-done-status',
    'salesBind' => 'data-review-done-sales',
    'noteBind' => 'data-review-done-note',
])

<p class="text-cb2 text-gray5" @if ($titleBind) {{ $titleBind }} @endif>{{ $title }}</p>
<div class="review-result-card">
    <div class="review-result-row">
        <span class="text-cb3 text-gray3 shrink-0">審核結果</span>
        <span class="text-cb3 text-gray5 min-w-0 flex-1" {{ $resultBind }}>-</span>
    </div>
    <div class="review-result-row">
        <span class="text-cb3 text-gray3 shrink-0">案件狀態</span>
        <span class="text-cb3 text-gray5 min-w-0 flex-1" {{ $statusBind }}>-</span>
    </div>
    <div class="review-result-row">
        <span class="text-cb3 text-gray3 shrink-0">原廠業務</span>
        <span class="text-cb3 text-gray5 min-w-0 flex-1" {{ $salesBind }}>-</span>
    </div>
    <div class="review-result-row">
        <span class="text-cb3 text-gray3 shrink-0">審核備註</span>
        <span class="text-cb3 text-gray5 min-w-0 flex-1 whitespace-pre-wrap" {{ $noteBind }}>-</span>
    </div>
</div>
