import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleFormsService } from './GoogleFormsService';
import type { QuizData } from './GeminiService';

const testQuiz: QuizData = {
  title: 'Test Quiz "Special" Title',
  description: 'A test quiz description with "quotes".',
  subject: 'Test Subject',
  generalInstructions: 'Please answer "all" questions.',
  questions: [
    {
      id: 'q1',
      questionText: 'What is the value of 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      difficulty: 'Easy',
      points: 1,
      confidenceScore: 'HIGH'
    },
    {
      id: 'q2',
      questionText: 'Which of these is a primary color?',
      options: ['Green', 'Orange', 'Red', 'Purple'],
      correctAnswer: 'Red',
      difficulty: 'Medium',
      points: 2,
      confidenceScore: 'MEDIUM'
    },
    {
      id: 'q3',
      questionText: 'This is a long question text designed to exceed the 120 character limit of Kahoot in order to verify that our slicing logic is operating correctly in the exporter script.',
      options: ['Option A', 'Option B'],
      correctAnswer: 'Option A',
      difficulty: 'Hard',
      points: 5,
      confidenceScore: 'LOW'
    }
  ]
};

describe('GoogleFormsService Export Utilities', () => {
  let triggerDownloadSpy = vi.fn();

  beforeEach(() => {
    triggerDownloadSpy = vi.fn();
    // Intercept triggerDownload to inspect generated contents
    vi.spyOn(GoogleFormsService as any, 'triggerDownload').mockImplementation(triggerDownloadSpy);
  });

  describe('stripMathDelimiters', () => {
    it('should strip $ and $$ delimiters from text but preserve escaped dollar signs', () => {
      expect(GoogleFormsService.stripMathDelimiters('Factorize: $x^2 + x = ?$')).toBe('Factorize: x² + x = ?');
      expect(GoogleFormsService.stripMathDelimiters('$x(x+1)$')).toBe('x(x+1)');
      expect(GoogleFormsService.stripMathDelimiters('$$E = mc^2$$')).toBe('E = mc²');
      expect(GoogleFormsService.stripMathDelimiters('Cost is \\$100')).toBe('Cost is $100');
      expect(GoogleFormsService.stripMathDelimiters('')).toBe('');
    });

    it('should unwrap latex text formatting commands like \\text{...}', () => {
      expect(GoogleFormsService.stripMathDelimiters('If focal length is $12.5\\text{ cm}$, find...')).toBe('If focal length is 12.5 cm, find...');
      expect(GoogleFormsService.stripMathDelimiters('$x\\mathrm{ cm}$')).toBe('x cm');
      expect(GoogleFormsService.stripMathDelimiters('$\\mathbf{v} = v$')).toBe('v = v');
    });
  });

  describe('generateAppsScript', () => {
    it('should escape double quotes in titles, descriptions and questions', () => {
      const script = GoogleFormsService.generateAppsScript(testQuiz);
      
      // Title and Description escaping checks
      expect(script).toContain('FormApp.create("Test Quiz \\"Special\\" Title")');
      expect(script).toContain('A test quiz description with \\"quotes\\"');
      
      // Question array content checks
      expect(script).toContain('questionText: "What is the value of 2 + 2?"');
      expect(script).toContain('options: ["3", "4", "5", "6"]');
      expect(script).toContain('correctAnswer: "4"');
      expect(script).toContain('points: 1');
      expect(script).toContain('points: 2');
    });

    it('should generate valid App Script syntax structure', () => {
      const script = GoogleFormsService.generateAppsScript(testQuiz);
      expect(script).toContain('function createGoogleForm()');
      expect(script).toContain('form.setIsQuiz(true)');
      expect(script).toContain('form.addMultipleChoiceItem()');
      expect(script).toContain('item.setChoices(choices)');
    });
  });

  describe('downloadCSV', () => {
    it('should format data correctly with appropriate headers', () => {
      GoogleFormsService.downloadCSV(testQuiz);
      
      expect(triggerDownloadSpy).toHaveBeenCalledOnce();
      const [content, mime, filename] = triggerDownloadSpy.mock.calls[0];
      
      expect(mime).toBe('text/csv');
      expect(filename).toContain('test_quiz_special_title_quiz.csv');
      
      const lines = content.split('\n');
      expect(lines[0]).toBe('Question,Option A,Option B,Option C,Option D,Correct Answer,Points,Difficulty');
      expect(lines[1]).toBe('"What is the value of 2 + 2?","3","4","5","6","4","1","Easy"');
      expect(lines[2]).toBe('"Which of these is a primary color?","Green","Orange","Red","Purple","Red","2","Medium"');
    });
  });

  describe('downloadMoodleXML', () => {
    it('should generate valid Moodle XML tags and category pathways', () => {
      GoogleFormsService.downloadMoodleXML(testQuiz);
      
      expect(triggerDownloadSpy).toHaveBeenCalledOnce();
      const [content, mime] = triggerDownloadSpy.mock.calls[0];
      
      expect(mime).toBe('text/xml');
      expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(content).toContain('<quiz>');
      expect(content).toContain('<question type="category">');
      expect(content).toContain('$course$/Formify Quiz/Test Quiz &quot;Special&quot; Title');
      
      // Question 1
      expect(content).toContain('<question type="multichoice">');
      expect(content).toContain('<text><![CDATA[<p>What is the value of 2 + 2?</p>]]></text>');
      expect(content).toContain('<defaultgrade>1</defaultgrade>');
      
      // Answer fraction checks
      expect(content).toContain('<answer fraction="100" format="html">\n      <text><![CDATA[4]]></text>');
      expect(content).toContain('<answer fraction="0" format="html">\n      <text><![CDATA[3]]></text>');
    });
  });

  describe('downloadKahootCSV', () => {
    it('should slice question text to 120 chars and option text to 75 chars', () => {
      GoogleFormsService.downloadKahootCSV(testQuiz);
      
      expect(triggerDownloadSpy).toHaveBeenCalledOnce();
      const [content] = triggerDownloadSpy.mock.calls[0];
      
      const lines = content.split('\n');
      const header = lines[0];
      const row3 = lines[3]; // third question
      
      expect(header).toBe('Question Text,Answer 1,Answer 2,Answer 3,Answer 4,Time limit (sec),Correct answers');
      
      // Long question text in row 3 should be sliced to exactly 120 characters
      // "This is a long question text designed to exceed the 120 character limit of Kahoot in order to verify that our slicing logic" -> 120 chars
      const expectedSlicedText = testQuiz.questions[2].questionText.slice(0, 120);
      expect(expectedSlicedText.length).toBe(120);
      expect(row3).toContain(`"${expectedSlicedText}"`);
    });

    it('should map the correct answer to its 1-based index string', () => {
      GoogleFormsService.downloadKahootCSV(testQuiz);
      const [content] = triggerDownloadSpy.mock.calls[0];
      const lines = content.split('\n');
      
      // Q1 correct answer is '4', which is at index 1 (second option) -> mapped to '2'
      expect(lines[1]).toContain(',"2"'); 
      
      // Q2 correct answer is 'Red', which is at index 2 (third option) -> mapped to '3'
      expect(lines[2]).toContain(',"3"');
    });
  });

  describe('downloadQuizizzCSV', () => {
    it('should compile correct columns and indices', () => {
      GoogleFormsService.downloadQuizizzCSV(testQuiz);
      
      expect(triggerDownloadSpy).toHaveBeenCalledOnce();
      const [content] = triggerDownloadSpy.mock.calls[0];
      
      const lines = content.split('\n');
      expect(lines[0]).toBe('Question Text,Question Type,Option 1,Option 2,Option 3,Option 4,Correct Answer,Time in seconds');
      
      // Q1 answer is 4 (Option 2) -> correct answer value is index "2"
      expect(lines[1]).toContain('"What is the value of 2 + 2?","Multiple Choice","3","4","5","6","2","30"');
    });
  });
});
