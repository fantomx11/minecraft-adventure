interface EditorHeaderProps {
  notice: string | null;
  onSave: () => void;
  onOpenModal: () => void;
  onReset: () => void;
}

export function EditorHeader({ notice, onSave, onOpenModal, onReset }: EditorHeaderProps) {
  return (
    <header class="editor-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <a href="./index.html" class="pixel-btn">
          ← BACK TO GAME
        </a>
        <span style={{ color: 'var(--pixel-yellow)', fontSize: '18px', fontWeight: 'bold' }}>
          NARRATIVE EDITOR
        </span>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {notice && <span style={{ color: 'var(--pixel-green)', fontSize: '12px' }}>{notice}</span>}
        <button type="button" class="pixel-btn btn-primary" onClick={onSave}>
          SAVE CHANGES
        </button>
        <button type="button" class="pixel-btn" onClick={onOpenModal}>
          IMPORT / EXPORT
        </button>
        <button type="button" class="pixel-btn btn-danger" onClick={onReset}>
          RESET BUILT-IN
        </button>
      </div>
    </header>
  );
}