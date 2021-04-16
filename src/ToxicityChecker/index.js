const fetch = require('node-fetch');

const STRATEGIES = {
  'TFIDF': '6f575112-9ca6-11eb-aefd-de79e166b688',
  'bert 30k': '49fb832a-9dfa-11eb-b2b9-8697a6fa86bd',
  'disilBert 30k': '03279852-9d6a-11eb-a90b-8697a6fa86bd'
};

const PATH_AI_LAB = 'https://predict-ailab.uruit.com/text/classification/predict';

const WEIGHTS = {
  'TFIDF': 0.2,
  'bert 30k': 0.6,
  'disilBert 30k': 0.2,
};

const attachStrategy = (obj, strategy) => ({...obj, strategy})

const pickBestOption = (arrayResponses) => {
  const weights = Object.values(WEIGHTS);
  console.log(JSON.stringify(arrayResponses));
  const [first, mainExperiment, last] = arrayResponses;
  return {
    ...mainExperiment,
    strategy: 'bert 30k',
    discarded: [
      attachStrategy(first, 'TFIDF'),
      attachStrategy(last, 'disilBert 30k')
    ]
  }
}

module.exports = async (message) => {

  // Please call all the sugested models and log it answers to choose the right one
  try {
    const promises = Object.values(STRATEGIES).map(async (experiment) => {
      const result = await fetch(`${PATH_AI_LAB}/${experiment}`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "text": message })
      });

      return result.json();
    });

    const responses = await Promise.all(promises);
    return pickBestOption(responses);
  } catch (e) {
    console.log('something went wrong', e);
    return null;
  }

}