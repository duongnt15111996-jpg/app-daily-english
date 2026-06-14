import { fetchVocabularyWord, WordDetails } from './api';

export type { WordDetails };

interface DatamuseWord {
  word: string;
  score: number;
}

const RANDOM_QUERIES = ['life', 'work', 'nature', 'society', 'time', 'people', 'world', 'mind'];

export async function fetchTopicWords(query: string | null, count: number): Promise<string[]> {
  const q = query ?? RANDOM_QUERIES[Math.floor(Math.random() * RANDOM_QUERIES.length)];
  const url = `https://api.datamuse.com/words?ml=${encodeURIComponent(q)}&max=${count}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Datamuse API error: ${res.status}`);
  const data: DatamuseWord[] = await res.json();
  return data.map(d => d.word);
}

export async function fetchWordDetails(word: string): Promise<WordDetails | null> {
  return fetchVocabularyWord(word);
}
