const API = "/api";

const toastEl = document.getElementById("toast");
const listaPersonas = document.getElementById("lista-personas");
const listaGrupos = document.getElementById("lista-grupos");
const countPersonas = document.getElementById("count-personas");
const countGrupos = document.getElementById("count-grupos");
const modalPersona = document.getElementById("modal-persona");
const modalGrupo = document.getElementById("modal-grupo");
const formPersona = document.getElementById("form-persona");
const formGrupo = document.getElementById("form-grupo");
const selectGrupo = document.getElementById("persona-grupo");
const inputBuscarPersonas = document.getElementById("buscar-personas");
const inputBuscarGrupos = document.getElementById("buscar-grupos");

function showToast(msg, type = "ok") {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  toastEl.className = "toast " + (type === "error" ? "error" : "ok");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toastEl.hidden = true;
  }, 4200);
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* vacío */
  }
  if (!res.ok) {
    const detail = data?.detail;
    const msg =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d.msg || d).join("; ")
          : res.statusText || "Error";
    throw new Error(msg);
  }
  return data;
}

function fotoSrc(fotografia) {
  if (!fotografia) return null;
  if (fotografia.startsWith("http") || fotografia.startsWith("data:")) return fotografia;
  return fotografia.startsWith("/") ? window.location.origin + fotografia : fotografia;
}

function fieldRow(label, value, valueClass = "") {
  const empty = value == null || String(value).trim() === "";
  const inner = empty ? "—" : escapeHtml(String(value));
  const cls = valueClass ? `field-value ${valueClass}` : "field-value";
  return `<div class="field-row"><span class="field-label">${escapeHtml(label)}</span><span class="${cls}">${inner}</span></div>`;
}

function fieldRowHtml(label, innerEscaped) {
  return `<div class="field-row"><span class="field-label">${escapeHtml(label)}</span><div class="field-value-wrap">${innerEscaped}</div></div>`;
}

let gruposCache = [];
let personasCache = [];

