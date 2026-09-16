<?php

$assignCatalogIds = static function (string $prefix, array $items): array {
    foreach ($items as $index => &$item) {
        if (empty($item['id'])) {
            $item['id'] = sprintf('%s-%03d', $prefix, $index + 1);
        }
    }
    unset($item);

    return $items;
};

return [
    'production' => false,
    'baseUrl' => '',
    'siteName' => 'Partners Portal',
    'siteDescription' => '合作夥伴入口網站',
    'description' => '合作夥伴入口網站',
    'language' => 'zh-Hant',
    'collections' => [],
    'locales' => ['TW', 'EN', 'JP'],
    'registerCountries' => (static function () {
        $countries = require __DIR__ . '/data/countries.php';
        $labelOverrides = [
            'hk' => '香港',
            'mo' => '澳門',
        ];

        foreach ($countries as &$country) {
            if (isset($labelOverrides[$country['value']])) {
                $country['label'] = $labelOverrides[$country['value']];
            }
        }
        unset($country);

        return $countries;
    })(),
    'partner' => [
        'company' => '經銷商公司名稱',
        'role' => '總管理者',
        'contact' => '王小明',
        'phone' => '02-1234-5678',
        'email' => 'ming.wang@partner.com',
        'job_title' => '業務經理 / 通路部',
    ],
    'defaultPreviewRole' => 'admin',
    // 預覽身分：partnerId 對應 partners[]，供商機可見範圍重算
    'roles' => [
        'admin' => [
            'label' => '總管理者',
            'identity' => 'admin',
            'partnerId' => '',
            'nav' => ['/', '/opportunities', '/products', '/training', '/marketing', '/support', '/profile'],
            'can' => [
                'opportunity.view',
                'opportunity.create',
                'opportunity.export',
                'opportunity.status.edit',
                'opportunity.actions',
                'opportunity.review',
                'product.manage',
                'marketing.manage',
                'training.manage',
                'support.create',
                'support.manage',
                'profile.manage',
            ],
        ],
        'oem_manager' => [
            'label' => '原廠主管',
            'identity' => 'oem_manager',
            'partnerId' => 'P260100001',
            'nav' => ['/', '/opportunities', '/products', '/training', '/marketing', '/support'],
            'can' => [
                'opportunity.view',
                'opportunity.create',
                'opportunity.export',
                'opportunity.actions',
                'support.create',
            ],
        ],
        'oem_sales' => [
            'label' => '原廠業務',
            'identity' => 'oem_sales',
            'partnerId' => 'P260101001',
            'nav' => ['/', '/opportunities', '/products', '/training', '/marketing', '/support'],
            'can' => [
                'opportunity.view',
                'opportunity.create',
                'opportunity.export',
                'opportunity.actions',
                'support.create',
            ],
        ],
        'dealer_tw' => [
            'label' => '國內經銷商',
            'identity' => 'dealer_tw',
            'partnerId' => 'P260312001',
            'nav' => ['/', '/opportunities', '/products', '/training', '/marketing', '/support'],
            'can' => [
                'opportunity.view',
                'opportunity.create',
                'opportunity.export',
                'opportunity.actions',
                'support.create',
            ],
        ],
        'dealer_overseas' => [
            'label' => '海外經銷商',
            'identity' => 'dealer_overseas',
            'partnerId' => 'P251106001',
            'nav' => ['/', '/opportunities', '/products', '/training', '/marketing', '/support'],
            'can' => [
                'opportunity.view',
                'opportunity.create',
                'opportunity.export',
                'opportunity.actions',
                'support.create',
            ],
        ],
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
        ['label' => '夥伴管理', 'path' => '/profile', 'icon' => 'id-card'],
    ],
    'pageBreadcrumbs' => [
        '/' => [
            ['label' => '概覽'],
        ],
        'opportunities' => [
            ['label' => '商機中心'],
        ],
        'opportunities/create' => [
            ['label' => '商機中心', 'path' => '/opportunities'],
            ['label' => '新增商機', 'attr' => 'data-page-title'],
        ],
        'opportunities/review' => [
            ['label' => '商機中心', 'path' => '/opportunities'],
            ['label' => '商機審核', 'attr' => 'data-review-crumb-kind'],
            ['label' => '', 'attr' => 'data-review-id-crumb', 'uppercase' => true],
        ],
        'opportunities/renew' => [
            ['label' => '商機中心', 'path' => '/opportunities'],
            ['label' => '商機續期'],
        ],
        'products' => [
            ['label' => '產品資訊中心'],
        ],
        'products/create' => [
            ['label' => '產品資訊中心', 'path' => '/products'],
            ['label' => '新增公告', 'attr' => 'data-catalog-crumb'],
        ],
        'marketing' => [
            ['label' => '行銷資源中心'],
        ],
        'marketing/create' => [
            ['label' => '行銷資源中心', 'path' => '/marketing'],
            ['label' => '新增資源', 'attr' => 'data-catalog-crumb'],
        ],
        'training' => [
            ['label' => '教育訓練中心'],
        ],
        'training/article' => [
            ['label' => '教育訓練中心', 'path' => '/training'],
            ['label' => '文章內容', 'attr' => 'data-training-crumb', 'current' => true],
        ],
        'training/create' => [
            ['label' => '教育訓練中心', 'path' => '/training'],
            ['label' => '新增文章', 'attr' => 'data-training-form-crumb'],
        ],
        'support' => [
            ['label' => '技術支援中心'],
        ],
        'support/create' => [
            ['label' => '技術支援中心', 'path' => '/support'],
            ['label' => '建立技術工單'],
        ],
        'support/faq' => [
            ['label' => '技術支援中心', 'path' => '/support'],
            ['label' => '新增 FAQ', 'attr' => 'data-faq-form-crumb'],
        ],
        'support/download' => [
            ['label' => '技術支援中心', 'path' => '/support'],
            ['label' => '新增檔案', 'attr' => 'data-download-form-crumb'],
        ],
        'support/ticket' => [
            ['label' => '技術支援中心', 'path' => '/support'],
            ['label' => '工單詳情'],
        ],
        'account' => [
            ['label' => '用戶資料'],
        ],
        'profile' => [
            ['label' => '夥伴管理'],
        ],
        'profile/edit' => [
            ['label' => '夥伴管理', 'path' => '/profile'],
            ['label' => '編輯夥伴資料', 'attr' => 'data-partner-crumb'],
        ],
        'profile/create' => [
            ['label' => '夥伴管理', 'path' => '/profile'],
            ['label' => '新增帳號'],
        ],
    ],
    'opportunityStats' => [
        ['label' => '進行中商機', 'count' => 12, 'tone' => 'default'],
        ['label' => '審核中', 'count' => 2, 'tone' => 'warning'],
        ['label' => '暫存檔', 'count' => 1, 'tone' => 'default'],
        ['label' => '30天內即將到期', 'count' => 2, 'tone' => 'danger'],
    ],
    'opportunityStatuses' => [
        ['value' => 'draft', 'label' => '暫存', 'icon' => 'file-pen-line'],
        ['value' => 'approved', 'label' => '已核准', 'icon' => 'check-circle'],
        ['value' => 'reviewing', 'label' => '審核中', 'icon' => 'clock'],
        ['value' => 'rejected', 'label' => '退回補件', 'icon' => 'file-warning'],
        ['value' => 'expiring', 'label' => '即將到期', 'icon' => 'alert-circle'],
        ['value' => 'expired', 'label' => '已到期', 'icon' => 'circle-x'],
        ['value' => 'cancelled', 'label' => '已取消', 'icon' => 'ban'],
        ['value' => 'completed', 'label' => '已結案', 'icon' => 'circle-check'],
        ['value' => 'invalid', 'label' => '已失效', 'icon' => 'circle-off'],
    ],
    'opportunityDealerLabels' => [
        'oem' => '原廠業務',
        'tw' => '台灣經銷商',
        'overseas' => '海外經銷商',
    ],
    'opportunityFilters' => [
        [
            'key' => 'dealer',
            'label' => '所屬',
            'options' => [
                ['value' => 'all', 'label' => '全部'],
                ['value' => 'oem', 'label' => '原廠業務'],
                ['value' => 'tw', 'label' => '台灣經銷商'],
                ['value' => 'overseas', 'label' => '海外經銷商'],
            ],
        ],
        [
            'key' => 'status',
            'label' => '商機狀態',
            'options' => [
                ['value' => 'all', 'label' => '全部'],
                ['value' => 'draft', 'label' => '暫存'],
                ['value' => 'approved', 'label' => '已核准'],
                ['value' => 'reviewing', 'label' => '審核中'],
                ['value' => 'rejected', 'label' => '退回補件'],
                ['value' => 'expiring', 'label' => '即將到期'],
                ['value' => 'expired', 'label' => '已到期'],
                ['value' => 'cancelled', 'label' => '已取消'],
                ['value' => 'completed', 'label' => '已結案'],
                ['value' => 'invalid', 'label' => '已失效'],
            ],
        ],
    ],
    'opportunities' => [
        [
            'id' => 'DRAFT-001',
            'customer' => '（暫存）尚未填寫完整',
            'amount' => '-',
            'amountValue' => 0,
            'status' => 'draft',
            'dealer' => 'tw',
            'protection' => '-',
            'created_by' => 'P260312001',
            'oem_sales_id' => 'P260101001',
        ],
        [
            'id' => 'N260728005',
            'customer' => 'A 公司',
            'amount' => '$500,000',
            'amountValue' => 500000,
            'status' => 'approved',
            'dealer' => 'tw',
            'protection' => '2026-09-30',
            'created_by' => 'P260312001',
            'oem_sales_id' => 'P260101001',
        ],
        [
            'id' => 'N260728004',
            'customer' => 'B 科技',
            'amount' => '$80,000',
            'amountValue' => 80000,
            'status' => 'reviewing',
            'dealer' => 'oem',
            'protection' => '-',
            'created_by' => 'P260101001',
            'oem_sales_id' => 'P260101001',
        ],
        [
            'id' => 'N260728002',
            'customer' => 'D 數位',
            'amount' => '$350,000',
            'amountValue' => 350000,
            'status' => 'rejected',
            'dealer' => 'tw',
            'protection' => '-',
            'created_by' => 'P260118001',
            'oem_sales_id' => 'P260101001',
        ],
        [
            'id' => 'N260728001',
            'customer' => 'C 集團',
            'amount' => '$1,200,000',
            'amountValue' => 1200000,
            'status' => 'expiring',
            'dealer' => 'overseas',
            'protection' => '2026-07-15',
            'created_by' => 'P251106001',
            'oem_sales_id' => 'P260102001',
        ],
        [
            'id' => 'N260728003',
            'customer' => 'E 集團',
            'amount' => '$750,000',
            'amountValue' => 750000,
            'status' => 'expired',
            'dealer' => 'oem',
            'protection' => '2026-07-15',
            'created_by' => 'P260102001',
            'oem_sales_id' => 'P260102001',
        ],
        [
            'id' => 'N260728006',
            'customer' => 'F 製造',
            'amount' => '$420,000',
            'amountValue' => 420000,
            'status' => 'cancelled',
            'dealer' => 'tw',
            'protection' => '-',
            'created_by' => 'P260312001',
            'oem_sales_id' => 'P260101001',
        ],
        [
            'id' => 'N260728007',
            'customer' => 'G 醫院',
            'amount' => '$980,000',
            'amountValue' => 980000,
            'status' => 'completed',
            'dealer' => 'oem',
            'protection' => '-',
            'created_by' => 'P260101001',
            'oem_sales_id' => 'P260101001',
        ],
        [
            'id' => 'N260728008',
            'customer' => 'H 零售',
            'amount' => '$260,000',
            'amountValue' => 260000,
            'status' => 'invalid',
            'dealer' => 'overseas',
            'protection' => '-',
            'created_by' => 'P250920001',
            'oem_sales_id' => 'P260104001',
        ],
    ],
    'opportunityPagination' => [
        'summary' => 'Showing 1-9 of 9 results',
        'pages' => [1],
        'current' => 1,
    ],
    'productTabs' => [
        [
            'value' => 'new',
            'label' => '新產品公告',
            'labels' => ['TW' => '新產品公告', 'EN' => 'New Products', 'JP' => '新製品のお知らせ'],
        ],
        [
            'value' => 'eol',
            'label' => 'EOL 停產',
            'labels' => ['TW' => 'EOL 停產', 'EN' => 'End of Life', 'JP' => 'EOL 製造終了'],
        ],
        [
            'value' => 'eos',
            'label' => 'EOS 停止支援',
            'labels' => ['TW' => 'EOS 停止支援', 'EN' => 'End of Support', 'JP' => 'EOS サポート終了'],
        ],
        [
            'value' => 'update',
            'label' => '版本更新',
            'labels' => ['TW' => '版本更新', 'EN' => 'Release Notes', 'JP' => 'バージョン更新'],
        ],
    ],
    'productCategories' => [
        'new' => ['label' => '新產品', 'class' => 'text-brand2'],
        'eol' => ['label' => 'EOL', 'class' => 'text-brand2'],
        'eos' => ['label' => 'EOS', 'class' => 'text-brand2'],
        'update' => ['label' => '版本更新', 'class' => 'text-brand2'],
    ],
    'productAnnouncements' => $assignCatalogIds('PA', [
        [
            'date' => '2026-06-15',
            'category' => 'new',
            'title' => '新產品公告：UPAS 雲端資安平台 7.0 正式上市',
            'attachment' => 'download',
        ],
        [
            'date' => '2026-05-20',
            'category' => 'eol',
            'title' => '產品停產公告：UPAS NOC 5.x 系列將於 2026/12/31 停止銷售',
            'attachment' => 'link',
        ],
        [
            'date' => '2026-05-02',
            'category' => 'new',
            'title' => '新產品公告：UPAS OT 資安偵測方案正式上市',
            'attachment' => 'download',
        ],
        [
            'date' => '2026-04-08',
            'category' => 'eos',
            'title' => '產品停止支援公告：UPAS NOC 4.x 系列將於 2026/09/30 停止技術支援',
            'attachment' => 'link',
        ],
        [
            'date' => '2026-03-12',
            'category' => 'update',
            'title' => '版本更新：UPAS NOC 7.0 Patch 2026-03 安全性更新',
            'attachment' => 'download',
        ],
        [
            'date' => '2026-02-18',
            'category' => 'new',
            'title' => '新產品公告：UPAS 資安監控模組正式推出',
            'attachment' => 'download',
        ],
        [
            'date' => '2026-02-01',
            'category' => 'eos',
            'title' => '產品停止支援公告：UPAS NOC 3.x 系列技術支援即將結束',
            'attachment' => 'link',
        ],
        [
            'date' => '2026-01-25',
            'category' => 'update',
            'title' => 'UPAS NOC 7.0 ISO27001 符規對照表',
            'attachment' => 'link',
        ],
        [
            'date' => '2026-01-08',
            'category' => 'eol',
            'title' => '產品停產公告：UPAS Scanner 3.x 將於 2026/10/31 停止銷售',
            'attachment' => 'link',
        ],
        [
            'date' => '2025-12-18',
            'category' => 'update',
            'title' => '版本更新：UPAS NOC 7.0 Patch 2025-12 功能增強',
            'attachment' => 'download',
        ],
        [
            'date' => '2025-12-10',
            'category' => 'new',
            'title' => '新產品公告：UPAS NOC 雲端備援模組開放申請',
            'attachment' => 'link',
        ],
        [
            'date' => '2025-11-15',
            'category' => 'eol',
            'title' => '產品停產公告：UPAS Appliance 2.x 硬體型號停止接單',
            'attachment' => 'download',
        ],
    ]),
    'productPagination' => [
        'summary' => 'Showing 1-4 of 4 results',
        'pages' => [1],
        'current' => 1,
    ],
    'marketingTabs' => [
        [
            'value' => 'doc',
            'label' => '文件',
            'labels' => ['TW' => '文件', 'EN' => 'Documents', 'JP' => 'ドキュメント'],
        ],
        [
            'value' => 'deck',
            'label' => '簡報',
            'labels' => ['TW' => '簡報', 'EN' => 'Decks', 'JP' => 'プレゼン資料'],
        ],
        [
            'value' => 'kit',
            'label' => 'Campaign Kit',
            'labels' => ['TW' => 'Campaign Kit', 'EN' => 'Campaign Kit', 'JP' => 'キャンペーンキット'],
        ],
    ],
    'marketingCategories' => [
        'doc' => ['label' => '文件'],
        'deck' => ['label' => '簡報'],
        'kit' => ['label' => 'Campaign Kit'],
    ],
    'marketingFormats' => ['PDF', 'PPTX', 'XLSX', 'ZIP'],
    'marketingResources' => $assignCatalogIds('MR', [
        [
            'date' => '2026-08-20',
            'category' => 'doc',
            'title' => 'UPAS NOC 7.0 產品規格書',
            'format' => 'PDF',
            'attachment' => 'download',
        ],
        [
            'date' => '2026-08-12',
            'category' => 'deck',
            'title' => 'UPAS NOC 7.0 銷售簡報',
            'format' => 'PPTX',
            'attachment' => 'download',
        ],
        [
            'date' => '2026-08-01',
            'category' => 'kit',
            'title' => '2026 Q3 通路活動素材包',
            'format' => 'ZIP',
            'attachment' => 'download',
        ],
        [
            'date' => '2026-07-22',
            'category' => 'doc',
            'title' => 'UPAS 解決方案白皮書',
            'format' => 'PDF',
            'attachment' => 'download',
        ],
        [
            'date' => '2026-07-15',
            'category' => 'deck',
            'title' => '競爭分析與話術卡',
            'format' => 'PPTX',
            'attachment' => 'download',
        ],
        [
            'date' => '2026-07-08',
            'category' => 'kit',
            'title' => '社群貼文與 Banner 套件',
            'format' => 'ZIP',
            'attachment' => 'download',
        ],
        [
            'date' => '2026-06-30',
            'category' => 'doc',
            'title' => '通路價格表 2026 Q3',
            'format' => 'XLSX',
            'attachment' => 'download',
        ],
        [
            'date' => '2026-06-18',
            'category' => 'deck',
            'title' => 'OT 資安方案介紹簡報',
            'format' => 'PPTX',
            'attachment' => 'download',
        ],
        [
            'date' => '2026-06-10',
            'category' => 'kit',
            'title' => 'Email 行銷範本與簽名檔',
            'format' => 'ZIP',
            'attachment' => 'download',
        ],
        [
            'date' => '2026-05-28',
            'category' => 'doc',
            'title' => 'UPAS OT 資安偵測方案規格書',
            'format' => 'PDF',
            'attachment' => 'link',
        ],
        [
            'date' => '2026-05-16',
            'category' => 'deck',
            'title' => '經銷商新人產品訓練簡報',
            'format' => 'PPTX',
            'attachment' => 'download',
        ],
        [
            'date' => '2026-05-02',
            'category' => 'kit',
            'title' => '展會用產品海報與易拉展',
            'format' => 'ZIP',
            'attachment' => 'download',
        ],
        [
            'date' => '2026-04-20',
            'category' => 'doc',
            'title' => 'ISO27001 符規對照表',
            'format' => 'PDF',
            'attachment' => 'link',
        ],
        [
            'date' => '2026-04-08',
            'category' => 'deck',
            'title' => 'UPAS 雲端備援模組簡報',
            'format' => 'PPTX',
            'attachment' => 'download',
        ],
        [
            'date' => '2026-03-25',
            'category' => 'kit',
            'title' => '品牌 Logo 與使用規範包',
            'format' => 'ZIP',
            'attachment' => 'download',
        ],
        [
            'date' => '2026-03-12',
            'category' => 'doc',
            'title' => '成功案例：醫療網段 IP 管理導入',
            'format' => 'PDF',
            'attachment' => 'download',
        ],
        [
            'date' => '2026-02-27',
            'category' => 'deck',
            'title' => '訪客管理方案銷售簡報',
            'format' => 'PPTX',
            'attachment' => 'link',
        ],
        [
            'date' => '2026-02-10',
            'category' => 'kit',
            'title' => '新品上市 Campaign Kit：雲端資安平台 7.0',
            'format' => 'ZIP',
            'attachment' => 'download',
        ],
    ]),
    'trainingCourses' => [
        [
            'id' => 'onboarding',
            'label' => '夥伴入門',
            'labels' => ['TW' => '夥伴入門', 'EN' => 'Partner Onboarding', 'JP' => 'パートナー入門'],
            'icon' => 'compass',
            'articles' => [
                [
                    'id' => 'portal-guide',
                    'label' => '平台導覽',
                    'title' => '認識 Partners Portal',
                    'body' => <<<'HTML'
<p>帶你快速走完合作夥伴入口的六大功能區塊，以及總管理者與一般使用者看到的差異。</p>
<p>Partners Portal 是給經銷夥伴使用的工作台。左側主選單可進入各中心；右上角顯示目前公司與角色。本頁右側的課程內容會隨左側目錄切換。</p>
<h2>你可以完成什麼</h2>
<ul>
<li>商機中心：註冊、查詢、續期與審核</li>
<li>產品資訊中心：新品、EOL／EOS 與版本更新</li>
<li>教育訓練中心：線上課程與認證導讀</li>
<li>行銷資源中心：文件、簡報與 Campaign Kit</li>
<li>技術支援中心：FAQ 與技術工單</li>
<li>夥伴管理：註冊申請、公司與聯絡人資料</li>
</ul>
<p>演示時可使用左下角「預覽身分權限」切換總管理者與業務／經銷商，觀察選單與操作差異。</p>
HTML,
                ],
                [
                    'id' => 'opportunity-flow',
                    'label' => '商機報備流程',
                    'title' => '商機報備怎麼走',
                    'body' => <<<'HTML'
<p>從填寫註冊到保護期生效，掌握每個關卡要準備的資料，減少退回補件。</p>
<p>商機需先完成報備並通過審核，才會進入保護期。資料愈完整，審核愈快；Key Man、時程與產品組合是最常被退回的欄位。</p>
<h2>標準路徑</h2>
<ol>
<li><strong>填寫註冊：</strong>選擇商機來源、客戶資料、產品與數量級距，並附上需求說明。</li>
<li><strong>送出審核：</strong>送出後狀態改為審核中，此時仍可於列表追蹤進度。</li>
<li><strong>原廠審核：</strong>通過後會指派原廠業務並產生報備編號；不足則退回補件。</li>
<li><strong>保護期生效：</strong>核准後開始計算保護期，到期前可申請續期。</li>
</ol>
<p>若狀態為「退回補件」，請依審核意見補齊資料後再送出，無需重新開立一筆商機。</p>
HTML,
                ],
                [
                    'id' => 'partner-rights',
                    'label' => '權益與保護期',
                    'title' => '商機保護期與夥伴權益',
                    'body' => <<<'HTML'
<p>了解保護期怎麼算、什麼情況會失效，以及夥伴可使用的資源範圍。</p>
<p>保護期自審核通過當日起算。列表會標示即將到期案件，建議在到期前 14 天提出續期，並補充最新進度。</p>
<h2>保護期常見規則</h2>
<ul>
<li>同一客戶、相同產品線原則上不可重複報備</li>
<li>保護期結束且未續期，案件改為已到期</li>
<li>客戶確認無需求或重複商機，可能改為已失效</li>
<li>夥伴可主動取消尚未成交的報備</li>
</ul>
<h2>夥伴可使用的資源</h2>
<ul>
<li>產品規格書、銷售簡報與案例</li>
<li>本中心的線上課程與認證導讀</li>
<li>技術支援 FAQ 與工單</li>
</ul>
<p>總管理者可檢視審核紀錄與指派業務；一般使用者以報備、查詢與續期為主。</p>
HTML,
                ],
            ],
        ],
        [
            'id' => 'products',
            'label' => '產品訓練',
            'labels' => ['TW' => '產品訓練', 'EN' => 'Product Training', 'JP' => '製品トレーニング'],
            'icon' => 'cpu',
            'articles' => [
                [
                    'id' => 'iplocator',
                    'label' => 'IPLocator 位址解析',
                    'title' => 'IPLocator IP 位址解析模組',
                    'body' => <<<'HTML'
<p>協助客戶把散落在各網段的 IP 資產一次看清楚，是多數導入案的第一個切點。</p>
<p>IPLocator 用來盤點與解析 IP 位址，讓資訊單位掌握「誰在用哪個位址」。適合正在做資產盤點、稽核或網段重整的客戶。</p>
<h2>適合什麼客戶</h2>
<ul>
<li>多棟辦公或跨據點、IP 資料分散在試算表</li>
<li>即將導入 ISO 27001 或內部稽核</li>
<li>規劃與 ARPScanner、MACManager 一併評估</li>
</ul>
<p>銷售話術可先問「現在 IP 清單多久更新一次」，通常能快速對到痛點。</p>
HTML,
                ],
                [
                    'id' => 'arpscanner',
                    'label' => 'ARPScanner IP 管理',
                    'title' => 'ARPScanner IP 管理系統',
                    'body' => <<<'HTML'
<p>在位址盤點之後，進一步做衝突偵測與日常管理，是中大型網路常見的下一步。</p>
<p>ARPScanner 協助偵測 IP 衝突、掌握連線狀態，減少「位址被佔用卻找不到人」的工單。常與 IPLocator 搭配提案。</p>
<h2>銷售重點</h2>
<ul>
<li>降低人工作業與重複派工</li>
<li>對製造、醫療等 24 小時運作環境特別有感</li>
<li>可依節點數量選擇數量級距，方便報價</li>
</ul>
<p>提案時請一併確認客戶現有網管工具，避免功能重疊造成疑慮。</p>
HTML,
                ],
                [
                    'id' => 'dhcpmanager',
                    'label' => 'DHCPManager 管理',
                    'title' => 'DHCPManager DHCP 管理系統',
                    'body' => <<<'HTML'
<p>當客戶的位址發放仍靠多台 DHCP、政策不一致時，這門課幫你對齊話術與導入順序。</p>
<p>DHCPManager 讓位址發放政策可被集中檢視與調整，適合據點多、租約衝突頻繁的環境。</p>
<h2>導入時要先問</h2>
<ul>
<li>DHCP 伺服器數量與分布</li>
<li>是否已有固定／浮動位址的區隔</li>
<li>與現有防火牆或網管的整合需求</li>
</ul>
<p>大型案建議先 POC 單一網段，再擴到全區，較容易過決策。</p>
HTML,
                ],
                [
                    'id' => 'macmanager',
                    'label' => 'MACManager 位址管理',
                    'title' => 'MACManager MAC 位址管理系統',
                    'body' => <<<'HTML'
<p>訪客、BYOD 與設備准入是常見切點，適合與 IP 管理方案一起談。</p>
<p>MACManager 用來管理裝置位址與准入政策，常出現在訪客管理、門市與醫療場域。</p>
<h2>常見場景</h2>
<ul>
<li>訪客裝置需暫時上網且要留下紀錄</li>
<li>內部設備要避免未授權接入</li>
<li>與 IPLocator 一併做資產與准入閉環</li>
</ul>
<p>若客戶已在評估訪客管理，請同步準備行銷資源中心的方案簡報。</p>
HTML,
                ],
            ],
        ],
        [
            'id' => 'sales',
            'label' => '銷售與案例',
            'labels' => ['TW' => '銷售與案例', 'EN' => 'Sales & Cases', 'JP' => 'セールスと事例'],
            'icon' => 'presentation',
            'articles' => [
                [
                    'id' => 'discovery',
                    'label' => '需求訪談技巧',
                    'title' => '需求訪談怎麼問',
                    'body' => <<<'HTML'
<p>用四個問題把現況、痛點、決策鏈與時程問清楚，報備資料也會比較完整。</p>
<p>訪談不是一次介紹完所有產品。先確認客戶現在怎麼管 IP／MAC，再對應模組，最後才談時程與預算。</p>
<ol>
<li><strong>現況盤點：</strong>清單在哪、多久更新、由誰維護。</li>
<li><strong>痛點：</strong>衝突、找不到人、稽核抽問時交不出資料。</li>
<li><strong>決策鏈：</strong>承辦人與 Key Man 是否同一人，誰能拍板。</li>
<li><strong>時程：</strong>POC、決策、交貨與上線的大致月份。</li>
</ol>
<p>這四項正好對應商機註冊欄位。訪談當下記下來，可減少退回補件。</p>
HTML,
                ],
                [
                    'id' => 'hospital-case',
                    'label' => '醫療業導入案例',
                    'title' => '成功案例：醫療網段 IP 管理',
                    'body' => <<<'HTML'
<p>以醫療場域為例，說明如何從網段盤點走到 DHCP 管理，並對應商機中心的結案情境。</p>
<p>醫療環境網段多、設備異質，IP 衝突會直接影響診療流程。此案先以 IPLocator 完成盤點，再導入 DHCPManager 統一發放政策。</p>
<h2>為什麼成交</h2>
<ul>
<li>對齊稽核與營運不中斷兩項需求</li>
<li>POC 先選非急診網段，降低風險</li>
<li>原廠與夥伴共同參與決策會議</li>
</ul>
<blockquote>「先把位址看清楚，後續的准入與發放才有依據。」<br>G 醫院　資訊室</blockquote>
<p>完整簡報與規格書可至行銷資源中心下載。</p>
HTML,
                ],
                [
                    'id' => 'compete',
                    'label' => '競爭分析要點',
                    'title' => '面對競爭時怎麼說',
                    'body' => <<<'HTML'
<p>客戶同時評估其他網管或 NAC 時，把差異說在「盤點完整性」與「落地支援」，而不是比功能清單。</p>
<p>競爭不一定要正面否定對方。先確認客戶真正要解決的是盤點、衝突還是准入，再對應 UPAS 模組組合。</p>
<h2>建議強調</h2>
<ul>
<li>IP／MAC 資產可視性，而不只是阻擋</li>
<li>可分模組導入，降低一次換系統的阻力</li>
<li>在地支援與 Partners Portal 的報備、訓練資源</li>
</ul>
<p>行銷資源中心有「競爭分析與話術卡」，可與本課一起使用。</p>
HTML,
                ],
            ],
        ],
        [
            'id' => 'cert',
            'label' => '認證課程',
            'labels' => ['TW' => '認證課程', 'EN' => 'Certification', 'JP' => '認定コース'],
            'icon' => 'badge-check',
            'articles' => [
                [
                    'id' => 'sales-cert',
                    'label' => '銷售認證導讀',
                    'title' => '銷售認證考前導讀',
                    'body' => <<<'HTML'
<p>整理銷售認證的出題範圍與準備順序，建議先完成本中心「夥伴入門」與「銷售與案例」。</p>
<p>銷售認證檢核你是否能獨立完成需求訪談、模組對應與商機報備。通過後可在對外場合使用認證夥伴識別。</p>
<h2>準備範圍</h2>
<ul>
<li>六大功能區塊與角色權限差異</li>
<li>商機報備欄位與保護期規則</li>
<li>四個核心產品的適用場景</li>
<li>醫療與跨據點兩類案例話術</li>
</ul>
<p>本頁為示意導讀。正式考場與報名流程將由原廠訓練窗口另行通知。</p>
HTML,
                ],
                [
                    'id' => 'tech-cert',
                    'label' => '技術認證實作',
                    'title' => '技術認證實作指引',
                    'body' => <<<'HTML'
<p>技術認證著重 POC 環境準備、盤點流程與常見問題排除，適合售前與導入工程師。</p>
<p>實作評量會要求你完成小型網段盤點，並說明如何把結果對應到 IPLocator 與 ARPScanner 的下一步。</p>
<ol>
<li><strong>準備環境：</strong>確認測試網段、帳號權限與現有 DHCP 範圍。</li>
<li><strong>執行盤點：</strong>產出位址清單，標示衝突與不明裝置。</li>
<li><strong>對應方案：</strong>說明哪些問題由哪個模組承接。</li>
<li><strong>回報結果：</strong>用客戶聽得懂的語言整理 POC 結論。</li>
</ol>
<p>實作細節若與現場環境衝突，請改走技術支援中心開立工單。</p>
HTML,
                ],
            ],
        ],
    ],
    'opportunitySources' => [
        ['value' => 'self', 'label' => '自行開發'],
        ['value' => 'oem', 'label' => '原廠派發'],
    ],
    'opportunityCustomerRelations' => [
        ['value' => 'first', 'label' => '第一次接洽'],
        ['value' => 'repeat', 'label' => '多次接洽(未成交)'],
        ['value' => 'other', 'label' => '其他'],
    ],
    'opportunityProducts' => [
        'IPLocator IP位址解析模組',
        'ARPScanner IP管理系統',
        'DHCPManager DHCP管理系統',
        'MACManager MAC位址管理系統',
    ],
    'opportunityUnitRanges' => [
        '0-499',
        '500-999',
        '1000-1999',
        '2000-4999',
        '5000+',
    ],
    'opportunityDefaultProducts' => [
        ['product' => 'IPLocator IP位址解析模組', 'units' => '0-499'],
        ['product' => 'ARPScanner IP管理系統', 'units' => '0-499'],
    ],
    'opportunityDates' => [
        ['name' => 'poc_date', 'label' => '預計 POC 日'],
        ['name' => 'decision_date', 'label' => '預計決策日'],
        ['name' => 'delivery_date', 'label' => '預計交貨日'],
        ['name' => 'complete_date', 'label' => '預計完成日'],
    ],
    'opportunityCustomerFields' => [
        ['name' => 'customer_company', 'label' => '客戶公司名稱', 'placeholder' => '請輸入完整公司名稱，以確保權益', 'type' => 'text'],
        ['name' => 'customer_address', 'label' => '客戶公司地址', 'placeholder' => '請輸入完整公司地址', 'type' => 'text'],
        ['name' => 'contact_name', 'label' => '客戶主要聯絡人／承辦人', 'placeholder' => '請輸入姓名', 'type' => 'text'],
        ['name' => 'contact_title', 'label' => '客戶主要聯絡人 職稱／部門', 'placeholder' => '例：資訊部經理', 'type' => 'text'],
        ['name' => 'contact_phone', 'label' => '客戶主要聯絡人電話', 'placeholder' => '請輸入電話或分機', 'type' => 'tel'],
        ['name' => 'contact_email', 'label' => '客戶主要聯絡人信箱', 'placeholder' => 'name@customer.com', 'type' => 'email'],
    ],
    'opportunityKeyManFields' => [
        ['name' => 'keyman_name', 'label' => 'Key Man', 'placeholder' => '請填寫 Key Man 名稱', 'type' => 'text'],
        ['name' => 'keyman_phone', 'label' => 'Key Man 聯絡電話', 'placeholder' => '請輸入電話或分機', 'type' => 'tel'],
        ['name' => 'keyman_email', 'label' => 'Key Man 聯絡 Email', 'placeholder' => 'name@customer.com', 'type' => 'email'],
    ],
    'opportunityReviewResults' => [
        ['value' => 'approved', 'label' => '審核通過', 'status' => 'approved', 'statusLabel' => '已核准', 'allowResubmit' => false],
        ['value' => 'insufficient', 'label' => '資料不足，請補充', 'status' => 'rejected', 'statusLabel' => '退回補件', 'allowResubmit' => true],
        ['value' => 'need_confirm', 'label' => '商機資訊需確認', 'status' => 'rejected', 'statusLabel' => '退回補件', 'allowResubmit' => true],
        ['value' => 'duplicate', 'label' => '已有相同／重複商機', 'status' => 'invalid', 'statusLabel' => '已失效', 'allowResubmit' => false],
        ['value' => 'not_eligible', 'label' => '不符合商機報備條件', 'status' => 'invalid', 'statusLabel' => '已失效', 'allowResubmit' => false],
        ['value' => 'no_demand', 'label' => '商機已失效／暫無需求', 'status' => 'invalid', 'statusLabel' => '已失效', 'allowResubmit' => false],
        ['value' => 'rejected', 'label' => '審核不通過', 'status' => 'invalid', 'statusLabel' => '已失效', 'allowResubmit' => false],
        ['value' => 'other', 'label' => '其他', 'status' => 'rejected', 'statusLabel' => '退回補件', 'allowResubmit' => true],
    ],
    'opportunityOemSalesOptions' => [
        ['value' => 'wang', 'label' => '王小華'],
        ['value' => 'chen', 'label' => '陳志明'],
        ['value' => 'lin', 'label' => '林佳穎'],
        ['value' => 'huang', 'label' => '黃建宏'],
        ['value' => 'wu', 'label' => '吳佩珊'],
    ],
    'opportunityCatalog' => [
        'N260728005' => [
            'id' => 'N260728005',
            'status' => 'approved',
            'statusLabel' => '已核准',
            'title' => 'A 公司 | 資安基礎建設升級案',
            'dealerName' => '台灣 XX 科技',
            'submittedAt' => '2026/07/18 14:20',
            'customer_company' => 'A 公司',
            'tax_id' => '24567890',
            'amount' => 'NT$ 500,000',
            'amountValue' => 500000,
            'close_date' => '2026 / 10 / 15',
            'product_line' => 'IPLocator、MACManager',
            'requirement' => '客戶規劃全公司 IP／MAC 資產盤點，並評估導入位址管理方案。',
            'attachment' => ['name' => '需求說明.pdf', 'url' => '#'],
            'booking_code' => 'N260728005',
            'dealer' => 'tw',
            'protection' => '2026-09-30',
            'created_by' => 'P260312001',
            'oem_sales_id' => 'P260101001',
            'review' => [
                'result' => 'approved',
                'resultLabel' => '審核通過',
                'sales' => 'wang',
                'salesLabel' => '王小華',
                'bookingCode' => 'N260728005',
                'note' => '資料齊全，已核准並指派原廠業務。',
                'reviewedAt' => '2026/07/19 10:05',
            ],
            'form' => [
                'source' => 'self',
                'oem_sales' => '王小華',
                'customer_relation' => 'first',
                'competitors' => '',
                'products' => ['IPLocator IP位址解析模組', 'MACManager MAC位址管理系統'],
                'units' => ['1000-1999', '500-999'],
                'fields' => [
                    'oem_sales' => '王小華',
                    'customer_company' => 'A 公司',
                    'customer_address' => '台北市內湖區',
                    'contact_name' => '林經理',
                    'contact_title' => '資訊部經理',
                    'contact_phone' => '02-2658-1234',
                    'contact_email' => 'lin@a-corp.com',
                    'keyman_name' => '黃副總',
                    'keyman_phone' => '02-2658-1000',
                    'keyman_email' => 'huang@a-corp.com',
                    'poc_date' => '2026-08-01',
                    'decision_date' => '2026-10-15',
                    'delivery_date' => '2026-11-01',
                    'complete_date' => '2026-12-01',
                ],
            ],
        ],
        'N260728004' => [
            'id' => 'N260728004',
            'status' => 'reviewing',
            'statusLabel' => '審核中',
            'title' => 'B 科技 | 網路設備盤點與存取控管案',
            'dealerName' => '台灣 XX 科技',
            'submittedAt' => '2026/07/22 09:40',
            'customer_company' => 'B 科技',
            'tax_id' => '12345678',
            'amount' => 'NT$ 350,000',
            'amountValue' => 350000,
            'close_date' => '2026 / 09 / 30',
            'product_line' => 'IP/MAC、GAM 訪客管理',
            'requirement' => '客戶希望盤點跨據點設備，並評估導入網路存取控管；目前已完成初步需求訪談。',
            'attachment' => ['name' => '客戶需求規格書.pdf', 'url' => '#'],
            'booking_code' => 'N260728004',
            'dealer' => 'oem',
            'protection' => '-',
            'created_by' => 'P260101001',
            'oem_sales_id' => 'P260101001',
            'review' => null,
            'form' => [
                'source' => 'oem',
                'oem_sales' => '王小華',
                'customer_relation' => 'repeat',
                'competitors' => '客戶同時評估其他網路存取控管方案',
                'products' => ['IPLocator IP位址解析模組', 'MACManager MAC位址管理系統'],
                'units' => ['500-999', '0-499'],
                'fields' => [
                    'oem_sales' => '王小華',
                    'customer_company' => 'B 科技',
                    'customer_address' => '新北市板橋區',
                    'contact_name' => '李承辦',
                    'contact_title' => '資訊處／專案經理',
                    'contact_phone' => '02-8765-4321',
                    'contact_email' => 'lee@b-tech.com',
                    'keyman_name' => '陳總監',
                    'keyman_phone' => '02-8765-4000',
                    'keyman_email' => 'chen@b-tech.com',
                    'poc_date' => '2026-08-15',
                    'decision_date' => '2026-09-30',
                    'delivery_date' => '2026-10-31',
                    'complete_date' => '2026-11-30',
                ],
                'attachment' => [
                    'name' => '客戶需求規格書.pdf',
                    'size' => 245760,
                    'sizeLabel' => '240.0 KB',
                    'type' => 'application/pdf',
                    'url' => '#',
                ],
            ],
        ],
        'N260728001' => [
            'id' => 'N260728001',
            'status' => 'expiring',
            'statusLabel' => '即將到期',
            'title' => 'C 集團 | 跨國據點存取控管案',
            'dealerName' => '海外 Partner HK',
            'submittedAt' => '2026/05/02 11:15',
            'customer_company' => 'C 集團',
            'tax_id' => '87654321',
            'amount' => 'NT$ 1,200,000',
            'amountValue' => 1200000,
            'close_date' => '2026 / 08 / 30',
            'product_line' => 'ARPScanner、DHCPManager',
            'requirement' => '海外據點需統一 IP 管理政策，保護期即將到期。',
            'attachment' => ['name' => '專案簡報.pdf', 'url' => '#'],
            'booking_code' => 'N260728001',
            'dealer' => 'overseas',
            'protection' => '2026-07-15',
            'created_by' => 'P251106001',
            'oem_sales_id' => 'P260102001',
            'review' => [
                'result' => 'approved',
                'resultLabel' => '審核通過',
                'sales' => 'chen',
                'salesLabel' => '陳志明',
                'bookingCode' => 'N260728001',
                'note' => '',
                'reviewedAt' => '2026/05/03 09:30',
            ],
            'form' => [
                'source' => 'self',
                'oem_sales' => '陳志明',
                'customer_relation' => 'repeat',
                'competitors' => '海外據點同時評估其他 IP 管理方案',
                'products' => ['ARPScanner IP管理系統', 'DHCPManager DHCP管理系統'],
                'units' => ['2000-4999', '1000-1999'],
                'fields' => [
                    'oem_sales' => '陳志明',
                    'customer_company' => 'C 集團',
                    'customer_address' => '香港九龍觀塘區',
                    'contact_name' => '周經理',
                    'contact_title' => '資訊長室／專案經理',
                    'contact_phone' => '+852-2345-6789',
                    'contact_email' => 'chow@c-group.com',
                    'keyman_name' => '吳執行長',
                    'keyman_phone' => '+852-2345-6000',
                    'keyman_email' => 'wu@c-group.com',
                    'poc_date' => '2026-06-01',
                    'decision_date' => '2026-08-30',
                    'delivery_date' => '2026-09-30',
                    'complete_date' => '2026-10-31',
                ],
                'attachment' => [
                    'name' => '專案簡報.pdf',
                    'size' => 512000,
                    'sizeLabel' => '500.0 KB',
                    'type' => 'application/pdf',
                    'url' => '#',
                ],
            ],
        ],
        'N260728002' => [
            'id' => 'N260728002',
            'status' => 'rejected',
            'statusLabel' => '退回補件',
            'title' => 'D 數位 | 訪客管理評估案',
            'dealerName' => '台灣 XX 科技',
            'submittedAt' => '2026/07/10 16:05',
            'customer_company' => 'D 數位',
            'tax_id' => '55667788',
            'amount' => 'NT$ 350,000',
            'amountValue' => 350000,
            'close_date' => '2026 / 11 / 01',
            'product_line' => 'GAM 訪客管理',
            'requirement' => '客戶評估訪客管理方案，目前需求說明較簡略。',
            'attachment' => ['name' => '初步需求.docx', 'url' => '#'],
            'booking_code' => 'N260728002',
            'dealer' => 'tw',
            'protection' => '-',
            'created_by' => 'P260118001',
            'oem_sales_id' => 'P260101001',
            'review' => [
                'result' => 'insufficient',
                'resultLabel' => '資料不足，請補充',
                'sales' => 'lin',
                'salesLabel' => '林佳穎',
                'bookingCode' => 'N260728002',
                'note' => '請補充 Key Man 聯絡資訊與預計 POC 時程。',
                'reviewedAt' => '2026/07/11 09:20',
            ],
            'form' => [
                'source' => 'self',
                'oem_sales' => '林佳穎',
                'customer_relation' => 'first',
                'competitors' => '',
                'products' => ['MACManager MAC位址管理系統'],
                'units' => ['0-499'],
                'fields' => [
                    'oem_sales' => '林佳穎',
                    'customer_company' => 'D 數位',
                    'customer_address' => '台北市信義區',
                    'contact_name' => '張經理',
                    'contact_title' => '資訊部',
                    'contact_phone' => '02-2345-6789',
                    'contact_email' => 'contact@d-digital.com',
                    'keyman_name' => '',
                    'keyman_phone' => '',
                    'keyman_email' => '',
                    'poc_date' => '',
                    'decision_date' => '2026-11-01',
                    'delivery_date' => '2026-12-01',
                    'complete_date' => '2026-12-15',
                ],
            ],
        ],
        'N260728003' => [
            'id' => 'N260728003',
            'status' => 'expired',
            'statusLabel' => '已到期',
            'title' => 'E 集團 | 舊案保護期結束',
            'dealerName' => '原廠業務窗口',
            'submittedAt' => '2026/03/01 10:00',
            'customer_company' => 'E 集團',
            'tax_id' => '11223344',
            'amount' => 'NT$ 750,000',
            'amountValue' => 750000,
            'close_date' => '2026 / 06 / 30',
            'product_line' => 'IPLocator、ARPScanner',
            'requirement' => '保護期已結束，客戶暫無後續採購時程。',
            'attachment' => null,
            'booking_code' => 'N260728003',
            'dealer' => 'oem',
            'protection' => '2026-07-15',
            'created_by' => 'P260102001',
            'oem_sales_id' => 'P260102001',
            'review' => [
                'result' => 'approved',
                'resultLabel' => '審核通過',
                'sales' => 'huang',
                'salesLabel' => '黃建宏',
                'bookingCode' => 'N260728003',
                'note' => '',
                'reviewedAt' => '2026/03/02 14:00',
            ],
            'form' => [
                'source' => 'oem',
                'oem_sales' => '黃建宏',
                'customer_relation' => 'repeat',
                'competitors' => '',
                'products' => ['IPLocator IP位址解析模組', 'ARPScanner IP管理系統'],
                'units' => ['1000-1999', '500-999'],
                'fields' => [
                    'oem_sales' => '黃建宏',
                    'customer_company' => 'E 集團',
                    'customer_address' => '台中市西屯區',
                    'contact_name' => '許經理',
                    'contact_title' => '資訊部經理',
                    'contact_phone' => '04-2358-1234',
                    'contact_email' => 'hsu@e-group.com',
                    'keyman_name' => '鄭副總',
                    'keyman_phone' => '04-2358-1000',
                    'keyman_email' => 'cheng@e-group.com',
                    'poc_date' => '2026-04-01',
                    'decision_date' => '2026-06-30',
                    'delivery_date' => '2026-07-31',
                    'complete_date' => '2026-08-31',
                ],
            ],
        ],
        'N260728006' => [
            'id' => 'N260728006',
            'status' => 'cancelled',
            'statusLabel' => '已取消',
            'title' => 'F 製造 | 廠區網路盤點案',
            'dealerName' => '台灣 XX 科技',
            'submittedAt' => '2026/06/12 13:40',
            'customer_company' => 'F 製造',
            'tax_id' => '33445566',
            'amount' => 'NT$ 420,000',
            'amountValue' => 420000,
            'close_date' => '2026 / 09 / 01',
            'product_line' => 'ARPScanner、MACManager',
            'requirement' => '客戶內部組織調整，經銷商已取消此商機報備。',
            'attachment' => ['name' => '取消說明.pdf', 'url' => '#'],
            'booking_code' => 'N260728006',
            'dealer' => 'tw',
            'protection' => '-',
            'created_by' => 'P260312001',
            'oem_sales_id' => 'P260101001',
            'review' => [
                'result' => 'approved',
                'resultLabel' => '審核通過',
                'sales' => 'wu',
                'salesLabel' => '吳佩珊',
                'bookingCode' => 'N260728006',
                'note' => '原已核准；後由夥伴取消報備。',
                'reviewedAt' => '2026/06/13 09:10',
            ],
            'form' => [
                'source' => 'self',
                'oem_sales' => '吳佩珊',
                'customer_relation' => 'first',
                'competitors' => '',
                'products' => ['ARPScanner IP管理系統', 'MACManager MAC位址管理系統'],
                'units' => ['500-999', '0-499'],
                'fields' => [
                    'oem_sales' => '吳佩珊',
                    'customer_company' => 'F 製造',
                    'customer_address' => '桃園市龜山區',
                    'contact_name' => '蔡課長',
                    'contact_title' => '廠務／資訊課',
                    'contact_phone' => '03-327-8899',
                    'contact_email' => 'tsai@f-mfg.com',
                    'keyman_name' => '葉廠長',
                    'keyman_phone' => '03-327-8800',
                    'keyman_email' => 'yeh@f-mfg.com',
                    'poc_date' => '2026-07-01',
                    'decision_date' => '2026-09-01',
                    'delivery_date' => '2026-10-01',
                    'complete_date' => '2026-10-31',
                ],
                'attachment' => [
                    'name' => '取消說明.pdf',
                    'size' => 81920,
                    'sizeLabel' => '80.0 KB',
                    'type' => 'application/pdf',
                    'url' => '#',
                ],
            ],
        ],
        'N260728007' => [
            'id' => 'N260728007',
            'status' => 'completed',
            'statusLabel' => '已結案',
            'title' => 'G 醫院 | 醫療網段 IP 管理導入案',
            'dealerName' => '原廠業務窗口',
            'submittedAt' => '2025/11/08 10:25',
            'customer_company' => 'G 醫院',
            'tax_id' => '99887766',
            'amount' => 'NT$ 980,000',
            'amountValue' => 980000,
            'close_date' => '2026 / 02 / 28',
            'product_line' => 'IPLocator、DHCPManager',
            'requirement' => '保護期已到期，無需再延長保護，本案結案。',
            'attachment' => ['name' => '驗收報告.pdf', 'url' => '#'],
            'booking_code' => 'N260728007',
            'dealer' => 'oem',
            'protection' => '-',
            'created_by' => 'P260101001',
            'oem_sales_id' => 'P260101001',
            'review' => [
                'result' => 'approved',
                'resultLabel' => '審核通過',
                'sales' => 'lin',
                'salesLabel' => '林佳穎',
                'bookingCode' => 'N260728007',
                'note' => '保護期已結束，無需再保護，已結案。',
                'reviewedAt' => '2025/11/09 11:00',
            ],
            'form' => [
                'source' => 'oem',
                'oem_sales' => '林佳穎',
                'customer_relation' => 'repeat',
                'competitors' => '',
                'products' => ['IPLocator IP位址解析模組', 'DHCPManager DHCP管理系統'],
                'units' => ['2000-4999', '1000-1999'],
                'fields' => [
                    'oem_sales' => '林佳穎',
                    'customer_company' => 'G 醫院',
                    'customer_address' => '高雄市苓雅區',
                    'contact_name' => '方主任',
                    'contact_title' => '資訊室主任',
                    'contact_phone' => '07-312-3456',
                    'contact_email' => 'fang@g-hospital.org',
                    'keyman_name' => '沈副院長',
                    'keyman_phone' => '07-312-3000',
                    'keyman_email' => 'shen@g-hospital.org',
                    'poc_date' => '2025-12-01',
                    'decision_date' => '2026-02-28',
                    'delivery_date' => '2026-03-15',
                    'complete_date' => '2026-03-31',
                ],
                'attachment' => [
                    'name' => '驗收報告.pdf',
                    'size' => 307200,
                    'sizeLabel' => '300.0 KB',
                    'type' => 'application/pdf',
                    'url' => '#',
                ],
            ],
        ],
        'N260728008' => [
            'id' => 'N260728008',
            'status' => 'invalid',
            'statusLabel' => '已失效',
            'title' => 'H 零售 | 門市訪客管理評估案',
            'dealerName' => '海外 Partner SG',
            'submittedAt' => '2026/07/05 15:10',
            'customer_company' => 'H 零售',
            'tax_id' => '66778899',
            'amount' => 'NT$ 260,000',
            'amountValue' => 260000,
            'close_date' => '2026 / 10 / 01',
            'product_line' => 'MACManager',
            'requirement' => '審核判定已有相同／重複商機，本案失效。',
            'attachment' => ['name' => '報備資料.pdf', 'url' => '#'],
            'booking_code' => 'N260728008',
            'dealer' => 'overseas',
            'protection' => '-',
            'created_by' => 'P250920001',
            'oem_sales_id' => 'P260104001',
            'review' => [
                'result' => 'duplicate',
                'resultLabel' => '已有相同／重複商機',
                'sales' => 'wang',
                'salesLabel' => '王小華',
                'bookingCode' => 'N260728008',
                'note' => '與既有報備案件重複，本案改為已失效。',
                'reviewedAt' => '2026/07/06 09:45',
            ],
            'form' => [
                'source' => 'self',
                'oem_sales' => '王小華',
                'customer_relation' => 'first',
                'competitors' => '',
                'products' => ['MACManager MAC位址管理系統'],
                'units' => ['0-499'],
                'fields' => [
                    'oem_sales' => '王小華',
                    'customer_company' => 'H 零售',
                    'customer_address' => '新加坡市中心',
                    'contact_name' => 'Tan 經理',
                    'contact_title' => 'IT Manager',
                    'contact_phone' => '+65-6123-4567',
                    'contact_email' => 'tan@h-retail.sg',
                    'keyman_name' => 'Lim 總監',
                    'keyman_phone' => '+65-6123-4000',
                    'keyman_email' => 'lim@h-retail.sg',
                    'poc_date' => '2026-08-01',
                    'decision_date' => '2026-10-01',
                    'delivery_date' => '2026-11-01',
                    'complete_date' => '2026-11-30',
                ],
                'attachment' => [
                    'name' => '報備資料.pdf',
                    'size' => 163840,
                    'sizeLabel' => '160.0 KB',
                    'type' => 'application/pdf',
                    'url' => '#',
                ],
            ],
        ],
    ],
    'supportFaqTypes' => [
        ['value' => 'incident', 'label' => '異常排除'],
        ['value' => 'ops', 'label' => '操作使用'],
        ['value' => 'access', 'label' => '權限設定'],
        ['value' => 'deploy', 'label' => '安裝部署'],
    ],
    'supportFaqModules' => [
        ['value' => 'mac', 'label' => 'MACManager'],
        ['value' => 'ip', 'label' => 'IPLocator'],
        ['value' => 'arp', 'label' => 'ARPScanner'],
        ['value' => 'dhcp', 'label' => 'DHCPManager'],
        ['value' => 'portal', 'label' => '夥伴入口'],
    ],
    'supportFaqs' => [
        [
            'id' => 'faq-mac-duplicate',
            'type' => 'incident',
            'module' => 'mac',
            'question' => '當相同 MAC 出現時，UPAS 可以同時阻斷兩者或只阻斷攻擊者嗎？',
            'answer' => '<p>可以依政策選擇。系統偵測到相同 MAC 出現在不同埠或不同位置時，預設會標示衝突並依「衝突處置」設定處理。</p><ul><li><strong>僅阻斷攻擊者：</strong>保留先註冊或已核准的合法裝置，阻斷後續冒用來源。</li><li><strong>同時阻斷兩者：</strong>適用於無法判斷誰是合法裝置、需先隔離再人工放行的環境。</li></ul><p>建議先在測試網段驗證政策，再套用到生產網段，避免誤阻關鍵設備。</p>',
        ],
        [
            'id' => 'faq-rbac',
            'type' => 'access',
            'module' => 'portal',
            'question' => '角色的存取控制 (RBAC) 如何運作？',
            'answer' => '<p>Partners Portal 以角色決定可見選單與可執行操作。總管理者可審核商機、管理夥伴資料；一般使用者以報備、查詢、下載資源與開立技術工單為主。</p><ul><li>同一公司可有多位使用者，權限依角色而非個人帳號硬編碼。</li><li>技術工單開立後，處理人員由原廠指派，夥伴端可追蹤狀態但不可自行改狀態。</li></ul><p>若需要調整既有帳號角色，請由總管理者於夥伴資料提出，或開立權限類工單。</p>',
        ],
        [
            'id' => 'faq-asset-missing',
            'type' => 'incident',
            'module' => 'ip',
            'question' => '部分網路設備未出現在資產盤點清單怎麼排查？',
            'answer' => '<p>常見原因是盤點範圍未涵蓋該網段、裝置離線，或被現有過濾條件排除。</p><ol><li>確認 Sensor／掃描器是否涵蓋該 VLAN 或實體網段。</li><li>檢查設備當下是否在線，離線裝置需等下次掃描或改為被動蒐集。</li><li>核對排除清單、過濾條件與認證範圍。</li></ol><p>若範圍設定正確仍缺資料，請附上網段資訊與設備範例開立工單。</p>',
        ],
        [
            'id' => 'faq-sensor-vlan',
            'type' => 'incident',
            'module' => 'arp',
            'question' => 'Sensor 無法接收指定 VLAN 的設備資訊？',
            'answer' => '<p>請先確認交換器已把該 VLAN 的流量鏡像或允許 Sensor 所在埠接收 ARP／相關封包。</p><ul><li>Trunk 是否允許目標 VLAN</li><li>SPAN／RSPAN 來源是否包含該 VLAN</li><li>Sensor 介面 VLAN 與管理位址是否正確</li></ul><p>完成網路側確認後，再到主控台查看該 Sensor 的即時流量與最近一次心跳。</p>',
        ],
        [
            'id' => 'faq-dhcp-conflict',
            'type' => 'incident',
            'module' => 'dhcp',
            'question' => 'DHCP 租約衝突時應如何處理？',
            'answer' => '<p>先在 DHCPManager 找出衝突位址、租約來源與時間，再決定是回收租約或調整範圍。</p><ul><li>確認是否有第二台 DHCP 在同一網段發放</li><li>固定／浮動位址區段是否重疊</li><li>裝置是否使用過期的自行設定位址</li></ul><p>大型環境建議先處理單一網段，確認無誤再擴到全區。</p>',
        ],
        [
            'id' => 'faq-mac-guest',
            'type' => 'ops',
            'module' => 'mac',
            'question' => 'MAC 准入政策生效後，訪客仍無法上網？',
            'answer' => '<p>請依序檢查訪客是否已取得暫時許可、對應的 VLAN／ACL 是否放行，以及認證頁是否可開啟。</p><ul><li>訪客 MAC 是否已出現在待核准清單</li><li>暫時上網時段是否已過期</li><li>交換器是否有把未認證流量導向導引網段</li></ul><p>現場排查時建議同時提供交換器埠號與訪客裝置 MAC。</p>',
        ],
        [
            'id' => 'faq-ip-scope',
            'type' => 'deploy',
            'module' => 'ip',
            'question' => '首次安裝後如何確認盤點範圍？',
            'answer' => '<p>安裝完成後，先用一個已知網段做驗證，確認清單數量與現場資產大致相符，再擴大範圍。</p><ol><li>設定掃描或被動蒐集的網段清單</li><li>對照現有 IP 表或 DHCP 範圍</li><li>標記不明裝置與離線裝置，避免一次當成異常</li></ol><p>POC 建議選擇非關鍵網段，降低對營運的影響。</p>',
        ],
        [
            'id' => 'faq-portal-role',
            'type' => 'access',
            'module' => 'portal',
            'question' => '如何為夥伴入口帳號指定角色？',
            'answer' => '<p>新帳號預設為一般使用者。若需改為總管理者，請由既有總管理者於夥伴資料提出，或開立「權限設定」工單並註明公司統編與帳號信箱。</p><p>角色變更會影響商機審核、匯出與夥伴資料維護等操作，請避免多人同時擁有不必要的最高權限。</p>',
        ],
        [
            'id' => 'faq-mac-export',
            'type' => 'ops',
            'module' => 'mac',
            'question' => '如何匯出 MAC 准入與阻斷紀錄？',
            'answer' => '<p>在 MACManager 的紀錄頁選擇時間範圍與結果類型後即可匯出。建議先篩選網段或政策，再下載，避免一次帶出過大的檔案。</p><ul><li>可用 CSV 交給現場核對交換器埠位</li><li>阻斷紀錄請一併保留政策名稱與生效時間</li></ul><p>若匯出欄位與現場報表不一致，請開立操作使用類工單並附上範例檔。</p>',
        ],
        [
            'id' => 'faq-dhcp-apply',
            'type' => 'ops',
            'module' => 'dhcp',
            'question' => '調整 DHCP 範圍後，新設定何時會生效？',
            'answer' => '<p>範圍與選項變更會先寫入待發布設定，需發布後才會套用到對應網段。既有租約通常等到續約或到期才改用新範圍。</p><ol><li>確認發布對象是正確的 DHCP 服務或站點</li><li>觀察新裝置是否取得新範圍的位址</li><li>舊裝置可在維護時段手動更新租約</li></ol><p>正式環境建議先在測試網段發布，確認無誤再擴大。</p>',
        ],
        [
            'id' => 'faq-arp-compare',
            'type' => 'ops',
            'module' => 'arp',
            'question' => 'ARPScanner 與 IPLocator 的資料不一致怎麼對照？',
            'answer' => '<p>兩者蒐集來源不同：ARPScanner 偏即時流量，IPLocator 則含掃描與既有資產。短暫不一致很常見，先對時間與網段再判斷是否異常。</p><ul><li>比對同一 VLAN、同一時間窗的清單</li><li>確認其中一邊是否被排除清單過濾</li><li>離線或靜音裝置可能只出現在盤點結果</li></ul><p>若同一網段長期落差很大，請附上兩個模組的匯出與交換器資訊開立工單。</p>',
        ],
        [
            'id' => 'faq-portal-manual',
            'type' => 'ops',
            'module' => 'portal',
            'question' => '夥伴入口的故障排除手冊要在哪裡下載？',
            'answer' => '<p>技術支援中心最下方的「檔案下載」可取得手冊與相關連結。下載前請確認帳號已通過審核，否則部分資源會被權限隱藏。</p><p>若清單沒有你需要的版本，請開立工單並註明產品與版號，由原廠補上後即可再下載。</p>',
        ],
    ],
    'supportTicketTypes' => [
        ['value' => 'operation', 'label' => '操作問題'],
        ['value' => 'system', 'label' => '系統問題'],
        ['value' => 'feature', 'label' => '功能問題'],
    ],
    'supportVersionHelpHtml' => '<ol><li>點擊頁面中右上角的設定 <i data-lucide="settings" class="inline-block w-4 h-4 align-[-0.2em] text-gray4"></i>。</li><li>尋找畫面左邊的 <strong>Version number</strong>。</li></ol><p><strong>Version number：</strong></br><code>8.2.6.20260713 en_US rc 11313</code></p>',
    'supportTicketStatuses' => [
        ['value' => 'open', 'label' => '未處理', 'icon' => 'circle-alert'],
        ['value' => 'progress', 'label' => '處理中', 'icon' => 'clock'],
        ['value' => 'resolved', 'label' => '已處理', 'icon' => 'check-circle'],
    ],
    'supportTickets' => [
        [
            'id' => 'TKT-2601',
            'customer' => 'A 公司',
            'product' => 'IPLocator / v3.5.2',
            'subject' => '部分網路設備未出現在資產盤點清單',
            'updated' => '10 分鐘前',
            'updatedAt' => '2026-09-09 15:32',
            'createdAt' => '2026-09-09 09:18',
            'assignee' => 'Joy',
            'status' => 'resolved',
            'type' => 'system',
            'contact' => '林佳穎 ・ 02-2555-1001',
            'description' => '客戶反映內湖辦公網段有多台印表機與 AP 未出現在 IPLocator 資產盤點清單，現場已確認設備在線。',
            'note' => '已補齊該 VLAN 的掃描範圍，清單已可看到缺漏設備。',
            'attachment' => [
                'name' => '缺漏設備清單.xlsx',
                'size' => 18944,
                'sizeLabel' => '18.5 KB',
                'type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'url' => '#',
            ],
        ],
        [
            'id' => 'TKT-2602',
            'customer' => 'B 科技',
            'product' => 'ARPScanner / v3.4.1',
            'subject' => 'Sensor 無法接收指定 VLAN 的設備資訊',
            'updated' => '2 天前',
            'updatedAt' => '2026-09-07 11:05',
            'createdAt' => '2026-09-07 10:40',
            'assignee' => '志銘',
            'status' => 'progress',
            'type' => 'system',
            'contact' => '陳威宇 ・ 03-5123-8899',
            'description' => '板橋機房 Sensor 對 VLAN 80 收不到 ARP 資訊，其他 VLAN 正常。交換器 SPAN 設定已請客戶協助確認中。',
            'note' => '',
        ],
        [
            'id' => 'TKT-2603',
            'customer' => 'C 集團',
            'product' => '夥伴入口 / v2.1.0',
            'subject' => '終端設備補丁狀態未正常更新',
            'updated' => '2026-05-12',
            'updatedAt' => '2026-05-12 16:20',
            'createdAt' => '2026-05-11 14:02',
            'assignee' => '志銘',
            'status' => 'open',
            'type' => 'operation',
            'contact' => '黃詩涵 ・ 04-2200-7788',
            'description' => '海外據點回報終端補丁狀態停留在上月結果，主控台重新整理後仍未更新。請協助確認同步排程與帳號權限。',
            'note' => '',
            'attachment' => [
                'name' => '補丁狀態截圖.png',
                'size' => 512000,
                'sizeLabel' => '500.0 KB',
                'type' => 'image/png',
                'url' => '#',
            ],
        ],
        [
            'id' => 'TKT-2604',
            'customer' => 'G 醫院',
            'product' => 'MACManager / v3.5.0',
            'subject' => '訪客 MAC 核准後仍無法連線',
            'updated' => '5 小時前',
            'updatedAt' => '2026-09-09 10:20',
            'createdAt' => '2026-09-09 08:55',
            'assignee' => 'Joy',
            'status' => 'progress',
            'type' => 'feature',
            'contact' => '張志偉 ・ 02-8888-6600',
            'description' => '門診大廳訪客完成核准後無法取得位址。已提供交換器埠號與訪客 MAC，請協助確認准入政策與導引網段。',
            'note' => '',
        ],
        [
            'id' => 'TKT-2605',
            'customer' => 'D 數位',
            'product' => '夥伴入口 / v2.1.0',
            'subject' => '申請將夥伴入口帳號改為總管理者',
            'updated' => '1 週前',
            'updatedAt' => '2026-09-02 17:48',
            'createdAt' => '2026-09-02 17:48',
            'assignee' => 'Joy',
            'status' => 'resolved',
            'type' => 'operation',
            'contact' => '王小明 ・ 02-8888-7777',
            'description' => '請將聯絡人王小明的帳號角色調整為總管理者，以便進行商機審核。',
            'note' => '已完成角色調整，請重新登入後確認選單。',
        ],
    ],
    'supportDownloads' => $assignCatalogIds('SD', [
        [
            'title' => 'UPAS NOC 系統故障排除手冊',
            'format' => 'PDF',
            'attachment' => 'download',
            'attachmentName' => 'UPAS-NOC-troubleshooting.pdf',
        ],
        [
            'title' => '2026 系統故障排除手冊連結',
            'format' => 'Link',
            'attachment' => 'link',
            'attachmentUrl' => 'https://support.upas.com.tw/docs/troubleshooting-2026',
        ],
        [
            'title' => 'MACManager 准入政策設定指引',
            'format' => 'PDF',
            'attachment' => 'download',
            'attachmentName' => 'MACManager-policy-guide.pdf',
        ],
        [
            'title' => 'IPLocator 盤點範圍設定說明',
            'format' => 'PDF',
            'attachment' => 'download',
            'attachmentName' => 'IPLocator-scope-guide.pdf',
        ],
        [
            'title' => 'ARPScanner 部署檢查清單',
            'format' => 'PDF',
            'attachment' => 'download',
            'attachmentName' => 'ARPScanner-checklist.pdf',
        ],
        [
            'title' => 'DHCPManager 常見問題整理',
            'format' => 'PDF',
            'attachment' => 'download',
            'attachmentName' => 'DHCPManager-faq.pdf',
        ],
        [
            'title' => '技術支援開單注意事項',
            'format' => 'Link',
            'attachment' => 'link',
            'attachmentUrl' => 'https://support.upas.com.tw/docs/ticket-guidelines',
        ],
    ]),
    'partnerStatuses' => [
        ['value' => 'reviewing', 'label' => '審核中', 'icon' => 'clock'],
        ['value' => 'approved', 'label' => '已核准', 'icon' => 'check-circle'],
        ['value' => 'rejected', 'label' => '已退回', 'icon' => 'file-warning'],
    ],
    // 後台審核指定；申請人註冊時不選
    'partnerIdentityTypes' => [
        ['value' => 'oem_manager', 'label' => '原廠業務主管'],
        ['value' => 'oem_sales', 'label' => '原廠業務'],
        ['value' => 'dealer_tw', 'label' => '國內經銷商'],
        ['value' => 'dealer_overseas', 'label' => '海外經銷商'],
    ],
    // 列表篩選（原廠業務含主管＋業務）
    'partnerIdentityFilters' => [
        ['value' => 'oem', 'label' => '原廠業務', 'identities' => ['oem_manager', 'oem_sales']],
        ['value' => 'dealer_overseas', 'label' => '海外經銷商', 'identities' => ['dealer_overseas']],
        ['value' => 'dealer_tw', 'label' => '國內經銷商', 'identities' => ['dealer_tw']],
    ],
    // 僅經銷身分權限使用；只做標示，不影響商機可見範圍
    'partnerLevels' => [
        ['value' => 'standard', 'label' => '一般'],
        ['value' => 'gold', 'label' => '黃金'],
        ['value' => 'platinum', 'label' => '白金'],
        ['value' => 'diamond', 'label' => '鑽石'],
    ],
    'partners' => [
        [
            'id' => 'P260312001',
            'identity' => 'dealer_tw',
            'level' => 'gold',
            'oem_sales' => '林佳穎',
            'oem_sales_id' => 'P260101001',
            'manager_id' => '',
            'company' => '數位聯防科技股份有限公司',
            'tax_id' => '24567890',
            'country' => 'tw',
            'name' => '王小明',
            'email' => 'ming.wang@digidefend.com.tw',
            'phone' => '02-1234-5678',
            'job_title' => '業務經理 / 通路部',
            'status' => 'approved',
            'applied_at' => '2026-03-12',
        ],
        [
            'id' => 'P260821001',
            'identity' => '',
            'level' => '',
            'oem_sales' => '陳志偉',
            'oem_sales_id' => '',
            'manager_id' => '',
            'company' => '雲端資安股份有限公司',
            'tax_id' => '53881234',
            'country' => 'tw',
            'name' => '張雅婷',
            'email' => 'yating.chang@cloudsec.com.tw',
            'phone' => '02-8765-4321',
            'job_title' => '協理 / 業務處',
            'status' => 'reviewing',
            'applied_at' => '2026-08-21',
        ],
        [
            'id' => 'P260118001',
            'identity' => 'dealer_tw',
            'level' => 'platinum',
            'oem_sales' => '林佳穎',
            'oem_sales_id' => 'P260101001',
            'manager_id' => '',
            'company' => '高雄網通系統有限公司',
            'tax_id' => '16774521',
            'country' => 'tw',
            'name' => '黃建宏',
            'email' => 'chienhung@khnetsys.com.tw',
            'phone' => '07-336-8800',
            'job_title' => '業務主任 / 南區',
            'status' => 'approved',
            'applied_at' => '2026-01-18',
        ],
        [
            'id' => 'P251106001',
            'identity' => 'dealer_overseas',
            'level' => 'gold',
            'oem_sales' => '吳佩珊',
            'oem_sales_id' => 'P260102001',
            'manager_id' => '',
            'company' => '香港網絡防護有限公司',
            'tax_id' => '68901234',
            'country' => 'hk',
            'name' => '李浩然',
            'email' => 'horan.lee@netguard.hk',
            'phone' => '+852-2123-7788',
            'job_title' => 'Sales Manager / Channel',
            'status' => 'approved',
            'applied_at' => '2025-11-06',
        ],
        [
            'id' => 'P260704001',
            'identity' => 'dealer_overseas',
            'level' => 'standard',
            'oem_sales' => '佐藤 健',
            'oem_sales_id' => 'P260103001',
            'manager_id' => '',
            'company' => '東京セキュア株式会社',
            'tax_id' => 'T8010001123456',
            'country' => 'jp',
            'name' => '田中 美咲',
            'email' => 'misaki.tanaka@tokyosecure.jp',
            'phone' => '+81-3-1234-5678',
            'job_title' => '営業部 / マネージャー',
            'status' => 'approved',
            'applied_at' => '2026-07-04',
        ],
        [
            'id' => 'P260902001',
            'identity' => '',
            'level' => '',
            'oem_sales' => '陳志偉',
            'oem_sales_id' => '',
            'manager_id' => '',
            'company' => '新加坡網安方案 Pte. Ltd.',
            'tax_id' => '202412345K',
            'country' => 'sg',
            'name' => 'Aisha Rahman',
            'email' => 'aisha.rahman@sgcyber.sg',
            'phone' => '+65-6789-1200',
            'job_title' => 'Channel Specialist / Sales',
            'status' => 'reviewing',
            'applied_at' => '2026-09-02',
        ],
        [
            'id' => 'P260615001',
            'identity' => 'dealer_overseas',
            'level' => '',
            'oem_sales' => '吳佩珊',
            'oem_sales_id' => 'P260102001',
            'manager_id' => '',
            'company' => '澳門資訊服務有限公司',
            'tax_id' => 'MO-88321',
            'country' => 'mo',
            'name' => '周曉琳',
            'email' => 'xiaolin.chou@macauits.com',
            'phone' => '+853-2871-6655',
            'job_title' => '客戶經理 / 商務部',
            'status' => 'rejected',
            'applied_at' => '2026-06-15',
        ],
        [
            'id' => 'P260828001',
            'identity' => '',
            'level' => '',
            'oem_sales' => '林佳穎',
            'oem_sales_id' => '',
            'manager_id' => '',
            'company' => '華南網絡科技有限公司',
            'tax_id' => '91440101MA5DXXXXX',
            'country' => 'cn',
            'name' => '劉振宇',
            'email' => 'zhenyu.liu@hnnetsec.cn',
            'phone' => '+86-20-3888-1200',
            'job_title' => '區域經理 / 渠道部',
            'status' => 'reviewing',
            'applied_at' => '2026-08-28',
        ],
        [
            'id' => 'P250920001',
            'identity' => 'dealer_overseas',
            'level' => 'diamond',
            'oem_sales' => 'James Cole',
            'oem_sales_id' => 'P260104001',
            'manager_id' => '',
            'company' => 'Pacific Secure Partners LLC',
            'tax_id' => '98-7654321',
            'country' => 'us',
            'name' => 'Emily Chen',
            'email' => 'emily.chen@pacificsecure.com',
            'phone' => '+1-415-555-0188',
            'job_title' => 'Account Director / APAC Desk',
            'status' => 'approved',
            'applied_at' => '2025-09-20',
        ],
        [
            'id' => 'P260510001',
            'identity' => 'dealer_overseas',
            'level' => '',
            'oem_sales' => '佐藤 健',
            'oem_sales_id' => 'P260103001',
            'manager_id' => '',
            'company' => '서울인포섹 주식회사',
            'tax_id' => '110-81-12345',
            'country' => 'kr',
            'name' => '박지훈',
            'email' => 'jihoon.park@seoulinfosec.kr',
            'phone' => '+82-2-555-0199',
            'job_title' => '과장 / 영업팀',
            'status' => 'rejected',
            'applied_at' => '2026-05-10',
        ],
        [
            'id' => 'P260903001',
            'identity' => '',
            'level' => '',
            'oem_sales' => '陳志偉',
            'oem_sales_id' => '',
            'manager_id' => '',
            'company' => '馬來西亞資安通路 Sdn. Bhd.',
            'tax_id' => '202301234567',
            'country' => 'my',
            'name' => 'Daniel Lim',
            'email' => 'daniel.lim@mysecure.my',
            'phone' => '+60-3-2166-8800',
            'job_title' => 'Sales Executive / Channel',
            'status' => 'reviewing',
            'applied_at' => '2026-09-03',
        ],
        // 示範：原廠人員（第 2 段審核下拉會用到）
        [
            'id' => 'P260101001',
            'identity' => 'oem_sales',
            'level' => '',
            'oem_sales' => '',
            'oem_sales_id' => '',
            'manager_id' => 'P260100001',
            'company' => 'UPAS 原廠',
            'tax_id' => '12345678',
            'country' => 'tw',
            'name' => '林佳穎',
            'email' => 'chiaying.lin@upas.com.tw',
            'phone' => '02-2658-1001',
            'job_title' => '原廠業務 / 通路部',
            'status' => 'approved',
            'applied_at' => '2026-01-01',
        ],
        [
            'id' => 'P260102001',
            'identity' => 'oem_sales',
            'level' => '',
            'oem_sales' => '',
            'oem_sales_id' => '',
            'manager_id' => 'P260100001',
            'company' => 'UPAS 原廠',
            'tax_id' => '12345678',
            'country' => 'tw',
            'name' => '吳佩珊',
            'email' => 'peishan.wu@upas.com.tw',
            'phone' => '02-2658-1002',
            'job_title' => '原廠業務 / 海外組',
            'status' => 'approved',
            'applied_at' => '2026-01-02',
        ],
        [
            'id' => 'P260103001',
            'identity' => 'oem_sales',
            'level' => '',
            'oem_sales' => '',
            'oem_sales_id' => '',
            'manager_id' => 'P260100001',
            'company' => 'UPAS 原廠',
            'tax_id' => '12345678',
            'country' => 'tw',
            'name' => '佐藤 健',
            'email' => 'ken.sato@upas.com.tw',
            'phone' => '02-2658-1003',
            'job_title' => '原廠業務 / 亞太組',
            'status' => 'approved',
            'applied_at' => '2026-01-03',
        ],
        [
            'id' => 'P260104001',
            'identity' => 'oem_sales',
            'level' => '',
            'oem_sales' => '',
            'oem_sales_id' => '',
            'manager_id' => 'P260100001',
            'company' => 'UPAS 原廠',
            'tax_id' => '12345678',
            'country' => 'tw',
            'name' => 'James Cole',
            'email' => 'james.cole@upas.com.tw',
            'phone' => '02-2658-1004',
            'job_title' => 'OEM Sales / APAC',
            'status' => 'approved',
            'applied_at' => '2026-01-04',
        ],
        [
            'id' => 'P260100001',
            'identity' => 'oem_manager',
            'level' => '',
            'oem_sales' => '',
            'oem_sales_id' => '',
            'manager_id' => '',
            'company' => 'UPAS 原廠',
            'tax_id' => '12345678',
            'country' => 'tw',
            'name' => '王經理',
            'email' => 'manager.wang@upas.com.tw',
            'phone' => '02-2658-1000',
            'job_title' => '原廠業務主管',
            'status' => 'approved',
            'applied_at' => '2026-01-01',
        ],
        [
            'id' => 'P260105001',
            'identity' => 'oem_sales',
            'level' => '',
            'oem_sales' => '',
            'oem_sales_id' => '',
            'manager_id' => 'P260100001',
            'company' => 'UPAS 原廠',
            'tax_id' => '12345678',
            'country' => 'tw',
            'name' => '陳志偉',
            'email' => 'chihwei.chen@upas.com.tw',
            'phone' => '02-2658-1005',
            'job_title' => '原廠業務 / 通路部',
            'status' => 'approved',
            'applied_at' => '2026-01-05',
        ],
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
