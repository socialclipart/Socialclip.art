// Alexa-Skill "Social Clip": leitet gesprochene Fragen an Google Gemini weiter
// und liest die Antwort vor. Läuft als Alexa-hosted Skill oder AWS Lambda.

const Alexa = require('ask-sdk-core');
const { GoogleGenAI, ApiError } = require('@google/genai');

const TIMEOUT_MS = 7000;

// Alexa wartet höchstens 8 Sekunden auf eine Antwort. Deshalb: kurzer
// Timeout und keine automatischen Wiederholungen.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { timeout: TIMEOUT_MS, retryOptions: { attempts: 1 } },
});

// Ein Flash-Modell ist schnell und im kostenlosen Kontingent enthalten.
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const MAX_HISTORY_TURNS = 6; // so viele Frage/Antwort-Paare merkt sich der Skill

const SYSTEM_PROMPT = `Du bist der Sprachassistent von SocialClip (socialclip.art) und antwortest über ein Amazon-Alexa-Gerät.
Deine Antwort wird vorgelesen, nicht angezeigt. Deshalb:
- Antworte auf Deutsch, freundlich und natürlich gesprochen.
- Halte dich kurz: meist zwei bis vier Sätze. Nur wenn ausdrücklich nach Details gefragt wird, darfst du länger antworten.
- Kein Markdown, keine Aufzählungszeichen, keine Emojis, keine Links oder Tabellen.
- Schreibe Zahlen und Abkürzungen so, dass sie gut vorgelesen werden können.`;

const REPROMPT = 'Möchtest du noch etwas wissen?';

// Macht den KI-Text vorlesbar: Markdown raus, SSML-Sonderzeichen maskieren.
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

async function askGemini(question, history) {
  const contents = [...history, { role: 'user', parts: [{ text: question }] }]
    .map((turn) => ({ role: turn.role, parts: turn.parts }));

  const response = await ai.models.generateContent({
    model: MODEL,
    contents,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      maxOutputTokens: 2000,
    },
  });

  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason === 'SAFETY' || response.promptFeedback?.blockReason) {
    return { text: 'Dabei kann ich leider nicht helfen. Frag mich gerne etwas anderes.', ok: false };
  }

  const text = (response.text || '').trim();
  return { text: text || 'Darauf habe ich gerade keine Antwort.', ok: Boolean(text) };
}

// Fehlermeldung, die Alexa vorliest, passend zur Ursache.
function errorSpeech(error) {
  if (error instanceof ApiError && error.status === 429) {
    return 'Das kostenlose Tageskontingent ist gerade aufgebraucht. Versuch es bitte später noch einmal.';
  }
  if (error instanceof ApiError && (error.status === 400 || error.status === 403)) {
    return 'Der Gemini-Schlüssel oder das Modell ist nicht richtig eingerichtet. Schau bitte in die Anleitung.';
  }
  if (error?.name === 'AbortError' || /timeout|timed out|aborted/i.test(String(error?.message))) {
    return 'Das dauert gerade zu lange. Stell die Frage bitte noch einmal, vielleicht etwas kürzer.';
  }
  return 'Ich kann die KI gerade nicht erreichen. Versuch es bitte gleich noch einmal.';
}

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Hallo, hier ist Social Clip. Was möchtest du wissen?')
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
      answer = await askGemini(question, history);
    } catch (error) {
      console.error('Gemini-Anfrage fehlgeschlagen:', error);
      return handlerInput.responseBuilder.speak(errorSpeech(error)).reprompt(REPROMPT).getResponse();
    }

    if (answer.ok) {
      history.push(
        { role: 'user', parts: [{ text: question }] },
        { role: 'model', parts: [{ text: answer.text }] },
      );
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
  .withCustomUserAgent('socialclip/alexa-gemini')
  .lambda();

// Für lokale Tests
exports.askGemini = askGemini;
exports.toSpeech = toSpeech;
