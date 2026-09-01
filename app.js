const SHEET_URL = "https://docs.google.com/spreadsheets/d/1Nq_FQ_CuMMO5V4pP2NufXSC4psVvXA2sg7KUPsjXMhU/edit";

const products = [
  { model: "910-004298", name: "M280 WIRELESS MOUSE", category: "Mouse", hsCode: "8471601030", baseRate: 8, chinaRate: 0, originCertificate: true, ratedVoltage: false, battery: "AA 배터리", dangerous: false },
  { model: "981-001153", name: "Zone Wireless 2", category: "Wireless Headset", hsCode: "8518309000", baseRate: 8, chinaRate: 1.6, originCertificate: true, ratedVoltage: true, battery: "내장 배터리(리튬 이온)", dangerous: true },
  { model: "920-013581", name: "Alto Keys K98M", category: "Keyboard", hsCode: "8471601020", baseRate: 8, chinaRate: 0, originCertificate: true, ratedVoltage: false, battery: "내장 배터리(리튬 이온)", dangerous: true }
];

const state = { query: "", filter: "all" };
const $ = (selector) => document.querySelector(selector);

function yesNo(value) { return value ? "O" : "X"; }
function formatRate(rate) { return Number.isInteger(rate) ? `${rate}%` : `${rate.toFixed(1)}%`; }

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
    <article class="result-card" data-model="${product.model}" tabindex="0" role="button" aria-label="${product.name} 상세 보기" style="animation-delay:${index * 55}ms">
      <div class="product-cell"><span class="product-icon">${initials}</span><span><strong>${product.name}</strong><small>${product.model} · ${product.category}</small></span></div>
      <span class="hs-code">${product.hsCode}</span>
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
  bindCards();
}

function openDetail(product) {
  $("#detailContent").innerHTML = `
    <div class="detail-hero"><p class="eyebrow">${product.category.toUpperCase()}</p><h3>${product.name}</h3><p>${product.model}</p></div>
    <div class="detail-grid">
      <div class="detail-field"><span>HS CODE</span><strong>${product.hsCode}</strong></div>
      <div class="detail-field"><span>중국 협정세율</span><strong>${formatRate(product.chinaRate)} <small>(기본 ${formatRate(product.baseRate)})</small></strong></div>
      <div class="detail-field"><span>원산지증명서</span><strong>${yesNo(product.originCertificate)}</strong></div>
      <div class="detail-field"><span>정격전압 확인</span><strong>${yesNo(product.ratedVoltage)}</strong></div>
      <div class="detail-field"><span>배터리 종류</span><strong>${product.battery}</strong></div>
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
$(".dialog-close").addEventListener("click", () => $("#detailDialog").close());
$("#detailDialog").addEventListener("click", (event) => { if (event.target === event.currentTarget) event.currentTarget.close(); });
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); $("#searchInput").focus(); }
});

const dangerCount = products.filter((product) => product.dangerous).length;
const averageRate = products.reduce((sum, product) => sum + product.chinaRate, 0) / products.length;
$("#itemMetric").textContent = String(products.length).padStart(2, "0");
$("#dangerMetric").textContent = String(dangerCount).padStart(2, "0");
$("#rateMetric").innerHTML = `${averageRate.toFixed(1)}<sup>%</sup>`;
render();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("service-worker.js");
