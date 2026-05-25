import type { QuizData } from './GeminiService';

export class GoogleFormsService {
  /**
   * Checks if an image string is a valid base64 data URI, HTTP(S) URL or local path
   */
  public static isValidImage(img: any): img is string {
    if (typeof img !== 'string') return false;
    const trimmed = img.trim();
    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return false;
    return trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/');
  }

  public static stripMathDelimiters(text: string): string {
    if (!text) return '';
    
    // 1. First strip standard math delimiters and resolve escaped dollar signs
    const stripped = text
      .replace(/\$\$/g, '')
      .replace(/(?<!\\)\$/g, '')
      .replace(/\\\$/g, '$');
      
    // 2. Convert LaTeX syntax to clean plain text mathematical Unicode symbols
    return GoogleFormsService.latexToPlainText(stripped);
  }

  /**
   * Converts standard LaTeX syntax to human-readable plain text using Unicode mathematical symbols
   */
  public static latexToPlainText(text: string): string {
    if (!text) return '';
    let result = text;
    
    // 0. Parse text formatting commands: \text{...} -> ...
    result = GoogleFormsService.parseTextCommands(result);
    
    // 1. Parse fractions: \frac{num}{den} -> (num)/(den)
    result = GoogleFormsService.parseFractions(result);
    
    // 2. Parse square roots: \sqrt{x} -> √x or √(x)
    result = GoogleFormsService.parseSqrt(result);
    
    // 3. Parse superscripts: ^2 -> ²
    result = GoogleFormsService.parseSuperscripts(result);
    
    // 4. Parse LaTeX math symbols to Unicode equivalents
    result = GoogleFormsService.parseLatexSymbols(result);
    
    // 5. Clean up any loose backslashes and double spaces
    result = result.replace(/\\/g, ''); 
    result = result.replace(/\s+/g, ' ');
    
    return result.trim();
  }

  private static parseTextCommands(str: string): string {
    let result = str;
    const commands = ['\\text{', '\\mathrm{', '\\mathbf{', '\\mathit{', '\\mathsf{', '\\mathtt{', '\\textbf{', '\\textit{'];
    
    for (const cmd of commands) {
      while (result.includes(cmd)) {
        const index = result.indexOf(cmd);
        let braceCount = 1;
        let i = index + cmd.length; // start after cmd
        while (i < result.length && braceCount > 0) {
          if (result[i] === '{') braceCount++;
          else if (result[i] === '}') braceCount--;
          i++;
        }
        if (braceCount > 0) break; // mismatched braces
        
        const content = result.substring(index + cmd.length, i - 1);
        const commandStr = result.substring(index, i);
        result = result.replace(commandStr, content);
      }
    }
    return result;
  }

  private static parseFractions(str: string): string {
    let result = str;
    while (result.includes('\\frac{')) {
      const index = result.indexOf('\\frac{');
      let braceCount = 1;
      let i = index + 6; // start after '\frac{'
      while (i < result.length && braceCount > 0) {
        if (result[i] === '{') braceCount++;
        else if (result[i] === '}') braceCount--;
        i++;
      }
      if (braceCount > 0) break; // mismatched braces
      
      const numerator = result.substring(index + 6, i - 1);
      
      // Next char must be '{' for denominator
      if (result[i] !== '{') break;
      
      let j = i + 1;
      braceCount = 1;
      while (j < result.length && braceCount > 0) {
        if (result[j] === '{') braceCount++;
        else if (result[j] === '}') braceCount--;
        j++;
      }
      if (braceCount > 0) break; // mismatched braces
      
      const denominator = result.substring(i + 1, j - 1);
      const fractionStr = result.substring(index, j);
      result = result.replace(fractionStr, `(${numerator})/(${denominator})`);
    }
    return result;
  }

  private static parseSqrt(str: string): string {
    let result = str;
    while (result.includes('\\sqrt{')) {
      const index = result.indexOf('\\sqrt{');
      let braceCount = 1;
      let i = index + 6; // start after '\sqrt{'
      while (i < result.length && braceCount > 0) {
        if (result[i] === '{') braceCount++;
        else if (result[i] === '}') braceCount--;
        i++;
      }
      if (braceCount > 0) break;
      
      const content = result.substring(index + 6, i - 1);
      const sqrtStr = result.substring(index, i);
      const replacement = content.length <= 3 && !content.includes(' ')
        ? `√${content}`
        : `√(${content})`;
      result = result.replace(sqrtStr, replacement);
    }
    return result;
  }

