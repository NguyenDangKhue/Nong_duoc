(function () {
  const { FORMS, MIX_ORDER, PRODUCTS, KIND_LABEL, SAME_GROUP_RULES, SOURCES, formByCode, productById } =
    window.BVTV;

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
          <dt>Đối tượng</dt><dd>${p.targets}</dd>
          <dt>Cây trồng</dt><dd>${p.crops}</dd>
          <dt>Liều bình 16L</dt><dd><strong>${p.dose.per16}</strong><br><span class="muted">${p.dose.note}</span></dd>
          <dt>Cách ly</dt><dd>${p.phi}</dd>
        </dl>
        <p><a href="#/dang/${p.form}">Dạng ${p.form} — ${f ? f.name : ""}: thứ tự pha</a></p>
        <button class="big-btn primary" style="width:100%;margin-top:8px;min-height:52px" data-add="${p.id}">
          <strong>Thêm vào bộ tra pha</strong>
        </button>
      </div>
      <div class="card">
        <h3>Khi phối với thuốc khác</h3>
        <ul class="plain">${p.mixNotes.map((n) => `<li>${n}</li>`).join("")}</ul>
      </div>
    `;
  }

  function scaleDose(text, liters) {
    if (liters === 16) return text;
    const m = String(text).match(/([\d.,]+)\s*[–-]\s*([\d.,]+)\s*(g|ml)/i) || String(text).match(/([\d.,]+)\s*(g|ml)/i);
    if (!m) return text + ` (quy ${liters}L theo tỉ lệ 16L)`;
    const factor = liters / 16;
    const fmt = (n) => {
      const x = parseFloat(n.replace(",", ".")) * factor;
      return x < 10 ? x.toFixed(1).replace(".", ",") : String(Math.round(x));
    };
    if (m[3]) return `${fmt(m[1])}–${fmt(m[2])} ${m[3]}`;
    return `${fmt(m[1])} ${m[2]}`;
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

  function renderChecker() {
    show("checker");
    setNav("checker");
    $("checker-picks").innerHTML = PRODUCTS.map((p) => {
      const on = selected.has(p.id);
      return `<label class="pick-row">
        <input type="checkbox" data-pick="${p.id}" ${on ? "checked" : ""}>
        <span class="meta" style="flex:1">
          <strong>${p.name}</strong>
          <span class="muted">${KIND_LABEL[p.kind]} · ${p.form}</span>
        </span>
        <span class="badge form">${p.form}</span>
      </label>`;
    }).join("");

    document.querySelectorAll(".tank-bar button").forEach((b) => {
      b.classList.toggle("on", Number(b.dataset.l) === tankL);
    });

    const ids = [...selected];
    const box = $("checker-result");
    if (ids.length < 1) {
      box.innerHTML = `<div class="result-empty">Chọn 1 thuốc để xem cách pha, hoặc 2–3 thuốc để kiểm tra thứ tự và cặp kỵ.</div>`;
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

    const orderHtml = `
      <div class="order-item"><span class="num">0</span><div><strong>Nước sạch ${tankL} lít — đổ ${Math.round(tankL * 0.6)} lít trước</strong><div class="muted">Khuấy. Hòa từng loại ở ca riêng rồi mới đổ vào bình.</div></div></div>
      ${r.sorted
        .map((p, i) => {
          const f = formByCode[p.form];
          return `<div class="order-item">
            <span class="num">${i + 1}</span>
            <div>
              <strong>${p.name}</strong> <span class="badge form">${p.form}</span>
              <div class="muted">${f ? f.how : ""}</div>
              <div style="margin-top:4px"><strong>Lượng ~ ${scaleDose(p.dose.per16, tankL)}</strong> / bình ${tankL}L</div>
            </div>
          </div>`;
        })
        .join("")}
      <div class="order-item"><span class="num">${r.sorted.length + 1}</span><div><strong>Châm đủ nước, khuấy, phun ngay</strong><div class="muted">Chất bám dính (nếu có) cho cuối. Không để qua đêm. Khuấy lại nếu có WP/WG/SC.</div></div></div>
    `;

    box.innerHTML = `
      ${
        r.blocked
          ? `<div class="callout bad"><strong>Không pha hỗn hợp này.</strong> Xem lý do dưới đây. Phun riêng từng loại, rửa bình giữa hai lần nếu cần.</div>`
          : r.alerts.length
          ? `<div class="callout warn"><strong>Có thể pha nếu thử cốc đạt.</strong> Làm phép thử 5–10 phút trước khi pha cả bình.</div>`
          : `<div class="callout ok"><strong>Không thấy cặp kỵ cứng trong danh mục này.</strong> Vẫn thử cốc. Nhãn bao bì luôn thắng hướng dẫn web.</div>`
      }
      ${alertHtml}
      <h3 style="margin:14px 0 8px">Thứ tự cho vào bình ${tankL}L</h3>
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
      selected.add(add.getAttribute("data-add"));
      go("#/tra");
      return;
    }
    const tank = e.target.closest("[data-l]");
    if (tank && tank.closest(".tank-bar")) {
      tankL = Number(tank.dataset.l);
      renderChecker();
    }
  });

  document.addEventListener("change", (e) => {
    const pick = e.target.closest("[data-pick]");
    if (!pick) return;
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
    const prods = PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.ai.toLowerCase().includes(q) ||
        p.targets.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q))
    );
    if (!forms.length && !prods.length) {
      box.classList.remove("hidden");
      box.innerHTML = `<div class="card"><p class="muted">Không thấy “${q}”. Thử WP, EC, Dipel, rầy, sương mai…</p></div>`;
      return;
    }
    box.classList.remove("hidden");
    box.innerHTML =
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
