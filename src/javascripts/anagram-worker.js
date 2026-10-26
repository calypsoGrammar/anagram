import { findCandidateWords, findExactAnagramSets } from "./anagram-search.js";

let dictionary = [];

self.onmessage = async ({ data }) => {
  if (data.type === "load") {
    try {
      const response = await fetch(data.path);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      dictionary = (await response.text()).split("\n");
      self.postMessage({ type: "loaded", id: data.id, size: dictionary.length });
    } catch (error) {
      self.postMessage({ type: "error", id: data.id, message: String(error) });
    }
    return;
  }

  if (data.type === "search") {
    try {
      const words = findCandidateWords(data.target, dictionary);
      self.postMessage({ type: "words", id: data.id, words });
      const result = findExactAnagramSets(data.target, words, {
        onProgress: (progress) => self.postMessage({ type: "progress", id: data.id, ...progress }),
      });
      self.postMessage({ type: "sets", id: data.id, ...result });
    } catch (error) {
      self.postMessage({ type: "error", id: data.id, message: String(error) });
    }
  }
};
