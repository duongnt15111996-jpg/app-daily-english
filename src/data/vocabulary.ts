import { VocabularyWord } from '../constants/types';

export const VOCABULARY_WORDS: VocabularyWord[] = [
  { id: 'v1', word: 'Communication', pronunciation: '/kəˌmjuːnɪˈkeɪʃn/', partOfSpeech: 'noun', definition: 'The act of sharing information between people', example: 'Good communication is essential in any relationship.', topicId: 'daily-conversations', topicName: 'Daily Life' },
  { id: 'v2', word: 'Journey', pronunciation: '/ˈdʒɜːni/', partOfSpeech: 'noun', definition: 'An act of travelling from one place to another', example: 'The journey from London to Paris takes about two hours by train.', topicId: 'travel-english', topicName: 'Travel' },
  { id: 'v3', word: 'Achievement', pronunciation: '/əˈtʃiːvmənt/', partOfSpeech: 'noun', definition: 'A thing done successfully with effort and skill', example: 'Winning the championship was a great achievement for the team.', topicId: 'daily-conversations', topicName: 'Daily Life' },
  { id: 'v4', word: 'Opportunity', pronunciation: '/ˌɒpəˈtjuːnɪti/', partOfSpeech: 'noun', definition: 'A time or set of circumstances that makes it possible to do something', example: 'This internship is a great opportunity to learn new skills.', topicId: 'business-english', topicName: 'Business' },
  { id: 'v5', word: 'Experience', pronunciation: '/ɪkˈspɪəriəns/', partOfSpeech: 'noun', definition: 'Practical contact with and observation of facts or events', example: 'She has ten years of experience working in marketing.', topicId: 'business-english', topicName: 'Business' },
  { id: 'v6', word: 'Conversation', pronunciation: '/ˌkɒnvəˈseɪʃn/', partOfSpeech: 'noun', definition: 'An informal talk involving a small group of people', example: 'We had an interesting conversation about climate change.', topicId: 'daily-conversations', topicName: 'Daily Life' },
  { id: 'v7', word: 'Professional', pronunciation: '/prəˈfeʃənl/', partOfSpeech: 'adjective', definition: 'Relating to or connected with a profession', example: 'She gave a very professional presentation to the board.', topicId: 'business-english', topicName: 'Business' },
  { id: 'v8', word: 'Transportation', pronunciation: '/ˌtrænspoːˈteɪʃn/', partOfSpeech: 'noun', definition: 'The action of transporting someone or something', example: 'Public transportation in this city is very efficient.', topicId: 'travel-english', topicName: 'Travel' },
  { id: 'v9', word: 'Reservation', pronunciation: '/ˌrezəˈveɪʃn/', partOfSpeech: 'noun', definition: 'An arrangement to have something kept for you', example: 'I made a reservation at the restaurant for eight o\'clock.', topicId: 'travel-english', topicName: 'Travel' },
  { id: 'v10', word: 'Fluent', pronunciation: '/ˈfluːənt/', partOfSpeech: 'adjective', definition: 'Able to express yourself clearly and easily', example: 'After two years of practice, she became fluent in Spanish.', topicId: 'daily-conversations', topicName: 'Daily Life' },
  { id: 'v11', word: 'Negotiate', pronunciation: '/nɪˈɡəʊʃieɪt/', partOfSpeech: 'verb', definition: 'To try to reach an agreement through discussion', example: 'We need to negotiate the terms of the contract before signing.', topicId: 'business-english', topicName: 'Business' },
  { id: 'v12', word: 'Itinerary', pronunciation: '/aɪˈtɪnərəri/', partOfSpeech: 'noun', definition: 'A planned route or journey', example: 'Please review the travel itinerary before departure.', topicId: 'travel-english', topicName: 'Travel' },
];

export const getWordsByTopic = (topicId: string) =>
  VOCABULARY_WORDS.filter(w => w.topicId === topicId);
