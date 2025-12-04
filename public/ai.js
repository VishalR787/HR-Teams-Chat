// --- Drawer open/close ---
const drawer = document.getElementById('assistantDrawer');
const openBtn = document.getElementById('openAssistant');
const closeBtn = document.getElementById('closeAssistant');

function openDrawer()  { drawer.style.right = '0'; }
function closeDrawer() { drawer.style.right = '-420px'; }

openBtn?.addEventListener('click', openDrawer);
closeBtn?.addEventListener('click', closeDrawer);

// --- Elements ---
const inputEl = document.getElementById('assistInput');
const outEl   = document.getElementById('assistOut');
const whyEl   = document.getElementById('assistWhy');
const runBtn  = document.getElementById('assistRun');
const useBtn  = document.getElementById('assistUse');
const copyBtn = document.getElementById('assistCopy');
const modeSel = document.getElementById('assistMode');
const toneSel = document.getElementById('assistTone');
const roleSel = document.getElementById('assistRole');
const replyStyleSel = document.getElementById('assistReplyStyle'); // (chat|email) optional
const formatSel     = document.getElementById('assistFormat');     // (paragraph|bullets) optional
const hrMsgTextbox  = document.getElementById('assistHrMsg');      // optional “HR message” box


// where the normal chat message is typed
const chatInput = document.getElementById('messageInput'); // already exists in your UI

async function runAssist() {
  const draft = (inputEl.value || '').trim();
  if (!draft) { outEl.value = ''; return; }

  outEl.value = 'Thinking…';
  whyEl.textContent = '';

  // --- Optional: local style hint so results change even if server ignores `role`
  const role = (roleSel?.value || 'employee');
  const roleHints = {
    employee: "Write as an employee messaging HR: polite, concise, responsible.",
    hr:       "Write as an HR representative replying to an employee: empathetic, clear, policy-aware.",
    peer:     "Write as a friendly coworker: supportive, straightforward, collaborative."
  };
  const guidedDraft = `${roleHints[role]}\n\n${draft}`;

  try {
    const r = await fetch('/api/ai/assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        
        hrMessage: "",              // keep or wire to an optional “HR message” box
        draft,
        mode: modeSel.value,        // polish | simplify | ask_clarify | …
        tone: toneSel.value,        // neutral | formal | friendly
        replyStyle: 'chat',         // or 'email' if you add a toggle
        length: 'short',
        format: 'paragraph'
      })


    });
    if (!r.ok) {
      const txt = await r.text();
      outEl.value = `Error: ${txt}`;
      return;
    }
    const data = await r.json();
    outEl.value = (data.final || '').trim();
  } catch (e) {
    outEl.value = `Error: ${e.message || e}`;
  }
}


runBtn?.addEventListener('click', runAssist);

// paste into chat input
useBtn?.addEventListener('click', () => {
  if (!chatInput) return;
  chatInput.value = outEl.value || '';
  closeDrawer();
  chatInput.focus();
});

// copy to clipboard
copyBtn?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(outEl.value || '');
    whyEl.textContent = 'Copied!';
    setTimeout(() => (whyEl.textContent = ''), 1200);
  } catch {}
});

// quick key: Ctrl+Enter to run
inputEl?.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') runAssist();
});
