import { SpaCyToken } from '../types/tokenization';

export interface TargetTokenIdentifier {
  start_char: number; // Corresponds to SpaCyToken.start
  end_char: number;   // Corresponds to SpaCyToken.end
}

// --- Internal Helper Functions using token.children and token.head ---

function getChildTokenObjects(parentToken: SpaCyToken, sentenceTokens: SpaCyToken[]): SpaCyToken[] {
  if (!parentToken.children || parentToken.children.length === 0) {
    return [];
  }
  const actualChildren: SpaCyToken[] = [];
  for (const childText of parentToken.children) {
    const potentialChildren = sentenceTokens.filter(t => t.text === childText);
    for (const pc of potentialChildren) {
      // Verify this child points back to the parent
      if (pc.head === parentToken.text && pc.head_pos === parentToken.pos) {
        actualChildren.push(pc);
      }
    }
  }
  // Ensure uniqueness based on start offset, as a simple de-duplication
  return Array.from(new Map(actualChildren.map(t => [t.start, t])).values());
}

function getHeadTokenObject(childToken: SpaCyToken, sentenceTokens: SpaCyToken[]): SpaCyToken | undefined {
  if (!childToken.head || (childToken.dep && childToken.dep === 'ROOT')) {
    return undefined;
  }

  const potentialHeads = sentenceTokens.filter(
    t => t.text === childToken.head && t.pos === childToken.head_pos
  );

  if (potentialHeads.length === 0) {
    return undefined;
  }
  if (potentialHeads.length === 1) {
    return potentialHeads[0];
  }
  // Disambiguate if multiple heads match by text and POS
  for (const ph of potentialHeads) {
    if (ph.children && ph.children.includes(childToken.text)) {
      return ph;
    }
  }
  // Fallback: return the first potential head if still ambiguous
  // console.warn(\`Ambiguous head for token "${childToken.text}". Found ${potentialHeads.length} potential heads.\`);
  return potentialHeads[0];
}


// --- VERB PHRASE GENERATORS ---

function verb_phrase_xcomp_ccomp_advcl_acl_mark(targetToken: SpaCyToken, sentenceTokens: SpaCyToken[]): string | null {
  const children = getChildTokenObjects(targetToken, sentenceTokens);
  for (const childClause of children) {
    if (childClause.dep && ['xcomp', 'ccomp', 'advcl', 'acl', 'acl:relcl'].includes(childClause.dep)) {
      const clauseChildren = getChildTokenObjects(childClause, sentenceTokens);
      const mark = clauseChildren.find(gc => gc.dep === 'mark');
      if (mark) {
        // Phrase: verb + mark. Sort by start position.
        const phraseTokens = [targetToken, mark].sort((a,b) => (a.start || 0) - (b.start || 0));
        return phraseTokens.map(t => t.text).join(' ');
      }
    }
  }
  return null;
}

function verb_phrase_direct_object(targetToken: SpaCyToken, sentenceTokens: SpaCyToken[]): string | null {
  const children = getChildTokenObjects(targetToken, sentenceTokens);
  const dobj = children.find(child => child.dep === 'obj'); // In UD, 'obj' is direct object
  if (dobj) {
    const phraseTokens = [targetToken, dobj].sort((a,b) => (a.start || 0) - (b.start || 0));
    return phraseTokens.map(t => t.text).join(' ');
  }
  return null;
}

function verb_phrase_particle_preposition(targetToken: SpaCyToken, sentenceTokens: SpaCyToken[]): string | null {
  const children = getChildTokenObjects(targetToken, sentenceTokens);
  const particle = children.find(child => child.dep === 'prt' || child.dep === 'compound:prt'); // 'prt' or 'compound:prt' (spaCy/Stanza)
  if (particle) {
    const phraseTokens = [targetToken, particle].sort((a,b) => (a.start || 0) - (b.start || 0));
    return phraseTokens.map(t => t.text).join(' ');
  }
  // Tightly bound prepositional child (often advmod or specific obl cases)
  const advmodPrep = children.find(child => child.dep === 'advmod' && child.pos === 'ADP');
  if (advmodPrep) {
     const phraseTokens = [targetToken, advmodPrep].sort((a,b) => (a.start || 0) - (b.start || 0));
    return phraseTokens.map(t => t.text).join(' ');
  }
  return null;
}

