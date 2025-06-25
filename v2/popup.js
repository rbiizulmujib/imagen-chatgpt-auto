document.getElementById("startBtn").addEventListener("click", async () => {
  const prompts = document
    .getElementById("promptInput")
    .value.split("\n")
    .filter(p => p.trim().length > 0);

  const intervalSec = 40;

  if (prompts.length === 0) {
    document.getElementById("status").textContent = "⚠️ Tidak ada prompt.";
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Debug log
  console.log("📤 Mengirim prompt ke background...");
  console.log("➡️ Prompts:", prompts);
  console.log("🧭 Tab ID:", tab.id);

  chrome.runtime.sendMessage({
    action: "startPromptInjection",
    prompts,
    intervalSec,
    tabId: tab.id
  });

  document.getElementById("status").textContent = "🚀 Prompt sedang dikirim di background...";
});
