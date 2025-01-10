import React, { useState, useEffect } from 'react';
import MagicalQuestionCard from './MagicalQuestionCard';
import InputModal from './InputModal';
import { getPhrase, checkAnswer } from '../services/aiService';
import '../styles/Game.css';

const CATEGORIES = {
  SONG: { name: 'Song', points: 1 },
  MOVIE: { name: 'Movie', points: 2 },
  FAMOUS_PERSON: { name: 'Famous Person', points: 3 },
  FICTIONAL_CHARACTER: { name: 'Fictional Character', points: 3 },
  BOOK: { name: 'Book', points: 4 },
  POET: { name: 'Poet', points: 5 },
  QUOTE: { name: 'Quote', points: 6 }
};

const Game = ({ difficulty, numberOfRounds }) => {
  // State declarations
  const [currentPhrase, setCurrentPhrase] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(1);
  const [triggerEffect, setTriggerEffect] = useState(0);
  const [showResult, setShowResult] = useState(null);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [currentQuestionType, setCurrentQuestionType] = useState('source');
  const [phraseData, setPhraseData] = useState(null);
  const [previousScore, setPreviousScore] = useState(0);

  // Add new states for the conversation flow
  const [playerNickname, setPlayerNickname] = useState('');
  const [gamePhase, setGamePhase] = useState('greeting');
  const [aiMessage, setAiMessage] = useState('');

  // Add new states for bonus question flow
  const [isAwaitingBonusConfirmation, setIsAwaitingBonusConfirmation] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

  useEffect(() => {
    // Initial greeting
    setAiMessage("👋 Hello, brilliant player! Welcome to 🎭 Legendary Lines Game ❗\n" +
                 "Ready to test your memory and wit? Let's dive into a world of words and wonders!\n" +
                 "🦹‍♀️ Choose an epic alias for your adventure!");
    setShowAnswerModal(true);
  }, []);

  const handlePlayerInput = async (input) => {
    switch(gamePhase) {
      case 'greeting':
        setPlayerNickname(input);
        setGamePhase('playing');
        setAiMessage(`Welcome, ${input}! 🌟\nWhat category would you like to play for Round 1?`);
        setShowAnswerModal(false);
        break;

      case 'playing':
        if (!phraseData) {
          await handleCategorySelect(input.toUpperCase());
        } else {
          try {
            // If waiting for bonus confirmation, handle yes/no response
            if (isAwaitingBonusConfirmation) {
              // Create a special entry for the bonus question
              const bonusQuestion = {
                type: 'bonus_question',
                questionType: currentQuestionType,
                playerAnswer: input
              };
              
              const result = await checkAnswer(
                input, 
                'yes', // The "correct" answer would be yes for wanting to continue
                'bonus_confirmation',
                [...conversationHistory, bonusQuestion]
              );

              if (result.isBonusResponse) {
                if (result.isCorrect) {
                  setIsAwaitingBonusConfirmation(false);
                  const promptMessage = currentQuestionType === 'year' 
                    ? "Enter the year..." 
                    : `Enter the ${selectedCategory === 'MOVIE' ? 'director' : 'artist'}...`;
                  setAiMessage(promptMessage);
                } else {
                  setAiMessage(`Alright! You keep your points for this round. 🎯`);
                  setTimeout(() => handleNextRound(), 2000);
                }
              }
              return;
            }

            // Store the current score before updating it
            setPreviousScore(score);
            
            // Normal answer validation flow
            const correctAnswer = currentQuestionType === 'creator' 
              ? phraseData.additionalInfo.creator 
              : phraseData[currentQuestionType];

            const result = await checkAnswer(
              input, 
              correctAnswer, 
              currentQuestionType,
              conversationHistory
            );
            
            if (result.isCorrect) {
              const pointsEarned = calculatePoints(selectedCategory, currentQuestionType);
              setScore(prev => prev + pointsEarned);
              setStreak(prev => prev + 1);
            }
            
            handleAnswerResult(result);
          } catch (error) {
            console.error('Error checking answer:', error);
            setAiMessage('Sorry, there was an error checking your answer. Please try again.');
          }
        }
        break;
    }
  };

  const handleAnswerResult = (result) => {
    if (result.isCorrect) {
      const feedbackMessage = result.feedback || '🎉 Correct!';
      
      if (currentQuestionType === 'source') {
        setAiMessage(`${feedbackMessage}\n\nWould you like to try guessing the year for double points? (Yes/No)`);
        setIsAwaitingBonusConfirmation(true);
        setTriggerEffect(prev => prev + 1);
        setCurrentQuestionType('year');
      } else if (currentQuestionType === 'year' && 
                 (selectedCategory === 'MOVIE' || selectedCategory === 'SONG' || selectedCategory === 'BOOK')) {
        const creatorType = {
          'MOVIE': 'director',
          'SONG': 'artist',
          'BOOK': 'author'
        }[selectedCategory];
        
        setAiMessage(`${feedbackMessage}\n\nWould you like to try guessing the ${creatorType} for triple points? (Yes/No)`);
        setIsAwaitingBonusConfirmation(true);
        setTriggerEffect(prev => prev + 1);
        setCurrentQuestionType('creator');
      } else {
        setAiMessage(`${feedbackMessage}`);
        setTimeout(() => handleNextRound(), 2000);
      }

      // Update conversation history
      updateConversationHistory(result.feedback, true);
    } else {
      handleIncorrectAnswer(result.feedback);
      updateConversationHistory(result.feedback, false);
    }
  };

  // Update the conversation history function to include more context
  const updateConversationHistory = (feedback, wasCorrect) => {
    const newEntry = {
      round,
      category: selectedCategory,
      questionType: currentQuestionType,
      wasCorrect,
      feedback,
      isAwaitingBonus: isAwaitingBonusConfirmation,
      timestamp: new Date().toISOString()
    };
    setConversationHistory(prev => [...prev, newEntry]);
  };

  const handleCategorySelect = async (category) => {
    // Check if category was already played in conversation history
    const categoryPlayed = conversationHistory.some(
      entry => entry.category === category
    );

    setSelectedCategory(category);
    try {
      const data = await getPhrase(category, difficulty, categoryPlayed ? conversationHistory : undefined);
      setPhraseData(data);
      setAiMessage(`🎭 Here's your ${category.toLowerCase()} phrase:\n\n"${data.phrase}"\n\n🤔 Can you tell me the source?`);
      setTriggerEffect(prev => prev + 1);
      setCurrentQuestionType('source');
      setIsAwaitingBonusConfirmation(false);
      setTimeout(() => {
        setShowAnswerModal(true);
      }, 1000);
    } catch (error) {
      console.error('Error fetching phrase:', error);
      setAiMessage('😅 Oops! Had trouble fetching a phrase. Try another category!');
    }
  };

  const getPromptForPhase = (phase, questionType) => {
    switch (phase) {
      case 'greeting':
        return 'Enter your nickname...';
      case 'playing':
        switch (questionType) {
          case 'source':
            return 'Enter the source...';
          case 'year':
            return 'Enter the year...';
          case 'creator':
            switch (selectedCategory) {
              case 'MOVIE':
                return 'Enter the director...';
              case 'SONG':
                return 'Enter the artist/band...';
              case 'BOOK':
                return 'Enter the author...';
              default:
                return 'Enter the creator...';
            }
          default:
            return 'Enter your answer...';
        }
      default:
        return 'Enter your response...';
    }
  };

  const handleNextRound = () => {
    if (round < numberOfRounds) {
      setPreviousScore(score); // Update previousScore before next round
      setRound(prev => prev + 1);
      setSelectedCategory(null);
      setCurrentQuestionType('source');
      setPhraseData(null);
      setCurrentPhrase(null);
      setAiMessage(`Alright ${playerNickname}, let's move to round ${round + 1}! Choose your category.`);
    } else {
      // Game Over
      const finalMessage = score === (numberOfRounds * 6) ? // Maximum possible score
        `💯🎆🏆 Congratulations!! You are a champion!! Mission Accomplished. Your final score: ${score}!` :
        `😥 Good luck next time! You've shown great effort with a final score of ${score}.`;
      setAiMessage(finalMessage);
      setGamePhase('completed');
    }
    setShowAnswerModal(false);
  };

  const handleIncorrectAnswer = (feedback) => {
    const correctAnswer = currentQuestionType === 'creator' 
      ? phraseData.additionalInfo.creator 
      : phraseData[currentQuestionType];
      
    setAiMessage(`🙁 ${feedback || 'Sorry, that\'s not correct.'}\nThe correct answer was: ${correctAnswer}`);
    setTriggerEffect(prev => prev + 1);
    setScore(prev => Math.max(0, prev - CATEGORIES[selectedCategory].points));
    setStreak(0);
    setTimeout(() => {
      handleNextRound();
    }, 3000);
  };

  const calculatePoints = (category, questionType) => {
    let points = CATEGORIES[category].points;
    if (questionType === 'year') points *= 2;
    if (questionType === 'creator') points *= 3;
    return points;
  };

  function handleInputSubmission(inputValue) {
    // Ensure inputValue is being processed correctly
    if (inputValue) {
        // Logic to send inputValue to the AI
        console.log("My input value is:", inputValue);
        handlePlayerInput(inputValue);
    } else {
        console.error("Input value is empty");
    }
  }

  // In your Game component, add logic to determine when a round is complete
  const isRoundComplete = (category, currentScore, previousScore) => {
    const pointsEarned = currentScore - previousScore;
    
    // For songs, movies, and books (categories with 3 levels)
    if (['SONG', 'MOVIE', 'BOOK'].includes(category)) {
      return pointsEarned === 6; // Base (1) + Year (2) + Creator (3) = 6 points
    }
    
    // For other categories (2 levels)
    return pointsEarned === 3; // Base (1) + Year (2) = 3 points
  };

  // JSX Return
  return (
    <div className="game-container">
      <div className="game-header">
        <div>Round: {round}/{numberOfRounds}</div>
        <div>Score: {score}</div>
        <div>Streak: {streak}</div>
      </div>

      <MagicalQuestionCard 
        message={aiMessage}
        triggerEffect={triggerEffect}
        isRoundComplete={isRoundComplete(selectedCategory, score, previousScore)}
      />

      <InputModal 
        isOpen={showAnswerModal}
        onSubmit={handleInputSubmission}
        prompt={getPromptForPhase(gamePhase, currentQuestionType)}
      />

      {gamePhase === 'playing' && (
        <div className="category-selector">
          <h3>Available Categories:</h3>
          <div className="category-buttons">
            {Object.entries(CATEGORIES).map(([key, value]) => (
              <button
                key={key}
                className={`category-btn ${selectedCategory === key ? 'selected' : ''}`}
                onClick={() => handleCategorySelect(key)}
              >
                {value.name}
                <span className="points">({value.points} pts)</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;