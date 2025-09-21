import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Form, Button, ListGroup } from 'react-bootstrap';

interface Answer {
  text: string;
  weight: number;
}

interface Question {
  text: string;
  answers: Answer[];
}

const Admin: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswers, setNewAnswers] = useState([{ text: '', weight: 0 }]);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    const response = await axios.get('/api/questions');
    setQuestions(response.data);
  };

  const handleAddAnswer = () => {
    setNewAnswers([...newAnswers, { text: '', weight: 0 }]);
  };

  const handleAnswerChange = (index: number, field: string, value: string) => {
    const updatedAnswers = [...newAnswers];
    if (field === 'text') {
      updatedAnswers[index].text = value;
    } else {
      updatedAnswers[index].weight = parseInt(value, 10);
    }
    setNewAnswers(updatedAnswers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const question: Question = {
      text: newQuestion,
      answers: newAnswers,
    };
    await axios.post('/api/questions', question);
    fetchQuestions();
    setNewQuestion('');
    setNewAnswers([{ text: '', weight: 0 }]);
  };

  return (
    <Container>
      <h1>Admin Panel</h1>
      <Form onSubmit={handleSubmit}>
        <Form.Group>
          <Form.Label>Question</Form.Label>
          <Form.Control
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
          />
        </Form.Group>
        {newAnswers.map((answer, index) => (
          <div key={index}>
            <Form.Group>
              <Form.Label>Answer {index + 1}</Form.Label>
              <Form.Control
                type="text"
                value={answer.text}
                onChange={(e) => handleAnswerChange(index, 'text', e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Weight</Form.Label>
              <Form.Control
                type="number"
                value={answer.weight}
                onChange={(e) => handleAnswerChange(index, 'weight', e.target.value)}
              />
            </Form.Group>
          </div>
        ))}
        <Button type="button" onClick={handleAddAnswer}>
          Add Answer
        </Button>
        <Button type="submit">Add Question</Button>
      </Form>
      <hr />
      <h2>Existing Questions</h2>
      <ListGroup>
        {questions.map((q, i) => (
          <ListGroup.Item key={i}>
            <strong>{q.text}</strong>
            <ul>
              {q.answers.map((a, j) => (
                <li key={j}>
                  {a.text} ({a.weight})
                </li>
              ))}
            </ul>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Container>
  );
};

export default Admin;
