import { Passage, Question } from '../models/placement.model';

/**
 * Banque de questions « English » (v1, sans IA). Items répartis sur les 6
 * niveaux CEFR et les 5 sections. Le moteur adaptatif choisit, dans chaque
 * section, l'item non utilisé dont le niveau est le plus proche de l'estimation
 * courante — la difficulté augmente/diminue donc selon les réponses.
 *
 * Pour ajouter une langue : dupliquer ce fichier et indexer par code langue.
 */

export const PASSAGES: Passage[] = [
  {
    id: 'p-a2-market',
    level: 'A2',
    title: 'A Saturday at the Market',
    text:
      'Every Saturday, Maria goes to the market near her house. She likes to buy ' +
      'fresh fruit and vegetables. The market opens at eight o’clock and closes at ' +
      'two in the afternoon. Maria usually arrives early because the best tomatoes ' +
      'sell quickly. Her favourite seller, Mr. Lopez, always saves a basket of ' +
      'strawberries for her. After shopping, Maria drinks a coffee at a small café ' +
      'and reads her book before walking home.',
  },
  {
    id: 'p-b1-remote',
    level: 'B1',
    title: 'Working from Home',
    text:
      'When the company first allowed staff to work from home, many employees were ' +
      'worried they would feel isolated. In practice, most found that they were able ' +
      'to concentrate better without the constant interruptions of the office. ' +
      'However, the change also brought new challenges. Some people struggled to ' +
      'separate their work from their personal life, answering emails late into the ' +
      'evening. The managers eventually agreed that clear boundaries—such as fixed ' +
      'working hours—were essential for the arrangement to succeed.',
  },
  {
    id: 'p-b2-tourism',
    level: 'B2',
    title: 'The Cost of Popularity',
    text:
      'Over the past decade, several historic cities have become victims of their own ' +
      'success. As the number of visitors has soared, local residents have found ' +
      'themselves priced out of the housing market, with apartments converted into ' +
      'short-term rentals. While tourism undeniably generates revenue, critics argue ' +
      'that the benefits rarely reach ordinary citizens. A growing movement now calls ' +
      'for stricter regulation, contending that without intervention the very ' +
      'character that attracts visitors will gradually be eroded.',
  },
];

