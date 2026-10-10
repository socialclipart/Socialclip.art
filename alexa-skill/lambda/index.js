// Alexa-Skill "Social Clip": leitet gesprochene Fragen an Claude weiter
// und liest die Antwort vor. Läuft als Alexa-hosted Skill oder AWS Lambda.

const Alexa = require('ask-sdk-core');
const Anthropic = require('@anthropic-ai/sdk');

// Alexa wartet höchstens 8 Sekunden auf eine Antwort. Deshalb: kurzer
// Timeout, keine automatischen Wiederholungen und niedriger Denkaufwand.
const client = new Anthropic({ timeout: 7000, maxRetries: 0 });

const MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5-5';
const EFFORT = process.env.CLAUDE_EFFORT || 'low';
const MAX_HISTORY_TURNS = 6; // so viele Frage/Antwort-Paare merkt sich der Skill

const SYSTEM_PROMPT = `Du bist der Sprachassistent von SocialClip (socialclip.art) und antwortest über ein Amazon-Alexa-Gerät.
Deine Antwort wird vorgelesen, nicht angezeigt. Deshalb:
- Antworte auf Deutsch, freundlich und natürlich gesprochen.
- Halte dich kurz: meist zwei bis vier Sätze. Nur wenn ausdrücklich nach Details gefragt wird, darfst du länger antworten.
- Kein Markdown, keine Aufzählungszeichen, keine Emojis, keine Links oder Tabellen.
- Schreibe Zahlen und Abkürzungen so, dass sie gut vorgelesen werden können.`;

const REPROMPT = 'Möchtest du noch etwas wissen?';

// Macht Claudes Text vorlesbar: Markdown raus, SSML-Sonderzeichen maskieren.
function toSpeech(text) {
  const plain = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[*_#`>|]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  const escaped = plain.replace(/&/g, ' und ').replace(/</g, ' ').replace(/>/g, ' ');
  return escaped.length > 7500 ? `${escaped.slice(0, 7500)} …` : escaped;
}

async function askClaude(question, history) {
  const messages = [...history, { role: 'user', content: question }];

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    output_config: { effort: EFFORT },
    // Lehnt das Modell aus Sicherheitsgründen ab, springt serverseitig
    // automatisch ein passendes Ersatzmodell ein.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    messages,
  });

  if (response.stop_reason === 'refusal') {
    return { text: 'Dabei kann ich leider nicht helfen. Frag mich gerne etwas anderes.', ok: false };
  }

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join(' ')
    .trim();

  return { text: text || 'Darauf habe ich gerade keine Antwort.', ok: Boolean(text) };
}

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Hallo, hier ist Social Clip mit Claude. Was möchtest du wissen?')
      .reprompt('Stell mir einfach eine Frage, zum Beispiel: Frage, wie schreibe ich einen guten Instagram-Post?')
      .getResponse();
  },
};

const FrageIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'FrageIntent';
  },
  async handle(handlerInput) {
    const question = Alexa.getSlotValue(handlerInput.requestEnvelope, 'anfrage');
    if (!question) {
      return handlerInput.responseBuilder
        .speak('Das habe ich nicht verstanden. Was möchtest du wissen?')
        .reprompt('Was möchtest du wissen?')
        .getResponse();
    }

    const session = handlerInput.attributesManager.getSessionAttributes();
    const history = Array.isArray(session.history) ? session.history : [];

    let answer;
    try {
      answer = await askClaude(question, history);
    } catch (error) {
      console.error('Claude-Anfrage fehlgeschlagen:', error);
      const speech = error instanceof Anthropic.APIConnectionTimeoutError
        ? 'Das dauert gerade zu lange. Stell die Frage bitte noch einmal, vielleicht etwas kürzer.'
        : 'Ich kann Claude gerade nicht erreichen. Versuch es bitte gleich noch einmal.';
      return handlerInput.responseBuilder.speak(speech).reprompt(REPROMPT).getResponse();
    }

    if (answer.ok) {
      history.push({ role: 'user', content: question }, { role: 'assistant', content: answer.text });
      session.history = history.slice(-MAX_HISTORY_TURNS * 2);
      handlerInput.attributesManager.setSessionAttributes(session);
    }

    return handlerInput.responseBuilder
      .speak(toSpeech(answer.text))
      .reprompt(REPROMPT)
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Beginne deine Frage mit „Frage“, „Sag mir“ oder „Erkläre mir“. Zum Beispiel: Erkläre mir, was ein Reel ist.')
      .reprompt('Was möchtest du wissen?')
      .getResponse();
  },
};

const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Das habe ich nicht ganz verstanden. Sag zum Beispiel: Frage, welche Hashtags passen zu Kaffee?')
      .reprompt('Was möchtest du wissen?')
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && ['AMAZON.CancelIntent', 'AMAZON.StopIntent', 'AMAZON.NavigateHomeIntent']
        .includes(Alexa.getIntentName(handlerInput.requestEnvelope));
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.speak('Bis bald!').withShouldEndSession(true).getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error('Unerwarteter Fehler:', error);
    return handlerInput.responseBuilder
      .speak('Da ist etwas schiefgelaufen. Versuch es bitte noch einmal.')
      .reprompt(REPROMPT)
      .getResponse();
  },
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    FrageIntentHandler,
    HelpIntentHandler,
    FallbackIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .withCustomUserAgent('socialclip/alexa-claude')
  .lambda();

// Für lokale Tests
exports.askClaude = askClaude;
exports.toSpeech = toSpeech;
