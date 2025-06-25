chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "startPromptInjection") {
    console.log("📥 Start injection dari popup...");

    const prompts = request.prompts;
    const intervalSec = request.intervalSec || 120;
    const tabId = request.tabId;

    for (let i = 0; i < prompts.length; i++) {
      const currentPrompt = prompts[i];

      // Step 1: Masukkan prompt dan tekan Enter
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

          // Delay sebentar agar React sempat sync, baru tekan Enter
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
          }, 150); // delay sebelum enter
        },
        args: [currentPrompt]
      });

      // Step 2: Tunggu render gambar (2 detik)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Klik tombol download jika ada
await chrome.scripting.executeScript({
  target: { tabId },
  func: () => {
    const buttons = Array.from(document.querySelectorAll('[aria-label="Unduh gambar ini"]'));

    if (buttons.length === 0) {
      console.warn("❌ Tidak ada tombol unduh ditemukan.");
      return;
    }

    buttons.forEach((btn, index) => {
      setTimeout(() => {
        btn.click();
        console.log(`⬇️ Gambar ${index + 1} diunduh.`);
      }, index * 300); // delay agar tidak tabrakan
    });
  }
});


      // Step 4: Tunggu sisa interval
      if (i < prompts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, (intervalSec - 2) * 1000));
      }
    }

    console.log("✅ Semua prompt selesai.");
    return true;
  }
});
