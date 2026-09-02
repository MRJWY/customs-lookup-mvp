const SHEET_URL = "https://docs.google.com/spreadsheets/d/1Nq_FQ_CuMMO5V4pP2NufXSC4psVvXA2sg7KUPsjXMhU/edit";
const SHEET_DATA_URL = "https://docs.google.com/spreadsheets/d/1Nq_FQ_CuMMO5V4pP2NufXSC4psVvXA2sg7KUPsjXMhU/gviz/tq?sheet=%EC%8B%9C%ED%8A%B81&tqx=out:json";

const fallbackProducts = [
  { model: "910-004298", name: "M280 WIRELESS MOUSE", category: "Mouse", hsCode: "8471601030", baseRate: 8, chinaRate: 0, originCertificate: true, ratedVoltage: false, battery: "AA 배터리", dangerous: false },
  { model: "981-001153", name: "Zone Wireless 2", category: "Wireless Headset", hsCode: "8518309000", baseRate: 8, chinaRate: 1.6, originCertificate: true, ratedVoltage: true, battery: "내장 배터리(리튬 이온)", dangerous: true },
  { model: "920-013581", name: "Alto Keys K98M", category: "Keyboard", hsCode: "8471601020", baseRate: 8, chinaRate: 0, originCertificate: true, ratedVoltage: false, battery: "내장 배터리(리튬 이온)", dangerous: true }
];
let products = [...fallbackProducts];

const state = { query: "", filter: "all" };
const $ = (selector) => document.querySelector(selector);

function yesNo(value) { return value ? "O" : "X"; }
function formatRate(rate) { return Number.isInteger(rate) ? `${rate}%` : `${rate.toFixed(1)}%`; }
function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}
function toBoolean(value) {
  return value === true || ["TRUE", "Y", "YES", "O"].includes(String(value).trim().toUpperCase());
}
function toPercent(value) {
  if (typeof value === "number") return value * 100;
  return Number.parseFloat(String(value).replace("%", "")) || 0;
}

function parseSheetResponse(response) {
  if (response.status === "error" || !response.table) throw new Error("Google Sheets 응답을 읽지 못했습니다.");
  const headers = response.table.cols.map((column) => column.label);
  const rows = response.table.rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row.c[index]?.v ?? ""])));
  return rows.filter((row) => row["모델넘버"]).map((row) => ({
    model: String(row["모델넘버"]),
    name: String(row["제품명"]),
    category: String(row["분류"]),
    hsCode: String(row["HS CODE"]),
    baseRate: toPercent(row["26년 기본세율"]),
    chinaRate: toPercent(row["26년 중국 협정세율"]),
    originCertificate: toBoolean(row["원산지증명서"]),
    ratedVoltage: toBoolean(row["정격전압"]),
    battery: String(row["배터리 종류"]),
    dangerous: toBoolean(row["위험물"]),
    image: String(row["제품이미지"] || "")
  }));
}

function loadSheetProducts() {
  return new Promise((resolve, reject) => {
    const previousGoogle = window.google;
    const timeout = window.setTimeout(() => finish(() => reject(new Error("Google Sheets 연결 시간이 초과됐습니다."))), 10000);
    const script = document.createElement("script");
    const finish = (callback) => {
      window.clearTimeout(timeout);
      script.remove();
      if (previousGoogle === undefined) delete window.google;
      else window.google = previousGoogle;
      callback();
    };

    window.google = { visualization: { Query: { setResponse: (response) => finish(() => resolve(parseSheetResponse(response))) } } };
    script.onerror = () => finish(() => reject(new Error("Google Sheets에 연결할 수 없습니다.")));
    script.src = `${SHEET_DATA_URL}&_=${Date.now()}`;
    document.head.append(script);
  });
}

function setSyncState(stateName, label) {
  const button = $("#syncButton");
  button.dataset.state = stateName;
  button.disabled = stateName === "loading";
  $("#syncLabel").textContent = label;
}

function getFilteredProducts() {
  const query = state.query.trim().toLocaleLowerCase("ko").replaceAll("-", "");
  return products.filter((product) => {
    const haystack = [product.model, product.name, product.category, product.hsCode, product.battery].join(" ").toLocaleLowerCase("ko").replaceAll("-", "");
    const matchesQuery = !query || haystack.includes(query);
    const matchesFilter = state.filter === "all"
      || (state.filter === "danger" && product.dangerous)
      || (state.filter === "battery" && product.battery.includes("내장"))
      || (state.filter === "fta" && product.chinaRate < product.baseRate);
    return matchesQuery && matchesFilter;
  });
}