function normalizarBusqueda(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function textoCoincide(haystack, q) {
  if (!q) return true;
  const n = normalizarBusqueda(haystack);
  return n.includes(q);
}

function filtrarGrupos(lista, qRaw) {
  const q = normalizarBusqueda(qRaw);
  if (!q) return lista;
  return lista.filter((g) => {
    const blob = [g.grupo, g.codigo, g.esta_activo ? "activo" : "inactivo"].filter(Boolean).join(" ");
    return textoCoincide(blob, q);
  });
}

function filtrarPersonas(lista, qRaw) {
  const q = normalizarBusqueda(qRaw);
  if (!q) return lista;
  return lista.filter((p) => {
    const grupoNombre = p.grupo?.grupo ?? "";
    const blob = [
      p.nombres,
      p.apellidos,
      p.correo,
      p.nro_celular,
      p.direccion,
      p.observaciones,
      p.codigo,
      grupoNombre,
      p.esta_activo ? "activo" : "inactivo",
    ]
      .filter(Boolean)
      .join(" ");
    return textoCoincide(blob, q);
  });
}

function aplicarBusquedaGrupos() {
  const filtrados = filtrarGrupos(gruposCache, inputBuscarGrupos.value);
  const q = inputBuscarGrupos.value.trim();
  if (!q) {
    countGrupos.textContent = `${gruposCache.length} grupo(s)`;
  } else {
    countGrupos.textContent = `${filtrados.length} de ${gruposCache.length} grupo(s)`;
  }
  renderGrupos(filtrados, q);
}

function aplicarBusquedaPersonas() {
  const filtrados = filtrarPersonas(personasCache, inputBuscarPersonas.value);
  const q = inputBuscarPersonas.value.trim();
  if (!q) {
    countPersonas.textContent = `${personasCache.length} persona(s)`;
  } else {
    countPersonas.textContent = `${filtrados.length} de ${personasCache.length} persona(s)`;
  }
  renderPersonas(filtrados, q);
}

async function cargarGrupos() {
  gruposCache = await fetchJson(`${API}/grupos`);
  selectGrupo.innerHTML = gruposCache
    .map(
      (g) =>
        `<option value="${g.codigo}">${escapeHtml(g.grupo)}${g.esta_activo ? "" : " (inactivo)"}</option>`
    )
    .join("");
  aplicarBusquedaGrupos();
}

function renderGrupos(grupos, queryActiva = "") {
  if (!grupos.length) {
    if (gruposCache.length && queryActiva) {
      listaGrupos.innerHTML = `<p class="empty">Ningún grupo coincide con «${escapeHtml(queryActiva)}».</p>`;
    } else {
      listaGrupos.innerHTML = '<p class="empty">No hay grupos. Cree uno con «Nuevo grupo».</p>';
    }
    return;
  }
  listaGrupos.innerHTML = grupos
    .map(
      (g) => `
    <article class="card-grupo ${g.esta_activo ? "" : "inactiva"}" data-entity="grupo">
      <span class="entity-badge entity-badge--grupo" aria-hidden="true">Grupo</span>
      <div class="card-grupo-body">
        <h3 class="card-grupo-title">${escapeHtml(g.grupo)}</h3>
        <p class="card-section-hint">Atributos del grupo</p>
        <div class="field-list field-list--compact field-list--grupo">
          ${fieldRow("Código (UUID)", g.codigo, "field-uuid field-uuid--grupo")}
          ${fieldRow("Nombre del grupo", g.grupo, "field-grupo-nombre")}
          ${fieldRow(
            "Está activo",
            g.esta_activo ? "Sí" : "No",
            g.esta_activo ? "field-status field-status--on" : "field-status field-status--off"
          )}
        </div>
      </div>
      <button type="button" class="btn ghost small" data-edit-grupo="${g.codigo}">Editar</button>
    </article>`
    )
    .join("");
  listaGrupos.querySelectorAll("[data-edit-grupo]").forEach((btn) => {
    btn.addEventListener("click", () => abrirGrupo(btn.getAttribute("data-edit-grupo")));
  });
}

async function cargarPersonas() {
  personasCache = await fetchJson(`${API}/personas`);
  aplicarBusquedaPersonas();
}

function renderPersonas(personas, queryActiva = "") {
  if (!personas.length) {
    if (personasCache.length && queryActiva) {
      listaPersonas.innerHTML = `<p class="empty">Ninguna persona coincide con «${escapeHtml(queryActiva)}».</p>`;
    } else {
      listaPersonas.innerHTML = '<p class="empty">No hay personas. Use «Nueva persona».</p>';
    }
    return;
  }
  listaPersonas.innerHTML = personas
    .map((p) => {
      const src = fotoSrc(p.fotografia);
      const img = src
        ? `<img src="${escapeAttr(src)}" alt="Foto de ${escapeAttr(p.nombres)}" loading="lazy" />`
        : '<div class="photo-placeholder">Sin foto</div>';
      const grupoTxt = p.grupo ? p.grupo.grupo : null;
      const obsBlock =
        p.observaciones && String(p.observaciones).trim()
          ? `<div class="field-block field-block--obs field-block--persona"><span class="field-label">Observaciones</span><p class="field-obs-text">${escapeHtml(
              p.observaciones
            )}</p></div>`
          : "";
      return `
    <article class="card-persona ${p.esta_activo ? "" : "inactiva"}" data-entity="persona">
      <span class="entity-badge entity-badge--persona" aria-hidden="true">Persona</span>
      <div class="photo-wrap">${img}</div>
      <div class="card-body">
        <h3 class="card-persona-name">${escapeHtml(p.nombres)} ${escapeHtml(p.apellidos)}</h3>
        <p class="card-section-hint">Datos personales y contacto</p>
        <div class="field-list field-list--persona">
          ${fieldRow("Nombres", p.nombres, "field-persona-nombre")}
          ${fieldRow("Apellidos", p.apellidos, "field-persona-nombre")}
          ${fieldRow("Correo electrónico", p.correo, "field-email")}
          ${fieldRow("Número de celular", p.nro_celular, "field-phone")}
          ${fieldRow("Dirección", p.direccion, "field-direccion")}
          ${fieldRow("Grupo asignado", grupoTxt, "field-group")}
          ${fieldRow(
            "Está activo",
            p.esta_activo ? "Sí" : "No",
            p.esta_activo ? "field-status field-status--on" : "field-status field-status--off"
          )}
          ${fieldRowHtml(
            "Código interno (UUID)",
            `<code class="field-code field-code--persona" title="Identificador único">${escapeHtml(p.codigo)}</code>`
          )}
        </div>
        ${obsBlock}
        <div class="card-actions">
          <button type="button" class="btn ghost small" data-edit-persona="${p.codigo}">Editar</button>
        </div>
      </div>
    </article>`;
    })
    .join("");
  listaPersonas.querySelectorAll("[data-edit-persona]").forEach((btn) => {
    btn.addEventListener("click", () => abrirPersona(btn.getAttribute("data-edit-persona")));
  });
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

document.querySelectorAll(".tab").forEach((t) => {
  t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((x) => x.classList.remove("active"));
    t.classList.add("active");
    document.getElementById("panel-" + t.dataset.tab).classList.add("active");
  });
});

document.querySelectorAll("[data-close]").forEach((b) => {
  b.addEventListener("click", () => {
    modalPersona.close();
    modalGrupo.close();
  });
});

document.getElementById("btn-nueva-persona").addEventListener("click", () => {
  if (!selectGrupo.options.length) {
    showToast("Cree al menos un grupo antes de registrar personas.", "error");
    return;
  }
  abrirPersona(null);
});
document.getElementById("btn-nuevo-grupo").addEventListener("click", () => abrirGrupo(null));

inputBuscarPersonas.addEventListener("input", () => aplicarBusquedaPersonas());
inputBuscarGrupos.addEventListener("input", () => aplicarBusquedaGrupos());

