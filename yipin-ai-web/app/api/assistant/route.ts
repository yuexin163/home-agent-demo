import { NextResponse } from "next/server";
import { customizationPlan, homeManual, showcaseProducts, spaces } from "@/src/lib/data";
import { findManualMatch } from "@/src/lib/manual-search";
import type { AssistantRequest, AssistantResponse, AssistantResult } from "@/src/types/assistant";

const equipmentAliases: Record<string, string[]> = {
  "installed-floor": ["地板", "地面"],
  "installed-tv-cabinet": ["电视柜", "柜体"],
  "installed-range-hood": ["油烟机", "烟机"],
  "installed-gas-hob": ["燃气灶", "灶具"],
  "installed-dishwasher": ["洗碗机"],
  "installed-smart-toilet": ["智能马桶", "马桶", "座便器"],
  "installed-vanity": ["浴室柜", "洗漱柜"],
  "installed-shower": ["淋浴器", "花洒", "淋浴"],
};

const planSpaceAliases: Record<string, string[]> = {
  "living-dining": ["客餐厅", "客厅", "餐厅"],
  "primary-bedroom": ["主卧", "主卧室"],
  "boys-bedroom": ["男孩房", "男孩卧室"],
  "girls-bedroom": ["女孩房", "女孩卧室"],
  kitchen: ["厨房"],
  "shared-bathroom": ["公共卫生间", "公卫", "客卫"],
  "primary-bathroom": ["主卫", "主卫生间"],
  balcony: ["阳台"],
};

const equipmentZoneBySpaceId: Record<string, string> = {
  kitchen: "厨电",
  "shared-bathroom": "卫浴",
  "primary-bathroom": "卫浴",
};

function normalizeSearchText(value: string) {
  return value.toLocaleLowerCase("zh-CN").replace(/[\s_\-—，。！？、,.!?：:；;（）()·]/g, "");
}

function findPlanSpace(query: string) {
  return customizationPlan.spaces.find((space) => (planSpaceAliases[space.id] ?? [space.name]).some((alias) => query.includes(alias)));
}

function findCustomizationProduct(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  return customizationPlan.products.find((product) => {
    const identifiers = [product.name, product.productCode, ...(product.name.match(/[a-z]*\d{3,}/gi) ?? [])]
      .filter(Boolean)
      .map(normalizeSearchText);
    return identifiers.some((identifier) => identifier.length >= 3 && normalizedQuery.includes(identifier));
  });
}

function productResult(productId: string): AssistantResult | null {
  const product = showcaseProducts.find((item) => item.id === productId);
  return product ? { id: product.id, title: product.name, type: "product", url: `/products/${product.id}` } : null;
}