export const QUESTIONS: Question[] = [
  // ─────────────────────────── Section 1 — Grammar ───────────────────────────
  { id: 'g-a1-1', section: 'grammar', level: 'A1', type: 'fill-blank', tag: 'Verb tenses',
    prompt: 'She ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], answer: 1,
    explanation: 'Third person singular present simple takes “-es”.' },
  { id: 'g-a1-2', section: 'grammar', level: 'A1', type: 'fill-blank', tag: 'Articles',
    prompt: 'I have ___ apple and a banana.', options: ['a', 'an', 'the', '—'], answer: 1 },
  { id: 'g-a2-1', section: 'grammar', level: 'A2', type: 'fill-blank', tag: 'Verb tenses',
    prompt: 'Yesterday we ___ a great film at the cinema.', options: ['see', 'saw', 'seen', 'seeing'], answer: 1 },
  { id: 'g-a2-2', section: 'grammar', level: 'A2', type: 'fill-blank', tag: 'Prepositions',
    prompt: 'The meeting is ___ Monday morning.', options: ['in', 'at', 'on', 'by'], answer: 2 },
  { id: 'g-b1-1', section: 'grammar', level: 'B1', type: 'fill-blank', tag: 'Conditionals',
    prompt: 'If it ___ tomorrow, we will stay at home.', options: ['rains', 'will rain', 'rained', 'would rain'], answer: 0,
    explanation: 'First conditional: if + present simple, will + base verb.' },
  { id: 'g-b1-2', section: 'grammar', level: 'B1', type: 'fill-blank', tag: 'Present perfect',
    prompt: 'I ___ in this city since 2019.', options: ['live', 'lived', 'have lived', 'am living'], answer: 2 },
  { id: 'g-b2-1', section: 'grammar', level: 'B2', type: 'fill-blank', tag: 'Passive voice',
    prompt: 'The new bridge ___ last year.', options: ['was built', 'built', 'has build', 'is building'], answer: 0 },
  { id: 'g-b2-2', section: 'grammar', level: 'B2', type: 'fill-blank', tag: 'Reported speech',
    prompt: 'She said that she ___ tired.', options: ['is', 'was', 'has been', 'will be'], answer: 1 },
  { id: 'g-c1-1', section: 'grammar', level: 'C1', type: 'fill-blank', tag: 'Conditionals',
    prompt: 'Had I known about the delay, I ___ earlier.', options: ['would leave', 'would have left', 'had left', 'will leave'], answer: 1,
    explanation: 'Third conditional with inversion (“Had I known…”).' },
  { id: 'g-c1-2', section: 'grammar', level: 'C1', type: 'mcq', tag: 'Sentence structure',
    prompt: 'Choose the most natural sentence.',
    options: [
      'Not only she sings, but also dances.',
      'Not only does she sing, but she also dances.',
      'She not only sing but also dance.',
      'Not only sings she but dances also.',
    ], answer: 1 },
  { id: 'g-c2-1', section: 'grammar', level: 'C2', type: 'mcq', tag: 'Advanced structures',
    prompt: 'Select the grammatically correct sentence.',
    options: [
      'Seldom have I seen such dedication.',
      'Seldom I have seen such dedication.',
      'Seldom I saw such a dedication.',
      'Seldom seen have I such dedication.',
    ], answer: 0 },
  { id: 'g-c2-2', section: 'grammar', level: 'C2', type: 'fill-blank', tag: 'Subjunctive',
    prompt: 'The board insisted that the policy ___ reviewed immediately.',
    options: ['is', 'was', 'be', 'will be'], answer: 2,
    explanation: 'Mandative subjunctive after “insist that”.' },

  // ───────────────────────── Section 2 — Vocabulary ──────────────────────────
  { id: 'v-a1-1', section: 'vocabulary', level: 'A1', type: 'mcq', tag: 'Everyday vocabulary',
    prompt: 'You sleep in a ___.', options: ['kitchen', 'bedroom', 'garden', 'garage'], answer: 1 },
  { id: 'v-a2-1', section: 'vocabulary', level: 'A2', type: 'mcq', tag: 'Travel vocabulary',
    prompt: 'At the airport, you show your ___ before the flight.',
    options: ['receipt', 'boarding pass', 'menu', 'invoice'], answer: 1 },
  { id: 'v-a2-2', section: 'vocabulary', level: 'A2', type: 'synonym', tag: 'Everyday vocabulary',
    prompt: 'Choose the closest synonym for “happy”.', options: ['tired', 'glad', 'angry', 'busy'], answer: 1 },
  { id: 'v-b1-1', section: 'vocabulary', level: 'B1', type: 'fill-blank', tag: 'Work vocabulary',
    prompt: 'Please ___ the report by Friday so the client can review it.',
    options: ['submit', 'subtract', 'suspend', 'surround'], answer: 0 },
  { id: 'v-b1-2', section: 'vocabulary', level: 'B1', type: 'synonym', tag: 'Everyday vocabulary',
    prompt: 'Choose the closest synonym for “quick”.', options: ['rapid', 'silent', 'heavy', 'rare'], answer: 0 },
  { id: 'v-b2-1', section: 'vocabulary', level: 'B2', type: 'mcq', tag: 'Business vocabulary',
    prompt: 'The company hopes to ___ its market share next year.',
    options: ['decline', 'expand', 'apologise', 'postpone'], answer: 1 },
  { id: 'v-b2-2', section: 'vocabulary', level: 'B2', type: 'synonym', tag: 'Academic vocabulary',
    prompt: 'Choose the closest synonym for “significant”.',
    options: ['minor', 'considerable', 'temporary', 'optional'], answer: 1 },
  { id: 'v-c1-1', section: 'vocabulary', level: 'C1', type: 'synonym', tag: 'Academic vocabulary',
    prompt: 'Choose the closest synonym for “meticulous”.',
    options: ['careless', 'thorough', 'generous', 'reluctant'], answer: 1 },
  { id: 'v-c1-2', section: 'vocabulary', level: 'C1', type: 'mcq', tag: 'Business vocabulary',
    prompt: 'After long talks, the two firms reached an ___.',
    options: ['amendment', 'amenity', 'accord', 'ascent'], answer: 2 },
  { id: 'v-c2-1', section: 'vocabulary', level: 'C2', type: 'synonym', tag: 'Academic vocabulary',
    prompt: 'Choose the closest synonym for “ubiquitous”.',
    options: ['rare', 'omnipresent', 'fragile', 'ambiguous'], answer: 1 },
  { id: 'v-c2-2', section: 'vocabulary', level: 'C2', type: 'mcq', tag: 'Nuance',
    prompt: 'Her remarks were so ___ that no one could tell what she truly meant.',
    options: ['lucid', 'oblique', 'candid', 'blunt'], answer: 1 },

  // ──────────────────────── Section 3 — Reading ──────────────────────────────
  { id: 'r-a2-1', section: 'reading', level: 'A2', type: 'reading', tag: 'General understanding',
    passageId: 'p-a2-market', prompt: 'When does Maria go to the market?',
    options: ['Every day', 'Every Saturday', 'On Sundays', 'Once a month'], answer: 1 },
  { id: 'r-a2-2', section: 'reading', level: 'A2', type: 'reading', tag: 'Detailed understanding',
    passageId: 'p-a2-market', prompt: 'Why does Maria arrive early?',
    options: ['The café is busy', 'The best tomatoes sell quickly', 'The market is far', 'She likes coffee'], answer: 1 },
  { id: 'r-a2-3', section: 'reading', level: 'A2', type: 'reading', tag: 'Vocabulary in context',
    passageId: 'p-a2-market', prompt: 'In the text, a “seller” is a person who ___.',
    options: ['buys things', 'sells things', 'cooks food', 'reads books'], answer: 1 },
  { id: 'r-b1-1', section: 'reading', level: 'B1', type: 'reading', tag: 'General understanding',
    passageId: 'p-b1-remote', prompt: 'What is the main idea of the passage?',
    options: [
      'Working from home is always better',
      'Remote work has benefits but needs clear boundaries',
      'Offices should be closed permanently',
      'Employees dislike working from home',
    ], answer: 1 },
  { id: 'r-b1-2', section: 'reading', level: 'B1', type: 'reading', tag: 'Detailed understanding',
    passageId: 'p-b1-remote', prompt: 'What problem did some employees face?',
    options: [
      'They could not use computers',
      'They separated work and personal life too strictly',
      'They answered emails late into the evening',
      'They were never interrupted',
    ], answer: 2 },
  { id: 'r-b1-3', section: 'reading', level: 'B1', type: 'reading', tag: 'Context understanding',
    passageId: 'p-b1-remote', prompt: 'What did the managers conclude?',
    options: [
      'Fixed working hours help the arrangement succeed',
      'Remote work should be banned',
      'Employees should work longer hours',
      'The office is more productive',
    ], answer: 0 },
  { id: 'r-b2-1', section: 'reading', level: 'B2', type: 'reading', tag: 'General understanding',
    passageId: 'p-b2-tourism', prompt: 'What is the author’s main concern?',
    options: [
      'Cities are not popular enough',
      'Mass tourism can harm local residents and city character',
      'Hotels are too expensive for tourists',
      'Tourism produces no revenue',
    ], answer: 1 },
  { id: 'r-b2-2', section: 'reading', level: 'B2', type: 'reading', tag: 'Detailed understanding',
    passageId: 'p-b2-tourism', prompt: 'Why are residents “priced out of the housing market”?',
    options: [
      'They earn too much',
      'Apartments are converted into short-term rentals',
      'There are too few tourists',
      'The government raised salaries',
    ], answer: 1 },
  { id: 'r-b2-3', section: 'reading', level: 'B2', type: 'reading', tag: 'Vocabulary in context',
    passageId: 'p-b2-tourism', prompt: 'In context, “eroded” is closest in meaning to ___.',
    options: ['strengthened', 'worn away', 'celebrated', 'rebuilt'], answer: 1 },

  // ──────────────────────── Section 4 — Listening ────────────────────────────
  { id: 'l-a2-1', section: 'listening', level: 'A2', type: 'listening', tag: 'Understanding',
    audioScript: 'Hi, this is a message from the dentist. Your appointment is on Thursday at three o’clock. Please call us if you cannot come.',
    prompt: 'When is the appointment?', options: ['Thursday at 3 p.m.', 'Tuesday at 3 p.m.', 'Thursday at 3 a.m.', 'Wednesday at 2 p.m.'], answer: 0 },
  { id: 'l-a2-2', section: 'listening', level: 'A2', type: 'listening', tag: 'Attention to detail',
    audioScript: 'The train to Manchester leaves from platform four at half past nine. Please have your tickets ready.',
    prompt: 'Which platform does the train leave from?', options: ['Platform 9', 'Platform 4', 'Platform 14', 'Platform 5'], answer: 1 },
  { id: 'l-b1-1', section: 'listening', level: 'B1', type: 'listening', tag: 'Understanding',
    audioScript: 'Good afternoon. Unfortunately, today’s two o’clock workshop has been moved to the main hall because the small room is being repaired. The time has not changed.',
    prompt: 'What changed about the workshop?', options: ['The time', 'The location', 'The speaker', 'The topic'], answer: 1 },
  { id: 'l-b1-2', section: 'listening', level: 'B1', type: 'listening', tag: 'Context comprehension',
    audioScript: 'I’d love to join you for dinner, but I have to finish this project tonight. Could we meet tomorrow instead?',
    prompt: 'What does the speaker mean?', options: ['They will come to dinner tonight', 'They cannot come tonight but suggest tomorrow', 'They do not want to meet', 'They already finished the project'], answer: 1 },
  { id: 'l-b2-1', section: 'listening', level: 'B2', type: 'listening', tag: 'Attention to detail',
    audioScript: 'While the proposal was well received overall, the committee raised concerns about the budget and asked the team to resubmit a revised plan within two weeks.',
    prompt: 'What did the committee ask for?', options: ['A new team', 'A revised plan within two weeks', 'A bigger budget immediately', 'A different proposal topic'], answer: 1 },
  { id: 'l-b2-2', section: 'listening', level: 'B2', type: 'listening', tag: 'Context comprehension',
    audioScript: 'Honestly, the film started promisingly, but by the final act I found it rather predictable and a little too long.',
    prompt: 'What is the speaker’s overall opinion?', options: ['Entirely positive', 'Mixed, ending in disappointment', 'They did not watch it', 'It was too short'], answer: 1 },
  { id: 'l-a1-1', section: 'listening', level: 'A1', type: 'listening', tag: 'Understanding',
    audioScript: 'Hello! The shop opens at nine in the morning and closes at six in the evening, from Monday to Friday.',
    prompt: 'What time does the shop close?', options: ['Six in the evening', 'Nine in the morning', 'Five in the evening', 'Seven in the evening'], answer: 0 },
  { id: 'l-c1-1', section: 'listening', level: 'C1', type: 'listening', tag: 'Inference',
    audioScript: 'While I appreciate the committee’s enthusiasm, I’d caution against rushing the rollout; a phased approach would let us address any unforeseen issues before they affect the wider user base.',
    prompt: 'What is the speaker mainly recommending?', options: ['Launching everything at once', 'A gradual, phased rollout', 'Cancelling the project entirely', 'Ignoring the potential issues'], answer: 1 },

  // ──────────────────────── Section 5 — Language Usage ───────────────────────
  { id: 'u-a2-1', section: 'usage', level: 'A2', type: 'mcq', tag: 'Booking a hotel',
    prompt: 'At reception, the most appropriate way to ask for a room is:',
    options: ['Give me room now.', 'I’d like to book a room, please.', 'Room. You. Me.', 'Where room?'], answer: 1 },
  { id: 'u-b1-1', section: 'usage', level: 'B1', type: 'mcq', tag: 'Writing an email',
    prompt: 'You need to reschedule a meeting. The best opening line is:',
    options: [
      'Move the meeting.',
      'I’m writing to ask whether we could reschedule our meeting.',
      'Meeting changed, deal with it.',
      'Why the meeting is when?',
    ], answer: 1 },
  { id: 'u-b1-2', section: 'usage', level: 'B1', type: 'mcq', tag: 'Professional communication',
    prompt: 'A colleague helped you a lot. You reply:',
    options: ['Whatever, thanks.', 'I really appreciate your help with this.', 'It’s your job anyway.', 'No comment.'], answer: 1 },
  { id: 'u-b2-1', section: 'usage', level: 'B2', type: 'mcq', tag: 'Job interview',
    prompt: 'Asked about a weakness in an interview, the strongest answer is:',
    options: [
      'I have no weaknesses.',
      'I sometimes take on too much, so I’m learning to delegate more effectively.',
      'I’m always late.',
      'I don’t like working.',
    ], answer: 1 },
  { id: 'u-b2-2', section: 'usage', level: 'B2', type: 'mcq', tag: 'Professional communication',
    prompt: 'You must politely disagree with a client. The best phrasing is:',
    options: [
      'That’s wrong.',
      'I see your point; however, I’d suggest a slightly different approach.',
      'No, you don’t understand.',
      'Do it my way.',
    ], answer: 1 },
  { id: 'u-c1-1', section: 'usage', level: 'C1', type: 'mcq', tag: 'Professional communication',
    prompt: 'To diplomatically decline an invitation while keeping the door open:',
    options: [
      'I can’t. Bye.',
      'I’m afraid I won’t be able to make it this time, but I’d welcome the chance to join in future.',
      'Not interested.',
      'Maybe, who knows.',
    ], answer: 1 },
];
