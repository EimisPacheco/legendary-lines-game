import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true  // Added for development
});

const DIFFICULTY_MODIFIERS = {
  EASY: {
    popularity: "well-known",
    description: "commonly recognized phrases",
    temperature: 0.7
  },
  MEDIUM: {
    popularity: "moderately known",
    description: "somewhat challenging phrases",
    temperature: 0.8
  },
  HARD: {
    popularity: "obscure",
    description: "rare and challenging phrases",
    temperature: 0.9
  }
};

export const getPhrase = async (category = 'QUOTE', difficulty = 'MEDIUM', conversationHistory = null) => {
  // Add default category if none is selected
  if (!category) {
    console.warn('No category provided, using default: QUOTE');
    category = 'QUOTE';
  }

  const difficultyConfig = DIFFICULTY_MODIFIERS[difficulty];
  
  try {
    const systemMessage = {
      role: "system",
      content: `You are a game master for 'Legendary Lines'. Generate ${difficultyConfig.popularity} content for the ${category} category. Focus on ${difficultyConfig.description}.`
    };

    const userMessage = {
      role: "user",
      content: `Generate a ${difficulty.toLowerCase()} difficulty ${category.toLowerCase()} phrase.`
    };

    // Add conversation history context if available
    const messages = [systemMessage];
    if (conversationHistory) {
      messages.push({
        role: "system",
        content: `Previous game history: ${JSON.stringify(conversationHistory)}`
      });
    }
    messages.push(userMessage);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      functions: [{
        name: "generatePhrase",
        description: "Generate a phrase or quote for the game based on category and difficulty",
        parameters: {
          type: "object",
          properties: {
            phrase: {
              type: "string",
              description: "The actual quote or phrase to be guessed"
            },
            source: {
              type: "string",
              description: "The origin of the phrase (book title, movie name, etc.)"
            },
            year: {
              type: "number",
              description: "The year the source was released/published"
            },
            hint: {
              type: "string",
              description: "A subtle hint without giving away the answer"
            },
            additionalInfo: {
              type: "object",
              properties: {
                creator: {
                  type: "string",
                  description: "Director (for movies), Artist/Band (for songs), or Author (for books)"
                },
                genre: {
                  type: "string",
                  description: "The genre of the source material"
                }
              }
            }
          },
          required: ["phrase", "source", "year", "hint"]
        }
      }],
      function_call: { name: "generatePhrase" }
    });

    const functionCall = completion.choices[0].message.function_call;
    return JSON.parse(functionCall.arguments);
  } catch (error) {
    console.error('Error generating phrase:', error);
    throw error;
  }
};

export const checkAnswer = async (playerAnswer, correctAnswer, answerType = 'source', conversationHistory = []) => {
  try {
    const messages = [
      {
        role: "system",
        content: `You are validating answers for the Legendary Lines game. 
                 For bonus round questions (about guessing year/creator):
                 1. First validate if the player wants to attempt the bonus (yes/no/sure vs. no/pass/skip)
                 2. Only if they agree, then validate their actual guess
                 3. If they decline, acknowledge their choice to keep current points
                 Previous conversation context: ${JSON.stringify(conversationHistory)}`
      },
      {
        role: "user",
        content: `Question type: ${answerType}
                 Player's answer: "${playerAnswer}"
                 Correct answer: "${correctAnswer}"
                 Context: ${
                   answerType.includes('bonus_confirmation') 
                   ? "This is a response to whether they want to attempt the bonus round" 
                   : "This is an actual answer attempt"
                 }`
      }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      functions: [{
        name: "validateAnswer",
        description: "Validate player's answer against the correct source or their intent for bonus questions",
        parameters: {
          type: "object",
          properties: {
            isCorrect: {
              type: "boolean",
              description: "Whether the answer is correct or if the player wants to continue with bonus"
            },
            similarity: {
              type: "number",
              description: "How close the answer is to the correct one (0-1)"
            },
            feedback: {
              type: "string",
              description: "Helpful feedback about why the answer was right or wrong"
            },
            isBonusResponse: {
              type: "boolean",
              description: "Whether this was a response to a bonus question prompt"
            },
            bonusDeclined: {
              type: "boolean",
              description: "Whether the player has declined to attempt the bonus round"
            }
          },
          required: ["isCorrect", "feedback", "isBonusResponse"]
        }
      }],
      function_call: { name: "validateAnswer" }
    });

    const functionCall = completion.choices[0].message.function_call;
    return JSON.parse(functionCall.arguments);
  } catch (error) {
    console.error('Error validating answer:', error);
    throw error;
  }
}; 