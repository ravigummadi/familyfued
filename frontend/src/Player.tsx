import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Form, Button, ListGroup, Card, Row, Col } from 'react-bootstrap';

interface Answer {
  text: string;
  weight: number;
}

interface Question {
  text: string;
  answers: Answer[];
}

interface GameState {
  question: Question | null;
  revealed_answers: Answer[];
  score: number;
  strikes: number;
}

const Player: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [guess, setGuess] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      fetchGameState();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchGameState = async () => {
    const response = await axios.get('/api/game/state');
    setGameState(response.data);
  };

  const handleNextQuestion = async () => {
    await axios.get('/api/game/next-question');
    fetchGameState();
  };

  const handleGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    await axios.post('/api/game/guess', { text: guess });
    setGuess('');
    fetchGameState();
  };

  return (
    <Container>
      <Row className="my-4">
        <Col>
          <Button onClick={handleNextQuestion}>Next Question</Button>
        </Col>
      </Row>
      {gameState && gameState.question && (
        <Card>
          <Card.Header as="h2">{gameState.question.text}</Card.Header>
          <Card.Body>
            <ListGroup>
              {gameState.question.answers.map((answer, index) => (
                <ListGroup.Item key={index}>
                  {gameState.revealed_answers.find(a => a.text === answer.text) ? (
                    <span>
                      {answer.text} - {answer.weight}
                    </span>
                  ) : (
                    <span>--------------------</span>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
            <Row className="mt-4">
              <Col>
                <h3>Score: {gameState.score}</h3>
              </Col>
              <Col>
                <h3>Strikes: {gameState.strikes}</h3>
              </Col>
            </Row>
            <Form onSubmit={handleGuess} className="mt-4">
              <Form.Group>
                <Form.Control
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="Enter your guess"
                />
              </Form.Group>
              <Button type="submit">Guess</Button>
            </Form>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default Player;
