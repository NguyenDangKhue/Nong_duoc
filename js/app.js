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
            <span class="name">${f.name}</span>
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
            <span class="name">${f.name}</span>
          </button>`
      )
      .join("");
    $("forms-other").innerHTML = other
      .map(
        (f) =>
          `<button class="chip" data-go="#/dang/${f.code}" style="border-top:3px solid ${f.color}">
            <span class="code">${f.code}</span>
            <span class="name">${f.name}</span>
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
    $("form-detail").innerHTML = `
      <button class="back" data-go="#/dang">← Tất cả dạng</button>
      <div class="card">
        <span class="badge form">${f.code}</span>
        <h3 style="margin-top:8px">${f.name}</h3>
        <p class="muted">${f.en}${f.vn ? " · Việt Nam: " + f.vn : ""}</p>
        <p>${f.look}</p>
        ${
          f.mixStep
            ? `<p><strong>Vị trí trong bình:</strong> bước ${f.mixStep} (sau nước, sau các dạng số nhỏ hơn).</p>`
            : `<p class="callout warn" style="margin-top:8px">Không dùng để pha bình phun lá theo cách thông thường.</p>`
        }
        <h3>Cách pha</h3>
        <p>${f.how}</p>
        ${f.tips.length ? `<h3>Lưu ý</h3><ul class="plain">${f.tips.map((t) => `<li>${t}</li>`).join("")}</ul>` : ""}
        ${f.avoid ? `<div class="callout warn">${f.avoid}</div>` : ""}
        <p><a href="#/pha">Xem đầy đủ thứ tự pha →</a></p>
      </div>
      ${
        related.length
          ? `<div class="section-title"><h2>Thuốc hay dùng dạng ${f.code}</h2></div>
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
          <strong>${s.title}</strong>
          <span class="muted">${s.detail}</span>
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
      <button class="back" data-go="#/thuoc">← Danh sách thuốc</button>
      <div class="card">
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <span class="badge form">${p.form}</span>
          <span class="badge">${KIND_LABEL[p.kind]}</span>
          ${p.bio ? `<span class="badge bio">Sinh học</span>` : ""}
        </div>
        <h3 style="margin-top:8px">${p.name}</h3>
        <dl class="dl">
          <dt>Hoạt chất</dt><dd>${p.ai}</dd>
          <dt>Nhóm</dt><dd>${p.group}</dd>
          ${p.pack ? `<dt>Chai / gói</dt><dd>${p.pack}</dd>` : ""}
          <dt>Đối tượng</dt><dd>${p.targets}</dd>
          <dt>Cây trồng</dt><dd>${p.crops}</dd>
          ${
            bannedCropsForProduct(p).length
              ? `<dt>Cấm phun trên</dt><dd>${bannedCropsForProduct(p)
                  .map((c) => c.name + (c.ja ? " (" + c.ja + ")" : ""))
                  .join(", ")}</dd>`
              : ""
          }
          ${p.dose.per1000 ? `<dt>Liều / 1000 m²</dt><dd>${p.dose.per1000}</dd>` : ""}
          <dt>Liều bình 16L</dt><dd><strong>${p.dose.per16}</strong><br><span class="muted">${p.dose.note}</span></dd>
          ${dilutionDl(p)}
          <dt>Cách ly</dt><dd>${p.phi}</dd>
        </dl>
        <p><a href="#/dang/${p.form}">Dạng ${p.form} — ${f ? f.name : ""}: thứ tự pha</a></p>
        ${
          f && f.mixStep > 0
            ? `<button class="big-btn primary" style="width:100%;margin-top:8px;min-height:52px" data-add="${p.id}">
          <strong>Thêm vào bộ tra pha</strong>
        </button>`
            : `<div class="callout warn" style="margin-top:8px">Thuốc hạt rải / không pha bình phun lá. Xem cây cấm ở mục trên — không cho vào bộ tra pha.</div>`
        }
      </div>
      <div class="card">
        <h3>Khi phối với thuốc khác</h3>
        <ul class="plain">${p.mixNotes.map((n) => `<li>${n}</li>`).join("")}</ul>
      </div>
    `;
  }

  function parseNum(s) {
    return parseFloat(String(s).replace(",", "."));
  }

  function fmtNum(n) {
    if (!isFinite(n)) return "—";
    const x = Math.round(n * 100) / 100;
    if (x < 10) return x.toFixed(1).replace(/\.0$/, "").replace(".", ",");
    return String(Math.round(x));
  }

  function fmtL(n) {
    return String(n).replace(".", ",");
  }

  function fmtFactor(n) {
    return String(Math.round(n * 100) / 100).replace(".", ",");
  }

  function fmtPacks(n) {
    if (Math.abs(n - 0.25) < 0.02) return "¼ gói";
    if (Math.abs(n - 0.5) < 0.03) return "½ gói";
    if (Math.abs(n - 0.75) < 0.03) return "¾ gói";
    if (Math.abs(n - Math.round(n)) < 0.05) return `${Math.round(n)} gói`;
    return `${fmtNum(n)} gói`;
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
      return `<div class="dose-range">Pha đúng <strong>1:${fmtDil(info.ratio)}</strong> ≈ ${fmtNum(info.suggestAmt)} ${u} / bình ${fmtL(liters)}L</div>`;
    }
    return `<div class="dose-range">
      <div class="dose-band">
        <span><em>Nhạt nhất</em><strong>${fmtNum(info.minAmt)} ${u}</strong><span class="muted">1:${fmtDil(info.thinN)}</span></span>
        <span><em>Theo tỷ lệ</em><strong>${fmtNum(info.suggestAmt)} ${u}</strong><span class="muted">1:${fmtDil(info.ratio)}</span></span>
        <span><em>Đậm nhất</em><strong>${fmtNum(info.maxAmt)} ${u}</strong><span class="muted">1:${fmtDil(info.thickN)}</span></span>
      </div>
      <div class="muted">Có thể lấy từ ${fmtNum(info.minAmt)} đến ${fmtNum(info.maxAmt)} ${u} cho bình ${fmtL(liters)}L. Không vượt ngưỡng đậm.</div>
    </div>`;
  }

  function dilutionDl(p) {
    const info = dilutionInfo(p, 16);
    if (!info) return "";
    if (!info.hasRange) {
      return `<dt>Pha loãng</dt><dd>Đúng tỷ lệ <strong>1:${fmtDil(info.ratio)}</strong> ≈ ${fmtNum(info.suggestAmt)} ${info.unit} / bình 16L</dd>`;
    }
    return `<dt>Pha loãng</dt><dd>
      Tỷ lệ gợi ý <strong>1:${fmtDil(info.ratio)}</strong>.<br>
      Khoảng cho phép: <strong>1:${fmtDil(info.thinN)}</strong> (nhạt) → <strong>1:${fmtDil(info.thickN)}</strong> (đậm).<br>
      Bình 16L: lấy từ <strong>${fmtNum(info.minAmt)} ${info.unit}</strong> đến <strong>${fmtNum(info.maxAmt)} ${info.unit}</strong>.
    </dd>`;
  }

  function doseTakeHtml(p) {
    const orig = p.dose.per16;
    const scaled = scaleDose(orig, tankL);
    const band = dilutionBandHtml(p, tankL);
    if (!canScaleDose(orig)) {
      return `<div class="dose-take">
        <div>Cần lấy: <strong>${orig}</strong></div>
        <div class="muted">Không có số g/ml trên nhãn tổng hợp — đọc bao bì, rồi nhân theo ${fmtL(tankL)} lít / 16 lít.</div>
        ${band}
      </div>`;
    }
    const origLine =
      tankL === 16
        ? `Gợi ý khối lượng theo bảng pha / bình 16 lít`
        : `Gợi ý ${orig} / 16L → nhân ×${fmtFactor(tankL / 16)} cho bình ${fmtL(tankL)}L`;
    return `<div class="dose-take">
      <div>Gợi ý lấy <strong>${scaled}</strong></div>
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
      hint.textContent = "Đúng liều nhãn (bình 16 lít). Đổ khoảng 10 lít nước trước, châm đủ lúc cuối.";
    } else {
      hint.innerHTML = `Bình <strong>${fmtL(tankL)} lít</strong> = ${fmtFactor(tankL / 16)} lần bình 16L. Lượng thuốc đã quy đổi bên dưới.`;
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
        title: "Quá nhiều loại trong một bình",
        text: "Nên tối đa 2–3 sản phẩm. Càng nhiều hoạt chất càng dễ kết tủa và khó tìm nguyên nhân nếu cây bị hại.",
      });
    }

    for (const rule of SAME_GROUP_RULES) {
      const hit = rule.ids.filter((id) => ids.includes(id));
      if (hit.length >= 2) {
        alerts.push({
          level: rule.level,
          title: "Trùng nhóm " + rule.group,
          text: hit.map((id) => productById[id].name).join(" + ") + ". " + rule.reason,
        });
      }
    }

    if (ids.includes("coc") && ids.length > 1) {
      alerts.push({
        level: "block",
        title: "COC 85 nên phun riêng",
        text: "Copper oxychloride / Booc-đô: khuyến cáo kỹ thuật Việt Nam là không phối hoạt chất khác. Các đồng hydroxide (Kocide, Champion) linh hoạt hơn — không áp dụng ngược cho COC 85.",
      });
    }

    if (ids.includes("eddy") && ids.includes("coc")) {
      alerts.push({
        level: "block",
        title: "Hai nguồn đồng",
        text: "Eddy đã có cuprous oxide. Không cộng COC 85.",
      });
    }

    const chemFung = items.filter((p) => p.kind === "tru-benh" && !p.bio);
    if (ids.includes("acti") && chemFung.length) {
      alerts.push({
        level: "block",
        title: "Vi sinh không đi với thuốc nấm hóa học",
        text: "Acti No Vate (Streptomyces) bị diệt bởi " + chemFung.map((p) => p.name).join(", ") + ". Cách ly 5–7 ngày.",
      });
    }

    if (ids.includes("dipel") && ids.includes("daconil")) {
      alerts.push({
        level: "block",
        title: "Dipel × Daconil",
        text: "Một số nhãn Dipel cấm phối chlorothalonil. Tách buổi phun.",
      });
    }

    if (ids.includes("dipel") && (ids.includes("coc") || ids.includes("eddy"))) {
      alerts.push({
        level: "caution",
        title: "Bt và đồng",
        text: "Đồng/kiềm có thể giảm Bacillus. Nếu thử cốc đạt, phải phun ngay, không để qua giờ.",
      });
    }

    const ecs = items.filter((p) => p.form === "EC");
    if (ecs.length >= 2) {
      alerts.push({
        level: "caution",
        title: "Hai (hoặc hơn) dạng EC",
        text: ecs.map((p) => p.name).join(" + ") + " cùng nhũ dầu: tăng dung môi, dễ cháy lá khi nắng. Giảm số EC hoặc tách phun.",
      });
    }

    if (ids.includes("neem") && ecs.length >= 2) {
      alerts.push({
        level: "caution",
        title: "Neem + EC hóa học",
        text: "Dầu neem phối EC dễ gây cháy lá. Phun neem riêng, chiều mát.",
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
    if (!sel || sel.dataset.ready) return;
    const groups = CROP_GROUPS.map((g) => {
      const opts = CROPS.filter((c) => c.group === g.id)
        .map((c) => `<option value="${c.id}">${c.name}${c.ja ? " (" + c.ja + ")" : ""}</option>`)
        .join("");
      return `<optgroup label="${g.name}">${opts}</optgroup>`;
    }).join("");
    sel.innerHTML = `<option value="">— Chọn cây đang phun —</option>${groups}`;
    sel.dataset.ready = "1";
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
        hint.innerHTML = "Chọn cây trước — thuốc cấm phun sẽ bị làm mờ, không chọn được.";
      } else {
        const bannedCount = PRODUCTS.filter((p) => productBannedOnCrop(p, crop)).length;
        hint.innerHTML = crop.ja
          ? `<strong>${crop.name}</strong> (${crop.ja}) — ${bannedCount} loại không được dùng (làm mờ). Hạt rải cũng hiện nếu bị cấm.`
          : `<strong>${crop.name}</strong> — ${bannedCount} loại không được dùng (làm mờ).`;
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
                .map((k) => AI_LABEL[k] || k)
                .join("; ")
            : granule
            ? "Hạt rải gốc — không pha bình phun lá"
            : "";
          const rowClass = banned ? " banned" : granule ? " granule" : "";
          const badge = banned
            ? `<span class="badge bad">CẤM</span>`
            : granule
            ? `<span class="badge warn">Hạt rải</span>`
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
        ? `<div class="result-empty">Đã chọn ${crop.name}. Chọn 1 thuốc được phép để xem lượng lấy cho bình ${fmtL(tankL)}L, hoặc 2–3 thuốc để kiểm tra thứ tự và cặp kỵ.</div>`
        : `<div class="result-empty">Chọn cây đang phun, rồi chọn 1 thuốc để xem lượng lấy cho bình ${fmtL(tankL)}L, hoặc 2–3 thuốc để kiểm tra thứ tự và cặp kỵ.</div>`;
      return;
    }
    const r = analyzeMix(ids);
    const alertHtml = r.alerts
      .map((a) => {
        const cls = a.level === "block" ? "bad" : a.level === "caution" ? "warn" : "ok";
        const tag = a.level === "block" ? "KHÔNG PHA CHUNG" : a.level === "caution" ? "CẨN THẬN" : "ĐƯỢC";
        return `<div class="callout ${cls}"><strong>${tag} — ${a.title}</strong><br>${a.text}</div>`;
      })
      .join("");

    const prefill = Math.round(tankL * 0.6 * 10) / 10;
    const orderHtml = `
      <div class="order-item"><span class="num">0</span><div><strong>Nước sạch ${fmtL(tankL)} lít — đổ ${fmtL(prefill)} lít trước</strong><div class="muted">Khuấy. Hòa từng loại ở ca riêng rồi mới đổ vào bình.</div></div></div>
      ${r.sorted
        .map((p, i) => {
          const f = formByCode[p.form];
          return `<div class="order-item">
            <span class="num">${i + 1}</span>
            <div>
              <strong>${p.name}</strong> <span class="badge form">${p.form}</span>
              <div class="muted">${f ? f.how : ""}</div>
              ${doseTakeHtml(p)}
            </div>
          </div>`;
        })
        .join("")}
      <div class="order-item"><span class="num">${r.sorted.length + 1}</span><div><strong>Châm đủ ${fmtL(tankL)} lít, khuấy, phun ngay</strong><div class="muted">Chất bám dính (nếu có) cho cuối. Không để qua đêm. Khuấy lại nếu có WP/WG/SC.</div></div></div>
    `;

    box.innerHTML = `
      ${
        crop
          ? `<div class="callout info"><strong>Cây: ${crop.name}${crop.ja ? " (" + crop.ja + ")" : ""}</strong><br>Hỗn hợp dưới đây chỉ gồm thuốc được phép phun trên cây này.</div>`
          : `<div class="callout warn"><strong>Chưa chọn cây trồng.</strong> Chọn cây phía trên để chương trình làm mờ thuốc cấm phun.</div>`
      }
      ${
        r.blocked
          ? `<div class="callout bad"><strong>Không pha hỗn hợp này.</strong> Xem lý do dưới đây. Phun riêng từng loại, rửa bình giữa hai lần nếu cần.</div>`
          : r.alerts.length
          ? `<div class="callout warn"><strong>Có thể pha nếu thử cốc đạt.</strong> Làm phép thử 5–10 phút trước khi pha cả bình.</div>`
          : `<div class="callout ok"><strong>Không thấy cặp kỵ cứng trong danh mục này.</strong> Vẫn thử cốc. Nhãn bao bì luôn thắng hướng dẫn web.</div>`
      }
      ${alertHtml}
      <div class="card take-summary">
        <h3>Cần lấy cho bình ${fmtL(tankL)}L</h3>
        <ul class="plain">
          ${r.sorted
            .map((p) => {
              const qty = canScaleDose(p.dose.per16) ? scaleDose(p.dose.per16, tankL) : p.dose.per16;
              const info = dilutionInfo(p, tankL);
              const range =
                info && info.hasRange
                  ? ` <span class="muted">(khoảng ${fmtNum(info.minAmt)}–${fmtNum(info.maxAmt)} ${info.unit})</span>`
                  : info
                  ? ` <span class="muted">(đúng 1:${fmtDil(info.ratio)})</span>`
                  : "";
              return `<li><strong>${p.name}:</strong> ${qty}${range}</li>`;
            })
            .join("")}
        </ul>
        <p class="muted" style="margin:8px 0 0">Số g/ml in đậm là gợi ý. Khoảng trong ngoặc là ngưỡng nhạt–đậm được phép. Hòa từng loại ở ca riêng. Nếu pha nhiều bình cùng dung tích, nhân với số lần pha.</p>
      </div>
      <h3 style="margin:14px 0 8px">Thứ tự cho vào bình ${fmtL(tankL)}L</h3>
      <div class="order-box">${orderHtml}</div>
      <div class="card" style="margin-top:12px">
        <h3>Phép thử cốc (jar test)</h3>
        <p class="muted">Pha đúng tỉ lệ vào cốc nước trong, lắc, để 5–10 phút. Hỏng nếu: kết tủa, vón, đổi màu lạ, nóng, sủi bọt nhiều, đóng váng không tan lại khi lắc.</p>
      </div>
    `;
  }

  function renderSources() {
    show("sources");
    setNav("home");
    $("source-list").innerHTML = SOURCES.map(
      (s) =>
        `<div class="source-item card">
          <a href="${s.url}" target="_blank" rel="noopener">${s.title}</a>
          <p class="muted">${s.use}</p>
        </div>`
    ).join("");
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
    const forms = FORMS.filter(
      (f) => f.code.toLowerCase().includes(q) || f.name.toLowerCase().includes(q) || f.en.toLowerCase().includes(q)
    );
    const cropsHit = CROPS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.ja && c.ja.toLowerCase().includes(q)) ||
        c.id.replace(/-/g, " ").includes(q)
    );
    const prods = PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.ai.toLowerCase().includes(q) ||
        p.targets.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q))
    );
    if (!forms.length && !prods.length && !cropsHit.length) {
      box.classList.remove("hidden");
      box.innerHTML = `<div class="card"><p class="muted">Không thấy “${q}”. Thử WP, EC, Dipel, hành tây, rầy…</p></div>`;
      return;
    }
    box.classList.remove("hidden");
    box.innerHTML =
      (cropsHit.length
        ? `<div class="section-title"><h2>Cây trồng</h2></div><div class="prod-list">${cropsHit
            .map(
              (c) =>
                `<button class="prod-row" data-crop="${c.id}"><span class="meta"><strong>${c.name}</strong><span class="muted">${c.ja || "Mở bộ tra pha"}</span></span><span class="badge">Tra pha</span></button>`
            )
            .join("")}</div>`
        : "") +
      (forms.length
        ? `<div class="section-title"><h2>Dạng chế phẩm</h2></div><div class="form-grid">${forms
            .map(
              (f) =>
                `<button class="chip" data-go="#/dang/${f.code}"><span class="code">${f.code}</span><span class="name">${f.name}</span></button>`
            )
            .join("")}</div>`
        : "") +
      (prods.length
        ? `<div class="section-title"><h2>Thuốc</h2></div><div class="prod-list">${prods.map(prodRow).join("")}</div>`
        : "");
  });

  window.addEventListener("hashchange", route);
  route();
})();