function cardTemplate(product, index) {
  const initials = product.category === "Wireless Headset" ? "WH" : product.category.slice(0, 2).toUpperCase();
  return `
    <article class="result-card" data-model="${escapeHtml(product.model)}" tabindex="0" role="button" aria-label="${escapeHtml(product.name)} 상세 보기" style="animation-delay:${index * 55}ms">
      <div class="product-cell"><span class="product-icon">${escapeHtml(initials)}</span><span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.model)} · ${escapeHtml(product.category)}</small></span></div>
      <span class="hs-code">${escapeHtml(product.hsCode)}</span>
      <span class="rate"><strong>${formatRate(product.chinaRate)}</strong><small>기본 ${formatRate(product.baseRate)}</small></span>
      <span class="badges">${product.dangerous ? '<i class="badge alert">위험물</i>' : '<i class="badge ok">일반화물</i>'}${product.battery.includes("내장") ? '<i class="badge">내장 배터리</i>' : ''}</span>
      <span class="arrow">→</span>
    </article>`;
}

function render() {
  const filtered = getFilteredProducts();
  $("#resultList").innerHTML = filtered.map(cardTemplate).join("");
  $("#resultCount").textContent = filtered.length;
  $("#emptyState").hidden = filtered.length > 0;
  $("#allCount").textContent = products.length;
  bindCards();
}

function renderMetrics() {
  const dangerCount = products.filter((product) => product.dangerous).length;
  const averageRate = products.length ? products.reduce((sum, product) => sum + product.chinaRate, 0) / products.length : 0;
  $("#itemMetric").textContent = String(products.length).padStart(2, "0");
  $("#dangerMetric").textContent = String(dangerCount).padStart(2, "0");
  $("#rateMetric").innerHTML = `${averageRate.toFixed(1)}<sup>%</sup>`;
}

function openDetail(product) {
  $("#detailContent").innerHTML = `
    <div class="detail-hero"><p class="eyebrow">${escapeHtml(product.category.toUpperCase())}</p><h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(product.model)}</p></div>
    <div class="detail-grid">
      <div class="detail-field"><span>HS CODE</span><strong>${escapeHtml(product.hsCode)}</strong></div>
      <div class="detail-field"><span>중국 협정세율</span><strong>${formatRate(product.chinaRate)} <small>(기본 ${formatRate(product.baseRate)})</small></strong></div>
      <div class="detail-field"><span>원산지증명서</span><strong>${yesNo(product.originCertificate)}</strong></div>
      <div class="detail-field"><span>정격전압 확인</span><strong>${yesNo(product.ratedVoltage)}</strong></div>
      <div class="detail-field"><span>배터리 종류</span><strong>${escapeHtml(product.battery)}</strong></div>
      <div class="detail-field"><span>위험물</span><strong>${yesNo(product.dangerous)}</strong></div>
    </div>
    <p class="detail-note">${product.dangerous ? "선적 전 위험물 서류와 운송사 접수 가능 여부를 확인하세요." : "일반화물 품목입니다. 실제 신고 전 HS CODE와 적용 세율을 최종 확인하세요."}</p>`;
  $("#detailDialog").showModal();
}

function bindCards() {
  document.querySelectorAll(".result-card").forEach((card) => {
    const show = () => openDetail(products.find((product) => product.model === card.dataset.model));
    card.addEventListener("click", show);
    card.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") show(); });
  });
}

$("#searchInput").addEventListener("input", (event) => { state.query = event.target.value; render(); });
$("#filterRow").addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  state.filter = button.dataset.filter;
  document.querySelectorAll(".filter").forEach((filter) => filter.classList.toggle("active", filter === button));
  render();
});
$("#sheetButton").addEventListener("click", () => window.open(SHEET_URL, "_blank", "noopener"));
$("#syncButton").addEventListener("click", refreshProducts);
$(".dialog-close").addEventListener("click", () => $("#detailDialog").close());
$("#detailDialog").addEventListener("click", (event) => { if (event.target === event.currentTarget) event.currentTarget.close(); });
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); $("#searchInput").focus(); }
});

async function refreshProducts() {
  setSyncState("loading", "Google Sheets 동기화 중");
  try {
    const liveProducts = await loadSheetProducts();
    if (!liveProducts.length) throw new Error("등록된 품목이 없습니다.");
    products = liveProducts;
    renderMetrics();
    render();
    const time = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
    setSyncState("live", `${time} 시트 동기화 완료`);
  } catch (error) {
    console.warn(error);
    products = [...fallbackProducts];
    renderMetrics();
    render();
    setSyncState("fallback", "연결 실패 · 내장 데이터 표시");
  }
}

renderMetrics();
render();
refreshProducts();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("service-worker.js");
