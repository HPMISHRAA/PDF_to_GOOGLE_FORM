import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Settings,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Info,
  ExternalLink,
  RotateCcw,
  Eye,
  BookOpen,
  HelpCircle,
  FileSpreadsheet,
  Compass,
  Sparkles,
  Cpu,
  Layers,
  Tv
} from 'lucide-react';
import { GeminiService } from './services/GeminiService';
import type { QuizData, Question } from './services/GeminiService';
import { GoogleFormsService } from './services/GoogleFormsService';

export const isValidImage = (img: any): img is string => {
  if (typeof img !== 'string') return false;
  const trimmed = img.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return false;
  return trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/');
};

export const autoWrapMath = (text: string): string => {
  if (!text) return text;

  // If the text is already wrapped in $ or $$ (contains $), let's not touch it
  if (text.includes('$')) {
    return text;
  }

  const trimmed = text.trim();
  
  // Case 1: The entire string is a LaTeX set notation like \{...\} or starts with a backslash command
  if (
    (trimmed.startsWith('\\{') && trimmed.endsWith('\\}')) ||
    (trimmed.startsWith('\\frac') || trimmed.startsWith('\\sqrt') || trimmed.startsWith('\\pm'))
  ) {
    return `$${trimmed}$`;
  }

  let processed = text;

  // 1. Wrap equations (like x^2 - 13x + 8 = 0)
  processed = processed.replace(/(?<!\$)\b([a-zA-Z][\^_][0-9a-zA-Z]+(?:\s*[\+\-\*\/\=]\s*[a-zA-Z0-9]+)*\s*\=\s*[0-9]+)\b(?!\$)/g, (match) => {
    return `$${match}$`;
  });

  // 2. Wrap LaTeX commands: e.g. \alpha, \beta, \alpha^4, \beta^4
  processed = processed.replace(/(?<!\$)(\\([a-zA-Z]+)(?:\{[^{}]*\}|\[[^[\]]*\])*|\\[\\{}])(?:[\^_]\{?[0-9a-zA-Z+\-]*\}?)?(?!\$)/g, (match) => {
    return `$${match}$`;
  });

  // 3. Wrap single exponent variables: e.g. x^2
  processed = processed.replace(/(?<!\$)\b([a-zA-Z])([\^_]\{?[0-9a-zA-Z+\-]*\}?)(?!\$)/g, (match) => {
    return `$${match}$`;
  });

  return processed;
};

interface MathTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

export const MathText: React.FC<MathTextProps> = ({ text, className, style }) => {
  if (!text) return null;

  // Auto-wrap any missed LaTeX delimiters
  const preparedText = autoWrapMath(text);

  // Split by block math ($$...$$) or inline math ($...$)
  const parts = preparedText.split(/(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g).filter(part => part !== '');
  
  const renderedElements = parts.map((part, index) => {
    // Check if block math
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const math = part.slice(2, -2);
      try {
        const katexHTML = (window as any).katex 
          ? (window as any).katex.renderToString(math, { displayMode: true, throwOnError: false })
          : math;
        return (
          <span 
            key={index} 
            className="math-block-wrapper" 
            dangerouslySetInnerHTML={{ __html: katexHTML }} 
            style={{ display: 'block', margin: '8px 0' }}
          />
        );
      } catch (err) {
        return <span key={index}>{part}</span>;
      }
    } 
    // Check if inline math
    else if (part.startsWith('$') && part.endsWith('$')) {
      const math = part.slice(1, -1);
      try {
        const katexHTML = (window as any).katex 
          ? (window as any).katex.renderToString(math, { displayMode: false, throwOnError: false })
          : math;
        return (
          <span 
            key={index} 
            className="math-inline-wrapper" 
            dangerouslySetInnerHTML={{ __html: katexHTML }} 
            style={{ display: 'inline-block', verticalAlign: 'middle' }}
          />
        );
      } catch (err) {
        return <span key={index}>{part}</span>;
      }
    } 
    // Plain text
    else {
      return <span key={index}>{part}</span>;
    }
  });

  return (
    <span className={className} style={{ display: 'inline', ...style }}>
      {renderedElements}
    </span>
  );
};

// Pre-populated Sample Data for Demo Mode
const sampleQuizData: QuizData = {
  title: "Computer Science Quiz - Web Fundamentals",
  description: "Test your knowledge on HTML, CSS, JavaScript, and HTTP concepts.",
  subject: "Computer Science",
  generalInstructions: "All questions are multiple-choice. Select the single best answer for each question. Each question is worth 1 point.",
  questions: [
    {
      id: "q-1",
      questionText: "Which HTTP status code represents a 'Not Found' error?",
      options: ["200 OK", "301 Moved Permanently", "404 Not Found", "500 Internal Server Error"],
      correctAnswer: "404 Not Found",
      difficulty: "Easy",
      points: 1,
      confidenceScore: "HIGH"
    },
    {
      id: "q-2",
      questionText: "What is the purpose of the 'async' attribute on a <script> tag?",
      options: [
        "It makes the script download in the background and execute immediately when downloaded, blocking HTML parsing during execution.",
        "It forces the script to execute only after the entire DOM has finished loading.",
        "It executes the script in a separate background thread (Web Worker).",
        "It pauses script execution until the user interacts with the page."
      ],
      correctAnswer: "It makes the script download in the background and execute immediately when downloaded, blocking HTML parsing during execution.",
      difficulty: "Medium",
      points: 1,
      confidenceScore: "HIGH"
    },
    {
      id: "q-3",
      questionText: "Which CSS property is used to create a glassmorphic background effect by blurring elements behind it?",
      options: ["filter: blur()", "backdrop-filter: blur()", "background-blur", "mix-blend-mode: blur()"],
      correctAnswer: "backdrop-filter: blur()",
      difficulty: "Medium",
      points: 1,
      confidenceScore: "HIGH"
    },
    {
      id: "q-4",
      questionText: "Which of the following is NOT a valid hook in React?",
      options: ["useState", "useEffect", "useContext", "useFetch"],
      correctAnswer: "useFetch",
      difficulty: "Easy",
      points: 1,
      confidenceScore: "HIGH"
    }
  ]
};

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