function verb_phrase_obl_case(targetToken: SpaCyToken, sentenceTokens: SpaCyToken[]): string | null {
    const children = getChildTokenObjects(targetToken, sentenceTokens); // Children of the verb
    const oblChildren = children.filter(child => child.dep && child.dep.startsWith('obl')); // 'obl' (oblique nominal)
    for (const obl of oblChildren) { // obl is typically a Noun
      const oblGrandChildren = getChildTokenObjects(obl, sentenceTokens); // Children of the Noun (obl)
      const caseToken = oblGrandChildren.find(gc => gc.dep === 'case' && gc.pos === 'ADP'); // Preposition
      if (caseToken) {
        // Phrase: verb + preposition (from obl's case)
        const phraseTokens = [targetToken, caseToken].sort((a,b) => (a.start || 0) - (b.start || 0));
        return phraseTokens.map(t => t.text).join(' ');
      }
    }
    return null;
}


function verb_phrase_reflexive_pronoun(targetToken: SpaCyToken, sentenceTokens: SpaCyToken[]): string | null {
  const children = getChildTokenObjects(targetToken, sentenceTokens);
  const reflexive = children.find(child =>
    (child.dep && child.dep.startsWith('expl')) || // e.g. 'expl:pv' in French for pronominal verbs
    (child.dep === 'obj' && child.lemma && ['se', 'me', 'te', 'vous', 'nous', "s'", "m'", "t'"].includes(child.lemma.toLowerCase()))
  );
  if (reflexive) {
    const phraseTokens = [targetToken, reflexive].sort((a,b) => (a.start || 0) - (b.start || 0));
    return phraseTokens.map(t => t.text).join(' ');
  }
  return null;
}

function verb_phrase_auxiliary(targetToken: SpaCyToken, sentenceTokens: SpaCyToken[]): string | null {
  // Auxiliaries are heads of the main verb in some parsing styles, or children in others.
  // Assuming they are children here as per typical dependency structures where main verb is head.
  const children = getChildTokenObjects(targetToken, sentenceTokens);
  const auxiliaries = children.filter(child => child.dep === 'aux' || child.dep === 'aux:pass');
  if (auxiliaries.length > 0) {
    const phraseTokens = [targetToken, ...auxiliaries].sort((a, b) => (a.start || 0) - (b.start || 0));
    return phraseTokens.map(t => t.text).join(' ');
  }
  // Also check if the targetToken itself is an AUX and its head is a VERB (e.g. "been running", target "been")
   if (targetToken.pos === 'AUX') {
    const head = getHeadTokenObject(targetToken, sentenceTokens);
    if (head && head.pos === 'VERB') {
        const phraseTokens = [head, targetToken].sort((a,b) => (a.start || 0) - (b.start || 0));
        return phraseTokens.map(t => t.text).join(' ');
    }
  }
  return null;
}

function verb_phrase_negation(targetToken: SpaCyToken, sentenceTokens: SpaCyToken[]): string | null {
  const children = getChildTokenObjects(targetToken, sentenceTokens);
  const negParticles = children.filter(child => child.dep === 'neg' || (child.dep === 'advmod' && child.lemma && ['pas', 'not', 'non'].includes(child.lemma.toLowerCase()) || (child.text && child.text.toLowerCase() === "n't")));
  if (negParticles.length > 0) {
    const phraseTokens = [targetToken, ...negParticles].sort((a, b) => (a.start || 0) - (b.start || 0));
    return phraseTokens.map(t => t.text).join(' ');
  }
  return null;
}

// --- NOUN PHRASE GENERATORS ---

function noun_phrase_adjectival_modifiers(targetToken: SpaCyToken, sentenceTokens: SpaCyToken[]): string | null {
  const children = getChildTokenObjects(targetToken, sentenceTokens);
  const amods = children.filter(child => child.dep === 'amod');
  if (amods.length > 0) {
    const phraseTokens = [targetToken, ...amods].sort((a, b) => (a.start || 0) - (b.start || 0));
    return phraseTokens.map(t => t.text).join(' ');
  }
  return null;
}

function noun_phrase_compound_parts(targetToken: SpaCyToken, sentenceTokens: SpaCyToken[]): string | null {
  const children = getChildTokenObjects(targetToken, sentenceTokens);
  // 'compound' for N-N compounds, 'flat' for multi-word expressions like names
  const compounds = children.filter(child => child.dep === 'compound' || child.dep === 'flat' || child.dep === 'name');
  if (compounds.length > 0) {
    const phraseTokens = [targetToken, ...compounds].sort((a, b) => (a.start || 0) - (b.start || 0));
    return phraseTokens.map(t => t.text).join(' ');
  }
  // Also check if target is part of a compound with its head
  if (targetToken.dep === 'compound' || targetToken.dep === 'flat' || targetToken.dep === 'name') {
    const head = getHeadTokenObject(targetToken, sentenceTokens);
    if (head) {
        const phraseTokens = [head, targetToken].sort((a,b) => (a.start || 0) - (b.start || 0));
        return phraseTokens.map(t => t.text).join(' ');
    }
  }
  return null;
}