  private static parseSuperscripts(str: string): string {
    let result = str;
    // Convert wrapped superscripts like ^{10} or ^{n+1}
    result = result.replace(/\^\{([0-9+\-n]+)\}/g, '^($1)');
    // Unicode superscript mappings
    const unicodeSups: { [key: string]: string } = {
      '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '1': '¹', '0': '⁰',
      '+': '⁺', '-': '⁻', '=': '⁼', 'n': 'ⁿ', 'x': 'ˣ', 'i': 'ⁱ'
    };
    result = result.replace(/\^([0-9+\-nxji])/g, (match, p1) => unicodeSups[p1] || match);
    return result;
  }

  private static parseLatexSymbols(str: string): string {
    let result = str;
    const symbolMap: { [key: string]: string } = {
      '\\alpha': 'α',
      '\\beta': 'β',
      '\\gamma': 'γ',
      '\\delta': 'δ',
      '\\epsilon': 'ε',
      '\\zeta': 'ζ',
      '\\eta': 'η',
      '\\theta': 'θ',
      '\\iota': 'ι',
      '\\kappa': 'κ',
      '\\lambda': 'λ',
      '\\mu': 'μ',
      '\\nu': 'ν',
      '\\xi': 'ξ',
      '\\pi': 'π',
      '\\rho': 'ρ',
      '\\sigma': 'σ',
      '\\tau': 'τ',
      '\\upsilon': 'υ',
      '\\phi': 'φ',
      '\\chi': 'χ',
      '\\psi': 'ψ',
      '\\omega': 'ω',
      '\\Delta': 'Δ',
      '\\pm': '±',
      '\\neq': '≠',
      '\\ne': '≠',
      '\\le': '≤',
      '\\ge': '≥',
      '\\times': '×',
      '\\div': '÷',
      '\\infty': '∞',
      '\\approx': '≈',
      '\\cdot': '·',
      '\\deg': '°',
      '\\{': '{',
      '\\}': '}',
      '\\Spacer': ' ',
      '\\quad': ' ',
      '\\qquad': '  ',
      '\\,': ' '
    };
    const sortedKeys = Object.keys(symbolMap).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      result = result.replace(new RegExp(escapedKey, 'g'), symbolMap[key]);
    }
    return result;
  }

  /**
   * Sanitizes text to remove newlines for Google Forms REST API compliance
   */
  private static sanitizeApiText(text: string): string {
    return (text || '').replace(/[\r\n]+/g, ' ').trim();
  }



  /**
   * Helper to split a long string into chunks of a given size separated by newlines
   */
  private static chunkString(str: string, size: number): string {
    const numChunks = Math.ceil(str.length / size);
    const chunks = new Array(numChunks);
    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
      chunks[i] = str.substring(o, o + size);
    }
    return chunks.join('\n');
  }

  /**
   * Generates Google Apps Script code to create a Google Form.
   * This is entirely client-side and requires copy-paste from the user.
   */
  public static generateAppsScript(quiz: QuizData): string {
    const cleanTitle = GoogleFormsService.stripMathDelimiters(quiz.title);
    const displayDesc = quiz.generalInstructions 
      ? `${quiz.description || ''}\n\nInstructions: ${quiz.generalInstructions}`
      : (quiz.description || '');
    const cleanDesc = GoogleFormsService.stripMathDelimiters(displayDesc);
 
    // Build the questions array block
    const questionsBlock = quiz.questions.map((q) => {
      const escapedQuestion = JSON.stringify(GoogleFormsService.stripMathDelimiters(q.questionText));
      const escapedOptions = q.options.map(opt => JSON.stringify(GoogleFormsService.stripMathDelimiters(opt)));
      const escapedAnswer = JSON.stringify(GoogleFormsService.stripMathDelimiters(q.correctAnswer));
      const rawBase64 = GoogleFormsService.isValidImage(q.image)
        ? q.image.replace(/^data:image\/[a-z]+;base64,/, '') 
        : null;
      
      let imageBase64Value = "null";
      if (rawBase64) {
        const chunked = GoogleFormsService.chunkString(rawBase64, 80);
        imageBase64Value = `\`\n${chunked}\n\``;
      }
      
      return `    {
       questionText: ${escapedQuestion},
       options: [${escapedOptions.join(', ')}],
       correctAnswer: ${escapedAnswer},
       points: ${q.points},
       imageBase64: ${imageBase64Value}
     }`;
    }).join(',\n');
 
 
     return `function createGoogleForm() {
   // Create a new Google Form
   var form = FormApp.create(${JSON.stringify(cleanTitle)});
   form.setDescription(${JSON.stringify(cleanDesc)});
  
  // Enable Quiz Mode
  form.setIsQuiz(true);
  
  var questions = [
${questionsBlock}
  ];
  
  for (var i = 0; i < questions.length; i++) {
    var q = questions[i];
    
    // Add image/diagram block right above the question if present
    if (q.imageBase64) {
      try {
        // Strip newlines/whitespace from chunked base64 template literal
        var cleanBase64 = q.imageBase64.replace(/\\s/g, '');
        var imgBlob = Utilities.newBlob(Utilities.base64Decode(cleanBase64), "image/jpeg", "question_image_" + i + ".jpg");
        var imgItem = form.addImageItem();
        imgItem.setImage(imgBlob);
      } catch (imgError) {
        Logger.log("Could not attach image for question " + (i + 1) + ": " + imgError.toString());
      }
    }
    
    var item = form.addMultipleChoiceItem();
    item.setTitle(q.questionText);
    
    var choices = [];
    for (var j = 0; j < q.options.length; j++) {
      var optionVal = q.options[j];
      var isCorrect = false;
      if (q.correctAnswer && optionVal.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) {
        isCorrect = true;
      }
      choices.push(item.createChoice(optionVal, isCorrect));
    }
    
    item.setChoices(choices);
    item.setPoints(q.points || 1);
    item.setRequired(true);
  }
  
  Logger.log("=========================================");
  Logger.log("Google Form Created Successfully!");
  Logger.log("Edit URL (Open to configure settings):");
  Logger.log(form.getEditUrl());
  Logger.log("Published URL (Send to respondents):");
  Logger.log(form.getPublishedUrl());
  Logger.log("=========================================");
  
  // Note: Standard standalone scripts cannot display UI dialogs unless attached to a doc,
  // but the URLs will print clearly in the Execution Logs at the bottom of script.google.com!
}
`;
  }

  /**
   * Helper to create Google Form directly using Google Forms REST API.
   * Requires GIS oauth2 token.
   */
  public static async createFormDirectly(
    accessToken: string,
    quiz: QuizData,
    onProgress: (status: string) => void
  ): Promise<{ formUrl: string; editUrl: string; warnings?: string[] }> {
    onProgress('Creating empty Google Form...');

    // 1. Create empty form
    const createResponse = await fetch('https://forms.googleapis.com/v1/forms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        info: {
          title: GoogleFormsService.sanitizeApiText(GoogleFormsService.stripMathDelimiters(quiz.title)),
          documentTitle: GoogleFormsService.sanitizeApiText(GoogleFormsService.stripMathDelimiters(quiz.title)),
        },
      }),
    });

    if (!createResponse.ok) {
      const err = await createResponse.json();
      throw new Error(`Failed to create form: ${err.error?.message || createResponse.statusText}`);
    }

    const formData = await createResponse.json();
    const formId = formData.formId;

    onProgress('Form created. Configuring settings and adding questions...');

    // 2. Build the batchUpdate requests
    const requests: any[] = [];

    // Make it a Quiz
    requests.push({
      updateSettings: {
        settings: {
          quizSettings: {
            isQuiz: true,
          },
        },
        updateMask: 'quizSettings.isQuiz',
      },
    });

    // Update form description if available
    const descText = quiz.generalInstructions 
      ? `${quiz.description}\n\nInstructions: ${quiz.generalInstructions}`
      : quiz.description;
    const cleanDescText = GoogleFormsService.stripMathDelimiters(descText);
      
    requests.push({
      updateFormInfo: {
        info: {
          description: cleanDescText,
        },
        updateMask: 'description',
      },
    });

    // Add questions (and images if present)
    const warnings: string[] = [];
    let currentIndex = 0;
    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      let imageUrl: string | null = null;

      if (GoogleFormsService.isValidImage(q.image)) {
        try {
          const fileId = await GoogleFormsService.uploadImageToDrive(
            accessToken,
            q.image,
            `question_image_${i + 1}.jpg`,
            onProgress
          );
          if (fileId) {
            await GoogleFormsService.shareFilePublicly(accessToken, fileId);
            // Use lh3.googleusercontent.com/d/ format which allows the Forms crawler to load the image directly
            imageUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
          } else {
            warnings.push(`Question ${i + 1}: Image upload returned empty file ID.`);
          }
        } catch (imgErr: any) {
          console.error(`Failed to handle image upload for question ${i + 1}:`, imgErr);
          warnings.push(`Question ${i + 1}: ${imgErr.message || 'Image upload error'}`);
        }
      }

      const optionsValues = q.options.map((opt) => ({ value: GoogleFormsService.sanitizeApiText(GoogleFormsService.stripMathDelimiters(opt)) }));
      const questionItem: any = {
        title: GoogleFormsService.sanitizeApiText(GoogleFormsService.stripMathDelimiters(q.questionText)),
        questionItem: {
          question: {
            required: true,
            choiceQuestion: {
              type: 'RADIO',
              options: optionsValues,
            },
            grading: {
              pointValue: q.points || 1,
              correctAnswers: {
                answers: [{ value: GoogleFormsService.sanitizeApiText(GoogleFormsService.stripMathDelimiters(q.correctAnswer)) }],
              },
            },
          },
        },
      };

      // Embed image directly inside the question card if available (supported by REST API)
      if (imageUrl) {
        questionItem.questionItem.image = {
          sourceUri: imageUrl,
          altText: `Diagram for Question ${i + 1}`
        };
      }

      requests.push({
        createItem: {
          item: questionItem,
          location: {
            index: currentIndex,
          },
        },
      });
      currentIndex++;
    }

    // Apply batch updates
    const updateResponse = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    if (!updateResponse.ok) {
      const err = await updateResponse.json();
      throw new Error(`Failed to populate questions: ${err.error?.message || updateResponse.statusText}`);
    }

    return {
      formUrl: `https://docs.google.com/forms/d/${formId}/viewform`,
      editUrl: `https://docs.google.com/forms/d/${formId}/edit`,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Helper to upload image to Google Drive
   */
  private static async uploadImageToDrive(
    accessToken: string,
    base64Data: string,
    filename: string,
    onProgress: (status: string) => void
  ): Promise<string | null> {
    try {
      onProgress(`Uploading image ${filename} to Google Drive...`);
      const rawBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
      const binaryStr = atob(rawBase64);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      
      const boundary = '-------314159265358979323846';
      const delimiter = `--${boundary}`;
      const closeDelim = `\r\n--${boundary}--`;
      
      const metadata = {
        name: filename,
        mimeType: 'image/jpeg'
      };
      
      const metadataPart = `${delimiter}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
      const mediaHeader = `${delimiter}\r\nContent-Type: image/jpeg\r\n\r\n`;
      
      // Convert metadata strings to Uint8Array
      const encoder = new TextEncoder();
      const metadataBytes = encoder.encode(metadataPart);
      const mediaHeaderBytes = encoder.encode(mediaHeader);
      const closeDelimBytes = encoder.encode(closeDelim);
      
      // Merge all parts into one array
      const totalLength = metadataBytes.length + mediaHeaderBytes.length + bytes.length + closeDelimBytes.length;
      const bodyBytes = new Uint8Array(totalLength);
      
      let offset = 0;
      bodyBytes.set(metadataBytes, offset);
      offset += metadataBytes.length;
      bodyBytes.set(mediaHeaderBytes, offset);
      offset += mediaHeaderBytes.length;
      bodyBytes.set(bytes, offset);
      offset += bytes.length;
      bodyBytes.set(closeDelimBytes, offset);
      
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: bodyBytes
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || response.statusText);
      }
      
      const data = await response.json();
      return data.id;
    } catch (err: any) {
      console.error("Failed to upload image to Google Drive:", err);
      throw err;
    }
  }

  /**
   * Helper to make uploaded Drive file public
   */
  private static async shareFilePublicly(
    accessToken: string,
    fileId: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone'
        })
      });
      
      return response.ok;
    } catch (err) {
      console.error("Failed to share file on Drive:", err);
      return false;
    }
  }


  /**
   * Helper to sanitize titles for OS-safe filenames.
   */
  private static getSanitizedFilename(title: string, suffix: string, ext: string): string {
    const sanitizedTitle = title.toLowerCase()
      .replace(/["*/:<>?\\|]/g, '') // strip illegal filename characters
      .replace(/\s+/g, '_');        // replace spaces with underscores
    return `${sanitizedTitle}_${suffix}.${ext}`;
  }

  /**
   * Exports quiz data as CSV file.
   */
  public static downloadCSV(quiz: QuizData) {
    const headers = ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Points', 'Difficulty'];
    const rows = quiz.questions.map((q) => {
      const opts = [...q.options];
      // ensure we have at least 4 options filled
      while (opts.length < 4) opts.push('');
      return [
        q.questionText,
        opts[0],
        opts[1],
        opts[2],
        opts[3],
        q.correctAnswer,
        q.points,
        q.difficulty
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const filename = GoogleFormsService.getSanitizedFilename(quiz.title, 'quiz', 'csv');
    GoogleFormsService.triggerDownload(csvContent, 'text/csv', filename);
  }

  /**
   * Exports quiz data as JSON file.
   */
  public static downloadJSON(quiz: QuizData) {
    const jsonContent = JSON.stringify(quiz, null, 2);
    const filename = GoogleFormsService.getSanitizedFilename(quiz.title, 'quiz', 'json');
    GoogleFormsService.triggerDownload(jsonContent, 'application/json', filename);
  }

  /**
   * Exports quiz data as Moodle XML format.
   */
  public static downloadMoodleXML(quiz: QuizData) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n';
    
    // Set category
    const cleanTitle = quiz.title
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
      
    xml += `  <question type="category">\n    <category>\n      <text>$course$/Formify Quiz/${cleanTitle}</text>\n    </category>\n  </question>\n\n`;

    quiz.questions.forEach((q, index) => {
      const cleanQText = q.questionText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      xml += `  <question type="multichoice">\n`;
      xml += `    <name>\n      <text>Question ${index + 1}</text>\n    </name>\n`;
      xml += `    <questiontext format="html">\n      <text><![CDATA[<p>${cleanQText}</p>]]></text>\n    </questiontext>\n`;
      xml += `    <single>true</single>\n`;
      xml += `    <shuffleanswers>true</shuffleanswers>\n`;
      xml += `    <answernumbering>abc</answernumbering>\n`;
      xml += `    <defaultgrade>${q.points}</defaultgrade>\n`;
      
      q.options.forEach((opt) => {
        const isCorrect = opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
        const fraction = isCorrect ? 100 : 0;
        const cleanOptText = opt.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        xml += `    <answer fraction="${fraction}" format="html">\n      <text><![CDATA[${cleanOptText}]]></text>\n    </answer>\n`;
      });
      
      xml += `  </question>\n\n`;
    });

    xml += '</quiz>';
    const filename = GoogleFormsService.getSanitizedFilename(quiz.title, 'moodle', 'xml');
    GoogleFormsService.triggerDownload(xml, 'text/xml', filename);
  }

  /**
   * Exports quiz data as Kahoot import format CSV.
   */
  public static downloadKahootCSV(quiz: QuizData) {
    const headers = ['Question Text', 'Answer 1', 'Answer 2', 'Answer 3', 'Answer 4', 'Time limit (sec)', 'Correct answers'];
    const rows = quiz.questions.map((q) => {
      const opts = [...q.options];
      while (opts.length < 4) opts.push('');
      
      // Kahoot expects answer index (1, 2, 3 or 4)
      const correctIdx = q.options.findIndex(
        opt => opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
      ) + 1;
      const correctVal = correctIdx > 0 ? String(correctIdx) : '1';

      return [
        q.questionText.slice(0, 120), // Kahoot question text max length is 120
        opts[0].slice(0, 75),        // Option max length is 75
        opts[1].slice(0, 75),
        opts[2].slice(0, 75),
        opts[3].slice(0, 75),
        '30',                       // Default time limit 30s
        correctVal
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const filename = GoogleFormsService.getSanitizedFilename(quiz.title, 'kahoot', 'csv');
    GoogleFormsService.triggerDownload(csvContent, 'text/csv', filename);
  }

  /**
   * Exports quiz data as Quizizz import format CSV.
   */
  public static downloadQuizizzCSV(quiz: QuizData) {
    const headers = ['Question Text', 'Question Type', 'Option 1', 'Option 2', 'Option 3', 'Option 4', 'Correct Answer', 'Time in seconds'];
    const rows = quiz.questions.map((q) => {
      const opts = [...q.options];
      while (opts.length < 4) opts.push('');
      
      const correctIdx = q.options.findIndex(
        opt => opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
      ) + 1;
      const correctVal = correctIdx > 0 ? String(correctIdx) : '1';

      return [
        q.questionText,
        'Multiple Choice',
        opts[0],
        opts[1],
        opts[2],
        opts[3],
        correctVal,
        '30'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const filename = GoogleFormsService.getSanitizedFilename(quiz.title, 'quizizz', 'csv');
    GoogleFormsService.triggerDownload(csvContent, 'text/csv', filename);
  }

  /**
   * Trigger a client-side file download
   */
  private static triggerDownload(content: string, mimeType: string, filename: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
