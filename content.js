chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "insertText") {
    const editor = document.querySelector("#prompt-textarea");

    if (!editor || editor.contentEditable !== "true") {
      sendResponse({ status: "gagal", message: "Editor tidak ditemukan atau bukan contenteditable." });
      return;
    }

    // Fokuskan elemen terlebih dahulu
    editor.focus();

    // Gunakan Selection API untuk menyisipkan teks ke ProseMirror
    const selection = window.getSelection();
    const range = document.createRange();

    range.selectNodeContents(editor);
    range.collapse(false); // posisikan di akhir

    selection.removeAllRanges();
    selection.addRange(range);

    // Gunakan execCommand sebagai fallback
    const success = document.execCommand("insertText", false, request.text);

    if (success) {
      sendResponse({ status: "sukses" });
    } else {
      sendResponse({ status: "gagal", message: "Gagal menyisipkan teks via execCommand." });
    }
  }
});