function noun_phrase_nmod_preposition(targetToken: SpaCyToken, sentenceTokens: SpaCyToken[]): string | null {
  const children = getChildTokenObjects(targetToken, sentenceTokens); // Children of target Noun
  const nmods = children.filter(child => child.dep === 'nmod'); // nmod is the head of the modifying PP
  for (const nmod of nmods) { // nmod is usually a Noun
    const nmodChildren = getChildTokenObjects(nmod, sentenceTokens); // Children of the nmod Noun
    const caseToken = nmodChildren.find(nc => nc.dep === 'case' && nc.pos === 'ADP'); // Preposition
    if (caseToken) {
      // Phrase: target_noun + preposition + nmod_noun_head
      const phraseTokens = [targetToken, caseToken, nmod].sort((a,b) => (a.start || 0) - (b.start || 0));
      return phraseTokens.map(t => t.text).join(' '); // Return first one found
    }
  }
  return null;
}

function noun_phrase_acl_mark(targetToken: SpaCyToken, sentenceTokens: SpaCyToken[]): string | null {
  const children = getChildTokenObjects(targetToken, sentenceTokens);
  const acls = children.filter(child => child.dep && (child.dep === 'acl' || child.dep === 'acl:relcl'));
  for (const acl of acls) { // acl is often a VERB
    const aclChildren = getChildTokenObjects(acl, sentenceTokens);
    const mark = aclChildren.find(ac => ac.dep === 'mark'); // e.g., 'that', 'to'
    if (mark) {
      // Phrase: noun + mark
       const phraseTokens = [targetToken, mark].sort((a,b) => (a.start || 0) - (b.start || 0));
      return phraseTokens.map(t => t.text).join(' ');
    }
  }
  return null;
}

// If target_word.dep_ is 'pobj' (object of preposition) or 'obl' -> target_word + its head (the preposition)
function noun_phrase_object_of_preposition_or_obl(targetToken: SpaCyToken, sentenceTokens: SpaCyToken[]): string | null {
  // Case 1: Target is 'pobj' (object of preposition in some older tagsets or specific parsers)
  // More commonly, the preposition is the head of 'pobj' in UD, or 'obl' has a 'case' child.
  if (targetToken.dep === 'pobj') {
    const prepHead = getHeadTokenObject(targetToken, sentenceTokens);
    if (prepHead && prepHead.pos === 'ADP') {
      const phraseTokens = [prepHead, targetToken].sort((a,b) => (a.start || 0) - (b.start || 0));
      return phraseTokens.map(t => t.text).join(' ');
    }
  }
  // Case 2: Target is 'obl' (oblique nominal) - find its 'case' child (preposition)
  if (targetToken.dep && targetToken.dep.startsWith('obl')) {
     const childrenOfObl = getChildTokenObjects(targetToken, sentenceTokens);
     const caseChild = childrenOfObl.find(c => c.dep === 'case' && c.pos === 'ADP');
     if (caseChild) { // This is the preposition attached to the OBL noun
        // Phrase: preposition + target_noun (obl)
        const phraseTokens = [caseChild, targetToken].sort((a,b) => (a.start || 0) - (b.start || 0));
        return phraseTokens.map(t => t.text).join(' ');
     }
  }
  return null;
}

// --- ADJECTIVE PHRASE GENERATORS ---

function adj_phrase_adverbial_modifiers(targetToken: SpaCyToken, sentenceTokens: SpaCyToken[]): string | null {
  const children = getChildTokenObjects(targetToken, sentenceTokens);
  const advmods = children.filter(child => child.dep === 'advmod');
  if (advmods.length > 0) {
    const phraseTokens = [targetToken, ...advmods].sort((a, b) => (a.start || 0) - (b.start || 0));
    return phraseTokens.map(t => t.text).join(' ');
  }
  return null;
}

