// src/qr-batch.js
// CSV 업로드 -> 현재 스타일 설정으로 QR N개 생성 -> ZIP 다운로드

(function () {
  const modal = document.getElementById("qrBatchModal");
  if (!modal) return;

  const openBtn = document.getElementById("btnQrBatchOpen");
  const closeBtn = document.getElementById("qrBatchModalCloseBtn");
  const currentTypeLabel = document.getElementById("qrBatchCurrentType");
  const columnsHint = document.getElementById("qrBatchColumnsHint");
  const sampleCsvBtn = document.getElementById("qrBatchSampleCsvBtn");
  const fileInput = document.getElementById("qrBatchFileInput");
  const fileNameEl = document.getElementById("qrBatchFileName");
  const uploadCard = document.getElementById("qrBatchUploadCard");
  const startBtn = document.getElementById("qrBatchStartBtn");
  const downloadZipBtn = document.getElementById("qrBatchDownloadZipBtn");
  const progressWrap = document.getElementById("qrBatchProgressWrap");
  const progressFill = document.getElementById("qrBatchProgressFill");
  const progressText = document.getElementById("qrBatchProgressText");
  const resultBox = document.getElementById("qrBatchResult");
  const alsoLabelCheckbox = document.getElementById("qrBatchAlsoLabel");
  const layoutCountHint = document.getElementById("qrBatchLayoutCountHint");
  const printLabelsBtn = document.getElementById("qrBatchPrintLabelsBtn");
  const sendLabelBtn = document.getElementById("qrBatchSendLabelBtn");
  const qrPrintLayoutEl = document.getElementById("qrPrintLayout");
  const footerStatus = document.getElementById("qrBatchFooterStatus");
  const progressBar = progressWrap?.querySelector('[role="progressbar"]');

  const TYPE_LABELS = { text: "텍스트/URL", wifi: "Wi-Fi", vcard: "연락처", email: "이메일", sms: "SMS", social: "소셜 미디어" };

  // 유형별 CSV 컬럼 정의: key = buildQRPayload가 받는 fields 키, header = CSV 헤더명, required = 필수 여부
  const TYPE_COLUMNS = {
    text: [
      { key: "data", header: "data", required: true, sample: "https://example.com" },
    ],
    wifi: [
      { key: "ssid", header: "ssid", required: true, sample: "Office_Guest_5G" },
      { key: "password", header: "password", required: false, sample: "guest12345" },
      { key: "auth", header: "auth", required: false, sample: "WPA" },
      { key: "hidden", header: "hidden", required: false, sample: "false" },
    ],
    vcard: [
      { key: "name", header: "name", required: true, sample: "홍길동" },
      { key: "phone", header: "phone", required: false, sample: "000-0000-0000" },
      { key: "org", header: "org", required: false, sample: "샘플테크" },
      { key: "title", header: "title", required: false, sample: "팀장" },
      { key: "email", header: "email", required: false, sample: "gildong@example.com" },
      { key: "url", header: "url", required: false, sample: "https://example.com" },
    ],
    email: [
      { key: "to", header: "to", required: true, sample: "sales@example.com" },
      { key: "subject", header: "subject", required: false, sample: "견적 문의" },
      { key: "body", header: "body", required: false, sample: "견적서 부탁드립니다." },
    ],
    sms: [
      { key: "phone", header: "phone", required: true, sample: "000-0000-0000" },
      { key: "message", header: "message", required: false, sample: "확인 부탁드립니다." },
    ],
    social: [
      { key: "platform", header: "platform", required: false, sample: "instagram" },
      { key: "id", header: "id", required: true, sample: "my_handle" },
    ],
  };

  let parsedRows = null; // [{ fields, filename }]
  let skippedRows = []; // [{ index, reason }]
  let generatedFiles = null; // [{ name, data: Uint8Array }] - createZip 입력
  let printContexts = null; // 성공한 행의 라벨 인쇄 컨텍스트
  let labelRecords = null; // 라벨·티켓 제작 탭으로 보낼 구조화 데이터
  let zipBlob = null;
  let returnFocusEl = null;

  function currentType() {
    return window.QRGeneratorCore?.getCurrentType?.() || "text";
  }

  function resetBatchState() {
    parsedRows = null;
    skippedRows = [];
    generatedFiles = null;
    printContexts = null;
    labelRecords = null;
    zipBlob = null;
    startBtn.disabled = true;
    downloadZipBtn.hidden = true;
    printLabelsBtn.hidden = true;
    if (sendLabelBtn) sendLabelBtn.hidden = true;
    progressWrap.hidden = true;
    resultBox.hidden = true;
    resultBox.innerHTML = "";
    resultBox.classList.remove("is-success", "has-warning");
    fileInput.value = "";
    fileNameEl.textContent = "선택된 파일 없음 · CSV 형식";
    uploadCard?.classList.remove("is-ready", "is-error", "is-dragover");
    progressFill.style.width = "0%";
    progressText.textContent = "0 / 0";
    progressBar?.setAttribute("aria-valuenow", "0");
    if (footerStatus) footerStatus.textContent = "CSV 파일을 선택하면 생성할 수 있습니다.";
  }

  function renderColumnsHint() {
    const type = currentType();
    currentTypeLabel.textContent = TYPE_LABELS[type] || type;
    const cols = TYPE_COLUMNS[type] || [];
    const parts = cols.map((c) => `<code>${c.header}</code>${c.required ? " (필수)" : " (선택)"}`);
    parts.push(`<code>filename</code> (선택, 없으면 자동 번호)`);
    columnsHint.innerHTML = `CSV 헤더: ${parts.join(", ")}`;
    if (layoutCountHint) layoutCountHint.textContent = qrPrintLayoutEl?.value || "1";
  }

  function openModal() {
    returnFocusEl = document.activeElement;
    resetBatchState();
    renderColumnsHint();
    modal.hidden = false;
    document.body.classList.add("qr-print-modal-open");
    closeBtn?.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("qr-print-modal-open");
    returnFocusEl?.focus?.();
  }

  qrPrintLayoutEl?.addEventListener("change", () => {
    if (layoutCountHint) layoutCountHint.textContent = qrPrintLayoutEl.value;
  });

  openBtn?.addEventListener("click", openModal);
  closeBtn?.addEventListener("click", closeModal);
  modal.querySelector("[data-qr-batch-close]")?.addEventListener("click", closeModal);
  modal.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    closeModal();
  });

  // -------- CSV 파서 (따옴표/콤마 이스케이프 대응) --------
  function parseCsv(text) {
    if (window.PromptDeckTabularData?.parseRows) {
      return window.PromptDeckTabularData.parseRows(text, { delimiter: "," });
    }
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += ch;
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field); field = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(field); field = "";
        if (row.some((v) => v !== "")) rows.push(row);
        row = [];
      } else {
        field += ch;
      }
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function sampleCsvText(type) {
    const cols = TYPE_COLUMNS[type] || [];
    const headers = [...cols.map((c) => c.header), "filename"];
    const sample1 = [...cols.map((c) => c.sample), "sample_1"];
    const sample2 = [...cols.map((c) => c.sample), "sample_2"];
    const escape = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    return [headers, sample1, sample2].map((r) => r.map(escape).join(",")).join("\n");
  }

  sampleCsvBtn?.addEventListener("click", () => {
    const type = currentType();
    const csv = sampleCsvText(type);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr_batch_sample_${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  async function loadCsvFile(file) {
    if (!file) return;
    parsedRows = null;
    startBtn.disabled = true;
    downloadZipBtn.hidden = true;
    printLabelsBtn.hidden = true;
    if (sendLabelBtn) sendLabelBtn.hidden = true;
    progressWrap.hidden = true;
    resultBox.hidden = true;
    uploadCard?.classList.remove("is-ready", "is-error");
    fileNameEl.textContent = file.name;
    if (footerStatus) footerStatus.textContent = "CSV 파일을 확인하고 있습니다…";
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length < 2) {
      showToastLocal("CSV에 데이터 행이 없습니다.", true);
      uploadCard?.classList.add("is-error");
      fileNameEl.textContent = `${file.name} · 데이터 행이 없습니다.`;
      if (footerStatus) footerStatus.textContent = "CSV에 데이터 행이 없습니다.";
      return;
    }
    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const type = currentType();
    const cols = TYPE_COLUMNS[type] || [];
    const missingRequired = cols.filter((c) => c.required && !headers.includes(c.header)).map((c) => c.header);
    if (missingRequired.length) {
      showToastLocal(`필수 컬럼이 없습니다: ${missingRequired.join(", ")}`, true);
      uploadCard?.classList.add("is-error");
      fileNameEl.textContent = `${file.name} · 필수 헤더를 확인하세요.`;
      if (footerStatus) footerStatus.textContent = `필수 헤더 누락: ${missingRequired.join(", ")}`;
      return;
    }
    const filenameIdx = headers.indexOf("filename");
    parsedRows = rows.slice(1).map((r) => {
      const fields = {};
      cols.forEach((c) => {
        const idx = headers.indexOf(c.header);
        fields[c.key] = idx >= 0 ? (r[idx] || "").trim() : "";
      });
      if (type === "wifi") fields.hidden = /^true$/i.test(fields.hidden || "");
      return { fields, filename: filenameIdx >= 0 ? (r[filenameIdx] || "").trim() : "" };
    });
    startBtn.disabled = false;
    uploadCard?.classList.add("is-ready");
    fileNameEl.textContent = `${file.name} · 데이터 ${parsedRows.length}개`;
    resultBox.hidden = true;
    downloadZipBtn.hidden = true;
    if (footerStatus) footerStatus.textContent = `${parsedRows.length}개 QR을 생성할 준비가 되었습니다.`;
    showToastLocal(`${parsedRows.length}개 행을 불러왔습니다.`);
  }

  fileInput?.addEventListener("change", async () => {
    await loadCsvFile(fileInput.files?.[0]);
  });

  ["dragenter", "dragover"].forEach((eventName) => uploadCard?.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadCard.classList.add("is-dragover");
  }));
  ["dragleave", "dragend"].forEach((eventName) => uploadCard?.addEventListener(eventName, () => {
    uploadCard.classList.remove("is-dragover");
  }));
  uploadCard?.addEventListener("drop", async (event) => {
    event.preventDefault();
    uploadCard.classList.remove("is-dragover");
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      uploadCard.classList.add("is-error");
      fileNameEl.textContent = `${file.name} · CSV 파일만 사용할 수 있습니다.`;
      if (footerStatus) footerStatus.textContent = "CSV 형식의 파일을 선택해주세요.";
      showToastLocal("CSV 파일만 사용할 수 있습니다.", true);
      return;
    }
    await loadCsvFile(file);
  });

  function showToastLocal(msg, isError = false) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.style.cssText = `display:block;position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:${isError ? "#c0392b" : "#1f5eff"};color:#fff;padding:10px 18px;border-radius:10px;z-index:99999;font-size:13px;`;
    clearTimeout(showToastLocal._t);
    showToastLocal._t = setTimeout(() => { toast.style.display = "none"; }, 2600);
  }

  function uniqueFileName(base, used) {
    let name = base;
    let n = 2;
    while (used.has(name)) { name = `${base}-${n}`; n++; }
    used.add(name);
    return name;
  }

  startBtn?.addEventListener("click", async () => {
    if (!parsedRows || !window.QRGeneratorCore || !window.createZip) return;
    startBtn.disabled = true;
    downloadZipBtn.hidden = true;
    printLabelsBtn.hidden = true;
    if (sendLabelBtn) sendLabelBtn.hidden = true;
    resultBox.hidden = true;
    progressWrap.hidden = false;
    progressBar?.setAttribute("aria-valuenow", "0");
    skippedRows = [];
    generatedFiles = [];
    printContexts = [];
    labelRecords = [];
    zipBlob = null;

    const type = currentType();
    const style = window.QRGeneratorCore.getStyleOptions();
    const logo = window.QRGeneratorCore.getLogoState();
    const wantLabels = Boolean(alsoLabelCheckbox?.checked);
    const usedNames = new Set();
    const total = parsedRows.length;
    if (footerStatus) footerStatus.textContent = `0 / ${total} 생성 중…`;

    for (let i = 0; i < total; i++) {
      const { fields, filename } = parsedRows[i];
      const data = window.QRGeneratorCore.buildQRPayload(type, fields);
      if (!data) {
        skippedRows.push({ index: i + 2, reason: "필수값 누락" });
      } else {
        try {
          const { canvas } = window.QRGeneratorCore.drawCustomQRCode(data, style.size, {
            ...style,
            logoImage: logo.image,
            logoRatio: logo.ratio,
          });
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
          const buffer = new Uint8Array(await blob.arrayBuffer());
          const base = (filename || `qr_${String(i + 1).padStart(3, "0")}`).replace(/[\\/:*?"<>|]/g, "_");
          const name = `${uniqueFileName(base, usedNames)}.png`;
          generatedFiles.push({ name, data: buffer });
          labelRecords.push({
            id: `qr-batch-${Date.now()}-${i + 1}`,
            number: String(i + 1).padStart(3, "0"),
            data: { ...fields, sourceFilename: filename || "" },
            front: {
              enabled: true,
              title: filename || fields.name || fields.ssid || `QR ${i + 1}`,
              subtitle: TYPE_LABELS[type] || type,
              qrValue: data,
            },
          });
          if (wantLabels) {
            const dataUrl = canvas.toDataURL("image/png");
            printContexts.push(window.QRGeneratorCore.buildBatchPrintContext(type, fields, dataUrl));
          }
        } catch (e) {
          skippedRows.push({ index: i + 2, reason: `생성 오류: ${e.message}` });
        }
      }

      const progress = Math.round(((i + 1) / total) * 100);
      progressFill.style.width = `${progress}%`;
      progressText.textContent = `${i + 1} / ${total}`;
      progressBar?.setAttribute("aria-valuenow", String(progress));
      if (footerStatus) footerStatus.textContent = `${i + 1} / ${total} 생성 중…`;
      if (i % 15 === 14) await new Promise((resolve) => setTimeout(resolve, 0));
    }

    if (generatedFiles.length) {
      zipBlob = window.createZip(generatedFiles);
      downloadZipBtn.hidden = false;
      if (wantLabels) printLabelsBtn.hidden = false;
      if (sendLabelBtn) sendLabelBtn.hidden = false;
    }

    resultBox.hidden = false;
    const summary = `완료: ${generatedFiles.length}개 성공, ${skippedRows.length}개 건너뜀`;
    const skipLines = skippedRows.slice(0, 20).map((s) => `<div class="qr-batch-skip-row">${s.index}행: ${s.reason}</div>`).join("");
    const more = skippedRows.length > 20 ? `<div class="qr-batch-skip-row">외 ${skippedRows.length - 20}건...</div>` : "";
    resultBox.innerHTML = `<div class="qr-batch-result-summary">${summary}</div>${skipLines}${more}`;
    resultBox.classList.toggle("is-success", skippedRows.length === 0);
    resultBox.classList.toggle("has-warning", skippedRows.length > 0);

    startBtn.disabled = false;
    if (footerStatus) footerStatus.textContent = skippedRows.length ? `${generatedFiles.length}개 완료 · ${skippedRows.length}개 확인 필요` : `${generatedFiles.length}개 생성 완료 · ZIP을 내려받을 수 있습니다.`;
    showToastLocal(summary, skippedRows.length > 0);
  });

  downloadZipBtn?.addEventListener("click", () => {
    if (!zipBlob) return;
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr_batch_${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  });

  sendLabelBtn?.addEventListener("click", async () => {
    if (!labelRecords?.length || !window.PromptDeckLabelBridge?.send) {
      showToastLocal("라벨로 보낼 QR 데이터가 없습니다.", true);
      return;
    }
    const style = window.QRGeneratorCore.getStyleOptions();
    try {
      await window.PromptDeckLabelBridge.send({
        sourceTab: "qrBatch",
        importMode: "append",
        records: labelRecords,
        qrSettings: { enabled: true, side: "front", source: "record", position: "right", sizePercent: 30, ...style },
      });
      closeModal();
      showToastLocal(`QR ${labelRecords.length}건을 라벨·티켓 제작으로 보냈습니다.`);
    } catch (error) {
      showToastLocal(error.message || "QR 일괄 데이터를 라벨로 보내지 못했습니다.", true);
    }
  });

  // -------- 라벨 일괄 인쇄: 여러 페이지로 분할해서 window.print() --------
  printLabelsBtn?.addEventListener("click", async () => {
    if (!printContexts || !printContexts.length || !window.QRGeneratorCore) return;
    const layoutCount = parseInt(qrPrintLayoutEl?.value, 10) || 1;

    const root = document.createElement("div");
    root.className = "qr-batch-print-root";

    const imageLoadPromises = [];
    for (let i = 0; i < printContexts.length; i += layoutCount) {
      const pageContexts = printContexts.slice(i, i + layoutCount);
      const page = document.createElement("div");
      page.className = `qr-batch-print-page layout-${layoutCount}`;
      pageContexts.forEach((context) => {
        const card = window.QRGeneratorCore.renderPrintCard(context);
        card.querySelectorAll("img").forEach((img) => {
          imageLoadPromises.push(new Promise((resolve) => {
            if (img.complete) resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }));
        });
        page.appendChild(card);
      });
      root.appendChild(page);
    }

    document.body.appendChild(root);
    await Promise.all(imageLoadPromises);
    window.print();
    setTimeout(() => { root.remove(); }, 500);
  });
})();
