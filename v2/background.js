console.log("🟢 Service worker aktif...");

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "startPromptInjection") {
    console.log("🚀 Mulai injeksi prompt via polling stop-button");

    const prompts = request.prompts;
    const tabId = request.tabId;

    for (let i = 0; i < prompts.length; i++) {
      const currentPrompt = prompts[i];
      console.log(`✏️ Prompt ${i + 1}/${prompts.length}: ${currentPrompt}`);

      // Step 1: Kirim prompt
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (text) => {
          try {
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
          } catch (e) {
            console.error("❌ Gagal input prompt:", e);
          }
        },
        args: [currentPrompt]
      });

      // Step 2: Tunggu sampai stop-button hilang
      console.log("⏳ Tunggu stop-button selesai...");
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          return new Promise((resolve) => {
            const interval = setInterval(() => {
              const stopButton = document.querySelector('[data-testid="stop-button"]');
              if (!stopButton) {
                clearInterval(interval);
                console.log("✅ stop-button sudah hilang");
                resolve();
              }
            }, 500);
          });
        }
      });

      // Step 3: Klik semua tombol unduh
      console.log("⬇️ Klik semua tombol unduh terbaru...");
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const buttons = Array.from(document.querySelectorAll('[aria-label="Unduh gambar ini"]'));
          if (buttons.length === 0) {
            console.warn("⚠️ Tidak ada tombol unduh ditemukan.");
            return;
          }

          buttons.forEach((btn, i) => {
            setTimeout(() => {
              btn.click();
              console.log(`✅ Unduh gambar ke-${i + 1}`);
            }, i * 300);
          });
        }
      });

      // Tidak perlu delay tetap, langsung ke prompt berikutnya
    }

    console.log("✅ Semua prompt selesai!");
    return true;
  }
});
