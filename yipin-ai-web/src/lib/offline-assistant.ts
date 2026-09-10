import { customizationPlan, homeManual } from "@/src/lib/data";
import { findManualMatch } from "@/src/lib/manual-search";
import type { AssistantResponse, AssistantResult } from "@/src/types/assistant";

const spaceAliases: Record<string, string[]> = {
  "living-dining": ["客餐厅", "客厅", "餐厅"],
  "primary-bedroom": ["主卧", "主卧室"],
  "boys-bedroom": ["男孩房", "男孩卧室"],
  "girls-bedroom": ["女孩房", "女孩卧室"],
  kitchen: ["厨房"],
  "shared-bathroom": ["公共卫生间", "公卫", "客卫"],
  "primary-bathroom": ["主卫", "主卫生间"],
  balcony: ["阳台"],
};

function answer(reply: string, results: AssistantResult[] = []): AssistantResponse {
  return {
    success: true,
    reply,
    action: { type: "ANSWER_ONLY", targetId: null, targetUrl: null },
    results,
  };
}

function navigation(reply: string, type: AssistantResponse["action"]["type"], targetId: string, targetUrl: string | null): AssistantResponse {
  return { success: true, reply, action: { type, targetId, targetUrl }, results: [] };
}

function normalize(value: string) {
  return value.toLocaleLowerCase("zh-CN").replace(/[\s_\-—，。！？、,.!?：:；;（）()·]/g, "");
}

function findSpace(query: string) {
  return customizationPlan.spaces.find((space) => (spaceAliases[space.id] ?? [space.name]).some((alias) => query.includes(alias)));
}

function findProduct(query: string) {
  const normalizedQuery = normalize(query);
  return customizationPlan.products.find((product) => {
    const identifiers = [product.name, product.productCode, ...(product.name.match(/[a-z]*\d{3,}/gi) ?? [])]
      .filter(Boolean)
      .map(normalize);
    return identifiers.some((identifier) => identifier.length >= 3 && normalizedQuery.includes(identifier));
  });
}