function abrirGrupo(codigo) {
  const hint = document.getElementById("grupo-uuid-hint");
  const hintCode = document.getElementById("grupo-uuid-text");
  document.getElementById("titulo-modal-grupo").textContent = codigo ? "Editar grupo" : "Nuevo grupo";
  document.getElementById("grupo-codigo").value = codigo || "";
  if (codigo) {
    hint.hidden = false;
    hintCode.textContent = codigo;
    const g = gruposCache.find((x) => x.codigo === codigo);
    document.getElementById("grupo-nombre").value = g?.grupo || "";
    document.getElementById("grupo-activo").checked = !!g?.esta_activo;
  } else {
    hint.hidden = true;
    hintCode.textContent = "";
    document.getElementById("grupo-nombre").value = "";
    document.getElementById("grupo-activo").checked = true;
  }
  modalGrupo.showModal();
}

function abrirPersona(codigo) {
  const pHint = document.getElementById("persona-uuid-hint");
  const pHintCode = document.getElementById("persona-uuid-text");
  document.getElementById("titulo-modal-persona").textContent = codigo ? "Editar persona" : "Nueva persona";
  document.getElementById("persona-codigo").value = codigo || "";
  document.getElementById("persona-foto").value = "";
  if (codigo) {
    fetchJson(`${API}/personas/${codigo}`)
      .then((p) => {
        pHint.hidden = false;
        pHintCode.textContent = p.codigo;
        document.getElementById("persona-nombres").value = p.nombres;
        document.getElementById("persona-apellidos").value = p.apellidos;
        document.getElementById("persona-correo").value = p.correo;
        document.getElementById("persona-celular").value = p.nro_celular || "";
        document.getElementById("persona-direccion").value = p.direccion || "";
        document.getElementById("persona-obs").value = p.observaciones || "";
        document.getElementById("persona-activo").checked = p.esta_activo;
        document.getElementById("persona-grupo").value = p.grupo_codigo;
        modalPersona.showModal();
      })
      .catch((e) => showToast(e.message, "error"));
  } else {
    pHint.hidden = true;
    pHintCode.textContent = "";
    document.getElementById("persona-nombres").value = "";
    document.getElementById("persona-apellidos").value = "";
    document.getElementById("persona-correo").value = "";
    document.getElementById("persona-celular").value = "";
    document.getElementById("persona-direccion").value = "";
    document.getElementById("persona-obs").value = "";
    document.getElementById("persona-activo").checked = true;
    if (selectGrupo.options.length) selectGrupo.selectedIndex = 0;
    modalPersona.showModal();
  }
}

formGrupo.addEventListener("submit", async (e) => {
  e.preventDefault();
  const codigo = document.getElementById("grupo-codigo").value;
  const body = {
    grupo: document.getElementById("grupo-nombre").value.trim(),
    esta_activo: document.getElementById("grupo-activo").checked,
  };
  try {
    if (codigo) {
      await fetchJson(`${API}/grupos/${codigo}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      showToast("Grupo actualizado");
    } else {
      await fetchJson(`${API}/grupos`, { method: "POST", body: JSON.stringify(body) });
      showToast("Grupo creado");
    }
    modalGrupo.close();
    await cargarGrupos();
    await cargarPersonas();
  } catch (err) {
    showToast(err.message, "error");
  }
});

formPersona.addEventListener("submit", async (e) => {
  e.preventDefault();
  const codigo = document.getElementById("persona-codigo").value;
  const payload = {
    nombres: document.getElementById("persona-nombres").value.trim(),
    apellidos: document.getElementById("persona-apellidos").value.trim(),
    correo: document.getElementById("persona-correo").value.trim(),
    nro_celular: document.getElementById("persona-celular").value.trim() || null,
    direccion: document.getElementById("persona-direccion").value.trim() || null,
    observaciones: document.getElementById("persona-obs").value.trim() || null,
    esta_activo: document.getElementById("persona-activo").checked,
    grupo_codigo: document.getElementById("persona-grupo").value,
  };
  const fileInput = document.getElementById("persona-foto");
  const file = fileInput.files?.[0];

  try {
    let id = codigo;
    if (codigo) {
      await fetchJson(`${API}/personas/${codigo}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      showToast("Persona actualizada");
    } else {
      const created = await fetchJson(`${API}/personas`, {
        method: "POST",
        body: JSON.stringify({ ...payload, fotografia: null }),
      });
      id = created.codigo;
      showToast("Persona creada");
    }
    if (file && id) {
      const fd = new FormData();
      fd.append("foto", file);
      const res = await fetch(`${API}/personas/${id}/foto`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "No se pudo subir la foto");
      }
      showToast(codigo ? "Datos y foto guardados" : "Persona y foto guardadas");
    }
    modalPersona.close();
    await cargarPersonas();
  } catch (err) {
    showToast(err.message, "error");
  }
});

(async function init() {
  try {
    await cargarGrupos();
    await cargarPersonas();
    showToast("Datos cargados", "ok");
  } catch (e) {
    showToast("No se pudo conectar al API: " + e.message, "error");
  }
})();
