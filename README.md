## Inspiration  
I’ve always loved trivia games that challenge your memory and knowledge of famous quotes and phrases. I wanted to take that concept further and make it more exciting by using AI to generate dynamic and unique challenges. I was inspired to create something that feels fresh, fun, and tests players in categories they enjoy—whether it’s music, movies, books, or even poetry.

## What it does  
Legendary Lines Game is an AI-powered trivia game where players identify the source of iconic phrases and can earn extra points by guessing the year it was said. The game covers categories like songs, movies, famous people, fictional characters, books, and more. Players get more points for harder categories and can double their score by correctly guessing the year and the triple for guessing the Director for movies, Artist/Band for songs or Author for books —but they also risk losing points if they’re wrong!

I created my own points-based compensation system from my imagination. Since it's easier to remember phrases from songs and movies than from books and other sources, the app rewards you with more points for choosing more challenging categories like books. This encourages better memory retention and a greater challenge.

## How we built it  
I used **React** to build the user interface for a seamless and engaging experience. The backend leverages **AWS Lambda functions** to handle API requests, connected through **API Gateway** for routing and communication. I used **S3** for storing game-related data and assets, and I also integrated **Amazon Q Developer** and **Q Framework** to manage interactions with GPT-4 for generating trivia content and providing phrase hints. This combination ensures that the game runs smoothly with low latency and scalability.

## Challenges we ran into  
One of the biggest challenges was ensuring the GPT-4 responses stayed relevant and aligned with the game format. I had to refine prompts and manage response validation to avoid phrases that were too obscure or ambiguous. Another challenge was optimizing the Lambda functions and handling timeouts, especially when handling multiple API calls. Integrating Amazon Q Developer in a way that felt responsive and natural also took some iteration.

## Accomplishments that we're proud of  
I’m proud of how intuitive and fun the game feels! The integration between the UI and backend is seamless, and players get an immersive experience. I’m also proud of successfully using AWS services like S3, Lambda, and API Gateway to build a robust, scalable game. Another accomplishment was making the gameplay highly customizable with flexible categories and scoring options.

## What we learned  
I learned a lot about designing efficient Lambda functions and optimizing API Gateway routes for faster performance. I also improved my skills in working with GPT-4, understanding how to fine-tune prompts for better results. Additionally, I gained a deeper understanding of the Amazon Q Developer tools and how they can enhance AI-driven applications. 

## What's next for Legendary Lines Game  
The next step is to add multiplayer support, allowing players to challenge friends or compete in live leaderboards. I also want to introduce custom game modes where users can suggest their own favorite phrases to the game. Additionally, I plan to improve personalization, allowing the AI to adjust the difficulty level based on each player’s performance history. Finally, I aim to expand the categories to include pop culture trends, historical speeches, and even fun regional sayings!
