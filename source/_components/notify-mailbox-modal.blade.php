@php
    $notifyScope = $notifyScope ?? '';
    $notifyPurpose = $notifyPurpose ?? '';
    $notifyInputId = 'notify-mailbox-' . $notifyScope;
@endphp
<div class="app-modal-host" data-notify-mailbox-modal="{{ $notifyScope }}" hidden>
    <div class="app-modal-backdrop" data-notify-mailbox-dismiss></div>
    <div class="app-modal-panel" role="dialog" aria-modal="true" aria-labelledby="{{ $notifyInputId }}-title">
        <div class="self-stretch flex items-start justify-between gap-4">
            <div class="min-w-0 flex flex-col items-start gap-1">
                <h3 id="{{ $notifyInputId }}-title" class="text-ch5 text-gray5">指定收件信箱</h3>
                @if ($notifyPurpose !== '')
                    <p class="text-cb3 text-gray4">{{ $notifyPurpose }}</p>
                @endif
            </div>
            <button type="button" class="icon-action shrink-0" data-notify-mailbox-dismiss aria-label="關閉">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>

        <div class="self-stretch flex flex-col items-start gap-1">
            <label class="form-label" for="{{ $notifyInputId }}">
                <span>收件信箱</span>
            </label>
            <input
                id="{{ $notifyInputId }}"
                type="text"
                class="form-input"
                placeholder="name@company.com, name2@company.com"
                autocomplete="off"
                data-notify-mailbox-input
            >
            <p class="text-cb3 text-gray3">若要新增多個信箱，請於每個信箱後面逗點空格後填寫下一組信箱。</p>
        </div>

        <div class="self-stretch inline-flex items-center justify-end gap-2">
            <button type="button" class="btn-secondary" data-notify-mailbox-dismiss>取消</button>
            <button type="button" class="btn-primary" data-notify-mailbox-save>儲存</button>
        </div>
    </div>
</div>
