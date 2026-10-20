
// ==UserScript==
// @name         高德地图 POI 详情页净化
// @description  保留必要模块，过滤无关内容及个人信息字段
// @version      1.0.0
// @match        https://info.amap.com/ws/shield/search/poi/detail*
// @run-at       response-body
// ==/UserScript==

(function () {
    "use strict";

    const skeleton = [
        "baseInfo",
        "poiDetailCommonConfig",
        "navbarMore",
        "backToTop",
        "poiDetailBottomBar",
        "poiMapModule",
        "anchor",
        "reSortContentAndSimilar",
        "comprehensiveEditEntrance",
        "functionZone",
        "poiTipBar",
        "floatTelButton",
        "footer_tel_button",
        "footer_retain_button"
    ];

    const ugc = [
        "attractGalleryInfo",
        "combineReviews",
        "evaluateVO",
        "reviews",
        "inviteReview",
        "seriousPublicExperience",
        "societyPublicExperience",
        "poiDetailRankUpCard",
        "travelGuideAndQa",
        "poiDetailAQModule",
        "AIStreetTips",
        "expertNote",
        "recommend_food",
        "shopNews",
        "mallNews",
        "shopBaseCase"
    ];

    const intro = [
        "wikiInfo",
        "wikiInfoBelow",
        "poiDetailNote",
        "poiDetailWikiAndLOI"
    ];

    const poiData = [
        "human_traffic",
        "floorGuideGbf",
        "houseEvaluationInfo",
        "residentialOwnersVO",
        "realtorRealStep",
        "houseOfficeInfo",
        "houseOfficeService",
        "houseOfficeBrandIntroduction",
        "houseOfficeNotice",
        "newHouseDetailInfo",
        "house_apart_info",
        "scenic_mustplay",
        "hotelGraphicDetail",
        "homestayGraphicDetail",
        "hotelFacilities",
        "hotelMustRead",
        "shoppingMallEvent"
    ];

    const service = [
        "enhanceIMQuestions",
        "enhanceCustomerServicePoiModule",
        "aiAgentFooterBar",
        "imBottomGuide",
        "enhanceCustomerServiceFixedBottom",
        "shopBasePerson",
        "shopServiceBffvo",
        "service_process",
        "shopCourseList",
        "poiDetailJobList",
        "jobRec",
        "shop_vip_card",
        "shopStdActivity",
        "privateSphereChannel",
        "kaShopService",
        "ka_not_enter",
        "company1688Info",
        "thirdparty_info",
        "expressEntryCard",
        "poi_intercept",
        "aiAgentEntry",
        "commonAiAgent",
        "poiCardAiAgentEntryV2"
    ];

    const guide = [
        "storeDirections",
        "shopFindWayGuide"
    ];

    const compliance = [
        "shopQualifications",
        "businessQualifications",
        "legal_document",
        "home_legal_document",
        "rec_legal_document",
        "business_scope",
        "governmentInformation",
        "official_account",
        "merchantSettlement",
        "shop_settlement"
    ];

    const booking = [
        "scenic_ticket",
        "movieBookingShelf",
        "hotelRooms",
        "ktvBookingShelf",
        "venueBookingShelfModule",
        "reserveShelf",
        "DinnerBottomBar",
        "poiDetailAppointmentRegister"
    ];

    // 合并全部白名单。
    const keepNames = Object.create(null);

    [
        skeleton,
        ugc,
        intro,
        poiData,
        service,
        guide,
        compliance,
        booking
    ].forEach(function (group) {
        group.forEach(function (name) {
            keepNames[name] = true;
        });
    });

    function keepModule(name) {
        return typeof name === "string" &&
            Object.prototype.hasOwnProperty.call(keepNames, name);
    }

    // 安全读取嵌套字段。
    function at(obj, keys) {
        let current = obj;

        for (let i = 0; i < keys.length; i++) {
            if (
                current === null ||
                typeof current !== "object"
            ) {
                return undefined;
            }

            current = current[keys[i]];
        }

        return current;
    }

    // 与 jq filter_refs 对应：
    // 字符串按白名单过滤，非字符串元素保留。
    function filterRefs(value) {
        if (!Array.isArray(value)) {
            return value;
        }

        return value.filter(function (item) {
            return typeof item !== "string" ||
                keepModule(item);
        });
    }

    // 判断 anchor 项是否包含至少一个保留模块。
    function anchorItemKept(item) {
        return (
            item !== null &&
            typeof item === "object" &&
            !Array.isArray(item) &&
            Array.isArray(item.anchor) &&
            item.anchor.some(function (name) {
                return keepModule(name);
            })
        );
    }

    // 判断上滑面板项是否应保留。
    // modulesMap 不是数组时，默认保留。
    function panelItemKept(item) {
        if (
            item !== null &&
            typeof item === "object" &&
            !Array.isArray(item) &&
            Array.isArray(item.modulesMap)
        ) {
            return item.modulesMap.some(function (name) {
                return keepModule(name);
            });
        }

        return true;
    }

    function trimDetail(root) {
        if (
            root === null ||
            typeof root !== "object" ||
            Array.isArray(root) ||
            root.data === null ||
            typeof root.data !== "object" ||
            Array.isArray(root.data)
        ) {
            return root;
        }

        const data = root.data;

        // 1. 过滤 data.regions 中的模块引用。
        if (
            data.regions !== null &&
            typeof data.regions === "object" &&
            !Array.isArray(data.regions)
        ) {
            Object.keys(data.regions).forEach(function (key) {
                data.regions[key] = filterRefs(data.regions[key]);
            });
        }

        // 2. 仅保留白名单中的 data.modules 模块。
        if (
            data.modules !== null &&
            typeof data.modules === "object" &&
            !Array.isArray(data.modules)
        ) {
            Object.keys(data.modules).forEach(function (key) {
                if (!keepModule(key)) {
                    delete data.modules[key];
                }
            });
        }

        // 3. 过滤半隐藏模块引用。
        const halfHidden = at(data, [
            "meta",
            "half_hidden_modules"
        ]);

        if (Array.isArray(halfHidden)) {
            data.meta.half_hidden_modules =
                filterRefs(halfHidden);
        }

        // 4. 删除用户对象中的位置及个人信息字段。
        const user = at(data, [
            "modules",
            "baseInfo",
            "data",
            "user"
        ]);

        if (
            user !== null &&
            typeof user === "object" &&
            !Array.isArray(user)
        ) {
            delete user.userLocRgeo;
            delete user.homeInfo;
            delete user.companyInfo;
        }

        // 5. 过滤锚点项目。
        const anchorItems = at(data, [
            "modules",
            "anchor",
            "data",
            "items"
        ]);

        if (Array.isArray(anchorItems)) {
            data.modules.anchor.data.items =
                anchorItems.filter(anchorItemKept);
        }

        // 6. 过滤上滑面板文案列表。
        const swipeTexts = at(data, [
            "modules",
            "poiDetailCommonConfig",
            "data",
            "swipeUpPanelConfig",
            "swipeUpPanelTextList"
        ]);

        if (Array.isArray(swipeTexts)) {
            data.modules.poiDetailCommonConfig
                .data.swipeUpPanelConfig
                .swipeUpPanelTextList =
                swipeTexts.filter(panelItemKept);
        }

        return root;
    }

    // Quantumult X 响应体处理入口。
    const response = $response;
    const body = response && response.body;

    if (typeof body !== "string" || body.length === 0) {
        $done({});
        return;
    }

    try {
        const json = JSON.parse(body);
        const result = trimDetail(json);

        $done({
            body: JSON.stringify(result)
        });
    } catch (error) {
        // 解析失败时返回原始响应，避免破坏接口数据。
        $done({
            body: body
        });
    }
})();
