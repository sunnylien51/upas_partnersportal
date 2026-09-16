@php
    $selectedProduct = $selectedProduct ?? '';
    $selectedUnits = $selectedUnits ?? '0-499';
    $showPlaceholder = $showPlaceholder ?? false;
@endphp

<div class="self-stretch flex flex-col items-start gap-3" data-product-row>
    <div class="self-stretch inline-flex items-center gap-3">
        <div class="flex-1 min-w-0 form-select" data-form-select data-required>
            <input type="hidden" name="products[]" value="{{ $selectedProduct }}" data-form-select-value>
            <button type="button" class="form-select-trigger form-select-trigger--muted" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                <span class="{{ $selectedProduct === '' ? 'is-placeholder' : '' }}" data-form-select-label>
                    {{ $selectedProduct !== '' ? $selectedProduct : '請選擇產品' }}
                </span>
                <i data-lucide="chevron-down" class="w-4 h-4 text-gray4 shrink-0"></i>
            </button>
            <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                @foreach ($page->opportunityProducts as $product)
                    <button
                        type="button"
                        class="form-select-option {{ $product === $selectedProduct ? 'is-selected' : '' }}"
                        role="option"
                        data-form-select-option
                        data-value="{{ $product }}"
                        data-label="{{ $product }}"
                    >
                        {{ $product }}
                    </button>
                @endforeach
            </div>
        </div>

        <div class="w-48 shrink-0 form-select" data-form-select data-required>
            <input type="hidden" name="units[]" value="{{ $selectedUnits }}" data-form-select-value>
            <button type="button" class="form-select-trigger form-select-trigger--units" data-form-select-trigger aria-haspopup="listbox" aria-expanded="false">
                <span data-form-select-label>{{ $selectedUnits }}</span>
                <i data-lucide="chevron-down" class="w-4 h-4 text-gray5 shrink-0"></i>
            </button>
            <div class="form-select-menu" data-form-select-menu hidden role="listbox">
                @foreach ($page->opportunityUnitRanges as $range)
                    <button
                        type="button"
                        class="form-select-option {{ $range === $selectedUnits ? 'is-selected' : '' }}"
                        role="option"
                        data-form-select-option
                        data-value="{{ $range }}"
                        data-label="{{ $range }}"
                    >
                        {{ $range }}
                    </button>
                @endforeach
            </div>
        </div>

        <button type="button" class="btn-remove-product" data-remove-product aria-label="刪除此產品">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
    </div>
    <div class="self-stretch h-0 border-t border-gray1" aria-hidden="true"></div>
</div>
