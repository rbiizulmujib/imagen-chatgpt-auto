console.log("🟢 Service worker aktif...");

let popupPort = null;

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup-status") {
    popupPort = port;
    port.onDisconnect.addListener(() => {
      popupPort = null;
    });
  }
});

function sendStatus(step, index, total, text) {
  const statusObj = { step, index, total, text };

  // simpan status ke storage
  chrome.storage.local.set({ latestStatus: statusObj });

  // kirim ke popup jika port terbuka
  if (popupPort) {
    popupPort.postMessage(statusObj);
  }
}

chrome.runtime.onMessage.addListener(async (request) => {
  if (request.action === "startPromptInjection") {
    const prompts = request.prompts;
    const tabId = request.tabId;

    for (let i = 0; i < prompts.length; i++) {
      const currentPrompt = prompts[i];
      sendStatus("📝 Kirim prompt", i + 1, prompts.length, currentPrompt);

      await chrome.scripting.executeScript({
        target: { tabId },
        func: (text) => {
          const editor = document.querySelector("#prompt-textarea");
          if (!editor || editor.contentEditable !== "true") return;

          editor.focus();
          document.execCommand("selectAll", false, null);
          document.execCommand("delete", false, null);
          document.execCommand("insertText", false, text);

          editor.dispatchEvent(new InputEvent("input", {
            bubbles: true,
            cancelable: true,
            inputType: "insertText",
            data: text
          }));

          setTimeout(() => {
            const enterEvent = new KeyboardEvent("keydown", {
              bubbles: true,
              cancelable: true,
              key: "Enter",
              code: "Enter",
              which: 13,
              keyCode: 13
            });
            editor.dispatchEvent(enterEvent);
          }, 150);
        },
        args: [currentPrompt]
      });

      // Tunggu stop-button hilang
      sendStatus("⏳ Menunggu selesai generate", i + 1, prompts.length, "Menunggu stop-button...");
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          return new Promise((resolve) => {
            const interval = setInterval(() => {
              const stopButton = document.querySelector('[data-testid="stop-button"]');
              if (!stopButton) {
                clearInterval(interval);
                resolve();
              }
            }, 500);
          });
        }
      });

      // Klik tombol unduh
      sendStatus("⬇️ Unduh gambar", i + 1, prompts.length, "Klik semua tombol unduh...");
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const buttons = Array.from(document.querySelectorAll('[aria-label="Unduh gambar ini"]'));
          buttons.forEach((btn, i) => {
            setTimeout(() => btn.click(), i * 300);
          });
        }
      });
    }

    sendStatus("✅ Selesai", prompts.length, prompts.length, "Semua prompt telah dikirim.");
  }
});
