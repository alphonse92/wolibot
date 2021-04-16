const fetch = require('node-fetch');
require('dotenv').config();
const {
  ALLOW_VOTATION
} = process.env

const STRATEGIES_NAMES = {
  TFIDF: 'TFIDF',
  BERT_300: 'bert 300',
  BERT_30K: 'bert 30k',
  DISILBERT: 'disilBert 30k'
}

const STRATEGIES = {
  [STRATEGIES_NAMES.TFIDF]: '6f575112-9ca6-11eb-aefd-de79e166b688',
  [STRATEGIES_NAMES.BERT_300]:  '30d948b8-9d4c-11eb-aa0f-521c6757c414',
  [STRATEGIES_NAMES.BERT_30K]: '49fb832a-9dfa-11eb-b2b9-8697a6fa86bd',
  [STRATEGIES_NAMES.DISILBERT]: '03279852-9d6a-11eb-a90b-8697a6fa86bd',
};

const PATH_AI_LAB = 'https://predict-ailab.uruit.com/text/classification/predict';

const PRIORITIES = {
  [STRATEGIES_NAMES.TFIDF]: 0.4,
  [STRATEGIES_NAMES.BERT_300]: 0.4,
  [STRATEGIES_NAMES.BERT_30K]: 0.6,
  [STRATEGIES_NAMES.DISILBERT]: 0.5,
};

const mapByName = array => {
  return array.reduce((accum , current) => {
    const {confidence_score, processing_time, result} = current;

    accum[current.strategy] = {
      processing_time,
      confidence_score,
      result,
    };
    return accum
  }, {})
}

const useDefaultOption = arrayResponses => {
  const defaultOption = arrayResponses.find(currentResponse =>  currentResponse.strategy === STRATEGIES_NAMES.BERT_30K)
  return {
    ...defaultOption,
    votation: mapByName(arrayResponses)
  }
};


const pickBestOption = (arrayResponses) => {
  if(!ALLOW_VOTATION) return useDefaultOption(arrayResponses);

  const toxicOptions = arrayResponses
    .filter(item => item.result === 'TOXIC')
    .sort((objA, objB) => {
      return objA.confidence_score - objB.confidence_score
    });

  if (toxicOptions.length >= 2) {
    const {mostImportant, mostWeight} = toxicOptions.reduce((accum, current) => {
      const {strategy, confidence_score} = current;
      if(!accum.mostImportant){
        accum.mostImportant = current;
      }

      if (!accum.mostWeight) {
        accum.mostWeight = confidence_score;
      }

      const accumPriority = PRIORITIES[accum.mostImportant.strategy];
      const currentPriority = PRIORITIES[strategy];
      if(currentPriority >= accumPriority) {
        accum.mostImportant = current;
      }

      if(accum.mostWeight < confidence_score){
        accum.mostWeight = confidence_score;
      }

      return accum;
    }, {});

    return {
      ...mostImportant,
      confidence_score: mostWeight,
      votation: mapByName(arrayResponses)
    }
  }

  return useDefaultOption(arrayResponses);
}

module.exports = async (message) => {

  // Please call all the sugested models and log it answers to choose the right one
  try {
    const promises = Object.keys(STRATEGIES).map(async (strategyName) => {

      const result = await fetch(`${PATH_AI_LAB}/${STRATEGIES[strategyName]}`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "text": message })
      });

      const data = await result.json();
      return {
        ...data,
        strategy: strategyName
      };
    });

    const responses = await Promise.all(promises);
    return pickBestOption(responses);
  } catch (e) {
    console.log('something went wrong', e);
    return null;
  }

}