function App() {
  // Navigation & Config State
  const [step, setStep] = useState<'config' | 'upload' | 'editor' | 'export'>('config');
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'editor' | 'simulator'>('editor');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationLanguage, setTranslationLanguage] = useState('Spanish');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkSearch, setBulkSearch] = useState('');
  const [bulkReplace, setBulkReplace] = useState('');
  const [bulkPoints, setBulkPoints] = useState(1);
  const [bulkDifficulty, setBulkDifficulty] = useState<Question['difficulty']>('Medium');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [googleClientId, setGoogleClientId] = useState('138111820315-l8vvnsnc20s78pm6368s0m6roocu59nu.apps.googleusercontent.com');
  const [geminiModel, setGeminiModel] = useState('gemini-3.5-flash');
  const [modelSelectValue, setModelSelectValue] = useState('gemini-3.5-flash');
  const [customModelName, setCustomModelName] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  // Quiz Data State
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [draftExists, setDraftExists] = useState(false);
  const [simulatorSelections, setSimulatorSelections] = useState<{ [qId: string]: string }>({});

  // Active question in workspace to scroll or highlight
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  // Background Task / File Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Direct Google Forms Export State
  const [isExportingDirect, setIsExportingDirect] = useState(false);
  const [directExportError, setDirectExportError] = useState<string | null>(null);
  const [directExportWarnings, setDirectExportWarnings] = useState<string[] | null>(null);
  const [createdForms, setCreatedForms] = useState<{ formUrl: string; editUrl: string } | null>(null);
  
  // Copy to clipboard code states
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Onboarding Guided Tour State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [showApiKeyHelp, setShowApiKeyHelp] = useState(false);
  
  // Toast Notification State
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Drag and Drop Zone Ref
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load API keys & Drafts on start
  useEffect(() => {
    const savedKey = localStorage.getItem('formify_gemini_key');
    const savedClientId = localStorage.getItem('formify_google_client_id');
    const savedDraft = localStorage.getItem('formify_quiz_draft');
    const savedModel = localStorage.getItem('formify_gemini_model') || 'gemini-3.5-flash';
    const onboardingCompleted = localStorage.getItem('formify_onboarding_completed');

    if (savedKey) setGeminiApiKey(savedKey);
    if (savedClientId) {
      setGoogleClientId(savedClientId);
    } else {
      setGoogleClientId('138111820315-l8vvnsnc20s78pm6368s0m6roocu59nu.apps.googleusercontent.com');
    }
    if (savedDraft) setDraftExists(true);
    
    setGeminiModel(savedModel);
    if (['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-3.1-pro'].includes(savedModel)) {
      setModelSelectValue(savedModel);
    } else {
      setModelSelectValue('custom');
      setCustomModelName(savedModel);
    }

    // If API Key is already configured, go straight to upload screen
    if (savedKey) {
      setStep('upload');
    }

    // Trigger onboarding on first visit
    if (onboardingCompleted !== 'true') {
      setShowOnboarding(true);
    }
  }, []);

  // Show Toast Helper
  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Save API Credentials
  const saveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiApiKey.trim()) {
      showToast('Gemini API Key is required.', 'error');
      return;
    }
    localStorage.setItem('formify_gemini_key', geminiApiKey.trim());
    localStorage.setItem('formify_gemini_model', geminiModel);
    if (googleClientId.trim()) {
      localStorage.setItem('formify_google_client_id', googleClientId.trim());
    } else {
      localStorage.removeItem('formify_google_client_id');
    }
    
    showToast('Credentials saved successfully!', 'success');
    setShowConfigModal(false);
    
    if (step === 'config') {
      setStep('upload');
    }
  };

  // Draft Autosave System
  useEffect(() => {
    if (quizData && step === 'editor') {
      const timer = setTimeout(() => {
        localStorage.setItem('formify_quiz_draft', JSON.stringify(quizData));
        showToast('Draft autosaved', 'success');
        setDraftExists(true);
      }, 1000); // Debounce saves by 1 sec
      return () => clearTimeout(timer);
    }
  }, [quizData, step]);

  // Restore Saved Draft
  const handleRestoreDraft = () => {
    const savedDraft = localStorage.getItem('formify_quiz_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft) as QuizData;
        setQuizData(parsed);
        setStep('editor');
        showToast('Draft restored successfully.', 'success');
      } catch (err) {
        showToast('Failed to load draft.', 'error');
      }
    }
  };

  // Start Fresh and clear Draft
  const handleClearDraft = () => {
    localStorage.removeItem('formify_quiz_draft');
    setDraftExists(false);
    setQuizData(null);
    if (step === 'editor') {
      setStep('upload');
    }
    showToast('Draft deleted. Starting fresh.', 'info');
  };

  // Demo Mode Activator
  const handleDemoMode = () => {
    setQuizData(JSON.parse(JSON.stringify(sampleQuizData))); // Deep clone
    setStep('editor');
    showToast('Demo Mode loaded with sample CS questions!', 'success');
  };

  // File Upload Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  // Main processing pipeline
  const processUploadedFile = async (file: File, appendMode = false) => {
    const keyToUse = geminiApiKey || localStorage.getItem('formify_gemini_key');
    if (!keyToUse) {
      showToast('Gemini API Key missing! Set it in the top settings.', 'error');
      setShowConfigModal(true);
      return;
    }

    // Validation checks
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf')) {
      showToast('Unsupported file type. Upload PDF or Images (PNG, JPG, WEBP).', 'error');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      showToast('File too large. Maximum size is 20MB.', 'error');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessingStatus('Starting parser...');

    try {
      const service = new GeminiService(keyToUse);
      const { quizData: parsedQuiz } = await service.extractMCQs(file, geminiModel, (status) => {
        setProcessingStatus(status);
      });
      
      if (appendMode && quizData) {
        setQuizData({
          ...quizData,
          questions: [...quizData.questions, ...parsedQuiz.questions]
        });
        showToast(`Extracted and added ${parsedQuiz.questions.length} new questions!`, 'success');
      } else {
        setQuizData(parsedQuiz);
        showToast('Quiz extracted successfully!', 'success');
      }
      setStep('editor');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during processing.');
      showToast('Processing failed.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Editor Actions
  const handleUpdateQuizMeta = (field: keyof QuizData, value: string) => {
    if (!quizData) return;
    setQuizData({
      ...quizData,
      [field]: value
    });
  };

  const handleUpdateQuestion = (qId: string, updatedQ: Partial<Question>) => {
    if (!quizData) return;
    setQuizData({
      ...quizData,
      questions: quizData.questions.map((q) => {
        if (q.id === qId) {
          const newQ = { ...q, ...updatedQ } as Question;
          // Ensure correct answer is synced if options change
          if (updatedQ.options && !newQ.options.includes(newQ.correctAnswer)) {
            newQ.correctAnswer = newQ.options[0] || '';
          }
          return newQ;
        }
        return q;
      })
    });
  };

  const handleDeleteQuestion = (qId: string) => {
    if (!quizData) return;
    setQuizData({
      ...quizData,
      questions: quizData.questions.filter((q) => q.id !== qId)
    });
    showToast('Question deleted', 'warning');
  };

  const handleAddQuestion = () => {
    if (!quizData) return;
    const newQ: Question = {
      id: `q-custom-${Date.now()}`,
      questionText: 'New Multiple Choice Question',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctAnswer: 'Option 1',
      difficulty: 'Medium',
      points: 1,
      confidenceScore: 'HIGH'
    };
    setQuizData({
      ...quizData,
      questions: [...quizData.questions, newQ]
    });
    setActiveQuestionId(newQ.id);
    showToast('Question added', 'success');
  };

  const handleReorderQuestion = (index: number, direction: 'up' | 'down') => {
    if (!quizData) return;
    const questions = [...quizData.questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    // Swap items
    const temp = questions[index];
    questions[index] = questions[targetIndex];
    questions[targetIndex] = temp;

    setQuizData({
      ...quizData,
      questions
    });
  };


  const handleQuestionImageUpload = (qId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Only image files are allowed for question diagrams.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      handleUpdateQuestion(qId, { image: reader.result as string });
      showToast('Image attached to question.', 'success');
    };
    reader.onerror = () => {
      showToast('Failed to read image file.', 'error');
    };
    reader.readAsDataURL(file);
  };

  // Bulk Actions & AI Translation handlers
  const handleBulkSetPoints = (pts: number) => {
    if (!quizData) return;
    setQuizData({
      ...quizData,
      questions: quizData.questions.map(q => ({ ...q, points: pts }))
    });
    showToast(`Set all questions to ${pts} points`, 'success');
  };

  const handleBulkSetDifficulty = (diff: Question['difficulty']) => {
    if (!quizData) return;
    setQuizData({
      ...quizData,
      questions: quizData.questions.map(q => ({ ...q, difficulty: diff }))
    });
    showToast(`Set all questions difficulty to ${diff}`, 'success');
  };

  const handleBulkShuffleOptions = () => {
    if (!quizData) return;
    const shuffledQuestions = quizData.questions.map(q => {
      const opts = [...q.options];
      for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opts[i], opts[j]] = [opts[j], opts[i]];
      }
      return {
        ...q,
        options: opts
      };
    });
    
    setQuizData({
      ...quizData,
      questions: shuffledQuestions
    });
    showToast('Shuffled options for all questions', 'success');
  };

  const handleBulkFindReplace = (search: string, replace: string) => {
    if (!quizData || !search) return;
    const searchReg = new RegExp(search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
    
    const updatedQuestions = quizData.questions.map(q => {
      const newText = q.questionText.replace(searchReg, replace);
      const newOptions = q.options.map(opt => opt.replace(searchReg, replace));
      const newCorrect = q.correctAnswer.replace(searchReg, replace);
      
      return {
        ...q,
        questionText: newText,
        options: newOptions,
        correctAnswer: newCorrect
      };
    });
    
    setQuizData({
      ...quizData,
      questions: updatedQuestions
    });
    showToast(`Replaced all occurrences of "${search}" with "${replace}"`, 'success');
  };

  const handleTranslateQuiz = async (lang: string) => {
    if (!quizData) return;
    const keyToUse = geminiApiKey || localStorage.getItem('formify_gemini_key');
    if (!keyToUse) {
      showToast('Gemini API Key missing! Configure it first.', 'error');
      setShowConfigModal(true);
      return;
    }
    
    setIsTranslating(true);
    showToast(`Translating quiz to ${lang}...`, 'info');
    
    try {
      const service = new GeminiService(keyToUse);
      const translatedQuiz = await service.translateQuiz(quizData, lang, geminiModel);
      setQuizData(translatedQuiz);
      showToast(`Successfully translated quiz to ${lang}!`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`Translation failed: ${err.message || 'Error'}`, 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  // Option Editors

  const handleUpdateOptionText = (qId: string, optIndex: number, newText: string) => {
    if (!quizData) return;
    const question = quizData.questions.find(q => q.id === qId);
    if (!question) return;

    const newOptions = [...question.options];
    const oldVal = newOptions[optIndex];
    newOptions[optIndex] = newText;

    // If the changed option was the correct answer, update the correct answer reference
    const wasCorrect = question.correctAnswer === oldVal;
    
    handleUpdateQuestion(qId, {
      options: newOptions,
      correctAnswer: wasCorrect ? newText : question.correctAnswer
    });
  };

  const handleAddOption = (qId: string) => {
    if (!quizData) return;
    const question = quizData.questions.find(q => q.id === qId);
    if (!question) return;

    const newOptions = [...question.options, `Option ${question.options.length + 1}`];
    handleUpdateQuestion(qId, { options: newOptions });
  };

  const handleRemoveOption = (qId: string, optIndex: number) => {
    if (!quizData) return;
    const question = quizData.questions.find(q => q.id === qId);
    if (!question) return;

    if (question.options.length <= 2) {
      showToast('A question must have at least 2 options.', 'warning');
      return;
    }

    const removedVal = question.options[optIndex];
    const newOptions = question.options.filter((_, idx) => idx !== optIndex);
    
    let correct = question.correctAnswer;
    if (correct === removedVal) {
      correct = newOptions[0];
    }

    handleUpdateQuestion(qId, {
      options: newOptions,
      correctAnswer: correct
    });
  };

  // Duplicate Check Validation
  const checkDuplicateQuestionText = (text: string, currentId: string) => {
    if (!quizData) return false;
    return quizData.questions.some(
      (q) => q.id !== currentId && q.questionText.trim().toLowerCase() === text.trim().toLowerCase()
    );
  };

  const checkDuplicateOptions = (options: string[]) => {
    const trimmed = options.map(o => o.trim().toLowerCase());
    return trimmed.some((opt, idx) => trimmed.indexOf(opt) !== idx);
  };

  // Google OAuth flow & direct form creation
  const handleGoogleAuth = () => {
    if (!googleClientId.trim()) {
      showToast('Google Cloud Client ID is missing. Add it in settings to enable direct creation.', 'error');
      setShowConfigModal(true);
      return;
    }

    setDirectExportError(null);
    setCreatedForms(null);

    const googleObj = (window as any).google;
    if (!googleObj) {
      showToast('Google API libraries not loaded. Check your internet connection.', 'error');
      return;
    }

    setIsExportingDirect(true);

    try {
      const client = googleObj.accounts.oauth2.initTokenClient({
        client_id: googleClientId.trim(),
        scope: 'https://www.googleapis.com/auth/forms.body https://www.googleapis.com/auth/drive.file',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            setDirectExportError(`Auth failed: ${tokenResponse.error_description || tokenResponse.error}`);
            setIsExportingDirect(false);
            return;
          }

          if (tokenResponse.access_token) {
            await createGoogleFormDirectly(tokenResponse.access_token);
          }
        },
        error_callback: (err: any) => {
          setDirectExportError(`Auth Error: ${err.message || 'Authorization client crashed'}`);
          setIsExportingDirect(false);
        }
      });
      client.requestAccessToken();
    } catch (err: any) {
      setDirectExportError(err.message || 'Could not initialize Google Identity Client');
      setIsExportingDirect(false);
    }
  };

  const createGoogleFormDirectly = async (token: string) => {
    if (!quizData) return;
    setDirectExportWarnings(null);
    setDirectExportError(null);
    try {
      const res = await GoogleFormsService.createFormDirectly(token, quizData, (status) => {
        setProcessingStatus(status);
      });
      setCreatedForms({ formUrl: res.formUrl, editUrl: res.editUrl });
      if (res.warnings) {
        setDirectExportWarnings(res.warnings);
        showToast('Form created with some image upload warnings.', 'warning');
      } else {
        showToast('Google Form created in your Drive!', 'success');
      }
    } catch (err: any) {
      setDirectExportError(err.message || 'Failed to create Google Form via API.');
      showToast('Direct export failed.', 'error');
    } finally {
      setIsExportingDirect(false);
    }
  };

  // Apps Script code utility
  const getGeneratedAppsScript = () => {
    if (!quizData) return '';
    return GoogleFormsService.generateAppsScript(quizData);
  };

  const copyAppsScript = () => {
    const code = getGeneratedAppsScript();
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(true);
      showToast('Apps Script code copied to clipboard!', 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  const handleCloseOnboarding = () => {
    localStorage.setItem('formify_onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  return (
    <div className="flex-column" style={{ minHeight: '100vh' }}>
      
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && <CheckCircle2 size={16} color="var(--color-success)" />}
            {toast.type === 'error' && <AlertTriangle size={16} color="var(--color-error)" />}
            {toast.type === 'warning' && <AlertTriangle size={16} color="var(--color-warning)" />}
            {toast.type === 'info' && <Info size={16} color="var(--color-accent)" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Main Sticky Header */}
      <header className="app-header">
        <div className="logo-container">
          <BookOpen className="logo-icon" size={28} color="var(--color-primary)" />
          <span className="logo-text">Formify PDF</span>
          <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>v1.0 (Beta)</span>
        </div>
        
        <div className="flex-row align-center gap-12">
          {draftExists && (
            <button className="btn-secondary" onClick={handleRestoreDraft} style={{ padding: '8px 16px', fontSize: '13px' }}>
               <RotateCcw size={14} /> Resume Draft
            </button>
          )}
          <button className="btn-secondary" onClick={() => { setOnboardingStep(1); setShowOnboarding(true); }} style={{ padding: '8px 12px' }} title="Take Guided Tour">
            <Compass size={16} /> Tour
          </button>
          <button className="btn-secondary" onClick={() => setShowInfoModal(true)} style={{ padding: '8px 12px' }}>
            <Info size={16} />
          </button>
          <button className="btn-secondary" onClick={() => setShowConfigModal(true)} style={{ padding: '8px 16px', border: '1px solid var(--color-primary-glow)' }}>
            <Settings size={16} /> Credentials
          </button>
        </div>
      </header>

      {/* Step 1: Config Screen (If API key not set) */}
      {step === 'config' && (
        <main className="config-container glass-panel">
          <div className="flex-column gap-8" style={{ textAlign: 'center', marginBottom: '10px' }}>
            <h1 style={{ fontFamily: 'var(--font-brand)', fontSize: '28px' }}>Welcome to Formify PDF</h1>
            <p style={{ color: 'var(--text-muted)' }}>
              Convert any test paper, textbook scanned PDF, or image question paper into an interactive Google Form MCQ quiz in seconds.
            </p>
          </div>

          <form onSubmit={saveCredentials} className="flex-column gap-16">
            <div className="flex-column gap-8">
              <label className="flex-row align-center gap-8" style={{ fontWeight: 600, fontSize: '14px' }}>
                Gemini API Key <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                type="password"
                placeholder="Enter your Gemini Developer API Key"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                required
              />
              <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                Don't have a key? Get a free key in 30 seconds at{' '}
                <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>
                  Google AI Studio <ExternalLink size={10} style={{ display: 'inline' }} />
                </a>.
              </p>
              <div style={{ marginTop: '2px' }}>
                <button
                  type="button"
                  onClick={() => setShowApiKeyHelp(!showApiKeyHelp)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-accent)', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>{showApiKeyHelp ? '▼' : '▶'} How to get a free Gemini API key?</span>
                </button>
                {showApiKeyHelp && (
                  <div className="glass-card" style={{ marginTop: '8px', padding: '12px', background: 'rgba(255,255,255,0.01)', fontSize: '11px', border: '1px solid var(--border-light)' }}>
                    <ol style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-muted)' }}>
                      <li>
                        Open <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>
                          Google AI Studio <ExternalLink size={8} style={{ display: 'inline' }} />
                        </a>.
                      </li>
                      <li>Click the blue <strong>"Get API key"</strong> button in the sidebar or top menu.</li>
                      <li>Click <strong>"Create API key"</strong>, select or create a project, and copy the key.</li>
                      <li>Paste the copied key into the input field above.</li>
                      <li>
                        Need help? Watch the{' '}
                        <a href="https://www.youtube.com/results?search_query=how+to+get+gemini+api+key" target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>
                          YouTube Video Guide <ExternalLink size={8} style={{ display: 'inline' }} />
                        </a>.
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-column gap-8">
              <label style={{ fontWeight: 600, fontSize: '14px' }}>Gemini AI Model</label>
              <select
                value={modelSelectValue}
                onChange={(e) => {
                  const val = e.target.value;
                  setModelSelectValue(val);
                  if (val !== 'custom') {
                    setGeminiModel(val);
                  } else {
                    setGeminiModel(customModelName || 'gemini-3.5-flash');
                  }
                }}
              >
                <option value="gemini-3.5-flash">Gemini 3.5 Flash (Recommended - Fastest & Coding-optimized)</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Standard stable)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Legacy)</option>
                <option value="gemini-3.1-pro">Gemini 3.1 Pro (Heavy reasoning)</option>
                <option value="custom">Custom Model Name...</option>
              </select>

              {modelSelectValue === 'custom' && (
                <div className="flex-column gap-8" style={{ marginTop: '8px' }}>
                  <input
                    type="text"
                    placeholder="e.g. gemini-3.5-pro"
                    value={customModelName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomModelName(val);
                      setGeminiModel(val);
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex-column gap-8">
              <label style={{ fontWeight: 600, fontSize: '14px' }}>
                Google Cloud Client ID <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Enter client_id (e.g. 12345-abcde.apps.googleusercontent.com)"
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
              />
              <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                Required ONLY if you want the app to automatically create Google Forms directly in your Drive. Create a Client ID in the{' '}
                <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>
                  Google Cloud Console
                </a>. Otherwise, you can bypass this and use the **Apps Script generator** instead!
              </p>
            </div>

            <button type="submit" className="btn-primary w-full justify-between" style={{ marginTop: '10px' }}>
              <span>Configure & Get Started</span>
              <CheckCircle2 size={16} />
            </button>
          </form>

          <div style={{ position: 'relative', textAlign: 'center', margin: '10px 0' }}>
            <span style={{ background: 'var(--bg-base)', padding: '0 15px', fontSize: '12px', color: 'var(--text-dim)' }}>OR</span>
            <hr style={{ border: '0', borderTop: '1px solid var(--border-light)', position: 'absolute', top: '50%', left: 0, right: 0, zIndex: -1 }} />
          </div>

          <div className="flex-column gap-12">
            <button onClick={handleDemoMode} className="btn-secondary w-full justify-center" style={{ borderColor: 'var(--color-accent)' }}>
              <Eye size={16} color="var(--color-accent)" /> Try App with Sample Data (Demo Mode)
            </button>
          </div>
        </main>
      )}

      {/* Step 2: Upload Zone */}
      {step === 'upload' && (
        <main className="dashboard-container">
          {isProcessing ? (
            <div className="glass-panel loader-wrapper">
              <div className="spinner"></div>
              <h3 style={{ fontFamily: 'var(--font-brand)', fontSize: '20px' }}>Analyzing Question Paper</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{processingStatus}</p>
              <div className="glowing-bar-container">
                <div className="glowing-bar"></div>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>This may take 10-30 seconds depending on page length.</p>
            </div>
          ) : (
            <div className="flex-column gap-20">
              <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontFamily: 'var(--font-brand)', fontSize: '32px' }}>Upload Question Paper</h1>
                <p style={{ color: 'var(--text-muted)' }}>
                  Upload a text PDF, scanned PDF, test paper snapshot, or handwritten quiz image.
                </p>
              </div>

              {error && (
                <div className="glass-card" style={{ border: '1px solid var(--color-error)', background: 'rgba(239,68,68,0.05)' }}>
                  <div className="flex-row gap-8 align-center" style={{ color: '#fca5a5', fontWeight: 600, marginBottom: '8px' }}>
                    <AlertTriangle size={18} />
                    <span>Extraction Error</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{error}</p>
                </div>
              )}

              <div
                className={`upload-zone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                />
                <div className="flex-column align-center gap-12">
                  <Upload size={48} color={dragActive ? 'var(--color-accent)' : 'var(--color-primary)'} />
                  <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Drag & drop your question file here</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>
                    Supports PDF, PNG, JPG, JPEG, and WEBP (Max 20MB)
                  </p>
                  <button type="button" className="btn-secondary" style={{ marginTop: '8px' }}>
                    Browse Files
                  </button>
                </div>
              </div>


              <div className="flex-row justify-between align-center glass-card" style={{ padding: '15px 24px' }}>
                <div className="flex-column">
                  <h4 style={{ fontWeight: 600 }}>Need to test features?</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Explore the Google Form simulator and download options instantly.</p>
                </div>
                <button onClick={handleDemoMode} className="btn-secondary" style={{ borderColor: 'var(--color-accent)' }}>
                  Launch Demo Mode
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* Step 3: Workspace (Editor + Simulator) */}
      {step === 'editor' && quizData && (
        <main className={`workspace-container show-${activeWorkspaceTab}`}>
          
          {/* Mobile Workspace Tabs Header */}
          <div className="mobile-workspace-tabs">
            <button
              type="button"
              onClick={() => setActiveWorkspaceTab('editor')}
              className={`mobile-tab-btn ${activeWorkspaceTab === 'editor' ? 'active' : ''}`}
            >
              Question Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveWorkspaceTab('simulator')}
              className={`mobile-tab-btn ${activeWorkspaceTab === 'simulator' ? 'active' : ''}`}
            >
              Form Preview
            </button>
          </div>
          
          {/* Left Side: Question Editor */}
          <section className="editor-pane">
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="flex-row justify-between align-center">
                <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '20px' }}>Quiz Configuration</h2>
                <div className="flex-row gap-8">
                  <button className="btn-danger" onClick={handleClearDraft}>
                    <Trash2 size={13} /> Reset
                  </button>
                  <button className="btn-primary" onClick={() => setStep('export')} style={{ padding: '8px 16px', fontSize: '13px' }}>
                    Export Quiz <Download size={14} />
                  </button>
                </div>
              </div>

              <div className="grid-cols-2">
                <div className="flex-column gap-8">
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Quiz Title</label>
                  <input
                    type="text"
                    value={quizData.title}
                    onChange={(e) => handleUpdateQuizMeta('title', e.target.value)}
                  />
                </div>
                <div className="flex-column gap-8">
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Subject</label>
                  <input
                    type="text"
                    value={quizData.subject}
                    onChange={(e) => handleUpdateQuizMeta('subject', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-column gap-8">
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Description</label>
                <textarea
                  rows={2}
                  value={quizData.description}
                  onChange={(e) => handleUpdateQuizMeta('description', e.target.value)}
                />
              </div>

               <div className="flex-column gap-8">
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>General Instructions</label>
                <input
                  type="text"
                  value={quizData.generalInstructions}
                  onChange={(e) => handleUpdateQuizMeta('generalInstructions', e.target.value)}
                />
              </div>

              {/* AI Translation Engine */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', marginTop: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  🌍 AI Quiz Translator (Powered by Gemini)
                </label>
                <div className="flex-row gap-12 align-center">
                  <select
                    value={translationLanguage}
                    onChange={(e) => setTranslationLanguage(e.target.value)}
                    style={{ flex: 1 }}
                    disabled={isTranslating}
                  >
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="French">French (Français)</option>
                    <option value="German">German (Deutsch)</option>
                    <option value="Arabic">Arabic (العربية)</option>
                    <option value="Bengali">Bengali (বাংলা)</option>
                    <option value="Portuguese">Portuguese (Português)</option>
                    <option value="Chinese">Chinese (中文)</option>
                    <option value="Japanese">Japanese (日本語)</option>
                    <option value="Russian">Russian (Русский)</option>
                  </select>
                  <button
                    className="btn-primary"
                    type="button"
                    onClick={() => handleTranslateQuiz(translationLanguage)}
                    disabled={isTranslating}
                    style={{ padding: '10px 20px', fontSize: '13px', background: 'linear-gradient(135deg, var(--color-accent), var(--color-primary))', whiteSpace: 'nowrap' }}
                  >
                    {isTranslating ? (
                      <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                    ) : 'Translate'}
                  </button>
                </div>
              </div>
            </div>

            {/* Questions Header */}
            <div className="flex-row justify-between align-center mt-12">
              <h3 style={{ fontFamily: 'var(--font-brand)', fontSize: '18px' }}>
                Questions ({quizData.questions.length})
              </h3>
              <button className="btn-secondary" onClick={handleAddQuestion} style={{ padding: '6px 12px', fontSize: '13px' }}>
                <Plus size={14} /> Add Question
              </button>
            </div>

            {/* Bulk Actions Toggle Button & Control Drawer */}
            {quizData.questions.length > 0 && (
              <div style={{ marginTop: '8px', marginBottom: '12px' }}>
                <button
                  className="btn-secondary w-full justify-between"
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  style={{ padding: '8px 16px', fontSize: '13px', border: '1px dashed var(--border-light)' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🛠️ {showBulkActions ? 'Hide Bulk Actions Panel' : 'Show Bulk Actions Panel'}
                  </span>
                  <span>{showBulkActions ? '▲' : '▼'}</span>
                </button>

                {showBulkActions && (
                  <div className="glass-card flex-column gap-16" style={{ marginTop: '8px', padding: '16px', border: '1px solid var(--border-light)', background: 'rgba(255, 255, 255, 0.01)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                      {/* Set All Points */}
                      <div className="flex-column gap-8">
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Mass Set Points</label>
                        <div className="flex-row gap-8">
                          <input
                            type="number"
                            min={0}
                            value={bulkPoints}
                            onChange={(e) => setBulkPoints(parseInt(e.target.value) || 0)}
                            style={{ flex: 1, padding: '6px 10px' }}
                          />
                          <button
                            className="btn-secondary"
                            onClick={() => handleBulkSetPoints(bulkPoints)}
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            Set All
                          </button>
                        </div>
                      </div>

                      {/* Set All Difficulty */}
                      <div className="flex-column gap-8">
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Mass Set Difficulty</label>
                        <div className="flex-row gap-8">
                          <select
                            value={bulkDifficulty}
                            onChange={(e) => setBulkDifficulty(e.target.value as Question['difficulty'])}
                            style={{ flex: 1, padding: '6px 10px' }}
                          >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                          <button
                            className="btn-secondary"
                            onClick={() => handleBulkSetDifficulty(bulkDifficulty)}
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            Set All
                          </button>
                        </div>
                      </div>

                      {/* Shuffle All Options */}
                      <div className="flex-column gap-8" style={{ justifyContent: 'flex-end' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Options Shuffling</label>
                        <button
                          className="btn-secondary w-full justify-center"
                          onClick={handleBulkShuffleOptions}
                          style={{ padding: '8px 12px', fontSize: '12px', border: '1px solid var(--color-primary-glow)' }}
                        >
                          🔀 Shuffle Options for All
                        </button>
                      </div>
                    </div>

                    {/* Find and Replace */}
                    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '12px' }} className="flex-column gap-8">
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Global Find & Replace</label>
                      <div className="flex-row gap-12 align-center" style={{ flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          placeholder="Search text / regex..."
                          value={bulkSearch}
                          onChange={(e) => setBulkSearch(e.target.value)}
                          style={{ flex: 1, minWidth: '150px', padding: '6px 10px' }}
                        />
                        <span style={{ fontSize: '14px', color: 'var(--text-dim)' }}>➔</span>
                        <input
                          type="text"
                          placeholder="Replace with..."
                          value={bulkReplace}
                          onChange={(e) => setBulkReplace(e.target.value)}
                          style={{ flex: 1, minWidth: '150px', padding: '6px 10px' }}
                        />
                        <button
                          className="btn-primary"
                          onClick={() => handleBulkFindReplace(bulkSearch, bulkReplace)}
                          style={{ padding: '8px 16px', fontSize: '12px' }}
                        >
                          Replace All
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Question Cards List */}
            {quizData.questions.map((q, index) => {
              const isDuplicateText = checkDuplicateQuestionText(q.questionText, q.id);
              const isDuplicateOpts = checkDuplicateOptions(q.options);
              const isOptionsCountLow = q.options.length < 2;
              const isCorrectAnswerMissing = !q.options.includes(q.correctAnswer);
              const isQuestionEmpty = !q.questionText.trim();
              
              const hasErrors = isOptionsCountLow || isCorrectAnswerMissing || isQuestionEmpty;
              const hasWarnings = isDuplicateText || isDuplicateOpts;

              return (
                <div
                  key={q.id}
                  className={`glass-panel glass-card edit-card ${activeQuestionId === q.id ? 'active' : ''}`}
                  style={{
                    borderColor: activeQuestionId === q.id 
                      ? 'var(--color-primary)' 
                      : hasErrors 
                        ? 'rgba(239,68,68,0.4)' 
                        : hasWarnings 
                          ? 'rgba(245,158,11,0.4)' 
                          : 'var(--border-light)'
                  }}
                  onClick={() => setActiveQuestionId(q.id)}
                >
                  <div className="edit-card-header">
                    <div className="flex-column gap-8 w-full">
                      <div className="flex-row align-center gap-8 justify-between">
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)' }}>
                          Question #{index + 1}
                        </span>
                        
                        <div className="edit-card-actions">
                          <button
                            className="btn-secondary"
                            onClick={(e) => { e.stopPropagation(); handleReorderQuestion(index, 'up'); }}
                            disabled={index === 0}
                            style={{ padding: '4px' }}
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            className="btn-secondary"
                            onClick={(e) => { e.stopPropagation(); handleReorderQuestion(index, 'down'); }}
                            disabled={index === quizData.questions.length - 1}
                            style={{ padding: '4px' }}
                          >
                            <ArrowDown size={13} />
                          </button>
                          <button
                            className="btn-danger"
                            onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(q.id); }}
                            style={{ padding: '4px' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Warnings / Error notifications */}
                      {hasErrors && (
                        <div className="flex-row align-center gap-8" style={{ color: '#fca5a5', fontSize: '11px', fontWeight: 500 }}>
                          <AlertTriangle size={12} />
                          <span>
                            {isQuestionEmpty && "Question text is empty. "}
                            {isOptionsCountLow && "Needs at least 2 options. "}
                            {isCorrectAnswerMissing && "Correct answer must match an option value."}
                          </span>
                        </div>
                      )}

                      {hasWarnings && (
                        <div className="flex-row align-center gap-8" style={{ color: '#fcd34d', fontSize: '11px', fontWeight: 500 }}>
                          <AlertTriangle size={12} />
                          <span>
                            {isDuplicateText && "Duplicate question text detected. "}
                            {isDuplicateOpts && "Duplicate option texts detected."}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Question Title Input */}
                  <textarea
                    rows={2}
                    value={q.questionText}
                    onChange={(e) => handleUpdateQuestion(q.id, { questionText: e.target.value })}
                    placeholder="Enter question text here..."
                  />

                  {/* Math Preview if LaTeX is detected */}
                  {q.questionText.includes('$') && (
                    <div style={{ fontSize: '13px', background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border-light)', padding: '8px 12px', borderRadius: '4px', marginTop: '-4px', marginBottom: '12px', color: 'var(--text-main)' }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, display: 'block', color: 'var(--color-primary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Math Preview:</span>
                      <MathText text={q.questionText} />
                    </div>
                  )}

                  {/* Image attachment section */}
                  <div className="image-attach-zone" onClick={(e) => e.stopPropagation()}>
                    {isValidImage(q.image) ? (
                      <div className="image-attach-preview-container">
                        <img src={q.image} alt="Question Diagram" className="image-attach-preview" />
                        <button
                          type="button"
                          className="image-attach-remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateQuestion(q.id, { image: undefined });
                            showToast('Image removed from question.', 'info');
                          }}
                          title="Remove Image"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="image-attach-placeholder"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleQuestionImageUpload(q.id, file);
                        }}
                        onPaste={(e) => {
                          const file = e.clipboardData.files?.[0];
                          if (file) handleQuestionImageUpload(q.id, file);
                        }}
                        onClick={() => {
                          const el = document.getElementById(`q-img-input-${q.id}`);
                          if (el) el.click();
                        }}
                      >
                        <Upload size={14} />
                        <span>Drag & Drop, Paste (Ctrl+V) or click to browse image</span>
                        <input
                          type="file"
                          id={`q-img-input-${q.id}`}
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleQuestionImageUpload(q.id, file);
                          }}
                        />
                      </div>
                    )}
                  </div>


                  {/* Question Options List */}
                  <div className="flex-column gap-8">
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Options & Correct Answer</label>
                    {q.options.map((opt, optIndex) => {
                      const isCorrect = q.correctAnswer === opt;
                      return (
                        <div key={optIndex} className="edit-option-row">
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={isCorrect}
                            onChange={() => handleUpdateQuestion(q.id, { correctAnswer: opt })}
                            title="Mark as Correct Answer"
                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--color-success)' }}
                          />
                          <div className="flex-column" style={{ flex: 1, gap: '4px' }}>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleUpdateOptionText(q.id, optIndex, e.target.value)}
                              placeholder={`Option ${optIndex + 1}`}
                              style={{ borderColor: isCorrect ? 'var(--color-success)' : 'var(--border-light)', width: '100%' }}
                            />
                            {opt.includes('$') && (
                              <div style={{ fontSize: '12px', color: 'var(--color-success)', paddingLeft: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '10px', opacity: 0.6, textTransform: 'uppercase' }}>Preview:</span>
                                <MathText text={opt} />
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => handleRemoveOption(q.id, optIndex)}
                            style={{ padding: '10px', alignSelf: opt.includes('$') ? 'flex-start' : 'center', marginTop: opt.includes('$') ? '2px' : '0' }}
                            title="Remove Option"
                          >
                            <Trash2 size={13} color="var(--color-error)" />
                          </button>
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      className="btn-secondary w-full justify-center"
                      onClick={() => handleAddOption(q.id)}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      <Plus size={12} /> Add Option
                    </button>
                  </div>

                  {/* Question Meta Row */}
                  <div className="grid-cols-2">
                    <div className="flex-column gap-8">
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Difficulty</label>
                      <select
                        value={q.difficulty}
                        onChange={(e) => handleUpdateQuestion(q.id, { difficulty: e.target.value as Question['difficulty'] })}
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <div className="flex-column gap-8">
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Points</label>
                      <input
                        type="number"
                        min={0}
                        value={q.points}
                        onChange={(e) => handleUpdateQuestion(q.id, { points: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  {/* Confidence Badges */}
                  <div className="edit-badge-list">
                    <span className={`badge badge-${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
                    <span className={`badge ${q.confidenceScore === 'HIGH' ? 'badge-high' : q.confidenceScore === 'MEDIUM' ? 'badge-med-conf' : 'badge-low'}`}>
                      Confidence: {q.confidenceScore}
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="flex-column gap-12 mt-20" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed var(--border-light)', borderRadius: '12px', padding: '20px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Add More Questions</span>
              <div className="flex-row gap-12 w-full" style={{ flexWrap: 'wrap' }}>
                <button
                  className="btn-secondary justify-center"
                  onClick={handleAddQuestion}
                  style={{ flex: 1, minWidth: '180px', padding: '12px', fontSize: '14px' }}
                >
                  <Plus size={16} /> Add Blank Question
                </button>
                <button
                  className="btn-primary justify-center"
                  onClick={() => {
                    const el = document.getElementById('append-file-input');
                    if (el) el.click();
                  }}
                  style={{ flex: 1, minWidth: '220px', padding: '12px', fontSize: '14px' }}
                >
                  <Upload size={16} /> Extract from PDF / Image
                </button>
                <input
                  type="file"
                  id="append-file-input"
                  accept=".pdf,image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setStep('upload');
                      processUploadedFile(file, true);
                    }
                    e.target.value = '';
                  }}
                />
              </div>
            </div>
          </section>

          <section className="simulator-pane">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--gform-border)', paddingBottom: '10px', color: 'var(--gform-text)' }}>
              <Eye size={18} color="var(--gform-purple)" />
              <span style={{ fontWeight: 600, fontSize: '14px', fontFamily: 'var(--font-brand)' }}>Live Google Form Preview</span>
            </div>

            {/* Google Form Title Card */}
            <div className="gform-header-card">
              <h1 className="gform-header-title"><MathText text={quizData.title || 'Untitled Quiz'} /></h1>
              <p className="gform-header-desc"><MathText text={quizData.description} /></p>
              {quizData.generalInstructions && (
                <div style={{ marginTop: '12px', borderLeft: '3px solid var(--gform-purple)', paddingLeft: '8px', color: 'var(--gform-text-muted)', fontSize: '13px' }}>
                  <strong>Instructions:</strong> <MathText text={quizData.generalInstructions} />
                </div>
              )}
            </div>

            {/* Questions Cards in Form */}
            {quizData.questions.map((q, idx) => {
              const activeChoice = simulatorSelections[q.id] || '';
              return (
                <div
                  key={q.id}
                  className="gform-question-card"
                  style={{
                    borderLeft: activeQuestionId === q.id ? '5px solid var(--gform-purple)' : '1px solid var(--gform-border)'
                  }}
                  onClick={() => setActiveQuestionId(q.id)}
                >
                  <span className="gform-points-badge">{q.points} {q.points === 1 ? 'point' : 'points'}</span>
                  <div className="gform-q-title">
                    {idx + 1}. <MathText text={q.questionText} />
                  </div>

                  {isValidImage(q.image) && (
                    <img 
                      src={q.image} 
                      alt={`Diagram for Question ${idx + 1}`} 
                      className="gform-question-image" 
                    />
                  )}

                  <div className="flex-column gap-8">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = activeChoice === opt;
                      const isCorrect = q.correctAnswer === opt;
                      return (
                        <div
                          key={optIdx}
                          className={`gform-option ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSimulatorSelections({
                              ...simulatorSelections,
                              [q.id]: opt
                            });
                          }}
                        >
                          <div className="gform-radio"></div>
                          <span><MathText text={opt} /></span>
                          {isCorrect && (
                            <span style={{ fontSize: '10px', color: 'var(--color-success)', fontWeight: 'bold', marginLeft: 'auto' }}>
                              Answer Key
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>

        </main>
      )}

      {/* Step 4: Export Center */}
      {step === 'export' && quizData && (
        <main className="dashboard-container glass-panel">
          <div style={{ borderBottom: '1px solid var(--border-light)', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '24px' }}>Export Your Quiz</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Choose the export format that best fits your workflow.</p>
            </div>
            <button className="btn-secondary" onClick={() => setStep('editor')}>
              Back to Editor
            </button>
          </div>

          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Method A: Google Forms direct API */}
            <section className="flex-column gap-12">
              <h3 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: 'var(--color-primary)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>A</span>
                Direct Form Creator (API Method)
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Directly build the Google Form inside your Google Drive using the REST API. Requires a Client ID.
              </p>

              {createdForms ? (
                <div className="glass-card" style={{ border: '1px solid var(--color-success)', background: 'rgba(16,185,129,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="flex-row gap-8 align-center" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                    <CheckCircle2 size={18} />
                    <span>Google Form Created Successfully!</span>
                  </div>
                  
                  {directExportWarnings && (
                    <div className="flex-column gap-8" style={{ marginTop: '8px', padding: '12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '6px' }}>
                      <span style={{ color: 'var(--color-warning)', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={14} /> Image Upload Warnings:
                      </span>
                      <ul style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '16px', margin: '4px 0 0 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {directExportWarnings.map((warn, wIdx) => (
                          <li key={wIdx}>{warn}</li>
                        ))}
                      </ul>
                      <p style={{ fontSize: '11px', color: 'var(--text-dim)', margin: '6px 0 0 0', lineHeight: '1.4' }}>
                        ⚠️ **Troubleshooting**: If images are missing, make sure you checked the **"View and manage Google Drive files..."** checkbox during Google OAuth sign-in. Also ensure **"Google Drive API"** is enabled in your Google Cloud Console project settings.
                      </p>
                    </div>
                  )}

                  <div className="flex-row gap-12 mt-12">
                    <a href={createdForms.editUrl} target="_blank" rel="noreferrer" className="btn-primary">
                      Open Form Editor <ExternalLink size={14} />
                    </a>
                    <a href={createdForms.formUrl} target="_blank" rel="noreferrer" className="btn-secondary">
                      View Live Quiz <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex-column gap-12">
                  {directExportError && (
                    <div className="glass-card" style={{ border: '1px solid var(--color-error)', background: 'rgba(239,68,68,0.05)', color: '#fca5a5', fontSize: '13px' }}>
                      {directExportError}
                    </div>
                  )}
                  {isExportingDirect ? (
                    <div className="flex-row align-center gap-12">
                      <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
                      <span>Creating Form on Google Cloud...</span>
                    </div>
                  ) : (
                    <div>
                      {googleClientId ? (
                        <button className="btn-primary" onClick={handleGoogleAuth}>
                          Create Google Form Now
                        </button>
                      ) : (
                        <div style={{ color: 'var(--text-dim)', fontSize: '13px' }}>
                          ⚠️ Google Client ID is not configured. Add it in credentials panel to use this method.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>

            <hr style={{ border: '0', borderTop: '1px solid var(--border-light)' }} />

            {/* Method B: Copy-Paste Apps Script */}
            <section className="flex-column gap-12">
              <h3 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: 'var(--color-secondary)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>B</span>
                Google Apps Script (Zero-Setup Method)
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Bypasses Google Cloud Console client setups entirely. Generate a script, copy it, and execute it inside your Google Account.
              </p>

              <div className="code-container">
                <div className="code-header">
                  <span>GoogleAppsScript.gs</span>
                  <button className="btn-secondary" onClick={copyAppsScript} style={{ padding: '4px 8px', fontSize: '11px' }}>
                    {copiedCode ? <Check size={12} color="var(--color-success)" /> : <Copy size={12} />}
                    {copiedCode ? ' Copied' : ' Copy Code'}
                  </button>
                </div>
                <pre className="code-pre">
                  <code>{getGeneratedAppsScript()}</code>
                </pre>
              </div>

              <div className="glass-card" style={{ marginTop: '10px' }}>
                <h4 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', marginBottom: '8px' }}>
                  <Info size={14} color="var(--color-accent)" /> Instructions to execute:
                </h4>
                <ol style={{ fontSize: '13px', color: 'var(--text-muted)', paddingLeft: '20px', lineHeight: '1.6' }}>
                  <li>Go to <a href="https://script.new" target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>script.new <ExternalLink size={10} style={{ display: 'inline' }} /></a> (opens a blank Google Apps Script file).</li>
                  <li>Clear all default text and **paste** the copied code.</li>
                  <li>Click the 💾 **Save** icon, then click the ▶️ **Run** button at the top.</li>
                  <li>Authorize script permissions (Google will ask to authorize creating files in Drive).</li>
                  <li>Open the **Execution Log** at the bottom to find the URL of your new Google Form!</li>
                </ol>
              </div>
            </section>

            <hr style={{ border: '0', borderTop: '1px solid var(--border-light)' }} />

            {/* Alternative Formats Exports */}
            <section className="flex-column gap-12">
              <h3 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSpreadsheet size={20} color="var(--color-accent)" />
                Download Alternative Formats
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Export data for importing into spreadsheets or other Learning Management Systems (LMS).</p>
              
              <div className="flex-row gap-12" style={{ flexWrap: 'wrap', marginTop: '8px' }}>
                <button className="btn-secondary" onClick={() => GoogleFormsService.downloadCSV(quizData)}>
                  <Download size={14} /> Download CSV
                </button>
                <button className="btn-secondary" onClick={() => GoogleFormsService.downloadJSON(quizData)}>
                  <Download size={14} /> Download JSON
                </button>
                <button className="btn-secondary" onClick={() => GoogleFormsService.downloadMoodleXML(quizData)}>
                  <Download size={14} /> Download Moodle XML
                </button>
                <button className="btn-secondary" onClick={() => GoogleFormsService.downloadKahootCSV(quizData)}>
                  <Download size={14} /> Download Kahoot Import
                </button>
                <button className="btn-secondary" onClick={() => GoogleFormsService.downloadQuizizzCSV(quizData)}>
                  <Download size={14} /> Download Quizizz Import
                </button>
              </div>
            </section>

          </div>
        </main>
      )}

      {/* Footer */}
      <footer style={{ marginTop: 'auto', padding: '24px 40px', borderTop: '1px solid var(--border-light)', textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
        <p>© 2026 Formify PDF. 100% client-side operations. Questions processed using Google Gemini 1.5 Flash.</p>
      </footer>

      {/* Modal: Credentials Setup */}
      {showConfigModal && (
        <div className="modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '22px', marginBottom: '16px' }}>Configure API Credentials</h2>
            <form onSubmit={saveCredentials} className="flex-column gap-16">
              <div className="flex-column gap-8">
                <label style={{ fontWeight: 600, fontSize: '14px' }}>Gemini Developer API Key</label>
                <input
                  type="password"
                  placeholder="Paste key here..."
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  required
                />
                <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  Stored in local storage. Never leaves your browser. Get key at{' '}
                  <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>
                    Google AI Studio
                  </a>.
                </p>
                <div style={{ marginTop: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setShowApiKeyHelp(!showApiKeyHelp)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-accent)', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>{showApiKeyHelp ? '▼' : '▶'} How to get a free Gemini API key?</span>
                  </button>
                  {showApiKeyHelp && (
                    <div className="glass-card" style={{ marginTop: '8px', padding: '12px', background: 'rgba(255,255,255,0.01)', fontSize: '11px', border: '1px solid var(--border-light)' }}>
                      <ol style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-muted)' }}>
                        <li>
                          Open <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>
                            Google AI Studio <ExternalLink size={8} style={{ display: 'inline' }} />
                          </a>.
                        </li>
                        <li>Click the blue <strong>"Get API key"</strong> button in the sidebar or top menu.</li>
                        <li>Click <strong>"Create API key"</strong>, select or create a project, and copy the key.</li>
                        <li>Paste the copied key into the input field above.</li>
                        <li>
                          Need help? Watch the{' '}
                          <a href="https://www.youtube.com/results?search_query=how+to+get+gemini+api+key" target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>
                            YouTube Video Guide <ExternalLink size={8} style={{ display: 'inline' }} />
                          </a>.
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-column gap-8">
                <label style={{ fontWeight: 600, fontSize: '14px' }}>Gemini AI Model</label>
                <select
                  value={modelSelectValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    setModelSelectValue(val);
                    if (val !== 'custom') {
                      setGeminiModel(val);
                    } else {
                      setGeminiModel(customModelName || 'gemini-3.5-flash');
                    }
                  }}
                >
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash (Recommended - Fastest & Coding-optimized)</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Standard stable)</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Legacy)</option>
                  <option value="gemini-3.1-pro">Gemini 3.1 Pro (Heavy reasoning)</option>
                  <option value="custom">Custom Model Name...</option>
                </select>

                {modelSelectValue === 'custom' && (
                  <div className="flex-column gap-8" style={{ marginTop: '8px' }}>
                    <input
                      type="text"
                      placeholder="e.g. gemini-3.5-pro"
                      value={customModelName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomModelName(val);
                        setGeminiModel(val);
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex-column gap-8">
                <label style={{ fontWeight: 600, fontSize: '14px' }}>Google Cloud Client ID (Optional)</label>
                <input
                  type="text"
                  placeholder="Paste Client ID here..."
                  value={googleClientId}
                  onChange={(e) => setGoogleClientId(e.target.value)}
                />
                <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  Used to generate forms directly via direct OAuth buttons. Create an OAuth 2.0 Web Client ID in the{' '}
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>
                    Google Cloud Console
                  </a>, enable "Google Forms API", and add this page's origin to authorized origins.
                </p>
              </div>

              <div className="flex-row gap-12 mt-12" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowConfigModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Instructions & Info */}
      {showInfoModal && (
        <div className="modal-overlay" onClick={() => setShowInfoModal(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '22px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle color="var(--color-primary)" />
              How Formify PDF Works
            </h2>
            
            <div className="flex-column gap-16" style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              <div>
                <h4 style={{ color: 'var(--text-main)', fontWeight: 600, marginBottom: '4px' }}>1. Uploading Documents</h4>
                <p>Upload a standard PDF containing text, a scanned paper, or photo image. The application sends files directly to Google Gemini 1.5 Flash using multimodal inputs.</p>
              </div>

              <div>
                <h4 style={{ color: 'var(--text-main)', fontWeight: 600, marginBottom: '4px' }}>2. AI Question Parsing</h4>
                <p>Gemini executes advanced OCR to extract the questions and option fields, infer the correct answer, evaluate the point scores, and output a strict JSON structure.</p>
              </div>

              <div>
                <h4 style={{ color: 'var(--text-main)', fontWeight: 600, marginBottom: '4px' }}>3. Live Validation & Editing</h4>
                <p>Review the extracted content in the Editor. The app validates questions, displays alerts for duplicate values, low confidence scores, or incomplete fields, and synchronizes the real-time Google Form Simulator.</p>
              </div>

              <div>
                <h4 style={{ color: 'var(--text-main)', fontWeight: 600, marginBottom: '4px' }}>4. Google Forms Generation</h4>
                <p>Generate Google Forms directly in Drive using OAuth2 API client credentials (requires developer configuration), or download Google Apps Script to copy-paste into Apps Script console for 100% zero-config form generation.</p>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={() => setShowInfoModal(false)}>
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Onboarding Guided Tour */}
      {showOnboarding && (
        <div className="modal-overlay" onClick={handleCloseOnboarding}>
          <div className="modal-content onboarding-card glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="onboarding-header">
              <div className="onboarding-title">Formify PDF Guide</div>
              <div className="onboarding-step-badge">Step {onboardingStep} of 5</div>
            </div>

            <div className="onboarding-content">
              {onboardingStep === 1 && (
                <div className="onboarding-slide">
                  <div className="onboarding-welcome-icon">
                    <Sparkles size={36} color="var(--color-primary)" />
                  </div>
                  <h3 style={{ textAlign: 'center', fontSize: '20px', marginBottom: '12px', fontFamily: 'var(--font-brand)' }}>Welcome to Formify PDF!</h3>
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    Convert your exams, textbook pages, scanned PDFs, or handwritten test photos into fully functional, interactive Google Forms quizzes in seconds using advanced Google Gemini 1.5 Flash.
                  </p>
                  <div className="onboarding-illustration-box">
                    <div className="onboarding-illustration-icon">
                      <BookOpen size={24} color="var(--color-accent)" />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: '14px' }}>AI-Powered OCR & Structure</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>We automatically extract questions, choices, answers, point values, and formatting without manual work.</p>
                    </div>
                  </div>
                </div>
              )}

              {onboardingStep === 2 && (
                <div className="onboarding-slide">
                  <div className="onboarding-welcome-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', borderColor: 'var(--color-accent)' }}>
                    <Cpu size={36} color="var(--color-accent)" />
                  </div>
                  <h3 style={{ textAlign: 'center', fontSize: '20px', marginBottom: '12px', fontFamily: 'var(--font-brand)' }}>Step 1: Set Up Credentials</h3>
                  <p style={{ color: 'var(--text-muted)' }}>
                    To ensure complete privacy, Formify PDF runs 100% client-side. We require your personal API Keys so your documents and tokens never touch our servers.
                  </p>
                  <div className="onboarding-feature-list">
                    <div className="onboarding-feature-pill">
                      <Settings className="onboarding-feature-pill-icon" size={16} />
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 600 }}>Gemini Developer API Key (Required)</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px' }}>
                          Powers the AI question scanning. It is 100% free and takes 30 seconds to get:
                        </p>
                        <ol style={{ fontSize: '11px', color: 'var(--text-muted)', paddingLeft: '16px', margin: '4px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <li>
                            Open <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>
                              Google AI Studio <ExternalLink size={10} style={{ display: 'inline' }} />
                            </a>.
                          </li>
                          <li>Click the blue <strong>"Get API key"</strong> button in the sidebar/top menu.</li>
                          <li>Click <strong>"Create API key"</strong> and copy your key.</li>
                          <li>Paste it into our <strong>Credentials</strong> setup panel.</li>
                          <li>
                            Need help? Watch the{' '}
                            <a href="https://www.youtube.com/results?search_query=how+to+get+gemini+api+key" target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>
                              YouTube Video Guide <ExternalLink size={8} style={{ display: 'inline' }} />
                            </a>.
                          </li>
                        </ol>
                      </div>
                    </div>
                    <div className="onboarding-feature-pill">
                      <CheckCircle2 className="onboarding-feature-pill-icon" size={16} />
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 600 }}>Google Cloud Client ID (Optional)</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Configure a Google OAuth Client ID to upload question diagram images and create Google Forms directly from the workspace.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {onboardingStep === 3 && (
                <div className="onboarding-slide">
                  <div className="onboarding-welcome-icon" style={{ background: 'rgba(168, 85, 247, 0.1)', borderColor: 'var(--color-secondary)' }}>
                    <Upload size={36} color="var(--color-secondary)" />
                  </div>
                  <h3 style={{ textAlign: 'center', fontSize: '20px', marginBottom: '12px', fontFamily: 'var(--font-brand)' }}>Step 2: Upload Documents</h3>
                  <p style={{ color: 'var(--text-muted)' }}>
                    Formify PDF accepts standard text PDFs, scanned documents, and images (PNG, JPG, JPEG, WEBP).
                  </p>
                  <div className="onboarding-illustration-box">
                    <div className="onboarding-illustration-icon">
                      <FileSpreadsheet size={24} color="var(--color-secondary)" />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: '14px' }}>Drag & Drop Uploader</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Simply drag your test paper file into the workspace dashboard. Gemini's multimodal visual OCR handles the rest, scanning and reading multiple columns or handwritten structures.</p>
                    </div>
                  </div>
                </div>
              )}

              {onboardingStep === 4 && (
                <div className="onboarding-slide">
                  <div className="onboarding-welcome-icon">
                    <Layers size={36} color="var(--color-primary)" />
                  </div>
                  <h3 style={{ textAlign: 'center', fontSize: '20px', marginBottom: '12px', fontFamily: 'var(--font-brand)' }}>Step 3: Question Editor & Simulator</h3>
                  <p style={{ color: 'var(--text-muted)' }}>
                    Once parsed, your questions open in our dual-pane workspace.
                  </p>
                  <div className="onboarding-feature-list">
                    <div className="onboarding-feature-pill">
                      <Sparkles className="onboarding-feature-pill-icon" size={16} />
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 600 }}>Interactive Editor & Math Rendering</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Edit questions, add multiple choices, attach diagram images via drag & drop / copy-paste, and preview LaTeX equations rendered beautifully in real time via KaTeX.</p>
                      </div>
                    </div>
                    <div className="onboarding-feature-pill">
                      <Tv className="onboarding-feature-pill-icon" size={16} />
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 600 }}>High-Fidelity Google Forms Simulator</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>The right-hand pane replicates the exact look, colors, and layout of a published Google Form, showing you how your students will see the questions.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {onboardingStep === 5 && (
                <div className="onboarding-slide">
                  <div className="onboarding-welcome-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', borderColor: 'var(--color-accent)' }}>
                    <Download size={36} color="var(--color-accent)" />
                  </div>
                  <h3 style={{ textAlign: 'center', fontSize: '20px', marginBottom: '12px', fontFamily: 'var(--font-brand)' }}>Step 4: Exporters & Fallbacks</h3>
                  <p style={{ color: 'var(--text-muted)' }}>
                    Ready to publish? Choose from our multiple export strategies:
                  </p>
                  <div className="onboarding-feature-list">
                    <div className="onboarding-feature-pill">
                      <CheckCircle2 className="onboarding-feature-pill-icon" size={16} color="var(--color-success)" />
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 600 }}>Method A: Direct Creator (OAuth)</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Automatically build the form and upload attached diagram images to your Google Drive in one click.</p>
                      </div>
                    </div>
                    <div className="onboarding-feature-pill">
                      <Settings className="onboarding-feature-pill-icon" size={16} color="var(--color-secondary)" />
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 600 }}>Method B: Google Apps Script (Zero Setup)</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>No Client ID setup? Copy the generated Apps Script, paste it into script.new, and run it to create your Form instantly.</p>
                      </div>
                    </div>
                    <div className="onboarding-feature-pill">
                      <Download className="onboarding-feature-pill-icon" size={16} color="var(--color-accent)" />
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 600 }}>Alternative LMS Downloads</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Download your quiz configuration as Moodle XML, Kahoot CSV, Quizizz template, JSON, or standard CSV.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="onboarding-footer">
              <button className="onboarding-btn-skip" onClick={handleCloseOnboarding}>
                {onboardingStep === 5 ? 'Close' : 'Skip Tour'}
              </button>

              <div className="onboarding-dots-container">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={`onboarding-dot ${onboardingStep === s ? 'active' : ''}`}
                    onClick={() => setOnboardingStep(s)}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {onboardingStep > 1 && (
                  <button className="btn-secondary" onClick={() => setOnboardingStep((p) => p - 1)} style={{ padding: '8px 16px', fontSize: '13px' }}>
                    Back
                  </button>
                )}
                {onboardingStep < 5 ? (
                  <button className="btn-primary" onClick={() => setOnboardingStep((p) => p + 1)} style={{ padding: '8px 16px', fontSize: '13px' }}>
                    Next
                  </button>
                ) : (
                  <button className="btn-primary" onClick={handleCloseOnboarding} style={{ padding: '8px 16px', fontSize: '13px' }}>
                    Get Started!
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
