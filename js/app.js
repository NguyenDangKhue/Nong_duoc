(function () {
  const {
    FORMS,
    MIX_ORDER,
    PRODUCTS,
    KIND_LABEL,
    AI_LABEL,
    CROP_GROUPS,
    CROPS,
    SAME_GROUP_RULES,
    SOURCES,
    formByCode,
    productById,
    cropById,
    productBannedOnCrop,
    bannedCropsForProduct,
  } = window.BVTV;

  const $ = (id) => document.getElementById(id);
  const pages = {
    home: $("page-home"),
    forms: $("page-forms"),
    form: $("page-form"),
    mix: $("page-mix"),
    products: $("page-products"),
    product: $("page-product"),
    checker: $("page-checker"),
    sources: $("page-sources"),
  };

  let tankL = 16;
  let productFilter = "all";
  let selected = new Set();
  let selectedCrop = "";
  let lang = "vi";
  try {
    const saved = localStorage.getItem("bvtv-lang");
    if (saved === "ja" || saved === "vi") lang = saved;
  } catch (e) {}

  function jaDict() {
    return (window.BVTV_I18N && window.BVTV_I18N.ja) || {};
  }

  function t(key, vi) {
    if (lang === "ja") {
      const v = jaDict().ui && jaDict().ui[key];
      if (v) return v;
    }
    return vi;
  }

  function fill(str, vars) {
    if (!vars) return str;
    return Object.keys(vars).reduce((acc, k) => acc.split("{" + k + "}").join(String(vars[k])), str);
  }

  function tf(key, vi, vars) {
    return fill(t(key, vi), vars);
  }

  function jaBucket(name, id) {
    if (lang !== "ja") return null;
    const b = jaDict()[name];
    return (b && b[id]) || null;
  }

  function formText(f, key) {
    const j = jaBucket("forms", f.code);
    if (j && j[key] != null && !(typeof j[key] === "string" && j[key] === "" && !f[key])) return j[key];
    return f[key];
  }

  function prodExtra(p) {
    return jaBucket("products", p.id);
  }

  function prodTargets(p) {
    const j = prodExtra(p);
    return (j && j.targets) || p.targets;
  }

  function prodCrops(p) {
    const j = prodExtra(p);
    return (j && j.crops) || p.crops;
  }

  function prodNotes(p) {
    const j = prodExtra(p);
    return (j && j.mixNotes) || p.mixNotes;
  }

  function doseNote(p) {
    const j = prodExtra(p);
    return (j && j.doseNote) || (p.dose && p.dose.note) || "";
  }

  function showQty(s) {
    if (lang !== "ja" || s == null) return s;
    return String(s).replace(/(\d),(\d)/g, "$1.$2");
  }

  function dosePer16(p) {
    const j = prodExtra(p);
    if (j && j.per16) return j.per16;
    return showQty(p.dose.per16);
  }

  function dosePer1000(p) {
    if (!p.dose || !p.dose.per1000) return "";
    const j = prodExtra(p);
    if (j && j.per1000) return j.per1000;
    return showQty(p.dose.per1000);
  }

  function prodPhi(p) {
    const j = prodExtra(p);
    if (j && j.phi) return j.phi;
    return p.phi;
  }

  function aiLabel(k) {
    if (lang === "ja" && jaDict().ai && jaDict().ai[k]) return jaDict().ai[k];
    return AI_LABEL[k] || k;
  }

  function kindLabel(k) {
    if (lang === "ja" && jaDict().kinds && jaDict().kinds[k]) return jaDict().kinds[k];
    return KIND_LABEL[k];
  }

  function groupName(g) {
    return lang === "ja" && g.ja ? g.ja : g.name;
  }

  function cropLabel(c) {
    if (!c) return "";
    if (lang === "ja") return c.ja || c.name;
    return c.name + (c.ja ? " (" + c.ja + ")" : "");
  }

  function mixText(s, key) {
    const j = jaBucket("mix", s.step);
    if (j && j[key]) return j[key];
    return s[key];
  }

  function ruleReason(rule) {
    if (lang === "ja" && jaDict().rules && jaDict().rules[rule.group]) return jaDict().rules[rule.group];
    return rule.reason;
  }

  function formTips(f) {
    const j = jaBucket("forms", f.code);
    if (j && j.tips) return j.tips;
    return f.tips;
  }

  function applyDomI18n() {
    const ui = jaDict().ui || {};
    document.documentElement.lang = lang === "ja" ? "ja" : "vi";
    document.body.classList.toggle("lang-ja", lang === "ja");
    if (!document.documentElement.dataset.viTitle) document.documentElement.dataset.viTitle = document.title;
    document.title = lang === "ja" && ui.docTitle ? ui.docTitle : document.documentElement.dataset.viTitle;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      if (el.dataset.vi == null) el.dataset.vi = el.textContent;
      const key = el.getAttribute("data-i18n");
      el.textContent = lang === "ja" && ui[key] ? ui[key] : el.dataset.vi;
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      if (el._viHtml == null) el._viHtml = el.innerHTML;
      const key = el.getAttribute("data-i18n-html");
      el.innerHTML = lang === "ja" && ui[key] ? ui[key] : el._viHtml;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      if (el.dataset.viPh == null) el.dataset.viPh = el.placeholder;
      const key = el.getAttribute("data-i18n-placeholder");
      el.placeholder = lang === "ja" && ui[key] ? ui[key] : el.dataset.viPh;
    });
    document.querySelectorAll("[data-set-lang]").forEach((b) => {
      const on = b.dataset.setLang === lang;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function setLang(next) {
    lang = next === "ja" ? "ja" : "vi";
    try {
      localStorage.setItem("bvtv-lang", lang);
    } catch (e) {}
    applyDomI18n();
    route();
  }

  const SPRAY_PRODUCTS = PRODUCTS.filter((p) => {
    const f = formByCode[p.form];
    return f && f.mixStep > 0;
  });

  function isSprayable(p) {
    const f = formByCode[p.form];
    return !!(f && f.mixStep > 0);
  }

  const FORM_RANK = { WP: 1, SP: 2, WG: 3, SG: 3, SC: 4, CS: 5, SE: 5, OD: 6, EC: 7, EW: 7, ME: 7, SL: 8 };

  function go(hash) {
    location.hash = hash;
  }

  function parseHash() {
    const raw = (location.hash || "#/").replace(/^#/, "");
    const parts = raw.split("/").filter(Boolean);
    return { path: parts[0] || "home", id: parts[1] || "" };
  }

  function setNav(active) {
    document.querySelectorAll(".bottom-nav button").forEach((b) => {
      b.classList.toggle("on", b.dataset.page === active);
    });
  }

  function show(name) {
    Object.values(pages).forEach((p) => p.classList.remove("active"));
    pages[name].classList.add("active");
  }

  function renderHome() {
    show("home");
    setNav("home");
    $("home-forms").innerHTML = FORMS.filter((f) => f.mixStep > 0)
      .slice(0, 9)
      .map(
        (f) =>
          `<button class="chip" data-go="#/dang/${f.code}" style="border-top:3px solid ${f.color}">
            <span class="code">${f.code}</span>
            <span class="name">${formText(f, "name")}</span>
          </button>`
      )
      .join("");
    $("home-prods").innerHTML = PRODUCTS.map(prodRow).join("");
  }

  function prodRow(p) {
    return `<button class="prod-row" data-go="#/thuoc/${p.id}">
      <span class="meta">
        <strong>${p.name}</strong>
        <span class="muted">${p.ai.split("(")[0].trim()}</span>
      </span>
      <span class="badge form">${p.form}</span>
    </button>`;
  }

  function renderForms() {
    show("forms");
    setNav("forms");
    const spray = FORMS.filter((f) => f.group !== "not-spray" && f.group !== "special");
    const other = FORMS.filter((f) => f.group === "not-spray" || f.group === "special");
    $("forms-spray").innerHTML = spray
      .map(
        (f) =>
          `<button class="chip" data-go="#/dang/${f.code}" style="border-top:3px solid ${f.color}">
            <span class="code">${f.code}</span>
            <span class="name">${formText(f, "name")}</span>
          </button>`
      )
      .join("");
    $("forms-other").innerHTML = other
      .map(
        (f) =>
          `<button class="chip" data-go="#/dang/${f.code}" style="border-top:3px solid ${f.color}">
            <span class="code">${f.code}</span>
            <span class="name">${formText(f, "name")}</span>
          </button>`
      )
      .join("");
  }

  function renderForm(code) {
    const f = formByCode[code];
    if (!f) return go("#/dang");
    show("form");
    setNav("forms");
    const related = PRODUCTS.filter((p) => p.form === f.code);
    const tips = formTips(f);
    const avoid = formText(f, "avoid");
    const vnBit = f.vn ? (lang === "ja" ? " · ベトナム表記: " + f.vn : " · Việt Nam: " + f.vn) : "";
    $("form-detail").innerHTML = `
      <button class="back" data-go="#/dang">${t("backForms", "← Tất cả dạng")}</button>
      <div class="card">
        <span class="badge form">${f.code}</span>
        <h3 style="margin-top:8px">${formText(f, "name")}</h3>
        <p class="muted">${f.en}${vnBit}</p>
        <p>${formText(f, "look")}</p>
        ${
          f.mixStep
            ? `<p><strong>${tf("formPos", "Vị trí trong bình: bước {step} (sau nước, sau các dạng số nhỏ hơn).", { step: f.mixStep })}</strong></p>`
            : `<p class="callout warn" style="margin-top:8px">${t("formNotSpray", "Không dùng để pha bình phun lá theo cách thông thường.")}</p>`
        }
        <h3>${t("formHow", "Cách pha")}</h3>
        <p>${formText(f, "how")}</p>
        ${tips.length ? `<h3>${t("formTips", "Lưu ý")}</h3><ul class="plain">${tips.map((tip) => `<li>${tip}</li>`).join("")}</ul>` : ""}
        ${avoid ? `<div class="callout warn">${avoid}</div>` : ""}
        <p><a href="#/pha">${t("formSeeMix", "Xem đầy đủ thứ tự pha →")}</a></p>
      </div>
      ${
        related.length
          ? `<div class="section-title"><h2>${tf("formRelated", "Thuốc hay dùng dạng {code}", { code: f.code })}</h2></div>
             <div class="prod-list">${related.map(prodRow).join("")}</div>`
          : ""
      }
    `;
  }

  function renderMix() {
    show("mix");
    setNav("mix");
    $("mix-steps").innerHTML = MIX_ORDER.map(
      (s) =>
        `<li>
          <strong>${mixText(s, "title")}</strong>
          <span class="muted">${mixText(s, "detail")}</span>
          ${s.codes.length ? `<div style="margin-top:6px">${s.codes.map((c) => `<span class="badge form">${c}</span>`).join(" ")}</div>` : ""}
        </li>`
    ).join("");
  }

  function renderProducts() {
    show("products");
    setNav("products");
    const list = PRODUCTS.filter((p) => {
      if (productFilter === "all") return true;
      if (productFilter === "bio") return p.bio;
      return p.kind === productFilter;
    });
    $("prod-list").innerHTML = list.map(prodRow).join("");
  }

  function renderProduct(id) {
    const p = productById[id];
    if (!p) return go("#/thuoc");
    const f = formByCode[p.form];
    show("product");
    setNav("products");
    $("product-detail").innerHTML = `
      <button class="back" data-go="#/thuoc">${t("backProds", "← Danh sách thuốc")}</button>
      <div class="card">
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <span class="badge form">${p.form}</span>
          <span class="badge">${kindLabel(p.kind)}</span>
          ${p.bio ? `<span class="badge bio">${t("bioBadge", "Sinh học")}</span>` : ""}
        </div>
        <h3 style="margin-top:8px">${p.name}</h3>
        <dl class="dl">
          <dt>${t("dtAi", "Hoạt chất")}</dt><dd>${showQty(p.ai)}</dd>
          <dt>${t("dtGroup", "Nhóm")}</dt><dd>${p.group}</dd>
          ${p.pack ? `<dt>${t("dtPack", "Chai / gói")}</dt><dd>${p.pack}</dd>` : ""}
          <dt>${t("dtTargets", "Đối tượng")}</dt><dd>${prodTargets(p)}</dd>
          <dt>${t("dtCrops", "Cây trồng")}</dt><dd>${prodCrops(p)}</dd>
          ${
            bannedCropsForProduct(p).length
              ? `<dt>${t("dtBanned", "Cấm phun trên")}</dt><dd>${bannedCropsForProduct(p)
                  .map((c) => cropLabel(c))
                  .join(", ")}</dd>`
              : ""
          }
          ${p.dose.per1000 ? `<dt>${t("dtPer1000", "Liều / 1000 m²")}</dt><dd>${dosePer1000(p)}</dd>` : ""}
          <dt>${t("dtPer16", "Liều bình 16L")}</dt><dd><strong>${dosePer16(p)}</strong><br><span class="muted">${doseNote(p)}</span></dd>
          ${dilutionDl(p)}
          <dt>${t("dtPhi", "Cách ly")}</dt><dd>${prodPhi(p)}</dd>
        </dl>
        <p><a href="#/dang/${p.form}">${tf("formLink", "Dạng {form} — {name}: thứ tự pha", { form: p.form, name: f ? formText(f, "name") : "" })}</a></p>
        ${
          f && f.mixStep > 0
            ? `<button class="big-btn primary" style="width:100%;margin-top:8px;min-height:52px" data-add="${p.id}">
          <strong>${t("addChecker", "Thêm vào bộ tra pha")}</strong>
        </button>`
            : `<div class="callout warn" style="margin-top:8px">${t("granuleWarn", "Thuốc hạt rải / không pha bình phun lá. Xem cây cấm ở mục trên — không cho vào bộ tra pha.")}</div>`
        }
      </div>
      <div class="card">
        <h3>${t("mixWithOthers", "Khi phối với thuốc khác")}</h3>
        <ul class="plain">${prodNotes(p).map((n) => `<li>${n}</li>`).join("")}</ul>
      </div>
    `;
  }

  function parseNum(s) {
    return parseFloat(String(s).replace(",", "."));
  }

  function decSep() {
    return lang === "ja" ? "." : ",";
  }

  function fmtNum(n) {
    if (!isFinite(n)) return "—";
    const x = Math.round(n * 100) / 100;
    if (x < 10) return x.toFixed(1).replace(/\.0$/, "").replace(".", decSep());
    return String(Math.round(x));
  }

  function fmtL(n) {
    return String(n).replace(".", decSep());
  }

  function fmtFactor(n) {
    return String(Math.round(n * 100) / 100).replace(".", decSep());
  }

  function fmtPacks(n) {
    const unit = lang === "ja" ? "袋" : "gói";
    if (lang === "ja") {
      if (Math.abs(n - 0.25) < 0.02) return "1/4" + unit;
      if (Math.abs(n - 0.5) < 0.03) return "1/2" + unit;
      if (Math.abs(n - 0.75) < 0.03) return "3/4" + unit;
    } else {
      if (Math.abs(n - 0.25) < 0.02) return "¼ " + unit;
      if (Math.abs(n - 0.5) < 0.03) return "½ " + unit;
      if (Math.abs(n - 0.75) < 0.03) return "¾ " + unit;
    }
    if (Math.abs(n - Math.round(n)) < 0.05) return `${Math.round(n)} ${unit}`;
    return `${fmtNum(n)} ${unit}`;
  }

  function canScaleDose(text) {
    return /[\d.,]+\s*(g|ml)/i.test(String(text));
  }

  function scaleDose(text, liters) {
    const raw = String(text);
    const factor = liters / 16;
    const range = raw.match(/([\d.,]+)\s*[–-]\s*([\d.,]+)\s*(g|ml)/i);
    const single = raw.match(/([\d.,]+)\s*(g|ml)/i);
    if (!range && !single) return raw;

    let core;
    let gramsForPack = null;
    if (range) {
      core = `${fmtNum(parseNum(range[1]) * factor)}–${fmtNum(parseNum(range[2]) * factor)} ${range[3]}`;
    } else {
      gramsForPack = /g/i.test(single[2]) ? parseNum(single[1]) : null;
      core = `${fmtNum(parseNum(single[1]) * factor)} ${single[2]}`;
    }

    const extras = [];
    const pack = raw.match(/\(([\d.,]+)\s*gói\)/i);
    if (pack && gramsForPack) {
      extras.push(fmtPacks((gramsForPack * factor) / (gramsForPack / parseNum(pack[1]))));
    }
    const pct = raw.match(/\(([\d.,]+\s*%)\)/);
    if (pct) extras.push(pct[1].trim());

    if (extras.length) return `${core} (${extras.join(", ")})`;
    return core;
  }

  function fmtDil(n) {
    return String(Math.round(n));
  }

  function dilAmount(ratio, liters) {
    return (liters * 1000) / ratio;
  }

  function dilutionInfo(p, liters) {
    const d = p.dose && p.dose.dilution;
    if (!d || !d.ratio) return null;
    const thickN = Math.min(d.upper, d.lower);
    const thinN = Math.max(d.upper, d.lower);
    const unit = d.unit || "g";
    return {
      unit,
      ratio: d.ratio,
      thickN,
      thinN,
      hasRange: thickN !== thinN,
      suggestAmt: dilAmount(d.ratio, liters),
      minAmt: dilAmount(thinN, liters),
      maxAmt: dilAmount(thickN, liters),
    };
  }

  function dilutionBandHtml(p, liters) {
    const info = dilutionInfo(p, liters);
    if (!info) return "";
    const u = info.unit;
    if (!info.hasRange) {
      return `<div class="dose-range">${tf("dilExact", `Pha đúng <strong>1:${fmtDil(info.ratio)}</strong> ≈ ${fmtNum(info.suggestAmt)} ${u} / bình ${fmtL(liters)}L`, { ratio: fmtDil(info.ratio), amt: fmtNum(info.suggestAmt), unit: u, liters: fmtL(liters) })}</div>`;
    }
    return `<div class="dose-range">
      <div class="dose-band">
        <span><em>${t("dilThin", "Nhạt nhất")}</em><strong>${fmtNum(info.minAmt)} ${u}</strong><span class="muted">1:${fmtDil(info.thinN)}</span></span>
        <span><em>${t("dilRatio", "Theo tỷ lệ")}</em><strong>${fmtNum(info.suggestAmt)} ${u}</strong><span class="muted">1:${fmtDil(info.ratio)}</span></span>
        <span><em>${t("dilThick", "Đậm nhất")}</em><strong>${fmtNum(info.maxAmt)} ${u}</strong><span class="muted">1:${fmtDil(info.thickN)}</span></span>
      </div>
      <div class="muted">${tf("dilRangeNote", `Có thể lấy từ ${fmtNum(info.minAmt)} đến ${fmtNum(info.maxAmt)} ${u} cho bình ${fmtL(liters)}L. Không vượt ngưỡng đậm.`, { liters: fmtL(liters), min: fmtNum(info.minAmt), max: fmtNum(info.maxAmt), unit: u })}</div>
    </div>`;
  }

  function dilutionDl(p) {
    const info = dilutionInfo(p, 16);
    if (!info) return "";
    if (!info.hasRange) {
      return `<dt>${t("dtDil", "Pha loãng")}</dt><dd>${tf("dilOne", `Đúng tỷ lệ <strong>1:${fmtDil(info.ratio)}</strong> ≈ ${fmtNum(info.suggestAmt)} ${info.unit} / bình 16L`, { ratio: fmtDil(info.ratio), amt: fmtNum(info.suggestAmt), unit: info.unit })}</dd>`;
    }
    return `<dt>${t("dtDil", "Pha loãng")}</dt><dd>${tf("dilRange", `Tỷ lệ gợi ý <strong>1:${fmtDil(info.ratio)}</strong>.<br>Khoảng cho phép: <strong>1:${fmtDil(info.thinN)}</strong> (nhạt) → <strong>1:${fmtDil(info.thickN)}</strong> (đậm).<br>Bình 16L: lấy từ <strong>${fmtNum(info.minAmt)} ${info.unit}</strong> đến <strong>${fmtNum(info.maxAmt)} ${info.unit}</strong>.`, { ratio: fmtDil(info.ratio), thin: fmtDil(info.thinN), thick: fmtDil(info.thickN), min: fmtNum(info.minAmt), max: fmtNum(info.maxAmt), unit: info.unit })}</dd>`;
  }

  function doseTakeHtml(p) {
    const orig = p.dose.per16;
    const scaled = scaleDose(orig, tankL);
    const band = dilutionBandHtml(p, tankL);
    if (!canScaleDose(orig)) {
      return `<div class="dose-take">
        <div>${t("doseNeed", "Cần lấy:")} <strong>${dosePer16(p)}</strong></div>
        <div class="muted">${tf("doseNoScale", `Không có số g/ml trên nhãn tổng hợp — đọc bao bì, rồi nhân theo ${fmtL(tankL)} lít / 16 lít.`, { liters: fmtL(tankL) })}</div>
        ${band}
      </div>`;
    }
    const origLine =
      tankL === 16
        ? t("doseSuggest16", "Gợi ý khối lượng theo bảng pha / bình 16 lít")
        : tf("doseSuggestScale", `Gợi ý ${showQty(orig)} / 16L → nhân ×${fmtFactor(tankL / 16)} cho bình ${fmtL(tankL)}L`, { orig: dosePer16(p), factor: fmtFactor(tankL / 16), liters: fmtL(tankL) });
    return `<div class="dose-take">
      <div>${tf("doseTake", `Gợi ý lấy <strong>${scaled}</strong>`, { qty: scaled })}</div>
      <div class="muted">${origLine}</div>
      ${band}
    </div>`;
  }

  function syncTankUI() {
    document.querySelectorAll(".tank-bar button").forEach((b) => {
      b.classList.toggle("on", Number(b.dataset.l) === tankL);
    });
    const inp = $("tank-liters");
    if (inp && document.activeElement !== inp) inp.value = tankL;
    const hint = $("tank-scale-hint");
    if (!hint) return;
    if (tankL === 16) {
      hint.textContent = t("tank16", "Đúng liều nhãn (bình 16 lít). Đổ khoảng 10 lít nước trước, châm đủ lúc cuối.");
    } else {
      hint.innerHTML = tf("tankScale", `Bình <strong>${fmtL(tankL)} lít</strong> = ${fmtFactor(tankL / 16)} lần bình 16L. Lượng thuốc đã quy đổi bên dưới.`, { liters: fmtL(tankL), factor: fmtFactor(tankL / 16) });
    }
  }

  function applyTankLiters(raw) {
    const n = parseNum(raw);
    if (!isFinite(n) || n < 0.5 || n > 500) return false;
    tankL = Math.round(n * 10) / 10;
    return true;
  }

  function analyzeMix(ids) {
    const items = ids.map((id) => productById[id]).filter(Boolean);
    const alerts = [];
    if (items.length >= 4) {
      alerts.push({
        level: "caution",
        title: t("alertManyTitle", "Quá nhiều loại trong một bình"),
        text: t("alertMany", "Nên tối đa 2–3 sản phẩm. Càng nhiều hoạt chất càng dễ kết tủa và khó tìm nguyên nhân nếu cây bị hại."),
      });
    }

    for (const rule of SAME_GROUP_RULES) {
      const hit = rule.ids.filter((id) => ids.includes(id));
      if (hit.length >= 2) {
        alerts.push({
          level: rule.level,
          title: t("alertGroup", "Trùng nhóm ") + rule.group,
          text: hit.map((id) => productById[id].name).join(" + ") + ". " + ruleReason(rule),
        });
      }
    }

    if (ids.includes("coc") && ids.length > 1) {
      alerts.push({
        level: "block",
        title: t("alertCocTitle", "COC 85 nên phun riêng"),
        text: t("alertCoc", "Copper oxychloride / Booc-đô: khuyến cáo kỹ thuật Việt Nam là không phối hoạt chất khác. Các đồng hydroxide (Kocide, Champion) linh hoạt hơn — không áp dụng ngược cho COC 85."),
      });
    }

    if (ids.includes("eddy") && ids.includes("coc")) {
      alerts.push({
        level: "block",
        title: t("alertCuTitle", "Hai nguồn đồng"),
        text: t("alertCu", "Eddy đã có cuprous oxide. Không cộng COC 85."),
      });
    }

    const chemFung = items.filter((p) => p.kind === "tru-benh" && !p.bio);
    if (ids.includes("acti") && chemFung.length) {
      alerts.push({
        level: "block",
        title: t("alertBioTitle", "Vi sinh không đi với thuốc nấm hóa học"),
        text: tf("alertBio", "Acti No Vate (Streptomyces) bị diệt bởi " + chemFung.map((p) => p.name).join(", ") + ". Cách ly 5–7 ngày.", { names: chemFung.map((p) => p.name).join(", ") }),
      });
    }

    if (ids.includes("dipel") && (ids.includes("coc") || ids.includes("eddy"))) {
      alerts.push({
        level: "caution",
        title: t("alertBtTitle", "Bt và đồng"),
        text: t("alertBt", "Đồng/kiềm có thể giảm Bacillus. Nếu thử cốc đạt, phải phun ngay, không để qua giờ."),
      });
    }

    const ecs = items.filter((p) => p.form === "EC");
    if (ecs.length >= 2) {
      alerts.push({
        level: "caution",
        title: t("alertEcTitle", "Hai (hoặc hơn) dạng EC"),
        text: tf("alertEc", ecs.map((p) => p.name).join(" + ") + " cùng nhũ dầu: tăng dung môi, dễ cháy lá khi nắng. Giảm số EC hoặc tách phun.", { names: ecs.map((p) => p.name).join(" + ") }),
      });
    }

    if (ids.includes("neem") && ecs.length >= 2) {
      alerts.push({
        level: "caution",
        title: t("alertNeemTitle", "Neem + EC hóa học"),
        text: t("alertNeem", "Dầu neem phối EC dễ gây cháy lá. Phun neem riêng, chiều mát."),
      });
    }

    const sorted = items.slice().sort((a, b) => (FORM_RANK[a.form] || 50) - (FORM_RANK[b.form] || 50));
    const blocked = alerts.some((a) => a.level === "block");
    return { items, sorted, alerts, blocked };
  }

  function currentCrop() {
    return selectedCrop ? cropById[selectedCrop] : null;
  }

  function fillCropSelect() {
    const sel = $("crop-select");
    if (!sel) return;
    if (sel.dataset.builtLang === lang) return;
    const groups = CROP_GROUPS.map((g) => {
      const opts = CROPS.filter((c) => c.group === g.id)
        .map((c) => `<option value="${c.id}">${cropLabel(c)}</option>`)
        .join("");
      return `<optgroup label="${groupName(g)}">${opts}</optgroup>`;
    }).join("");
    sel.innerHTML = `<option value="">${t("cropPh", "— Chọn cây đang phun —")}</option>${groups}`;
    sel.dataset.builtLang = lang;
  }

  function dropBannedPicks() {
    const crop = currentCrop();
    if (!crop) return;
    for (const id of [...selected]) {
      if (productBannedOnCrop(productById[id], crop)) selected.delete(id);
    }
  }

  function renderChecker(opts) {
    const refreshPicks = !opts || opts.refreshPicks !== false;
    show("checker");
    setNav("checker");
    fillCropSelect();
    if (selectedCrop && !cropById[selectedCrop]) selectedCrop = "";
    const sel = $("crop-select");
    if (sel) sel.value = selectedCrop;
    dropBannedPicks();

    const crop = currentCrop();
    const hint = $("crop-ban-hint");
    if (hint) {
      if (!crop) {
        hint.textContent = t("cropEmpty", "Chọn cây trước — thuốc cấm phun sẽ bị làm mờ, không chọn được.");
      } else {
        const bannedCount = PRODUCTS.filter((p) => productBannedOnCrop(p, crop)).length;
        hint.innerHTML = tf(
          "cropHint",
          `<strong>${cropLabel(crop)}</strong> — ${bannedCount} loại không được dùng (làm mờ). Hạt rải cũng hiện nếu bị cấm.`,
          { name: cropLabel(crop), count: bannedCount }
        );
      }
    }

    if (refreshPicks) {
      const list = PRODUCTS.slice().sort((a, b) => {
        const ab = crop && productBannedOnCrop(a, crop) ? 1 : 0;
        const bb = crop && productBannedOnCrop(b, crop) ? 1 : 0;
        if (ab !== bb) return ab - bb;
        const ag = isSprayable(a) ? 0 : 1;
        const bg = isSprayable(b) ? 0 : 1;
        if (ag !== bg) return ag - bg;
        if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
        return a.name.localeCompare(b.name, "vi");
      });

      $("checker-picks").innerHTML = list
        .map((p) => {
          const banned = !!(crop && productBannedOnCrop(p, crop));
          const granule = !isSprayable(p);
          const locked = banned || granule;
          const on = selected.has(p.id) && !locked;
          const aiShort = p.ai.split("(")[0].trim();
          const why = banned
            ? (p.aiKeys || [])
                .filter((k) => crop.bannedAis.includes(k))
                .map((k) => aiLabel(k))
                .join("; ")
            : granule
            ? t("granuleWhy", "Hạt rải gốc — không pha bình phun lá")
            : "";
          const rowClass = banned ? " banned" : granule ? " granule" : "";
          const badge = banned
            ? `<span class="badge bad">${t("badgeBan", "CẤM")}</span>`
            : granule
            ? `<span class="badge warn">${t("badgeGran", "Hạt rải")}</span>`
            : `<span class="badge form">${p.form}</span>`;
          return `<label class="pick-row${rowClass}">
        <input type="checkbox" data-pick="${p.id}" ${on ? "checked" : ""} ${locked ? "disabled" : ""}>
        <span class="meta" style="flex:1">
          <strong>${p.name}</strong>
          <span class="muted">${aiShort} · ${p.form}${why ? " · " + why : ""}</span>
        </span>
        ${badge}
      </label>`;
        })
        .join("");
    }

    syncTankUI();

    const ids = [...selected].filter((id) => SPRAY_PRODUCTS.some((p) => p.id === id));
    const box = $("checker-result");
    if (ids.length < 1) {
      box.innerHTML = crop
        ? `<div class="result-empty">${tf("emptyCrop", `Đã chọn ${cropLabel(crop)}. Chọn 1 thuốc được phép để xem lượng lấy cho bình ${fmtL(tankL)}L, hoặc 2–3 thuốc để kiểm tra thứ tự và cặp kỵ.`, { name: cropLabel(crop), liters: fmtL(tankL) })}</div>`
        : `<div class="result-empty">${tf("emptyNone", `Chọn cây đang phun, rồi chọn 1 thuốc để xem lượng lấy cho bình ${fmtL(tankL)}L, hoặc 2–3 thuốc để kiểm tra thứ tự và cặp kỵ.`, { liters: fmtL(tankL) })}</div>`;
      return;
    }
    const r = analyzeMix(ids);
    const alertHtml = r.alerts
      .map((a) => {
        const cls = a.level === "block" ? "bad" : a.level === "caution" ? "warn" : "ok";
        const tag = a.level === "block" ? t("tagBlock", "KHÔNG PHA CHUNG") : a.level === "caution" ? t("tagCaution", "CẨN THẬN") : t("tagOk", "ĐƯỢC");
        return `<div class="callout ${cls}"><strong>${tag} — ${a.title}</strong><br>${a.text}</div>`;
      })
      .join("");

    const prefill = Math.round(tankL * 0.6 * 10) / 10;
    const orderHtml = `
      <div class="order-item"><span class="num">0</span><div><strong>${tf("orderWater", `Nước sạch ${fmtL(tankL)} lít — đổ ${fmtL(prefill)} lít trước`, { liters: fmtL(tankL), prefill: fmtL(prefill) })}</strong><div class="muted">${t("orderWaterSub", "Khuấy. Hòa từng loại ở ca riêng rồi mới đổ vào bình.")}</div></div></div>
      ${r.sorted
        .map((p, i) => {
          const f = formByCode[p.form];
          return `<div class="order-item">
            <span class="num">${i + 1}</span>
            <div>
              <strong>${p.name}</strong> <span class="badge form">${p.form}</span>
              <div class="muted">${f ? formText(f, "how") : ""}</div>
              ${doseTakeHtml(p)}
            </div>
          </div>`;
        })
        .join("")}
      <div class="order-item"><span class="num">${r.sorted.length + 1}</span><div><strong>${tf("orderFill", `Châm đủ ${fmtL(tankL)} lít, khuấy, phun ngay`, { liters: fmtL(tankL) })}</strong><div class="muted">${t("orderFillSub", "Chất bám dính (nếu có) cho cuối. Không để qua đêm. Khuấy lại nếu có WP/WG/SC.")}</div></div></div>
    `;

    box.innerHTML = `
      ${
        crop
          ? `<div class="callout info"><strong>${tf("cropOn", "Cây: {name}", { name: cropLabel(crop) })}</strong><br>${t("cropOnSub", "Hỗn hợp dưới đây chỉ gồm thuốc được phép phun trên cây này.")}</div>`
          : `<div class="callout warn"><strong>${t("cropOff", "Chưa chọn cây trồng.")}</strong> ${t("cropOffSub", "Chọn cây phía trên để chương trình làm mờ thuốc cấm phun.")}</div>`
      }
      ${
        r.blocked
          ? `<div class="callout bad"><strong>${t("blockHead", "Không pha hỗn hợp này.")}</strong> ${t("blockSub", "Xem lý do dưới đây. Phun riêng từng loại, rửa bình giữa hai lần nếu cần.")}</div>`
          : r.alerts.length
          ? `<div class="callout warn"><strong>${t("cautionHead", "Có thể pha nếu thử cốc đạt.")}</strong> ${t("cautionSub", "Làm phép thử 5–10 phút trước khi pha cả bình.")}</div>`
          : `<div class="callout ok"><strong>${t("okHead", "Không thấy cặp kỵ cứng trong danh mục này.")}</strong> ${t("okSub", "Vẫn thử cốc. Nhãn bao bì luôn thắng hướng dẫn web.")}</div>`
      }
      ${alertHtml}
      <div class="card take-summary">
        <h3>${tf("takeTitle", "Cần lấy cho bình {liters}L", { liters: fmtL(tankL) })}</h3>
        <ul class="plain">
          ${r.sorted
            .map((p) => {
              const qty = canScaleDose(p.dose.per16) ? scaleDose(p.dose.per16, tankL) : dosePer16(p);
              const info = dilutionInfo(p, tankL);
              const range =
                info && info.hasRange
                  ? ` <span class="muted">${tf("rangeBit", `(khoảng ${fmtNum(info.minAmt)}–${fmtNum(info.maxAmt)} ${info.unit})`, { min: fmtNum(info.minAmt), max: fmtNum(info.maxAmt), unit: info.unit })}</span>`
                  : info
                  ? ` <span class="muted">${tf("exactBit", `(đúng 1:${fmtDil(info.ratio)})`, { ratio: fmtDil(info.ratio) })}</span>`
                  : "";
              return `<li><strong>${p.name}:</strong> ${qty}${range}</li>`;
            })
            .join("")}
        </ul>
        <p class="muted" style="margin:8px 0 0">${t("takeFoot", "Số g/ml in đậm là gợi ý. Khoảng trong ngoặc là ngưỡng nhạt–đậm được phép. Hòa từng loại ở ca riêng. Nếu pha nhiều bình cùng dung tích, nhân với số lần pha.")}</p>
      </div>
      <h3 style="margin:14px 0 8px">${tf("orderTitle", "Thứ tự cho vào bình {liters}L", { liters: fmtL(tankL) })}</h3>
      <div class="order-box">${orderHtml}</div>
      <div class="card" style="margin-top:12px">
        <h3>${t("jarTitle", "Phép thử cốc (jar test)")}</h3>
        <p class="muted">${t("jarText", "Pha đúng tỉ lệ vào cốc nước trong, lắc, để 5–10 phút. Hỏng nếu: kết tủa, vón, đổi màu lạ, nóng, sủi bọt nhiều, đóng váng không tan lại khi lắc.")}</p>
      </div>
    `;
  }

  function renderSources() {
    show("sources");
    setNav("home");
    $("source-list").innerHTML = SOURCES.map((s, i) => {
      const tr = lang === "ja" && jaDict().sources && jaDict().sources[i];
      const title = tr && tr.title ? tr.title : s.title;
      const use = tr && tr.use ? tr.use : s.use;
      return `<div class="source-item card">
          <a href="${s.url}" target="_blank" rel="noopener">${title}</a>
          <p class="muted">${use}</p>
        </div>`;
    }).join("");
  }

  function route() {
    const { path, id } = parseHash();
    $("global-search").value = "";
    $("search-results").classList.add("hidden");
    $("search-results").innerHTML = "";
    document.querySelector("main").style.display = "";
    window.scrollTo(0, 0);
    if (path === "dang" && id) return renderForm(id.toUpperCase());
    if (path === "dang") return renderForms();
    if (path === "pha") return renderMix();
    if (path === "thuoc" && id) return renderProduct(id);
    if (path === "thuoc") return renderProducts();
    if (path === "tra") return renderChecker();
    if (path === "nguon") return renderSources();
    renderHome();
  }

  document.addEventListener("click", (e) => {
    const langBtn = e.target.closest("[data-set-lang]");
    if (langBtn) {
      e.preventDefault();
      setLang(langBtn.dataset.setLang);
      return;
    }
    const goEl = e.target.closest("[data-go]");
    if (goEl) {
      e.preventDefault();
      go(goEl.getAttribute("data-go"));
      return;
    }
    const add = e.target.closest("[data-add]");
    if (add) {
      const id = add.getAttribute("data-add");
      const crop = currentCrop();
      if (crop && productBannedOnCrop(productById[id], crop)) {
        go("#/tra");
        return;
      }
      selected.add(id);
      go("#/tra");
      return;
    }
    const cropBtn = e.target.closest("[data-crop]");
    if (cropBtn) {
      selectedCrop = cropBtn.getAttribute("data-crop");
      go("#/tra");
      return;
    }
    const tank = e.target.closest("[data-l]");
    if (tank && tank.closest(".tank-bar")) {
      tankL = Number(tank.dataset.l);
      const inp = $("tank-liters");
      if (inp) inp.value = tankL;
      renderChecker({ refreshPicks: false });
    }
  });

  document.addEventListener("input", (e) => {
    if (e.target && e.target.id === "tank-liters") {
      if (applyTankLiters(e.target.value)) renderChecker({ refreshPicks: false });
    }
  });

  document.addEventListener("change", (e) => {
    if (e.target && e.target.id === "tank-liters") {
      if (applyTankLiters(e.target.value)) renderChecker({ refreshPicks: false });
      else if ($("tank-liters")) $("tank-liters").value = tankL;
      return;
    }
    if (e.target && e.target.id === "crop-select") {
      selectedCrop = e.target.value;
      dropBannedPicks();
      renderChecker();
      return;
    }
    const pick = e.target.closest("[data-pick]");
    if (!pick) return;
    const crop = currentCrop();
    if (pick.checked && crop && productBannedOnCrop(productById[pick.dataset.pick], crop)) {
      pick.checked = false;
      selected.delete(pick.dataset.pick);
      renderChecker();
      return;
    }
    if (pick.checked && !isSprayable(productById[pick.dataset.pick])) {
      pick.checked = false;
      selected.delete(pick.dataset.pick);
      renderChecker();
      return;
    }
    if (pick.checked) selected.add(pick.dataset.pick);
    else selected.delete(pick.dataset.pick);
    renderChecker();
  });

  document.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      productFilter = btn.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((b) => b.classList.toggle("on", b === btn));
      renderProducts();
    });
  });

  $("global-search").addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    const box = $("search-results");
    const main = document.querySelector("main");
    if (!q) {
      box.classList.add("hidden");
      box.innerHTML = "";
      main.style.display = "";
      return;
    }
    main.style.display = "none";
    const forms = FORMS.filter((f) => {
      const jn = (window.BVTV_I18N && window.BVTV_I18N.ja.forms[f.code] && window.BVTV_I18N.ja.forms[f.code].name) || "";
      return f.code.toLowerCase().includes(q) || f.name.toLowerCase().includes(q) || f.en.toLowerCase().includes(q) || jn.toLowerCase().includes(q);
    });
    const cropsHit = CROPS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.ja && c.ja.toLowerCase().includes(q)) ||
        c.id.replace(/-/g, " ").includes(q)
    );
    const prods = PRODUCTS.filter((p) => {
      const j = (window.BVTV_I18N && window.BVTV_I18N.ja.products[p.id]) || {};
      const blob = [p.name, p.ai, p.targets, p.crops, (p.tags || []).join(" "), j.targets || "", j.crops || "", j.doseNote || ""]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
    if (!forms.length && !prods.length && !cropsHit.length) {
      box.classList.remove("hidden");
      box.innerHTML = `<div class="card"><p class="muted">${tf("searchMiss", `Không thấy “${q}”. Thử WP, EC, Dipel, hành tây, rầy…`, { q })}</p></div>`;
      return;
    }
    box.classList.remove("hidden");
    box.innerHTML =
      (cropsHit.length
        ? `<div class="section-title"><h2>${t("searchCrops", "Cây trồng")}</h2></div><div class="prod-list">${cropsHit
            .map((c) => {
              const primary = lang === "ja" ? c.ja || c.name : c.name;
              const secondary = lang === "ja" ? c.name : c.ja || t("searchOpen", "Mở bộ tra pha");
              return `<button class="prod-row" data-crop="${c.id}"><span class="meta"><strong>${primary}</strong><span class="muted">${secondary}</span></span><span class="badge">${t("searchGo", "Tra pha")}</span></button>`;
            })
            .join("")}</div>`
        : "") +
      (forms.length
        ? `<div class="section-title"><h2>${t("searchForms", "Dạng chế phẩm")}</h2></div><div class="form-grid">${forms
            .map(
              (f) =>
                `<button class="chip" data-go="#/dang/${f.code}"><span class="code">${f.code}</span><span class="name">${formText(f, "name")}</span></button>`
            )
            .join("")}</div>`
        : "") +
      (prods.length
        ? `<div class="section-title"><h2>${t("searchProds", "Thuốc")}</h2></div><div class="prod-list">${prods.map(prodRow).join("")}</div>`
        : "");
  });

  window.addEventListener("hashchange", route);
  applyDomI18n();
  route();
})();
