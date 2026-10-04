const url = $request.url;
let body = $response.body;
if (body) {
try {
let obj = JSON.parse(body);
// 1. 推荐直播接口: ^https://api.finka.cn/recommend/live
if (url.includes("/recommend/live")) {
// 过滤掉带有 adList 的模块 (.data.moduleList |= map(select(.adList | not)))
if (obj.data && Array.isArray(obj.data.moduleList)) {
obj.data.moduleList = obj.data.moduleList.filter(item => !item.adList);
}
// 删除列表中的挂件装饰信息 (del(.data.list[].decoV1, .data.list[].deco))
if (obj.data && Array.isArray(obj.data.list)) {
obj.data.list.forEach(item => {
delete item.decoV1;
delete item.deco;
});
}
}
// 2. 推荐动态列表接口: ^https://api.finka.cn/post/rcmd/list?
if (url.includes("/post/rcmd/list")) {
// 删除广告和标签列表 (del(.data.adList, .data.tagList))
if (obj.data) {
delete obj.data.adList;
delete obj.data.tagList;
}
// 过滤掉包含 tabList 的数据项 (.data.list |= map(select(.tabList | not)))
if (obj.data && Array.isArray(obj.data.list)) {
obj.data.list = obj.data.list.filter(item => !item.tabList);
}
}
$done({ body: JSON.stringify(obj) });
} catch (e) {
console.log("Finka Clean Script Error: " + e);
$done({});
}
} else {
$done({});
}
*/