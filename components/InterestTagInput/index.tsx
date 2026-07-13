'use client';

import { useState } from 'react';

const SUGGESTIONS = ['Música', 'Futebol', 'Culinária', 'Cinema', 'Leitura', 'Viagens', 'Tecnologia', 'Fotografia', 'Esportes', 'Natureza'];

interface InterestTagInputProps {
  value: string;
  onChange: (value: string) => void;
}

function splitInterests(value: string) {
  return value
    .split(',')
    .map((interest) => interest.trim())
    .filter(Boolean);
}

export default function InterestTagInput({ value, onChange }: InterestTagInputProps) {
  const [draft, setDraft] = useState('');
  const interests = splitInterests(value);

  function addInterest(rawInterest: string) {
    const interest = rawInterest.trim().replace(/,+$/, '').trim();
    if (!interest || interests.some((item) => item.localeCompare(interest, 'pt-BR', { sensitivity: 'accent' }) === 0)) {
      setDraft('');
      return;
    }
    onChange([...interests, interest].join(', '));
    setDraft('');
  }

  function removeInterest(interest: string) {
    onChange(interests.filter((item) => item !== interest).join(', '));
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="interests" className="text-xs font-medium text-body">
        Interesses
      </label>
      <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-[10px] border border-line bg-card px-3 py-2 focus-within:border-brand">
        {interests.map((interest) => (
          <span key={interest} className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-dark">
            {interest}
            <button
              type="button"
              onClick={() => removeInterest(interest)}
              aria-label={`Remover ${interest}`}
              className="ml-0.5 text-brand-dark/70 hover:text-danger"
            >
              ×
            </button>
          </span>
        ))}
        <input
          id="interests"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === 'Tab' || e.key === ',') && draft.trim()) {
              e.preventDefault();
              addInterest(draft);
            }
          }}
          placeholder={interests.length ? 'Adicionar interesse' : 'Escreva um interesse'}
          className="h-7 min-w-40 flex-1 bg-transparent text-sm text-body outline-none placeholder:text-muted"
        />
      </div>
      <p className="text-xs text-muted">Escreva e pressione Enter ou Tab para adicionar.</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {SUGGESTIONS.filter((suggestion) => !interests.some((item) => item.localeCompare(suggestion, 'pt-BR', { sensitivity: 'accent' }) === 0)).map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => addInterest(suggestion)}
            className="text-brand hover:text-brand-dark hover:underline"
          >
            + {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
