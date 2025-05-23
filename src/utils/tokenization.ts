export interface Token {
  text: string;
  isWord: boolean;
}

export function tokenizeContent(content: string): Token[] {
  const regex = /([a-zA-ZÀ-ÿ]+['']?[a-zA-ZÀ-ÿ]*)|([^a-zA-ZÀ-ÿ]+)/g;
  const matches = content.match(regex) || [];
  
  return matches.map(match => ({
    text: match,
    isWord: /^[a-zA-ZÀ-ÿ]+['']?[a-zA-ZÀ-ÿ]*$/.test(match)
  }));
}

export function getSentenceContext(tokens: Token[], currentWordIndex: number): string {
  const words = tokens.filter(token => token.isWord);
  const currentWord = words[currentWordIndex];
  
  // Find the token index of the current word
  const tokenIndex = tokens.findIndex(token => 
    token.isWord && token.text === currentWord.text
  );
  
  let startIndex = tokenIndex;
  let endIndex = tokenIndex;
  
  // Look backwards for sentence start (period, exclamation, question mark)
  while (startIndex > 0) {
    const token = tokens[startIndex - 1];
    if (/[.!?]/.test(token.text)) {
      break;
    }
    startIndex--;
  }
  
  // Look forwards for sentence end
  while (endIndex < tokens.length - 1) {
    const token = tokens[endIndex + 1];
    if (/[.!?]/.test(token.text)) {
      endIndex = endIndex + 1;
      break;
    }
    endIndex++;
  }
  
  // Join the tokens to form the sentence
  return tokens.slice(startIndex, endIndex + 1)
    .map(token => token.text)
    .join('')
    .trim();
}

export function getCompositionColor(score: number | undefined): string {
  if (score === undefined) return 'text-gray-700';
  const red = Math.round(255 * (1 - score));
  const green = Math.round(255 * score);
  return `rgb(${red}, ${green}, 0)`;
}

export function getNGram(tokens: Token[], currentWordIndex: number): string {
  const words = tokens.filter(token => token.isWord);
  const remainingWords = words.length - currentWordIndex;
  const gramSize = Math.min(3, remainingWords);
  
  return words.slice(currentWordIndex, currentWordIndex + gramSize)
    .map(word => word.text)
    .join(' ');
} 