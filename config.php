<?php

return [
    'production' => false,
    'baseUrl' => '',
    'siteName' => 'Partners Portal',
    'siteDescription' => '合作夥伴入口網站',
    'description' => '合作夥伴入口網站',
    'language' => 'zh-Hant',
    'collections' => [],
    'locales' => ['TW', 'EN', 'JP'],
    'partner' => [
        'company' => '經銷商公司名稱',
        'role' => '經銷商管理員',
    ],
    'overviewModules' => [
        [
            'label' => '商機中心',
            'path' => '/opportunities',
            'description' => "商機註冊 • 查詢\n修改 • 續期",
        ],
        [
            'label' => '產品資訊中心',
            'path' => '/products',
            'description' => "新品 • EOL／EOS\n版本更新公告",
        ],
        [
            'label' => '教育訓練中心',
            'path' => '/training',
            'description' => '線上課程',
        ],
        [
            'label' => '行銷資源中心',
            'path' => '/marketing',
            'description' => "文件 • 簡報\nCampaign Kit",
        ],
        [
            'label' => '技術支援中心',
            'path' => '/support',
            'description' => "FAQ 與材料\n新增技術工單",
        ],
    ],
    'appNav' => [
        ['label' => '概覽', 'path' => '/', 'icon' => 'layout-dashboard'],
        ['label' => '商機中心', 'path' => '/opportunities', 'icon' => 'briefcase'],
        ['label' => '產品資訊中心', 'path' => '/products', 'icon' => 'package'],
        ['label' => '教育訓練中心', 'path' => '/training', 'icon' => 'graduation-cap'],
        ['label' => '行銷資源中心', 'path' => '/marketing', 'icon' => 'megaphone'],
        ['label' => '技術支援中心', 'path' => '/support', 'icon' => 'headset'],
        ['label' => '夥伴資料', 'path' => '/profile', 'icon' => 'id-card'],
    ],
    'isActive' => function ($page, $path) {
        $current = trim($page->getPath(), '/');
        $target = trim($path, '/');

        if ($target === '') {
            return $current === '' ? 'active' : '';
        }

        return ($current === $target || str_starts_with($current . '/', $target . '/'))
            ? 'active'
            : '';
    },
];
