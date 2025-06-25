let totalPrompts = 0;

document.getElementById("startBtn").addEventListener("click", async () => {
  const prompts = document
    .getElementById("promptInput")
    .value.split("\n")
    .filter(p => p.trim().length > 0);

  totalPrompts = prompts.length;
  const intervalSec = 40;

  if (totalPrompts === 0) {
    document.getElementById("status").textContent = "⚠️ Tidak ada prompt.";
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.runtime.sendMessage({
    action: "startPromptInjection",
    prompts,
    intervalSec,
    tabId: tab.id
  });

  document.getElementById("status").textContent = "🚀 Memulai proses...";
});

// Ambil status terakhir dari storage saat popup dibuka
chrome.storage.local.get("latestStatus", (result) => {
  if (result.latestStatus) {
    const { step, index, total, text } = result.latestStatus;
    document.getElementById("status").textContent = `${step} (${index}/${total})\n${text}`;
  }
});

// Buat koneksi untuk terima update realtime dari background
const port = chrome.runtime.connect({ name: "popup-status" });

port.onMessage.addListener((message) => {
  const { step, index, total, text } = message;
  document.getElementById("status").textContent = `${step} (${index}/${total})\n${text}`;
});