export function askOfflineAssistant(rawQuery: string): AssistantResponse {
  const query = rawQuery.trim();
  if (!query) {
    return { success: false, reply: "请告诉小壹您想查询的房屋、设备或装修问题。", action: { type: "ANSWER_ONLY", targetId: null, targetUrl: null }, results: [] };
  }

  if (["报事报修", "报修", "维修", "联系物业", "找物业", "物业报事"].some((keyword) => query.includes(keyword))) {
    return navigation("小壹已为您打开物业报事报修入口，请使用微信扫描二维码提交服务需求。", "OPEN_REPAIR", "property-repair", null);
  }

  if ((query.includes("验房报告") || query.includes("质检")) && ["多少问题", "问题数", "概况", "结果"].some((keyword) => query.includes(keyword))) {
    return answer("本次验房任务共覆盖279个房间，发现17个问题，其中6个已关闭、11个已整改待复验；已完成复验的问题通过率为100%，详细统计和隐蔽工程影像可在装修质检报告中查看。", [
      { id: "inspection", title: "查看验房报告与现场影像", type: "inspection", url: "/inspection" },
    ]);
  }

  if (["质检", "纪检", "验收", "整改"].some((keyword) => query.includes(keyword))) {
    return {
      ...navigation("小壹已整理本次验房任务报告和5条隐蔽工程影像，可查看验收统计、整改进度以及现场施工记录。", "OPEN_INSPECTION", "inspection", "/inspection"),
      results: [{ id: "inspection", title: "装修质检报告", type: "inspection", url: "/inspection" }],
    };
  }

  const manualMatch = findManualMatch(query);
  if (manualMatch) {
    const { document, page, snippet } = manualMatch;
    const pageText = page ? `已在原说明书第${page}页定位到相关内容。` : "可打开原说明书完整查看。";
    const excerpt = snippet ? `相关原文片段：${snippet}` : document.summary;
    const url = `/home-manual/${document.id}${page ? `?page=${page}` : ""}`;
    return answer(`${document.deviceName ?? document.title}：${pageText}${excerpt}`, [
      { id: document.id, title: `${document.title}${page ? ` · 第${page}页` : ""}`, type: "manual", url },
    ]);
  }

  if (query.includes("设备说明书")) {
    return navigation("已为您打开设备说明书，当前按厨电、卫浴、暖通和其他四个分区展示。", "OPEN_MANUAL", "equipment-manuals", "/home-manual?tab=equipment");
  }

  if (["建筑面积", "多少平", "户型", "朝向", "房屋信息"].some((keyword) => query.includes(keyword))) {
    const house = homeManual.property;
    return answer(`${house.name}的建筑面积为${house.buildingArea}，户型为${house.layout}，朝向为${house.orientation}。更多房屋信息可在数字房屋说明书中查看。`, [
      { id: "home-manual", title: "查看房屋说明书", type: "manual", url: "/home-manual" },
    ]);
  }

  const product = findProduct(query);
  if (product) {
    const productSpaces = customizationPlan.spaces.filter((space) => product.spaceIds.includes(space.id));
    const primarySpace = productSpaces[0];
    const url = `/products/${product.id}${primarySpace ? `?space=${primarySpace.id}` : ""}`;
    return answer(`小壹已找到${product.name}：商品 ID 为 ${product.productCode}，模型尺寸为 ${product.dimensions}，品牌系列为${product.brandSeries}，用于${productSpaces.map((space) => space.name).join("、")}。`, [
      { id: product.id, title: `查看${product.name}详情`, type: "product", url },
    ]);
  }

  const space = findSpace(query);
  if (space && ["产品", "定制", "家具", "材料", "配置", "有哪些"].some((keyword) => query.includes(keyword))) {
    const products = customizationPlan.products.filter((item) => item.spaceIds.includes(space.id));
    const materials = customizationPlan.materials.filter((item) => item.spaceIds.includes(space.id));
    const results: AssistantResult[] = products.slice(0, 3).map((item) => ({ id: item.id, title: item.name, type: "product", url: `/products/${item.id}?space=${space.id}` }));
    results.push({ id: space.id, title: `查看${space.name}完整配置`, type: "space", url: `/materials?space=${space.id}` });
    return answer(`${space.name}方案包含${products.length}项产品：${products.map((item) => item.name).join("、") || "暂无定制产品"}。主要材料为：${materials.map((item) => item.name).join("、") || "暂无主要材料"}。`, results);
  }

  if (query.includes("房屋说明书") || query.includes("设备档案")) {
    return navigation("已为您打开数字房屋说明书中的房屋说明书。", "OPEN_MANUAL", "home-manual", "/home-manual?tab=house");
  }

  if (["产品库", "商品库", "定制化装修", "装修资料"].some((keyword) => query.includes(keyword))) {
    return navigation("已为您打开定制化装修方案。", "OPEN_MATERIAL", "materials", "/materials");
  }

  if (space) {
    return navigation(`小壹已为您定位到${space.name}的定制装修方案。`, "OPEN_SPACE", space.id, `/materials?space=${space.id}`);
  }

  if (query.includes("资料") || query.includes("文档")) {
    return answer("小壹已将居家资料分为定制化装修方案、装修质检报告和数字房屋说明书，可直接选择需要查看的内容。", [
      { id: "materials", title: "定制化装修方案", type: "material", url: "/materials" },
      { id: "inspection", title: "装修质检报告", type: "inspection", url: "/inspection" },
      { id: "home-manual", title: "数字房屋说明书", type: "manual", url: "/home-manual" },
    ]);
  }

  return answer("您可以向小壹询问房屋信息、设备使用与维护、定制装修产品、装修质检或物业报修，例如“净水器如何更换滤芯”。");
}