function adj_phrase_head_noun(targetToken: SpaCyToken, sentenceTokens: SpaCyToken[]): string | null {
  // target_word + its head (if the head is a NOUN)
  const head = getHeadTokenObject(targetToken, sentenceTokens);
  if (head && (head.pos === 'NOUN' || head.pos === 'PROPN' || head.pos === 'PRON')) {
    const phraseTokens = [head, targetToken].sort((a,b) => (a.start || 0) - (b.start || 0));
    return phraseTokens.map(t => t.text).join(' ');
  }
  return null;
}

function adj_phrase_obl_preposition(targetToken: SpaCyToken, sentenceTokens: SpaCyToken[]): string | null {
  // target_word + 'case' (preposition) of its oblique complement (obl) + (optionally) head of that obl
  const children = getChildTokenObjects(targetToken, sentenceTokens); // Children of the Adjective
  const obls = children.filter(child => child.dep && child.dep.startsWith('obl')); // Oblique nominals modifying the adjective
  for (const obl of obls) { // obl is a NOUN
    const oblChildren = getChildTokenObjects(obl, sentenceTokens); // Children of the OBL Noun
    const caseToken = oblChildren.find(oc => oc.dep === 'case' && oc.pos === 'ADP'); // Preposition
    if (caseToken) {
      // Phrase: Adjective + Preposition (+ Noun (obl) - rule says optionally head of obl)
      // Let's include the adjective and preposition for now. Adding obl is also an option.
      const phraseTokens = [targetToken, caseToken, obl].sort((a,b) => (a.start || 0) - (b.start || 0));
      return phraseTokens.map(t => t.text).join(' ');
    }
  }
  return null;
}

// --- ADVERB PHRASE GENERATORS ---

function adv_phrase_adverbial_modifiers(targetToken: SpaCyToken, sentenceTokens: SpaCyToken[]): string | null {
  const children = getChildTokenObjects(targetToken, sentenceTokens);
  // Adverb modifying target adverb
  const advmods = children.filter(child => child.dep === 'advmod' && child.pos === 'ADV');
  if (advmods.length > 0) {
    const phraseTokens = [targetToken, ...advmods].sort((a, b) => (a.start || 0) - (b.start || 0));
    return phraseTokens.map(t => t.text).join(' ');
  }
  return null;
}

// --- Main Phrase Generation Function ---

export function generateAllPhrases(
  sentenceTokens: SpaCyToken[],
  targetToken: SpaCyToken
): string[] {
  const phrases: (string | null)[] = [];

  if (!targetToken || !targetToken.pos || !sentenceTokens.find(t => t.start === targetToken.start && t.end === targetToken.end)) {
    console.warn("Target token is not valid, missing POS, or not found within the provided sentence tokens.");
    return [];
  }

  const pos = targetToken.pos; // Safe now due to check above

  if (pos === 'VERB' || pos === 'AUX') {
    phrases.push(verb_phrase_xcomp_ccomp_advcl_acl_mark(targetToken, sentenceTokens));
    phrases.push(verb_phrase_direct_object(targetToken, sentenceTokens));
    phrases.push(verb_phrase_particle_preposition(targetToken, sentenceTokens));
    phrases.push(verb_phrase_obl_case(targetToken, sentenceTokens));
    phrases.push(verb_phrase_reflexive_pronoun(targetToken, sentenceTokens));
    phrases.push(verb_phrase_auxiliary(targetToken, sentenceTokens));
    phrases.push(verb_phrase_negation(targetToken, sentenceTokens));
  } else if (pos === 'NOUN' || pos === 'PROPN' || pos === 'PRON') {
    phrases.push(noun_phrase_adjectival_modifiers(targetToken, sentenceTokens));
    phrases.push(noun_phrase_compound_parts(targetToken, sentenceTokens));
    phrases.push(noun_phrase_nmod_preposition(targetToken, sentenceTokens));
    phrases.push(noun_phrase_acl_mark(targetToken, sentenceTokens));
    phrases.push(noun_phrase_object_of_preposition_or_obl(targetToken, sentenceTokens));
  } else if (pos === 'ADJ') {
    phrases.push(adj_phrase_adverbial_modifiers(targetToken, sentenceTokens));
    phrases.push(adj_phrase_head_noun(targetToken, sentenceTokens));
    phrases.push(adj_phrase_obl_preposition(targetToken, sentenceTokens));
  } else if (pos === 'ADV') {
    phrases.push(adv_phrase_adverbial_modifiers(targetToken, sentenceTokens));
  }

  // Filter out nulls, empty strings, and duplicates, then sort for consistent output
  const uniquePhrases = Array.from(new Set(phrases.filter(p => p && p.trim() !== "") as string[]));
  return uniquePhrases.sort();
} 