function answer(reply: string, results: AssistantResult[] = []): AssistantResponse {
  return { success: true, reply, action: { type: "ANSWER_ONLY", targetId: null, targetUrl: null }, results };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<AssistantRequest>;
    const query = body.query?.trim() ?? "";

    if (!query) {
      return NextResponse.json<AssistantResponse>({ success: false, reply: "请告诉小壹您想查询的房屋、设备或装修问题。", action: { type: "ANSWER_ONLY", targetId: null, targetUrl: null }, results: [] }, { status: 400 });
    }

    if (["报事报修", "报修", "维修", "联系物业", "找物业", "物业报事"].some((keyword) => query.includes(keyword))) {
      return NextResponse.json<AssistantResponse>({
        success: true,
        reply: "小壹已为您打开物业报事报修入口，请使用微信扫描二维码提交服务需求。",
        action: { type: "OPEN_REPAIR", targetId: "property-repair", targetUrl: null },
        results: [],
      });
    }

    if ((query.includes("验房报告") || query.includes("质检")) && ["多少问题", "问题数", "概况", "结果"].some((keyword) => query.includes(keyword))) {
      return NextResponse.json(answer(
        "本次验房任务共覆盖279个房间，发现17个问题，其中6个已关闭、11个已整改待复验；已完成复验的问题通过率为100%，详细统计和隐蔽工程影像可在装修质检报告中查看。",
        [{ id: "inspection", title: "查看验房报告与现场影像", type: "inspection", url: "/inspection" }],
      ));
    }

    if (query.includes("质检") || query.includes("纪检") || query.includes("验收") || query.includes("整改")) {
      return NextResponse.json<AssistantResponse>({
        success: true,
        reply: "小壹已整理本次验房任务报告和5条隐蔽工程影像，可查看279个房间的验收统计、17个问题的整改进度以及现场施工记录。当前6个问题已关闭，另有11个问题已整改待复验。",
        action: { type: "OPEN_INSPECTION", targetId: "inspection", targetUrl: "/inspection" },
        results: [{ id: "inspection", title: "装修质检报告", type: "inspection", url: "/inspection" }],
      });
    }

    const manualMatch = findManualMatch(query);
    if (manualMatch) {
      const { document, page, snippet } = manualMatch;
      const pageText = page ? `已在原说明书第${page}页定位到相关内容。` : "该资料为扫描版或未命中具体页，可打开原说明书完整查看。";
      const excerpt = snippet ? `相关原文片段：${snippet}` : document.summary;
      const url = `/home-manual/${document.id}${page ? `?page=${page}` : ""}`;
      return NextResponse.json(answer(`${document.deviceName ?? document.title}：${pageText}${excerpt}`, [{ id: document.id, title: `${document.title}${page ? ` · 第${page}页` : ""}`, type: "manual", url }]));
    }

    const planSpace = findPlanSpace(query);
    const requestedEquipmentZone = planSpace ? equipmentZoneBySpaceId[planSpace.id] : undefined;
    if (planSpace && requestedEquipmentZone && (query.includes("说明书") || query.includes("设备档案"))) {
      const url = `/home-manual?tab=equipment&zone=${encodeURIComponent(requestedEquipmentZone)}`;
      return NextResponse.json<AssistantResponse>({
        success: true,
        reply: `小壹已定位到${planSpace.name}相关的${requestedEquipmentZone}说明书，可按设备名称或型号继续查询。`,
        action: { type: "OPEN_MANUAL", targetId: requestedEquipmentZone, targetUrl: url },
        results: [{ id: requestedEquipmentZone, title: `查看${requestedEquipmentZone}说明书`, type: "manual", url }],
      });
    }

    if (query.includes("设备说明书")) {
      return NextResponse.json<AssistantResponse>({ success: true, reply: "已为您打开设备说明书，当前按厨电、卫浴、暖通和其他四个分区展示。", action: { type: "OPEN_MANUAL", targetId: "equipment-manuals", targetUrl: "/home-manual?tab=equipment" }, results: [] });
    }

    if (["建筑面积", "多少平", "户型", "朝向", "房屋信息"].some((keyword) => query.includes(keyword))) {
      const house = homeManual.property;
      return NextResponse.json(answer(`${house.name}的建筑面积为${house.buildingArea}，户型为${house.layout}，朝向为${house.orientation}。更多房屋信息可在数字房屋说明书中查看。`, [{ id: "home-manual", title: "查看房屋说明书", type: "manual", url: "/home-manual" }]));
    }

    const customizationProduct = findCustomizationProduct(query);
    if (customizationProduct) {
      const productSpaces = customizationPlan.spaces.filter((space) => customizationProduct.spaceIds.includes(space.id));
      const primarySpace = productSpaces[0];
      const url = `/products/${customizationProduct.id}${primarySpace ? `?space=${primarySpace.id}` : ""}`;
      return NextResponse.json(answer(
        `小壹已找到${customizationProduct.name}：商品 ID 为 ${customizationProduct.productCode}，模型尺寸为 ${customizationProduct.dimensions}，品牌系列为${customizationProduct.brandSeries}，用于${productSpaces.map((space) => space.name).join("、")}。`,
        [{ id: customizationProduct.id, title: `查看${customizationProduct.name}详情`, type: "product", url }],
      ));
    }

    if (planSpace && ["产品", "定制", "家具", "材料", "配置", "有哪些"].some((keyword) => query.includes(keyword))) {
      const planProducts = customizationPlan.products.filter((product) => product.spaceIds.includes(planSpace.id));
      const planMaterials = customizationPlan.materials.filter((material) => material.spaceIds.includes(planSpace.id));
      const productNames = planProducts.map((product) => product.name).join("、") || "暂无定制产品";
      const materialNames = planMaterials.map((material) => material.name).join("、") || "暂无主要材料";
      const results: AssistantResult[] = planProducts.slice(0, 3).map((product) => ({
        id: product.id,
        title: product.name,
        type: "product",
        url: `/products/${product.id}?space=${planSpace.id}`,
      }));
      results.push({ id: planSpace.id, title: `查看${planSpace.name}完整配置`, type: "space", url: `/materials?space=${planSpace.id}` });
      return NextResponse.json(answer(
        `${planSpace.name}方案包含${planProducts.length}项产品：${productNames}。主要材料为：${materialNames}。`,
        results,
      ));
    }

    const requestedSpace = spaces.find((space) => query.includes(space.name) || (space.id === "bathroom" && query.includes("卫生间")));
    if (requestedSpace && (query.includes("设备") || query.includes("安装"))) {
      const installed = homeManual.installedEquipment.filter((item) => item.spaceId === requestedSpace.id);
      const names = installed.map((item) => showcaseProducts.find((product) => product.id === item.productId)?.name).filter(Boolean);
      const results = installed.map((item) => productResult(item.productId)).filter((item): item is AssistantResult => Boolean(item)).slice(0, 3);
      results.unshift({ id: `manual-${requestedSpace.id}`, title: `${requestedSpace.name}设备档案`, type: "manual", url: `/home-manual#${requestedSpace.id}` });
      return NextResponse.json(answer(`${requestedSpace.name}当前记录了${installed.length}项已安装材料或设备：${names.join("、")}。可进入设备档案查看安装位置、维护建议与产品详情。`, results));
    }

    const equipment = homeManual.installedEquipment.find((item) => (equipmentAliases[item.id] ?? []).some((alias) => query.includes(alias)));
    if (equipment) {
      const product = showcaseProducts.find((item) => item.id === equipment.productId);
      if (product) {
        const isMaintenance = ["保养", "维护", "清洁", "怎么用", "使用"].some((keyword) => query.includes(keyword));
        const reply = isMaintenance
          ? `${product.name}（型号 ${product.model}）的维护建议：${equipment.maintenance}`
          : `${product.name}安装在${equipment.installLocation}，型号为 ${product.model}。可进入设备档案查看完整说明与维护信息。`;
        return NextResponse.json(answer(reply, [
          { id: equipment.id, title: "查看设备档案", type: "manual", url: `/home-manual#${equipment.id}` },
          { id: product.id, title: "查看产品资料", type: "product", url: `/products/${product.id}` },
        ]));
      }
    }

    if (query.includes("房屋说明书") || query.includes("设备档案")) {
      return NextResponse.json<AssistantResponse>({ success: true, reply: "已为您打开数字房屋说明书中的房屋说明书。", action: { type: "OPEN_MANUAL", targetId: "home-manual", targetUrl: "/home-manual?tab=house" }, results: [] });
    }

    if (query.includes("产品库") || query.includes("商品库") || query.includes("定制化装修") || query.includes("装修资料")) {
      return NextResponse.json<AssistantResponse>({ success: true, reply: "已为您打开定制化装修资料库。", action: { type: "OPEN_MATERIAL", targetId: "materials", targetUrl: "/materials" }, results: [] });
    }

    if (planSpace) {
      return NextResponse.json<AssistantResponse>({ success: true, reply: `小壹已为您定位到${planSpace.name}的定制装修方案。`, action: { type: "OPEN_SPACE", targetId: planSpace.id, targetUrl: `/materials?space=${planSpace.id}` }, results: [] });
    }

    if (requestedSpace) {
      const targetSpaceId = requestedSpace.id === "bathroom" ? "shared-bathroom" : requestedSpace.id;
      return NextResponse.json<AssistantResponse>({ success: true, reply: `已为您打开${requestedSpace.name}定制化装修资料。`, action: { type: "OPEN_SPACE", targetId: targetSpaceId, targetUrl: `/materials?space=${targetSpaceId}` }, results: [] });
    }

    const normalized = query.toLocaleLowerCase("zh-CN");
    const matchedProduct = showcaseProducts.find((product) => [product.name, product.brand, product.model, product.category, product.subcategory, ...product.tags].join(" ").toLocaleLowerCase("zh-CN").includes(normalized));
    if (matchedProduct) {
      return NextResponse.json(answer(`找到产品资料：${matchedProduct.name}，品牌 ${matchedProduct.brand}，型号 ${matchedProduct.model}，适用于${matchedProduct.suitableSpaces.join("、")}。`, [{ id: matchedProduct.id, title: "查看产品详情", type: "product", url: `/products/${matchedProduct.id}` }]));
    }

    if (query.includes("资料") || query.includes("文档")) {
      return NextResponse.json(answer("小壹已将居家资料分为定制化装修方案、装修质检报告和数字房屋说明书，可直接选择需要查看的内容。", [
        { id: "materials", title: "定制化装修方案", type: "material", url: "/materials" },
        { id: "inspection", title: "装修质检报告", type: "inspection", url: "/inspection" },
        { id: "home-manual", title: "数字房屋说明书", type: "manual", url: "/home-manual" },
      ]));
    }

    return NextResponse.json(answer("您可以向小壹询问房屋信息、设备使用与维护、定制装修产品或装修质检，例如“燃气灶如何清洁”。"));
  } catch {
    return NextResponse.json<AssistantResponse>({ success: false, reply: "请求格式有误，请稍后重试。", action: { type: "ANSWER_ONLY", targetId: null, targetUrl: null }, results: [] }, { status: 400 });
  }
}
