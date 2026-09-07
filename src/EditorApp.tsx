// src/EditorApp.tsx
import { useState } from 'preact/hooks';
import {
  STORY_PASSAGES,
  CUSTOM_STORY_STORAGE_KEY,
  validateNarrative,
} from './data/storyPassages';
import { Passage, PassageChoice } from './types/narrative';
import { EditorHeader } from './components/editor/EditorHeader';
import { PassageSidebar } from './components/editor/PassageSidebar';
import { PassageForm } from './components/editor/PassageForm';
import { JsonTransferModal } from './components/editor/JSonTransferModal';

export function EditorApp() {
  const [passages, setPassages] = useState<Record<string, Passage>>(() => {
    const raw = localStorage.getItem(CUSTOM_STORY_STORAGE_KEY);
    if (raw) {
      try {
        const validated = validateNarrative(JSON.parse(raw));
        if (validated) return validated;
      } catch {}
    }
    return JSON.parse(JSON.stringify(STORY_PASSAGES));
  });

  const [selectedId, setSelectedId] = useState<string>(() => Object.keys(passages)[0] || 'start');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const flashNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleSaveToStorage = () => {
    localStorage.setItem(CUSTOM_STORY_STORAGE_KEY, JSON.stringify(passages, null, 2));
    flashNotice('Saved to local storage!');
  };

  const handleUpdatePassage = <K extends keyof Passage>(key: K, value: Passage[K]) => {
    setPassages((prev) => ({
      ...prev,
      [selectedId]: { ...prev[selectedId], [key]: value },
    }));
  };

  const handleUpdateChoice = (idx: number, updated: Partial<PassageChoice>) => {
    const choices = [...passages[selectedId].choices];
    choices[idx] = { ...choices[idx], ...updated };
    handleUpdatePassage('choices', choices);
  };

  const handleAddChoice = () => {
    const choices = [
      ...passages[selectedId].choices,
      { text: 'New Choice Option', targetPassageId: selectedId },
    ];
    handleUpdatePassage('choices', choices);
  };

  const handleRemoveChoice = (idx: number) => {
    const choices = passages[selectedId].choices.filter((_, i) => i !== idx);
    handleUpdatePassage('choices', choices);
  };

  return (
    <div class="app-root editor-root">
      <EditorHeader
        notice={notice}
        onSave={handleSaveToStorage}
        onOpenModal={() => setModalOpen(true)}
        onReset={() => {
          if (confirm('Reset to built-in story?')) {
            setPassages(JSON.parse(JSON.stringify(STORY_PASSAGES)));
            setSelectedId('start');
            localStorage.removeItem(CUSTOM_STORY_STORAGE_KEY);
            flashNotice('Reset complete.');
          }
        }}
      />

      <div class="editor-container">
        <PassageSidebar
          passages={passages}
          selectedId={selectedId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectPassage={setSelectedId}
          onAddPassage={() => {
            let count = Object.keys(passages).length + 1;
            while (passages[`passage_${count}`]) count++;
            const id = `passage_${count}`;
            setPassages({
              ...passages,
              [id]: { id, title: 'New Passage', text: '', choices: [] },
            });
            setSelectedId(id);
          }}
        />

        <main>
          {passages[selectedId] && (
            <PassageForm
              passage={passages[selectedId]}
              allPassageIds={Object.keys(passages)}
              onUpdatePassage={handleUpdatePassage}
              onUpdateChoice={handleUpdateChoice}
              onAddChoice={handleAddChoice}
              onRemoveChoice={handleRemoveChoice}
              onDeletePassage={(id) => {
                const copy = { ...passages };
                delete copy[id];
                setPassages(copy);
                setSelectedId(Object.keys(copy)[0]);
              }}
              onRenameId={(newId) => {
                if (passages[newId]) return alert('ID already exists');
                const copy = { ...passages };
                copy[newId] = { ...copy[selectedId], id: newId };
                delete copy[selectedId];
                setPassages(copy);
                setSelectedId(newId);
              }}
            />
          )}
        </main>
      </div>

      <JsonTransferModal
        isOpen={modalOpen}
        passages={passages}
        onClose={() => setModalOpen(false)}
        onApply={(loaded) => {
          setPassages(loaded);
          setSelectedId(Object.keys(loaded)[0] || 'start');
          flashNotice('Narrative imported!');
        }}
      />
    </div>
  );
}